import type { ProviderResult } from "@/lib/integrations/types";

export async function createEPrescription(patientName: string): Promise<ProviderResult> {
  return {
    ok: true,
    provider: "mock-e-recete",
    reference: `erecete_${Date.now()}`,
    message: `${patientName} icin mock e-Recete referansi olusturuldu.`
  };
}
