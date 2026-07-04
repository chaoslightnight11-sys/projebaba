import { NextResponse } from "next/server";
import { registerClinic } from "@/lib/services/authService";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const result = await registerClinic(payload);
    return NextResponse.json(
      {
        organizationId: result.organization.id,
        userId: result.user.id
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Klinik hesabi olusturulamadi." }, { status: 400 });
  }
}
