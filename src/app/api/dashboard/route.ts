import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();

    const activeBoards = db
      .prepare("SELECT * FROM boards WHERE status = 'open' OR status = 'active'")
      .all() as any[];

    const participation = db
      .prepare(
        `SELECT b.id as board_id, b.title, b.honoree_name, b.type, b.values_tag, b.expires_at,
          COUNT(p.id) as post_count
         FROM boards b
         LEFT JOIN board_posts p ON p.board_id = b.id
         WHERE b.status = 'open' OR b.status = 'active'
         GROUP BY b.id
         ORDER BY b.expires_at ASC`
      )
      .all() as any[];

    const topContributors = db
      .prepare(
        `SELECT author_name, COUNT(*) as count
         FROM board_posts
         WHERE is_manager_note = 0
         GROUP BY author_name
         ORDER BY count DESC
         LIMIT 10`
      )
      .all() as any[];

    const valuesPosts = db
      .prepare(
        `SELECT bp.values_tag
         FROM board_posts bp
         JOIN boards b ON b.id = bp.board_id
         WHERE (b.status = 'open' OR b.status = 'active') AND bp.values_tag IS NOT NULL`
      )
      .all() as any[];

    const VALUES_TAGS = ["Win Together", "Be Bold", "Move with Urgency"];
    const valuesBreakdown: Record<string, number> = {
      "Win Together": 0,
      "Be Bold": 0,
      "Move with Urgency": 0,
    };
    for (const row of valuesPosts) {
      if (VALUES_TAGS.includes(row.values_tag)) {
        valuesBreakdown[row.values_tag]++;
      }
    }

    const totalActive = activeBoards.length;
    const totalPosts = participation.reduce((s: number, b: any) => s + (b.post_count || 0), 0);
    const avgPostsPerBoard = totalActive > 0 ? Math.round((totalPosts / totalActive) * 10) / 10 : 0;

    return NextResponse.json({
      active_boards: activeBoards,
      participation,
      top_contributors: topContributors,
      values_breakdown: valuesBreakdown,
      total_active: totalActive,
      avg_posts_per_board: avgPostsPerBoard,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
