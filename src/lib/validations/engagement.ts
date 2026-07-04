import { z } from "zod";

export const consentSchema = z.object({
  patientId: z.string().trim().min(1, "Lütfen bir hasta seçin."),
  templateName: z.string().trim().min(2, "Onam şablonu en az 2 karakter olmalı."),
  content: z.string().trim().min(10, "Onam içeriği en az 10 karakter olmalı."),
  status: z.enum(["DRAFT", "SENT", "SIGNED", "CANCELLED"]).default("DRAFT")
});

export const surveySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().or(z.literal(""))
});

export const communicationSchema = z.object({
  patientId: z.string().optional().or(z.literal("")),
  to: z.string().trim().min(3, "Alıcı bilgisi en az 3 karakter olmalı."),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(3, "Mesaj en az 3 karakter olmalı.")
});

export const incomingCommunicationSchema = z.object({
  patientId: z.string().optional().or(z.literal("")),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactValue: z.string().trim().min(3, "Gönderen bilgisi en az 3 karakter olmalı."),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "PHONE"]),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Konu en az 2 karakter olmalı.").max(120),
  message: z.string().trim().min(3, "Mesaj en az 3 karakter olmalı.")
});

export const recallSchema = z.object({
  patientId: z.string().min(1),
  reason: z.string().min(2),
  dueDate: z.string().min(1),
  status: z.enum(["OPEN", "CONTACTED", "SCHEDULED", "CLOSED"]).default("OPEN"),
  notes: z.string().optional().or(z.literal(""))
});
