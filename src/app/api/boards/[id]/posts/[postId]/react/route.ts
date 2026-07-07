import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRunReturning } from "@/lib/db-client";
import { badRequest, serverError, parseJson } from "@/lib/validate";

const ALLOWED_EMOJIS = new Set(["❤️", "🔥", "🙌", "😂", "👏", "🎉"]);
const MAX_REACTION_COUNT = 9999;
const MAX_CAS_ATTEMPTS = 15;

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

    // Compare-and-swap loop: guards the UPDATE on the exact reactions_json
    // value just read, so two concurrent reactions on the same post can't
    // both read-modify-write from the same stale snapshot and silently drop
    // one increment. Retries (re-reading fresh state) on a lost race.
    let reactions: Record<string, number> = {};
    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
      const post = await dbGet<{ id: string; reactions_json: string | null }>(
        "SELECT id, reactions_json FROM board_posts WHERE id = ? AND board_id = ?",
        [postId, id]
      );

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      reactions = {};
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
      const newJson = JSON.stringify(reactions);

      const updated = post.reactions_json === null
        ? await dbRunReturning("UPDATE board_posts SET reactions_json = ? WHERE id = ? AND reactions_json IS NULL RETURNING id", [newJson, postId])
        : await dbRunReturning("UPDATE board_posts SET reactions_json = ? WHERE id = ? AND reactions_json = ? RETURNING id", [newJson, postId, post.reactions_json]);

      if (updated.length > 0) break;
      if (attempt === MAX_CAS_ATTEMPTS - 1) return serverError("Too much reaction traffic on this post, try again");
    }

    return NextResponse.json({ reactions });
  } catch (err) {
    console.error("POST /api/boards/[id]/posts/[postId]/react failed:", err);
    return serverError();
  }
}
