import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Gecerli bir e-posta girin.").toLowerCase(),
  password: z.string().min(8, "Sifre en az 8 karakter olmali."),
  mfaCode: z.string().trim().min(6).max(20).optional()
});

export const registerSchema = z.object({
  clinicName: z.string().min(2, "Klinik adi gerekli."),
  fullName: z.string().min(2, "Ad soyad gerekli."),
  email: z.string().email("Gecerli bir e-posta girin.").toLowerCase(),
  password: z.string()
    .min(12, "Şifre en az 12 karakter olmalı.")
    .regex(/[a-z]/, "Şifre küçük harf içermeli.")
    .regex(/[A-Z]/, "Şifre büyük harf içermeli.")
    .regex(/[0-9]/, "Şifre rakam içermeli.")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin.").toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(40, "Şifre yenileme bağlantısı geçersiz."),
  password: z.string()
    .min(12, "Şifre en az 12 karakter olmalı.")
    .regex(/[a-z]/, "Şifre küçük harf içermeli.")
    .regex(/[A-Z]/, "Şifre büyük harf içermeli.")
    .regex(/[0-9]/, "Şifre rakam içermeli.")
});
