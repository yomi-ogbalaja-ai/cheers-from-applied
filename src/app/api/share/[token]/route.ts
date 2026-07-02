import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll } from "@/lib/db-client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const board = await dbGet("SELECT * FROM boards WHERE share_token = ?", [token]) as { id: string; public_share_enabled: number } | null;

  if (!board || board.public_share_enabled === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = await dbAll(
    "SELECT * FROM board_posts WHERE board_id = ? ORDER BY is_manager_note DESC, created_at ASC",
    [board.id]
  );

  const gifts = await dbAll(
    "SELECT * FROM board_gifts WHERE board_id = ? ORDER BY created_at ASC",
    [board.id]
  );

  return NextResponse.json({ board, posts, gifts });
}
