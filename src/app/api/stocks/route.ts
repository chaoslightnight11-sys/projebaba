import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createStockItem, getStocks } from "@/lib/services/stockService";
import { getWritableBranchId } from "@/lib/services/tenantService";
import { stockItemSchema } from "@/lib/validations/stock";

export async function GET() {
  const session = await requireSession();
  const stocks = await getStocks(session.organizationId);
  return NextResponse.json({ stocks });
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const branchId = await getWritableBranchId(session);
    const payload = stockItemSchema.parse(await request.json());
    const stock = await createStockItem(session.organizationId, branchId, payload);
    return NextResponse.json({ stock }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stok kaydedilemedi." }, { status: 400 });
  }
}
