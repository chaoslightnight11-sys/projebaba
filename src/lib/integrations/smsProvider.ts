import type { MessagePayload, MessageProvider, ProviderResult } from "@/lib/integrations/types";

export const smsProvider: MessageProvider = {
  async send(payload: MessagePayload): Promise<ProviderResult> {
    return {
      ok: true,
      provider: "mock-sms",
      reference: `sms_${Date.now()}`,
      message: `${payload.to} numarasina SMS kuyruga alindi.`
    };
  }
};
