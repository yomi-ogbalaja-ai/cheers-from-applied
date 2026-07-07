import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun, dbRunReturning } from "@/lib/db-client";
import { randomUUID } from "crypto";
import { badRequest, serverError, parseJson, str, optStr, isEmail } from "@/lib/validate";

const GIFT_CAP_HOURS = 8;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gifts = await dbAll("SELECT * FROM board_gifts WHERE board_id = ? ORDER BY created_at ASC", [id]);
    const agg = await dbGet<{ total_pending_hrs: number; total_approved_hrs: number }>(`
      SELECT
        COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END), 0) as total_pending_hrs,
        COALESCE(SUM(CASE WHEN status='approved' THEN amount ELSE 0 END), 0) as total_approved_hrs
      FROM board_gifts WHERE board_id = ?
    `, [id]);
    return NextResponse.json({ gifts, ...agg as object });
  } catch (err) {
    console.error("GET /api/boards/[id]/gifts failed:", err);
    return serverError();
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const board = await dbGet<{ requires_gift_approval: number }>("SELECT * FROM boards WHERE id = ?", [id]);
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    const from_name = str(body.from_name, 100);
    if (!from_name) return badRequest("from_name is required (max 100 chars)");

    if (!isEmail(body.from_email)) return badRequest("from_email must be a valid email address");
    const from_email = body.from_email;

    if (body.gift_type !== undefined && body.gift_type !== null && body.gift_type !== "" && optStr(body.gift_type, 50) === null) {
      return badRequest("gift_type must be a string (max 50 chars)");
    }
    const gift_type = optStr(body.gift_type, 50) ?? "time_off_hours";

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > GIFT_CAP_HOURS) {
      return badRequest(`amount must be a number between 0 and ${GIFT_CAP_HOURS}`);
    }

    if (body.note !== undefined && body.note !== null && body.note !== "" && optStr(body.note, 500) === null) {
      return badRequest("note must be a string (max 500 chars)");
    }
    const note = optStr(body.note, 500);

    let workday_balance: number | null = null;
    if (body.workday_balance !== undefined && body.workday_balance !== null && body.workday_balance !== "") {
      workday_balance = Number(body.workday_balance);
      if (!Number.isFinite(workday_balance)) return badRequest("workday_balance must be a number");
    }

    const giftId = randomUUID();
    const autoApprove = board.requires_gift_approval === 0;

    // The cap check and insert run as one statement (with RETURNING to report
    // success) instead of a separate SELECT-then-INSERT — two concurrent
    // requests from the same giver can no longer both read the same stale
    // total and both slip under the cap.
    const inserted = await dbRunReturning(
      `INSERT INTO board_gifts (id, board_id, from_name, from_email, gift_type, amount, note, status, workday_balance)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
       WHERE (SELECT COALESCE(SUM(amount), 0) FROM board_gifts WHERE board_id = ? AND from_email = ?) + ? <= ?
       RETURNING id`,
      [
        giftId, id, from_name, from_email, gift_type, amount, note,
        autoApprove ? "approved" : "pending", workday_balance,
        id, from_email, amount, GIFT_CAP_HOURS,
      ]
    );

    if (inserted.length === 0) {
      return NextResponse.json({ error: `Exceeds ${GIFT_CAP_HOURS} hour limit per giver per event` }, { status: 400 });
    }

    const gift = await dbGet("SELECT * FROM board_gifts WHERE id = ?", [giftId]);
    return NextResponse.json(gift, { status: 201 });
  } catch (err) {
    console.error("POST /api/boards/[id]/gifts failed:", err);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const board = await dbGet<{ gift_manager_email: string | null }>("SELECT * FROM boards WHERE id = ?", [id]);
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    const giftId = str(body.giftId, 100);
    if (!giftId) return badRequest("giftId required");

    if (body.action !== "approve" && body.action !== "reject") {
      return badRequest("action must be 'approve' or 'reject'");
    }

    if (!isEmail(body.approved_by)) {
      return badRequest("approved_by must be a valid email address");
    }

    if (!board.gift_manager_email || body.approved_by.toLowerCase() !== board.gift_manager_email.toLowerCase()) {
      return NextResponse.json(
        { error: "Only this board's designated gift manager can approve or reject gifts" },
        { status: 403 }
      );
    }

    const gift = await dbGet("SELECT id FROM board_gifts WHERE id = ? AND board_id = ?", [giftId, id]);
    if (!gift) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const status = body.action === "approve" ? "approved" : "rejected";
    await dbRun("UPDATE board_gifts SET status = ?, approved_by = ? WHERE id = ? AND board_id = ?", [
      status, body.approved_by, giftId, id,
    ]);

    const updated = await dbGet("SELECT * FROM board_gifts WHERE id = ?", [giftId]);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/boards/[id]/gifts failed:", err);
    return serverError();
  }
}
