import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PANEL = process.env.PANEL_URL ?? "http://127.0.0.1:80";

export async function GET() {
  try {
    const res = await fetch(`${PANEL}/api/servers`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ servers: [] }, { status: 502 });
  }
}
