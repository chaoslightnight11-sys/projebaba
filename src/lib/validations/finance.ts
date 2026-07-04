import { z } from "zod";

export const paymentSchema = z.object({
  patientId: z.string().optional().or(z.literal("")),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Tutar pozitif olmali."),
  method: z.enum(["CASH", "CARD", "TRANSFER", "ONLINE"]),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["PAID", "PENDING", "CANCELLED"]),
  paidAt: z.string().optional().or(z.literal(""))
});

export type PaymentInput = z.infer<typeof paymentSchema>;
