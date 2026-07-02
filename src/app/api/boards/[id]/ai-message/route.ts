import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, parseJson } from "@/lib/validate";

const FALLBACK = { message: "Wishing you a wonderful celebration! You bring so much to this team.", ai: false };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params; // id not needed for message generation
    const body = await parseJson(req);
    if (!body) return badRequest("Invalid JSON body");
    const { milestone_type, honoree_name, sender_context } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json(FALLBACK);

    try {
      const userMessage = `Write a cheer message for ${honoree_name}'s ${milestone_type}. ${sender_context ? "Extra context: " + sender_context : ""} Make it feel genuine and specific to this milestone.`;

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
          system: "You write warm, genuine celebration messages for workplace milestones. Keep them personal, specific, and under 3 sentences. No corporate jargon. Sound like a real teammate.",
          messages: [{ role: "user", content: userMessage }],
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) return NextResponse.json(FALLBACK);

      const data = await res.json();
      const message = data?.content?.[0]?.text?.trim() ?? FALLBACK.message;
      return NextResponse.json({ message, ai: true });
    } catch {
      return NextResponse.json(FALLBACK);
    }
  } catch (err) {
    console.error("POST /api/boards/[id]/ai-message failed:", err);
    return serverError();
  }
}
