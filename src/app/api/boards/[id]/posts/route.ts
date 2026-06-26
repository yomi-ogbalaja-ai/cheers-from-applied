import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(id);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const postId = randomUUID();

  db.prepare(`INSERT INTO board_posts
    (id, board_id, author_name, author_email, author_avatar_color, message, gif_url, gif_title, photo_url, audio_url, reaction, is_manager_note, values_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  );

  // Auto-award badge if first post by this author on this board
  if (body.author_email) {
    const existing = db.prepare(
      "SELECT id FROM badges WHERE person_email = ? AND board_id = ? AND badge_type = 'team_player'"
    ).get(body.author_email, id);

    if (!existing) {
      db.prepare(`INSERT INTO badges (person_email, person_name, badge_type, board_id, reason)
        VALUES (?, ?, 'team_player', ?, 'Showed up for a teammate's milestone')`
      ).run(body.author_email, body.author_name, id);
    }
  }

  const post = db.prepare("SELECT * FROM board_posts WHERE id = ?").get(postId);
  return NextResponse.json(post, { status: 201 });
}
