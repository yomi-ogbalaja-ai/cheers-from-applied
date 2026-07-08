import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db-client";
import { randomUUID } from "crypto";
import { badRequest, serverError, parseJson, str } from "@/lib/validate";

// Records a unique (board, anonymous session) view. Deliberately dedupes at
// the DB level via the UNIQUE(board_id, session_id) constraint rather than
// logging every mount, so repeat visits from the same browser don't inflate
// the count and the table stays small.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const board = await dbGet("SELECT id FROM boards WHERE id = ?", [id]);
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");

    const session_id = str(body.session_id, 100);
    if (!session_id) return badRequest("session_id is required (max 100 chars)");

    await dbRun(
      `INSERT INTO celebration_views (id, board_id, session_id)
       VALUES (?, ?, ?)
       ON CONFLICT (board_id, session_id) DO NOTHING`,
      [randomUUID(), id, session_id]
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/celebrations/[id]/view failed:", err);
    return serverError();
  }
}
