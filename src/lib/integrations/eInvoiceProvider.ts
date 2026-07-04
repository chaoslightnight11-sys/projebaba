import type { ProviderResult } from "@/lib/integrations/types";

export async function sendEInvoice(invoiceNumber: string): Promise<ProviderResult> {
  return {
    ok: true,
    provider: "mock-e-fatura",
    reference: `efatura_${Date.now()}`,
    message: `${invoiceNumber} numarali fatura mock e-Fatura sistemine gonderildi.`
  };
}
