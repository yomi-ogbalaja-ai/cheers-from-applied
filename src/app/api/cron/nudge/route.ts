import { NextRequest, NextResponse } from "next/server";
import { dbAll, dbGet } from "@/lib/db-client";
import { serverError } from "@/lib/validate";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
    }

    if (
      request.headers.get("authorization") !==
      `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Get all active boards expiring in ≤ 3 days
    const boards = await dbAll(
      `SELECT * FROM boards
         WHERE status = 'active'
           AND expires_at IS NOT NULL
           AND expires_at <= ?
           AND expires_at >= ?`,
      [threeDaysFromNow.toISOString(), now.toISOString()]
    ) as Array<{
      id: string;
      title: string;
      expires_at: string;
    }>;

    let nudged = 0;

    for (const board of boards) {
      // Count posts excluding manager notes
      const row = await dbGet(
        `SELECT COUNT(*) as count FROM board_posts
           WHERE board_id = ? AND is_manager_note = 0`,
        [board.id]
      ) as { count: number };
      const { count } = row;

      if (count < 5) {
        const expiresAt = new Date(board.expires_at);
        const msLeft = expiresAt.getTime() - now.getTime();
        const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

        const message = `⏰ Reminder: ${board.title} closes in ${days} day(s) and only has ${count} cheers so far. Add yours: https://cheers-from-applied.vercel.app/board/${board.id}`;

        if (process.env.SLACK_WEBHOOK_URL) {
          try {
            await fetch(process.env.SLACK_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: message }),
              signal: AbortSignal.timeout(10000),
            });
            console.log(`[nudge] Slack nudge sent for board ${board.id}`);
          } catch (err) {
            console.error(`[nudge] Failed to send Slack nudge for board ${board.id}:`, err);
          }
        } else {
          console.log(`[nudge] No SLACK_WEBHOOK_URL set. Would have sent: ${message}`);
        }

        nudged++;
      }
    }

    return NextResponse.json({
      nudged,
      boards_checked: boards.length,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/cron/nudge failed:", err);
    return serverError();
  }
}
