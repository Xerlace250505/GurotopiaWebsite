import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PANEL = process.env.PANEL_URL ?? "http://127.0.0.1:80";

/** Body dari client: { "tankIDName|\ntankIDPass|\n...": "" } */
async function extractClientData(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = await request.text();
  if (!raw) return "";

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return Object.keys(parsed)[0] ?? "";
    } catch {
      return "";
    }
  }

  const params = new URLSearchParams(raw);
  const first = [...params.keys()][0];
  if (first && first.includes("|")) return first;
  if (first && !first.includes("=")) return first;
  return raw;
}

async function servers(): Promise<{ name: string; port: number }[]> {
  try {
    const res = await fetch(`${PANEL}/api/servers`, { cache: "no-store" });
    const data = (await res.json()) as { servers?: { name: string; port: number }[] };
    return data.servers ?? [];
  } catch {
    return [];
  }
}

function escapeHtml(value: string): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

function page(token: string, valKey: string, list: { name: string; port: number }[]): string {
  const options = list
    .map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`)
    .join("");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Log in with your Grow ID</title>
<style>
body{margin:0;background:#e9eef5;font:16px/1.5 Arial,Helvetica,sans-serif;color:#22333f}
.wrap{max-width:360px;margin:0 auto;padding:26px 16px}
h1{font-size:20px;text-align:center;margin:0 0 16px;color:#1b3a5c}
label{display:block;font-size:13px;color:#5a6b7d;margin:10px 0 4px}
input,select{width:100%;padding:11px;border:1px solid #c3cedb;border-radius:6px;font-size:15px;background:#fff}
button{width:100%;margin-top:18px;padding:13px;border:0;border-radius:6px;background:#2f7ae5;color:#fff;font-size:16px;font-weight:bold}
</style></head><body>
<div class="wrap">
<h1>Log in with your Grow ID</h1>
<form method="POST" action="/player/growid/login/validate" autocomplete="off">
<input type="hidden" name="_token" value="${escapeHtml(token)}">
<input type="hidden" name="valKey" value="${escapeHtml(valKey)}">
<label>Server</label>
<select name="server" required>${options || '<option value="">(no server)</option>'}</select>
<label>Your Growtopia Name *</label>
<input name="growId" required autocomplete="off">
<label>Your Growtopia Password *</label>
<input name="password" type="password" required autocomplete="off">
<button type="submit">Log in</button>
</form>
</div>
</body></html>`;
}

function respond(html: string) {
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const token = Buffer.from(await extractClientData(request)).toString("base64");
  const valKey = new URL(request.url).searchParams.get("valKey") ?? "";
  return respond(page(token, valKey, await servers()));
}

export async function GET(request: Request) {
  const valKey = new URL(request.url).searchParams.get("valKey") ?? "";
  return respond(page("", valKey, await servers()));
}
