import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.redirect(new URL("/player/growid/validate/checktoken", process.env.PUBLIC_URL ?? "https://xerhost.my.id"), 307);
}

export async function GET() {
  return NextResponse.redirect(new URL("/player/growid/validate/checktoken", process.env.PUBLIC_URL ?? "https://xerhost.my.id"), 307);
}
