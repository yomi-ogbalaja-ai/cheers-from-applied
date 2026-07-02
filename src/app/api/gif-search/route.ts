import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "celebration";
  const key = process.env.TENOR_API_KEY;

  if (!key) {
    const FALLBACK = [
      { url: "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif", title: "Birthday Confetti" },
      { url: "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif", title: "Congrats!" },
      { url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", title: "Celebration" },
      { url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXppYWR1NWc2cDJxMHN1bm50MXpvaHFqeDNoeXd6MXR2MXB2aXdxeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XDAY1NNG2VvobAp9o1/giphy.gif", title: "Welcome!" },
      { url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif", title: "Amazing!" },
      { url: "https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif", title: "Fireworks" },
      { url: "https://media.giphy.com/media/xT9IgG50Lg7rusNZ6A/giphy.gif", title: "High Five" },
      { url: "https://media.giphy.com/media/l0He4s2cNyROC9NVK/giphy.gif", title: "Dancing" },
    ];
    return NextResponse.json({ gifs: FALLBACK });
  }

  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${key}&limit=16&media_filter=gif`;
    const res = await fetch(url);
    const data = await res.json();
    const gifs = (data.results ?? []).map((r: Record<string, unknown>) => {
      const media = (r.media_formats as Record<string, { url: string }> | undefined) ?? {};
      return { url: media.gif?.url ?? media.tinygif?.url ?? "", title: r.content_description ?? r.title ?? "" };
    }).filter((g: { url: string }) => g.url);
    return NextResponse.json({ gifs });
  } catch {
    return NextResponse.json({ gifs: [] });
  }
}
