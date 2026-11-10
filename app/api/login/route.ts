import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PANEL = process.env.PANEL_URL ?? "http://127.0.0.1:80";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Permintaan tidak valid." }, { status: 400 });
  }

  try {
    const res = await fetch(`${PANEL}/api/tenant-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "Server login tidak bisa dihubungi." }, { status: 502 });
  }
}
