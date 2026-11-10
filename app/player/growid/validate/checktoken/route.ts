import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readFields(request: Request): Promise<{ refreshToken: string; clientData: string }> {
  const raw = await request.text();
  const params = new URLSearchParams(raw);

  let refreshToken = params.get("refreshToken") ?? "";
  let clientData = params.get("clientData") ?? "";

  /* beberapa build mengirim semuanya sebagai satu key */
  if ((!refreshToken || !clientData) && params.size === 1) {
    const only = [...params.keys()][0];
    if (only && only.includes("=")) {
      const inner = new URLSearchParams(only);
      refreshToken = refreshToken || inner.get("refreshToken") || "";
      clientData = clientData || inner.get("clientData") || "";
    }
  }

  return { refreshToken, clientData };
}

export async function POST(request: Request) {
  const { refreshToken, clientData } = await readFields(request);

  if (!refreshToken || !clientData) {
    return json({ status: "error", message: "Missing refreshToken or clientData" });
  }

  let decoded = Buffer.from(refreshToken, "base64").toString("utf-8");
  decoded = decoded.replace("&reg=0", "").replace("&reg=1", "");

  const fresh = Buffer.from(clientData).toString("base64");
  const updated = decoded.replace(/(_token=)[^&]*/, `$1${fresh}`);

  return json({
    status: "success",
    message: "Account Validated.",
    token: Buffer.from(updated).toString("base64"),
    url: "",
    accountType: "growtopia",
    accountAge: 2,
  });
}

export async function GET() {
  return json({ status: "error", message: "Gunakan POST." }, 405);
}
