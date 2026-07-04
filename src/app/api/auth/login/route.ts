import { NextResponse } from "next/server";
import { authCookieName, createSessionToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { authenticate } from "@/lib/services/authService";
import { writeAuditLog } from "@/lib/services/auditLogService";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const session = await authenticate(payload.email, payload.password);

    if (!session) {
      return NextResponse.json({ error: "E-posta veya sifre hatali." }, { status: 401 });
    }

    const token = await createSessionToken(session);
    const response = NextResponse.json({ user: session });
    response.cookies.set(authCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
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
