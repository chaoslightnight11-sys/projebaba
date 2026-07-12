import { NextResponse } from "next/server";
import { requestClientId, takeRateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/lib/services/passwordResetService";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const rateLimit = takeRateLimit({ key: `auth:forgot:${requestClientId(request)}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  }

  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (parsed.success) {
    await requestPasswordReset(parsed.data.email).catch(() => undefined);
  }
  return NextResponse.json({ ok: true, message: "Hesap bulunursa şifre yenileme bağlantısı e-posta ile gönderilir." });
}
