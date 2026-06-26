import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ status: "ok", app: "cheers-from-applied", ts: new Date().toISOString() });
}
