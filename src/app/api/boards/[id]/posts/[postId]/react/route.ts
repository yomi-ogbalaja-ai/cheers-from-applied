import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db-client";

const ALLOWED_EMOJIS = new Set(["❤️", "🔥", "🙌", "😂", "👏", "🎉"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id, postId } = await params;

  let emoji: string;
  try {
    const body = await request.json();
    emoji = body.emoji;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!emoji || !ALLOWED_EMOJIS.has(emoji)) {
    return NextResponse.json(
      { error: "Invalid emoji. Must be one of: ❤️ 🔥 🙌 😂 👏 🎉" },
      { status: 400 }
    );
  }

  const post = await dbGet<{ id: string; reactions_json: string | null }>(
    "SELECT id, reactions_json FROM board_posts WHERE id = ? AND board_id = ?",
    [postId, id]
  );

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const reactions: Record<string, number> = post.reactions_json
    ? JSON.parse(post.reactions_json)
    : {};

  reactions[emoji] = (reactions[emoji] ?? 0) + 1;

  await dbRun("UPDATE board_posts SET reactions_json = ? WHERE id = ?", [
    JSON.stringify(reactions),
    postId,
  ]);

  return NextResponse.json({ reactions });
}
