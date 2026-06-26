import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(id);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = db.prepare(
    "SELECT * FROM board_posts WHERE board_id = ? ORDER BY is_manager_note DESC, created_at ASC"
  ).all(id);

  const gifts = db.prepare("SELECT * FROM board_gifts WHERE board_id = ? ORDER BY created_at ASC").all(id);

  const badges = db.prepare(
    "SELECT * FROM badges WHERE board_id = ? ORDER BY awarded_at DESC"
  ).all(id);

  return NextResponse.json({ board, posts, gifts, badges });
}
