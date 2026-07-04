import { z } from "zod";

export const tourismLeadSchema = z.object({
  sourceChannel: z.enum(["WEB_FORM", "WHATSAPP", "INSTAGRAM_DM", "MANUAL", "N8N_WEBHOOK", "AIRTABLE"]).default("MANUAL"),
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı."),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Geçerli e-posta girin.").optional().or(z.literal("")),
  country: z.string().trim().min(2, "Ülke gerekli."),
  city: z.string().trim().optional().or(z.literal("")),
  language: z.string().trim().default("EN"),
  interestedTreatment: z.string().trim().min(2, "Tedavi ilgisi gerekli."),
  estimatedBudget: z.string().trim().optional().or(z.literal("")),
  travelDate: z.string().trim().optional().or(z.literal("")),
  message: z.string().trim().min(3, "Mesaj en az 3 karakter olmalı."),
  gdprConsent: z.coerce.boolean().default(false)
});

export const packageBuilderSchema = z.object({
  leadId: z.string().trim().min(1, "Lead seçin."),
  packageTitle: z.string().trim().min(2, "Paket başlığı gerekli."),
  treatmentSummary: z.string().trim().min(3, "Tedavi özeti gerekli."),
  treatmentName: z.string().trim().min(2, "Tedavi kalemi gerekli."),
  toothArea: z.string().trim().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
  hotelInfo: z.string().trim().optional().or(z.literal("")),
  transferInfo: z.string().trim().optional().or(z.literal("")),
  arrivalAirport: z.string().trim().optional().or(z.literal("")),
  arrivalDate: z.string().trim().optional().or(z.literal("")),
  departureDate: z.string().trim().optional().or(z.literal("")),
  numberOfCompanions: z.coerce.number().int().min(0).default(0),
  hotelPrice: z.coerce.number().min(0).default(0),
  transferPrice: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  currency: z.enum(["EUR", "USD", "GBP", "TRY"]).default("EUR"),
  validUntil: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal(""))
});

export const reservationShareSchema = z.object({
  packageId: z.string().trim().min(1),
  hotelPartnerId: z.string().trim().optional().or(z.literal("")),
  transferPartnerId: z.string().trim().optional().or(z.literal(""))
});

export const publicQuestionSchema = z.object({
  token: z.string().trim().min(1),
  message: z.string().trim().min(3)
});

export const careCheckSchema = z.object({
  token: z.string().trim().min(1),
  status: z.enum(["OK", "ISSUE"]),
  painLevel: z.coerce.number().min(0).max(10).default(0),
  issueDescription: z.string().trim().optional().or(z.literal("")),
  contactPreference: z.string().trim().optional().or(z.literal(""))
});

export const digitalConsentSignSchema = z.object({
  token: z.string().trim().min(1),
  signerName: z.string().trim().min(2),
  understood: z.coerce.boolean(),
  signatureData: z.string().trim().min(2)
});

export const tourismSurveySubmitSchema = z.object({
  token: z.string().trim().min(1),
  rating: z.coerce.number().min(1).max(5),
  doctor: z.coerce.number().min(1).max(5),
  clinic: z.coerce.number().min(1).max(5),
  transfer: z.coerce.number().min(1).max(5),
  hotel: z.coerce.number().min(1).max(5),
  turkey: z.coerce.number().min(1).max(5),
  npsScore: z.coerce.number().min(0).max(10),
  comment: z.string().trim().optional().or(z.literal(""))
});

export const chatbotTestSchema = z.object({
  message: z.string().trim().min(2),
  channel: z.enum(["WEBSITE", "WHATSAPP", "INSTAGRAM"]).default("WEBSITE")
});
