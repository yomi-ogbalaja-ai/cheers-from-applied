import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db-client";
import { badRequest, serverError, parseJson } from "@/lib/validate";

const ALLOWED_EMOJIS = new Set(["❤️", "🔥", "🙌", "😂", "👏", "🎉"]);
const MAX_REACTION_COUNT = 9999;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params;

    const body = await parseJson(request);
    if (!body) return badRequest("Invalid JSON body");

    const emoji = body.emoji;
    if (typeof emoji !== "string" || !emoji || emoji.length > 8 || !ALLOWED_EMOJIS.has(emoji)) {
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

    let reactions: Record<string, number> = {};
    if (post.reactions_json) {
      try {
        const parsed = JSON.parse(post.reactions_json);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          reactions = parsed;
        }
      } catch {
        reactions = {};
      }
    }

    const current = typeof reactions[emoji] === "number" ? reactions[emoji] : 0;
    reactions[emoji] = Math.min(current + 1, MAX_REACTION_COUNT);

    await dbRun("UPDATE board_posts SET reactions_json = ? WHERE id = ?", [
      JSON.stringify(reactions),
      postId,
    ]);

    return NextResponse.json({ reactions });
  } catch (err) {
    console.error("POST /api/boards/[id]/posts/[postId]/react failed:", err);
    return serverError();
  }
}
