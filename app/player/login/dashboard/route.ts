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
      const key = Object.keys(parsed)[0];
      return key ?? "";
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

function page(token: string, servers: { name: string; port: number }[]): string {
  const options = servers
    .map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`)
    .join("");

  return `<!doctype html>
<html lang="id"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Log in with your Grow ID</title>
<style>
*{box-sizing:border-box}
body{margin:0;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;background:#0b1220;color:#dbe6f5;display:flex;min-height:100vh;align-items:center;justify-content:center}
.card{background:#131c2e;border:1px solid #22304a;border-radius:14px;padding:22px;width:min(92vw,360px)}
h1{font-size:18px;margin:0 0 14px;text-align:center}
label{display:block;color:#7f8ea8;font-size:13px;margin-bottom:4px}
input,select,button{width:100%;font:inherit;padding:11px 12px;border-radius:9px;border:1px solid #22304a;background:#0d1524;color:#dbe6f5;margin-bottom:12px}
button{background:#3b82f6;border-color:#3b82f6;color:#fff;font-weight:600;cursor:pointer}
.err{color:#ffb4b4;font-size:13px;margin:0 0 12px}
</style></head><body>
<div class="card">
<h1>Log in with your Grow ID</h1>
<div class="err" id="err"></div>
<form id="f" method="POST" action="/player/growid/login/validate">
<input name="_token" type="hidden" value="${escapeHtml(token)}">
<label>Server</label>
<select name="server" required>${options || '<option value="">(belum ada server)</option>'}</select>
<label>Your Growtopia Name *</label>
<input name="growId" required autocomplete="username">
<label>Your Growtopia Password *</label>
<input name="password" type="password" required autocomplete="current-password">
<button type="submit">Log in</button>
</form>
</div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
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

export async function POST(request: Request) {
  const token = Buffer.from(await extractClientData(request)).toString("base64");
  return new NextResponse(page(token, await servers()), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET() {
  return new NextResponse(page("", await servers()), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
