import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db-client";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gifts = await dbAll("SELECT * FROM board_gifts WHERE board_id = ? ORDER BY created_at ASC", [id]);
  const agg = await dbGet<{ total_pending_hrs: number; total_approved_hrs: number }>(`
    SELECT
      COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END), 0) as total_pending_hrs,
      COALESCE(SUM(CASE WHEN status='approved' THEN amount ELSE 0 END), 0) as total_approved_hrs
    FROM board_gifts WHERE board_id = ?
  `, [id]);
  return NextResponse.json({ gifts, ...agg as object });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await dbGet<{ requires_gift_approval: number }>("SELECT * FROM boards WHERE id = ?", [id]);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Max 8 hrs per giver per board
  const existingRow = await dbGet<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM board_gifts WHERE board_id = ? AND from_email = ?",
    [id, body.from_email]
  );
  const existingTotal = existingRow?.total ?? 0;
  if (existingTotal + body.amount > 8) {
    return NextResponse.json({ error: "Exceeds 8 hour limit per giver per event" }, { status: 400 });
  }

  const giftId = randomUUID();
  const autoApprove = board.requires_gift_approval === 0;
  await dbRun(`INSERT INTO board_gifts
    (id, board_id, from_name, from_email, gift_type, amount, note, status, workday_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    giftId, id, body.from_name, body.from_email, body.gift_type ?? "time_off_hours",
    body.amount, body.note ?? null, autoApprove ? "approved" : "pending", body.workday_balance ?? null,
  ]);

  const gift = await dbGet("SELECT * FROM board_gifts WHERE id = ?", [giftId]);
  return NextResponse.json(gift, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { giftId, action, approved_by } = body;

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  await dbRun("UPDATE board_gifts SET status = ?, approved_by = ? WHERE id = ? AND board_id = ?", [
    status, approved_by ?? null, giftId, id,
  ]);

  const gift = await dbGet("SELECT * FROM board_gifts WHERE id = ?", [giftId]);
  return NextResponse.json(gift);
}
