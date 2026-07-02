import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db-client";

function daysUntilNextOccurrence(milestoneDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const md = new Date(milestoneDate);
  const month = md.getUTCMonth();
  const day = md.getUTCDate();

  // Try this year
  let next = new Date(today.getFullYear(), month, day);
  if (next < today) {
    // Already passed this year, use next year
    next = new Date(today.getFullYear() + 1, month, day);
  }

  const diff = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export async function GET() {
  try {
    const boards = await dbAll(
      `SELECT id, honoree_name, type, title, milestone_date, expires_at FROM boards`,
      []
    ) as any[];

    const upcoming: any[] = [];

    for (const board of boards) {
      const dateStr = board.milestone_date || board.expires_at;
      if (!dateStr) continue;

      const relevantTypes = ["birthday", "work_anniversary", "milestone"];
      const hasMilestoneDate = !!board.milestone_date;
      const isRelevantType = relevantTypes.includes(board.type);

      if (!hasMilestoneDate && !isRelevantType) continue;

      const daysUntil = daysUntilNextOccurrence(dateStr);

      if (daysUntil >= 0 && daysUntil <= 60) {
        upcoming.push({
          board_id: board.id,
          honoree_name: board.honoree_name,
          type: board.type,
          milestone_date: dateStr,
          days_until: daysUntil,
          title: board.title,
        });
      }
    }

    upcoming.sort((a, b) => a.days_until - b.days_until);

    return NextResponse.json({ upcoming });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
