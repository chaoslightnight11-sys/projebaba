import { z } from "zod";

export const digitalConsentSignSchema = z.object({
  token: z.string().trim().min(1),
  signerName: z.string().trim().min(2),
  understood: z.coerce.boolean(),
  signatureData: z.string().trim().min(2)
});
