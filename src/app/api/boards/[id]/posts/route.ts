import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db-client";
import { randomUUID } from "crypto";
import { badRequest, serverError, parseJson, str, optStr, isEmail } from "@/lib/validate";

const VALUES_TAGS = ["Win Together", "Be Bold", "Move with Urgency"];

function isUrlLike(v: unknown, allowData: boolean): v is string {
  if (typeof v !== "string" || !v) return false;
  if (v.startsWith("https://")) return true;
  return allowData && v.startsWith("data:");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const board = await dbGet<{ status: string; expires_at: string | null }>(
      "SELECT * FROM boards WHERE id = ?",
      [id]
    );
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Closed board check
    if (
      board.status !== "active" ||
      (board.expires_at && new Date(board.expires_at) < new Date())
    ) {
      return NextResponse.json({ error: "This board is closed" }, { status: 403 });
    }

    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    const author_name = str(body.author_name, 100);
    if (!author_name) return badRequest("author_name is required (max 100 chars)");

    if (body.message !== undefined && body.message !== null && body.message !== "" && optStr(body.message, 2000) === null) {
      return badRequest("message must be a string (max 2000 chars)");
    }
    const message = optStr(body.message, 2000);

    if (body.author_email !== undefined && body.author_email !== null && body.author_email !== "" && !isEmail(body.author_email)) {
      return badRequest("author_email must be a valid email address");
    }
    const author_email = isEmail(body.author_email) ? body.author_email : null;

    if (body.values_tag !== undefined && body.values_tag !== null && body.values_tag !== "" && !VALUES_TAGS.includes(body.values_tag as string)) {
      return badRequest(`values_tag must be one of: ${VALUES_TAGS.join(", ")}`);
    }

    if (body.gif_url !== undefined && body.gif_url !== null && body.gif_url !== "" && !isUrlLike(body.gif_url, false)) {
      return badRequest("gif_url must be an https:// URL");
    }
    if (body.photo_url !== undefined && body.photo_url !== null && body.photo_url !== "" && !isUrlLike(body.photo_url, true)) {
      return badRequest("photo_url must be an https:// URL or data: URI");
    }
    if (body.audio_url !== undefined && body.audio_url !== null && body.audio_url !== "" && !isUrlLike(body.audio_url, true)) {
      return badRequest("audio_url must be an https:// URL or data: URI");
    }

    const gif_url = typeof body.gif_url === "string" && body.gif_url ? body.gif_url : null;
    const photo_url = typeof body.photo_url === "string" && body.photo_url ? body.photo_url : null;
    const audio_url = typeof body.audio_url === "string" && body.audio_url ? body.audio_url : null;
    const reaction = optStr(body.reaction, 16);

    if (!message && !gif_url && !photo_url && !audio_url && !reaction) {
      return badRequest("Provide at least one of: message, gif_url, photo_url, audio_url, reaction");
    }

    // Duplicate prevention: idempotent on (board, author_email, message)
    if (author_email && message) {
      const dup = await dbGet<{ id: string }>(
        "SELECT id FROM board_posts WHERE board_id = ? AND author_email = ? AND message = ?",
        [id, author_email, message]
      );
      if (dup) {
        const existingPost = await dbGet("SELECT * FROM board_posts WHERE id = ?", [dup.id]);
        return NextResponse.json(existingPost, { status: 200 });
      }
    }

    const postId = randomUUID();

    await dbRun(`INSERT INTO board_posts
      (id, board_id, author_name, author_email, author_avatar_color, message, gif_url, gif_title, photo_url, audio_url, reaction, is_manager_note, values_tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      postId,
      id,
      author_name,
      author_email,
      optStr(body.author_avatar_color, 20) ?? "#6366f1",
      message,
      gif_url,
      optStr(body.gif_title, 200),
      photo_url,
      audio_url,
      reaction,
      body.is_manager_note ? 1 : 0,
      optStr(body.values_tag, 50),
    ]);

    // Auto-award badge if first post by this author on this board
    if (author_email) {
      const existing = await dbGet(
        "SELECT id FROM badges WHERE person_email = ? AND board_id = ? AND badge_type = 'team_player'",
        [author_email, id]
      );

      if (!existing) {
        await dbRun(
          `INSERT INTO badges (person_email, person_name, badge_type, board_id, reason)
          VALUES (?, ?, 'team_player', ?, ?)`,
          [author_email, author_name, id, "Showed up for a teammate's milestone"]
        );
      }
    }

    const post = await dbGet("SELECT * FROM board_posts WHERE id = ?", [postId]);
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("POST /api/boards/[id]/posts failed:", err);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    const postId = str(body.postId, 100);
    if (!postId) return badRequest("postId required");

    if (body.message !== undefined && body.message !== null && body.message !== "" && optStr(body.message, 2000) === null) {
      return badRequest("message must be a string (max 2000 chars)");
    }
    const message = optStr(body.message, 2000);

    await dbRun("UPDATE board_posts SET message = ? WHERE id = ? AND board_id = ?", [message, postId, id]);

    const post = await dbGet("SELECT * FROM board_posts WHERE id = ?", [postId]);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    console.error("PATCH /api/boards/[id]/posts failed:", err);
    return serverError();
  }
}
