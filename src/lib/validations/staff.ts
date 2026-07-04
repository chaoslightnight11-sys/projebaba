import { z } from "zod";

export const staffSchema = z.object({
  fullName: z.string().min(2),
  roleLabel: z.string().min(2),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  workingHours: z.string().optional().or(z.literal("")),
  compensation: z.string().optional().or(z.literal("")),
  active: z.enum(["true", "false"]).default("true")
});
