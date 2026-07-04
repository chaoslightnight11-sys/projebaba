import type { PaymentPayload, PaymentProvider, ProviderResult } from "@/lib/integrations/types";

export const paymentProvider: PaymentProvider = {
  async charge(payload: PaymentPayload): Promise<ProviderResult> {
    return {
      ok: true,
      provider: "mock-virtual-pos",
      reference: `pos_${Date.now()}`,
      message: `${payload.amount} ${payload.currency} tutarinda mock odeme basarili.`
    };
  }
};
