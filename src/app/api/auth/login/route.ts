import { NextResponse } from "next/server";
import { authCookieName, createSessionToken } from "@/lib/auth";
import { shouldUseSecureCookies } from "@/lib/auth-config";
import { loginSchema } from "@/lib/validations/auth";
import { authenticate } from "@/lib/services/authService";
import { writeAuditLog } from "@/lib/services/auditLogService";
import { requestClientId, takeRateLimit } from "@/lib/rate-limit";
import { decryptMfaSecret, hashRecoveryCode, verifyTotp } from "@/lib/mfa";
import { isDemoMode } from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const rateLimit = takeRateLimit({
    key: `auth:login:${requestClientId(request)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const payload = loginSchema.parse(await request.json());
    const session = await authenticate(payload.email, payload.password);

    if (!session) {
      return NextResponse.json({ error: "E-posta veya sifre hatali." }, { status: 401 });
    }

    if (!isDemoMode()) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { mfaEnabledAt: true, mfaSecretEncrypted: true, mfaRecoveryCodeHashes: true, mfaLastUsedCounter: true }
      });
      if (user?.mfaEnabledAt && user.mfaSecretEncrypted) {
        if (!payload.mfaCode) return NextResponse.json({ mfaRequired: true }, { status: 202 });
        const hashes = Array.isArray(user.mfaRecoveryCodeHashes) ? user.mfaRecoveryCodeHashes.filter((item): item is string => typeof item === "string") : [];
        const recoveryHash = hashRecoveryCode(payload.mfaCode);
        const recoveryIndex = hashes.indexOf(recoveryHash);
        if (recoveryIndex >= 0) {
          const consumed = await prisma.$executeRaw`
            UPDATE "User"
               SET "mfaRecoveryCodeHashes" = COALESCE(
                 (SELECT jsonb_agg(value) FROM jsonb_array_elements_text("mfaRecoveryCodeHashes") AS value WHERE value <> ${recoveryHash}),
                 '[]'::jsonb
               )
             WHERE "id" = ${session.userId}
               AND "mfaRecoveryCodeHashes" @> ${JSON.stringify([recoveryHash])}::jsonb
          `;
          if (consumed !== 1) return NextResponse.json({ error: "Kurtarma kodu daha önce kullanılmış." }, { status: 401 });
        } else {
          const counter = verifyTotp(decryptMfaSecret(user.mfaSecretEncrypted), payload.mfaCode);
          if (counter === null || counter <= user.mfaLastUsedCounter) {
            return NextResponse.json({ error: "Doğrulama kodu geçersiz veya daha önce kullanılmış." }, { status: 401 });
          }
          const consumed = await prisma.user.updateMany({
            where: { id: session.userId, mfaLastUsedCounter: { lt: counter } },
            data: { mfaLastUsedCounter: counter }
          });
          if (consumed.count !== 1) return NextResponse.json({ error: "Doğrulama kodu daha önce kullanılmış." }, { status: 401 });
        }
      }
    }

    const token = await createSessionToken(session);
    const response = NextResponse.json({ user: session });
    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(request),
      priority: "high",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    await writeAuditLog({
      userId: session.userId,
      action: "LOGIN",
      module: "auth",
      organizationId: session.organizationId,
      branchId: session.branchId
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Giris yapilamadi." }, { status: 400 });
  }
}
