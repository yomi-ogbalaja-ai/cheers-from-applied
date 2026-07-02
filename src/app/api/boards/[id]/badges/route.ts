import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db-client";
import { badRequest, serverError, parseJson, str, optStr, isEmail } from "@/lib/validate";

const BADGE_TYPES = [
  "team_player",
  "cheer_champion",
  "birthday_star",
  "rising_star",
  "generous_soul",
  "milestone_maker",
  "culture_carrier",
  "heartwarmer",
  "welcome_wagon",
];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const badges = await dbAll("SELECT * FROM badges WHERE board_id = ? ORDER BY awarded_at DESC", [id]);
    return NextResponse.json(badges);
  } catch (err) {
    console.error("GET /api/boards/[id]/badges failed:", err);
    return serverError();
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const board = await dbGet("SELECT id FROM boards WHERE id = ?", [id]);
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    const person_name = str(body.person_name, 100);
    if (!person_name) return badRequest("person_name is required (max 100 chars)");

    const badge_type = str(body.badge_type, 50);
    if (!badge_type || !BADGE_TYPES.includes(badge_type)) {
      return badRequest(`badge_type must be one of: ${BADGE_TYPES.join(", ")}`);
    }

    if (body.person_email !== undefined && body.person_email !== null && body.person_email !== "" && !isEmail(body.person_email)) {
      return badRequest("person_email must be a valid email address");
    }

    if (body.reason !== undefined && body.reason !== null && body.reason !== "" && optStr(body.reason, 500) === null) {
      return badRequest("reason must be a string (max 500 chars)");
    }

    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    await dbRun(
      `INSERT INTO badges (person_email, person_name, badge_type, board_id, reason, awarded_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [isEmail(body.person_email) ? body.person_email : "", person_name, badge_type, id, optStr(body.reason, 500), now]
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/boards/[id]/badges failed:", err);
    return serverError();
  }
}
