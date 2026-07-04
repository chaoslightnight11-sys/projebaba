import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createPayment, getFinanceOverview } from "@/lib/services/financeService";
import { getWritableBranchId } from "@/lib/services/tenantService";
import { paymentSchema } from "@/lib/validations/finance";

export async function GET() {
  const session = await requireSession();
  const finance = await getFinanceOverview(session.organizationId);
  return NextResponse.json(finance);
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const branchId = await getWritableBranchId(session);
    const payload = paymentSchema.parse(await request.json());
    const payment = await createPayment(session.organizationId, branchId, payload);
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Odeme kaydedilemedi." }, { status: 400 });
  }
}
