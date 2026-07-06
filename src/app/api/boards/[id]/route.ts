import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll, dbRun } from "@/lib/db-client";
import { badRequest, serverError, parseJson, str, optStr } from "@/lib/validate";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await dbGet("SELECT id FROM boards WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    if (body.title !== undefined && str(body.title, 200) === null) {
      return badRequest("title must be a non-empty string (max 200 chars)");
    }
    if (body.description !== undefined && body.description !== null && body.description !== "" && optStr(body.description, 1000) === null) {
      return badRequest("description must be a string (max 1000 chars)");
    }

    if (body.title === undefined && body.description === undefined) {
      return badRequest("Provide at least one of: title, description");
    }

    if (body.title !== undefined) {
      await dbRun("UPDATE boards SET title = ? WHERE id = ?", [str(body.title, 200), id]);
    }
    if (body.description !== undefined) {
      await dbRun("UPDATE boards SET description = ? WHERE id = ?", [optStr(body.description, 1000), id]);
    }

    const board = await dbGet("SELECT * FROM boards WHERE id = ?", [id]);
    return NextResponse.json(board);
  } catch (err) {
    console.error("PATCH /api/boards/[id] failed:", err);
    return serverError();
  }
}
