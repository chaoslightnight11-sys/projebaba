import { NextResponse } from "next/server";
import { requestClientId, takeRateLimit } from "@/lib/rate-limit";
import { resetPassword } from "@/lib/services/passwordResetService";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const rateLimit = takeRateLimit({ key: `auth:reset:${requestClientId(request)}`, limit: 8, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  }

  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Form geçersiz." }, { status: 400 });
  const changed = await resetPassword(parsed.data.token, parsed.data.password);
  if (!changed) return NextResponse.json({ error: "Bağlantı geçersiz, kullanılmış veya süresi dolmuş." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
