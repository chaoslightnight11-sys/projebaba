import { z } from "zod";

export const demoRequestSchema = z.object({
  fullName: z.string().min(2, "Ad soyad gerekli."),
  clinicName: z.string().min(2, "Klinik adi gerekli."),
  phone: z.string().min(8, "Telefon gerekli."),
  email: z.string().email("Gecerli bir e-posta girin."),
  city: z.string().min(2, "Sehir gerekli."),
  clinicSize: z.string().min(1, "Klinik buyuklugu secin."),
  message: z.string().max(1000).optional().or(z.literal(""))
});
