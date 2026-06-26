import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const board = db.prepare("SELECT * FROM boards WHERE share_token = ?").get(token) as { id: string; public_share_enabled: number } | null;

  if (!board || board.public_share_enabled === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = db.prepare(
    "SELECT * FROM board_posts WHERE board_id = ? ORDER BY is_manager_note DESC, created_at ASC"
  ).all(board.id);

  const gifts = db.prepare(
    "SELECT * FROM board_gifts WHERE board_id = ? ORDER BY created_at ASC"
  ).all(board.id);

  return NextResponse.json({ board, posts, gifts });
}
