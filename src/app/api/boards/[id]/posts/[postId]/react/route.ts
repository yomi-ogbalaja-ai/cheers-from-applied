import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

  const db = getDb();

  const post = db
    .prepare(
      "SELECT id, reactions_json FROM board_posts WHERE id = ? AND board_id = ?"
    )
    .get(postId, id) as { id: string; reactions_json: string | null } | undefined;

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const reactions: Record<string, number> = post.reactions_json
    ? JSON.parse(post.reactions_json)
    : {};

  reactions[emoji] = (reactions[emoji] ?? 0) + 1;

  db.prepare("UPDATE board_posts SET reactions_json = ? WHERE id = ?").run(
    JSON.stringify(reactions),
    postId
  );

  return NextResponse.json({ reactions });
}
