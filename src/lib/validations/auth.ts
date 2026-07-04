import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Gecerli bir e-posta girin.").toLowerCase(),
  password: z.string().min(8, "Sifre en az 8 karakter olmali.")
});

export const registerSchema = z.object({
  clinicName: z.string().min(2, "Klinik adi gerekli."),
  fullName: z.string().min(2, "Ad soyad gerekli."),
  email: z.string().email("Gecerli bir e-posta girin.").toLowerCase(),
  password: z.string().min(8, "Sifre en az 8 karakter olmali.")
});
