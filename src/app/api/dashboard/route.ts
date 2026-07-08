import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db-client";

export async function GET() {
  try {
    const activeBoards = await dbAll(
      "SELECT * FROM boards WHERE status = 'open' OR status = 'active'",
      []
    ) as any[];

    const participation = await dbAll(
      `SELECT b.id as board_id, b.title, b.honoree_name, b.type, b.values_tag, b.expires_at,
          COUNT(DISTINCT p.id) as post_count,
          COUNT(DISTINCT v.id) as view_count
         FROM boards b
         LEFT JOIN board_posts p ON p.board_id = b.id
         LEFT JOIN celebration_views v ON v.board_id = b.id
         WHERE b.status = 'open' OR b.status = 'active'
         GROUP BY b.id
         ORDER BY b.expires_at ASC`,
      []
    ) as any[];

    const topContributors = await dbAll(
      `SELECT author_name, COUNT(*) as count
         FROM board_posts
         WHERE is_manager_note = 0
         GROUP BY author_name
         ORDER BY count DESC
         LIMIT 10`,
      []
    ) as any[];

    const valuesPosts = await dbAll(
      `SELECT bp.values_tag
         FROM board_posts bp
         JOIN boards b ON b.id = bp.board_id
         WHERE (b.status = 'open' OR b.status = 'active') AND bp.values_tag IS NOT NULL`,
      []
    ) as any[];

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
    const totalViews = participation.reduce((s: number, b: any) => s + (b.view_count || 0), 0);

    return NextResponse.json({
      active_boards: activeBoards,
      participation,
      top_contributors: topContributors,
      values_breakdown: valuesBreakdown,
      total_active: totalActive,
      avg_posts_per_board: avgPostsPerBoard,
      total_views: totalViews,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
