import type { MessagePayload, MessageProvider, ProviderResult } from "@/lib/integrations/types";

export const emailProvider: MessageProvider = {
  async send(payload: MessagePayload): Promise<ProviderResult> {
    return {
      ok: true,
      provider: "mock-email",
      reference: `mail_${Date.now()}`,
      message: `${payload.to} adresine e-posta kuyruga alindi.`
    };
  }
};
