import { NextResponse } from "next/server";
import { runDueFollowUps } from "@/lib/services/tourismService";

export async function GET() {
  const result = await runDueFollowUps();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST() {
  const result = await runDueFollowUps();
  return NextResponse.json({ ok: true, ...result });
}
