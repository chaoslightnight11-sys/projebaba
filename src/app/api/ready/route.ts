import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";
import { getProductionReadiness } from "@/lib/production-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = getProductionReadiness();
  let databaseReady = isDemoMode();

  if (!databaseReady) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseReady = true;
    } catch {
      databaseReady = false;
    }
  }

  const ready = readiness.ready && databaseReady;
  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      mode: readiness.mode,
      database: databaseReady ? "ok" : "unavailable",
      checks: readiness.checks.map(({ key, label, state, detail }) => ({ key, label, state, detail })),
      timestamp: new Date().toISOString()
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
