import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resendApiKey = process.env.RESEND_API_KEY;

  const db = getDb();
  const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shareUrl = `https://cheers-from-applied.vercel.app/c/${board.share_token}`;
  const honoree = board.honoree_name as string;
  const honoreeEmail = board.honoree_email as string;

  const htmlBody = `<p>Hi ${honoree},</p><p>Your team created a celebration board for you. Click below to view your messages.</p><a href="${shareUrl}">View Your Board</a>`;

  if (!resendApiKey) {
    return NextResponse.json({
      stub: true,
      message: "Email not configured — set RESEND_API_KEY in env",
      preview: {
        to: honoreeEmail,
        subject: "Your team has a surprise for you!",
        body: htmlBody,
      },
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Cheers from Applied <cheers@applied.co>",
        to: [honoreeEmail],
        subject: "Your team has a surprise for you! 🎉",
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ sent: false, error }, { status: 200 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    return NextResponse.json({ sent: false, error: String(err) }, { status: 200 });
  }
}
