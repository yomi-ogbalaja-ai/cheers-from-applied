import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db-client";
import { randomUUID } from "crypto";
import { badRequest, serverError, parseJson, str, optStr, isEmail } from "@/lib/validate";

const BOARD_TYPES = [
  "birthday",
  "promotion",
  "new_hire",
  "work_anniversary",
  "wedding",
  "new_baby",
  "get_well",
  "personal_achievement",
];

const VALUES_TAGS = ["Win Together", "Be Bold", "Move with Urgency"];

export async function GET() {
  try {
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
  } catch (err) {
    console.error("GET /api/boards failed:", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    const honoree_name = str(body.honoree_name, 100);
    if (!honoree_name) return badRequest("honoree_name is required (max 100 chars)");

    const title = str(body.title, 200);
    if (!title) return badRequest("title is required (max 200 chars)");

    const type = str(body.type, 50);
    if (!type || !BOARD_TYPES.includes(type)) {
      return badRequest(`type must be one of: ${BOARD_TYPES.join(", ")}`);
    }

    if (body.description !== undefined && body.description !== null && body.description !== "") {
      if (optStr(body.description, 1000) === null) {
        return badRequest("description must be a string (max 1000 chars)");
      }
    }
    const description = optStr(body.description, 1000);

    if (body.honoree_email !== undefined && body.honoree_email !== null && body.honoree_email !== "" && !isEmail(body.honoree_email)) {
      return badRequest("honoree_email must be a valid email address");
    }
    if (body.created_by !== undefined && body.created_by !== null && body.created_by !== "" && !isEmail(body.created_by)) {
      return badRequest("created_by must be a valid email address");
    }

    if (body.values_tag !== undefined && body.values_tag !== null && body.values_tag !== "" && !VALUES_TAGS.includes(body.values_tag as string)) {
      return badRequest(`values_tag must be one of: ${VALUES_TAGS.join(", ")}`);
    }

    if (
      body.honoree_avatar_color !== undefined &&
      body.honoree_avatar_color !== null &&
      body.honoree_avatar_color !== "" &&
      (typeof body.honoree_avatar_color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(body.honoree_avatar_color))
    ) {
      return badRequest("honoree_avatar_color must be a hex color like #6366f1");
    }

    // Compute expires_at from close_days if not explicitly provided.
    let expires_at = optStr(body.expires_at, 50);
    if (!expires_at) {
      let days = 30;
      if (body.close_days !== undefined && body.close_days !== null) {
        const n = Number(body.close_days);
        if (!Number.isFinite(n) || n < 1 || n > 365) {
          return badRequest("close_days must be a number between 1 and 365");
        }
        days = Math.floor(n);
      }
      expires_at = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    }

    const id = randomUUID();
    const share_token = randomUUID();

    await dbRun(`INSERT INTO boards
      (id, honoree_name, honoree_email, honoree_avatar_color, type, title, description,
       milestone_date, values_tag, is_private, public_share_enabled, share_token,
       requires_gift_approval, gift_manager_email, status, created_by, created_by_name, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `, [
      id,
      honoree_name,
      optStr(body.honoree_email, 254),
      optStr(body.honoree_avatar_color, 7) ?? "#6366f1",
      type,
      title,
      description,
      optStr(body.milestone_date, 50),
      optStr(body.values_tag, 50) ?? "Win Together",
      body.is_private ? 1 : 0,
      body.public_share_enabled !== false ? 1 : 0,
      share_token,
      body.requires_gift_approval ? 1 : 0,
      optStr(body.gift_manager_email, 254),
      optStr(body.created_by, 254),
      optStr(body.created_by_name, 100),
      expires_at,
    ]);

    const board = await dbGet("SELECT * FROM boards WHERE id = ?", [id]);
    return NextResponse.json(board, { status: 201 });
  } catch (err) {
    console.error("POST /api/boards failed:", err);
    return serverError();
  }
}
