import { NextRequest, NextResponse } from "next/server";
import { dbGet } from "@/lib/db-client";
import { serverError } from "@/lib/validate";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { stub: true, message: "Slack not configured — set SLACK_WEBHOOK_URL in env" },
        { status: 200 }
      );
    }

    const board = await dbGet("SELECT * FROM boards WHERE id = ?", [id]) as Record<string, unknown> | null;
    if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const row = await dbGet("SELECT COUNT(*) as count FROM board_posts WHERE board_id = ?", [id]) as { count: number };
    const postCount = row.count;

    const url = `https://cheers-from-applied.vercel.app/board/${id}`;
    const text = `🎉 A new Cheers board is live! *${board.title}* — ${board.honoree_name} · ${board.values_tag}. ${postCount} cheers so far. View: ${url}`;

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const error = await res.text();
        return NextResponse.json({ ok: false, sent: false, error }, { status: 502 });
      }

      return NextResponse.json({ ok: true, sent: true });
    } catch (err) {
      console.error("Slack webhook failed:", err);
      return NextResponse.json({ ok: false, sent: false, error: "Failed to reach Slack" }, { status: 502 });
    }
  } catch (err) {
    console.error("POST /api/boards/[id]/slack failed:", err);
    return serverError();
  }
}
