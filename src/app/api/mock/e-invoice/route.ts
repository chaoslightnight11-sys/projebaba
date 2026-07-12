import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { sendEInvoice } from "@/lib/integrations/eInvoiceProvider";

export async function POST(request: Request) {
  if (!isDemoMode()) return NextResponse.json({ error: "Bu demo endpoint'i üretimde kapalıdır." }, { status: 404 });
  await requireSession();
  const payload = (await request.json()) as { invoiceNumber?: string };
  const result = await sendEInvoice(payload.invoiceNumber ?? "CNV-MOCK");
  return NextResponse.json(result);
}
