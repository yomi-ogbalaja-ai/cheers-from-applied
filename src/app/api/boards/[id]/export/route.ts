import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function escapeCsvValue(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = db
    .prepare("SELECT * FROM board_posts WHERE board_id = ? ORDER BY created_at ASC")
    .all(id) as Record<string, unknown>[];

  const header = "author_name,message,values_tag,reaction,created_at,type";
  const rows = posts.map((post) =>
    [
      escapeCsvValue(post.author_name),
      escapeCsvValue(post.message),
      escapeCsvValue(post.values_tag),
      escapeCsvValue(post.reaction),
      escapeCsvValue(post.created_at),
      escapeCsvValue(board.type),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="board-${id}-posts.csv"`,
    },
  });
}
