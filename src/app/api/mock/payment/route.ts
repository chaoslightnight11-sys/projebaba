import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { paymentProvider } from "@/lib/integrations/paymentProvider";

export async function POST(request: Request) {
  await requireSession();
  const payload = (await request.json()) as { amount: number; description?: string; patientId?: string };
  const result = await paymentProvider.charge({
    amount: payload.amount,
    currency: "TRY",
    description: payload.description ?? "ClinicNova mock tahsilat",
    patientId: payload.patientId
  });
  return NextResponse.json(result);
}
