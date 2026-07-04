import { z } from "zod";

export const patientSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmali."),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmali."),
  nationalId: z.string().optional().or(z.literal("")),
  phone: z.string().min(8, "Telefon gerekli."),
  email: z.string().email("Gecerli e-posta girin.").optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["FEMALE", "MALE", "OTHER", "UNSPECIFIED"]).default("UNSPECIFIED"),
  address: z.string().optional().or(z.literal("")),
  allergies: z.string().optional().or(z.literal("")),
  chronicDiseases: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  tag: z.enum(["NEW", "ACTIVE", "PASSIVE", "RISKY", "VIP"]).default("NEW")
});

export type PatientInput = z.infer<typeof patientSchema>;
