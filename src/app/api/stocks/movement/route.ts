import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createStockMovement } from "@/lib/services/stockService";
import { getWritableBranchId } from "@/lib/services/tenantService";
import { stockMovementSchema } from "@/lib/validations/stock";
import { canAccess } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!canAccess(session.role, "stocks")) return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
    const branchId = await getWritableBranchId(session);
    const payload = stockMovementSchema.parse(await request.json());
    const movement = await createStockMovement(session.organizationId, branchId, payload);
    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stok hareketi kaydedilemedi." }, { status: 400 });
  }
}
