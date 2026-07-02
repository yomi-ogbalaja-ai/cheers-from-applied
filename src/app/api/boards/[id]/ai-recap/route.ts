import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbAll } from "@/lib/db-client";
import { serverError } from "@/lib/validate";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const board = await dbGet("SELECT * FROM boards WHERE id = ?", [id]) as {
      honoree_name: string;
      type: string;
      values_tag: string | null;
    } | null;
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allPosts = await dbAll(
      "SELECT * FROM board_posts WHERE board_id = ? ORDER BY created_at ASC",
      [id]
    ) as { message: string | null; is_manager_note: number }[];

    const posts = allPosts.filter((p) => !p.is_manager_note && p.message);

    if (posts.length < 2) {
      return NextResponse.json({ recap: "Not enough cheers yet to generate a recap.", ai: false, post_count: posts.length });
    }

    const fallback = () => {
      const valuesTag = board.values_tag ?? "teamwork and appreciation";
      return NextResponse.json({
        recap: `Your board has ${posts.length} cheers from your team. The messages highlight themes of ${valuesTag}.`,
        ai: false,
        post_count: posts.length,
      });
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return fallback();

    try {
      const messageSample = posts
        .slice(0, 20)
        .map((p) => `- ${p.message!.slice(0, 200)}`)
        .join("\n");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 256,
          system: "You write warm, concise celebration summaries for team milestone boards. 2-3 sentences max. Focus on what makes this person special based on what teammates said.",
          messages: [
            {
              role: "user",
              content: `Here are the cheer messages for ${board.honoree_name}'s ${board.type} board:\n${messageSample}\n\nWrite a 2-3 sentence highlights summary that captures the team's sentiment.`,
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) return fallback();

      const data = await res.json();
      const recap = data?.content?.[0]?.text?.trim();
      if (!recap) return fallback();
      return NextResponse.json({ recap, ai: true, post_count: posts.length });
    } catch {
      return fallback();
    }
  } catch (err) {
    console.error("POST /api/boards/[id]/ai-recap failed:", err);
    return serverError();
  }
}
