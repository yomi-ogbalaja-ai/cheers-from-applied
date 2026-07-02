import { NextRequest, NextResponse } from "next/server";
import { dbAll } from "@/lib/db-client";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "2026", 10);

  const boards = await dbAll(`
    SELECT b.*,
      (SELECT COUNT(*) FROM board_posts WHERE board_id = b.id) as post_count
    FROM boards b
    WHERE strftime('%Y', COALESCE(b.milestone_date, b.created_at)) = ?
    ORDER BY COALESCE(b.milestone_date, b.created_at) ASC
  `, [String(year)]) as Array<{
    id: string;
    title: string;
    type: string;
    honoree_name: string;
    values_tag: string | null;
    created_at: string | null;
    milestone_date: string | null;
    post_count: number;
  }>;

  const total_boards = boards.length;
  const total_posts = boards.reduce((sum, b) => sum + (b.post_count ?? 0), 0);

  // By value
  const by_value: Record<string, number> = {};
  for (const b of boards) {
    const tag = b.values_tag ?? "Other";
    by_value[tag] = (by_value[tag] ?? 0) + 1;
  }

  // By type
  const by_type: Record<string, number> = {};
  for (const b of boards) {
    by_type[b.type] = (by_type[b.type] ?? 0) + 1;
  }

  // By month — 12 slots
  const by_month = MONTH_LABELS.map((month, i) => {
    const monthStr = String(i + 1).padStart(2, "0");
    const monthBoards = boards.filter((b) => {
      const dateStr = b.milestone_date ?? b.created_at ?? "";
      return dateStr.startsWith(`${year}-${monthStr}`);
    });
    return {
      month,
      count: monthBoards.length,
      boards: monthBoards.map((b) => b.title),
    };
  });

  return NextResponse.json({
    year,
    total_boards,
    total_posts,
    by_value,
    by_type,
    by_month,
    boards: boards.map((b) => ({
      id: b.id,
      title: b.title,
      type: b.type,
      honoree_name: b.honoree_name,
      values_tag: b.values_tag,
      post_count: b.post_count,
      date: b.milestone_date ?? b.created_at,
    })),
  });
}
