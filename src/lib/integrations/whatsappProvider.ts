import type { MessagePayload, MessageProvider, ProviderResult } from "@/lib/integrations/types";

export const whatsappProvider: MessageProvider = {
  async send(payload: MessagePayload): Promise<ProviderResult> {
    return {
      ok: true,
      provider: "mock-whatsapp-business",
      reference: `wa_${Date.now()}`,
      message: `${payload.to} icin WhatsApp mesaji hazirlandi.`
    };
  }
};
