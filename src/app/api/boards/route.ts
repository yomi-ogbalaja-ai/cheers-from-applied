import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db-client";
import { randomUUID } from "crypto";

export async function GET() {
  const boards = await dbAll(`
    SELECT b.*,
      (SELECT COUNT(*) FROM board_posts WHERE board_id = b.id) as post_count,
      (SELECT COUNT(*) FROM board_gifts WHERE board_id = b.id) as gift_count,
      (SELECT COALESCE(SUM(amount), 0) FROM board_gifts WHERE board_id = b.id AND status = 'approved') as approved_hours
    FROM boards b
    WHERE b.status = 'active'
    ORDER BY b.created_at DESC
  `);
  return NextResponse.json(boards);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = randomUUID();
  const share_token = randomUUID();

  await dbRun(`INSERT INTO boards
    (id, honoree_name, honoree_email, honoree_avatar_color, type, title, description,
     milestone_date, values_tag, is_private, public_share_enabled, share_token,
     requires_gift_approval, gift_manager_email, status, created_by, created_by_name, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `, [
    id,
    body.honoree_name,
    body.honoree_email ?? null,
    body.honoree_avatar_color ?? "#6366f1",
    body.type,
    body.title,
    body.description ?? null,
    body.milestone_date ?? null,
    body.values_tag ?? "Win Together",
    body.is_private ? 1 : 0,
    body.public_share_enabled !== false ? 1 : 0,
    share_token,
    body.requires_gift_approval !== false ? 1 : 0,
    body.gift_manager_email ?? null,
    body.created_by ?? null,
    body.created_by_name ?? null,
    body.expires_at ?? null,
  ]);

  const board = await dbGet("SELECT * FROM boards WHERE id = ?", [id]);
  return NextResponse.json(board, { status: 201 });
}
