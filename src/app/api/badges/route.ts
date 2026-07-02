import { NextResponse } from "next/server";
import { dbAll } from "@/lib/db-client";

export async function GET() {
  const badges = await dbAll("SELECT * FROM badges ORDER BY awarded_at DESC") as Array<{
    id: number; person_email: string; person_name: string; badge_type: string;
    board_id: string | null; reason: string | null; awarded_at: string;
  }>;

  // Group by person_email
  const grouped: Record<string, { person_name: string; person_email: string; badges: typeof badges }> = {};
  for (const b of badges) {
    if (!grouped[b.person_email]) {
      grouped[b.person_email] = { person_name: b.person_name, person_email: b.person_email, badges: [] };
    }
    grouped[b.person_email].badges.push(b);
  }

  return NextResponse.json(Object.values(grouped));
}
