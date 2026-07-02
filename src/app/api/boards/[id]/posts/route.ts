import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db-client";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await dbGet("SELECT * FROM boards WHERE id = ?", [id]);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const postId = randomUUID();

  await dbRun(`INSERT INTO board_posts
    (id, board_id, author_name, author_email, author_avatar_color, message, gif_url, gif_title, photo_url, audio_url, reaction, is_manager_note, values_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    postId,
    id,
    body.author_name,
    body.author_email ?? null,
    body.author_avatar_color ?? "#6366f1",
    body.message ?? null,
    body.gif_url ?? null,
    body.gif_title ?? null,
    body.photo_url ?? null,
    body.audio_url ?? null,
    body.reaction ?? null,
    body.is_manager_note ? 1 : 0,
    body.values_tag ?? null,
  ]);

  // Auto-award badge if first post by this author on this board
  if (body.author_email) {
    const existing = await dbGet(
      "SELECT id FROM badges WHERE person_email = ? AND board_id = ? AND badge_type = 'team_player'",
      [body.author_email, id]
    );

    if (!existing) {
      await dbRun(
        `INSERT INTO badges (person_email, person_name, badge_type, board_id, reason)
        VALUES (?, ?, 'team_player', ?, ?)`,
        [body.author_email, body.author_name, id, "Showed up for a teammate's milestone"]
      );
    }
  }

  const post = await dbGet("SELECT * FROM board_posts WHERE id = ?", [postId]);
  return NextResponse.json(post, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { postId, message } = await req.json();
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  await dbRun("UPDATE board_posts SET message = ? WHERE id = ? AND board_id = ?", [message ?? null, postId, id]);

  const post = await dbGet("SELECT * FROM board_posts WHERE id = ?", [postId]);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}
