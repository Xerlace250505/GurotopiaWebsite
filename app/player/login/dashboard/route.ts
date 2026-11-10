import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const PANEL = process.env.PANEL_URL ?? "http://127.0.0.1:80";
const TEMPLATE = path.join(process.cwd(), "template", "dashboard.html");

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

function serverField(list: { name: string; port: number }[]): string {
  const options = list.map((s) => `<option value="${s.name}">${s.name}</option>`).join("");
  return `<div class="form-group">
  <select class="form-control grow-text" name="server" required>
    <option value="" disabled selected>Pilih server *</option>
    ${options}
  </select>
</div>`;
}

async function render(token: string): Promise<string> {
  const template = await readFile(TEMPLATE, "utf8");
  const list = await servers();

  /* sisipkan pilihan server tepat setelah input _token, di kedua form */
  const withServers = template.replace(
    /(<input name="_token" type="hidden" value="\{\{ data \}\}">)/g,
    `$1\n${serverField(list)}`,
  );

  return withServers.replace(/\{\{ data \}\}/g, token);
}

function respond(html: string) {
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const token = Buffer.from(await extractClientData(request)).toString("base64");
  return respond(await render(token));
}

export async function GET() {
  return respond(await render(""));
}
