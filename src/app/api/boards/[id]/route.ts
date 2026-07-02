import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll } from "@/lib/db-client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await dbGet("SELECT * FROM boards WHERE id = ?", [id]);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = await dbAll(
    "SELECT * FROM board_posts WHERE board_id = ? ORDER BY is_manager_note DESC, created_at ASC",
    [id]
  );

  const gifts = await dbAll("SELECT * FROM board_gifts WHERE board_id = ? ORDER BY created_at ASC", [id]);

  const badges = await dbAll(
    "SELECT * FROM badges WHERE board_id = ? ORDER BY awarded_at DESC",
    [id]
  );

  return NextResponse.json({ board, posts, gifts, badges });
}
