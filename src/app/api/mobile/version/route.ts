import { NextResponse } from "next/server";
import packageInfo from "../../../../../package.json";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    currentVersion: packageInfo.version,
    minimumVersion: process.env.MOBILE_MIN_VERSION || packageInfo.version,
    apkUrl: process.env.MOBILE_APK_URL || null,
    sha256: process.env.MOBILE_APK_SHA256 || null
  }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
