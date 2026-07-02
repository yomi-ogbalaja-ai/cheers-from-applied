import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db-client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const badges = await dbAll("SELECT * FROM badges WHERE board_id = ? ORDER BY awarded_at DESC", [id]);
  return NextResponse.json(badges);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await dbGet("SELECT id FROM boards WHERE id = ?", [id]);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { person_name, person_email, badge_type, reason } = body;
  if (!person_name || !badge_type) {
    return NextResponse.json({ error: "person_name and badge_type required" }, { status: 400 });
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  await dbRun(
    `INSERT INTO badges (person_email, person_name, badge_type, board_id, reason, awarded_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [person_email ?? "", person_name, badge_type, id, reason ?? null, now]
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
