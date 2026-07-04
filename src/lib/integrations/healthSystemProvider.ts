import type { ProviderResult } from "@/lib/integrations/types";

export async function syncHealthSystem(entity: string): Promise<ProviderResult> {
  return {
    ok: true,
    provider: "mock-mbys-uss",
    reference: `uss_${Date.now()}`,
    message: `${entity} kaydi mock MBYS/USS katmanina senkronize edildi.`
  };
}
