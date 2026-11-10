import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PANEL = process.env.PANEL_URL ?? "http://127.0.0.1:80";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readForm(request: Request): Promise<URLSearchParams> {
  const raw = await request.text();
  const params = new URLSearchParams(raw);

  /* beberapa build mengirim seluruh form sebagai satu key */
  if (params.size === 1) {
    const only = [...params.keys()][0];
    if (only && only.includes("=")) return new URLSearchParams(only);
  }
  return params;
}

export async function POST(request: Request) {
  const form = await readForm(request);

  const clientToken = form.get("_token") ?? "";
  const growId = (form.get("growId") ?? "").trim();
  const password = form.get("password") ?? "";
  const email = (form.get("email") ?? "").trim();
  const server = (form.get("server") ?? "").trim();

  if (!growId || !password) {
    return json({ status: "error", message: "GrowID dan password wajib diisi." }, 400);
  }

  if (!server) {
    return json({ status: "error", message: "Pilih server dulu." }, 400);
  }

  try {
    const check = await fetch(`${PANEL}/api/tenant-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ server, growid: growId, password }),
      cache: "no-store",
    });
    const result = (await check.json()) as { ok?: boolean; error?: string };

    if (!result.ok) {
      return json({ status: "error", message: result.error ?? "GrowID atau password salah." });
    }
  } catch {
    return json({ status: "error", message: "Server login tidak bisa dihubungi." }, 502);
  }

  const reg = email ? 1 : 0;
  const payload = email
    ? `_token=${clientToken}&growId=${growId}&password=${password}&email=${email}&reg=1&server=${server}`
    : `_token=${clientToken}&growId=${growId}&password=${password}&reg=0&server=${server}`;

  return json({
    status: "success",
    message: "Account Validated.",
    token: Buffer.from(payload).toString("base64"),
    url: "",
    accountType: "growtopia",
  });
}

export async function GET() {
  return json({ status: "error", message: "Gunakan POST." }, 405);
}
