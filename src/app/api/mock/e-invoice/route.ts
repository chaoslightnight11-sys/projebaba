import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sendEInvoice } from "@/lib/integrations/eInvoiceProvider";

export async function POST(request: Request) {
  await requireSession();
  const payload = (await request.json()) as { invoiceNumber?: string };
  const result = await sendEInvoice(payload.invoiceNumber ?? "CNV-MOCK");
  return NextResponse.json(result);
}
