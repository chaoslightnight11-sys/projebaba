import type { LucideIcon } from "lucide-react";
import { Bot, Building2, ChartNoAxesCombined, FileSignature, GalleryHorizontalEnd, Handshake, HeartPulse, Hotel, MessageCircle, PackagePlus, Repeat, ShieldCheck, Star } from "lucide-react";
import type {
  BeforeAfterStatus,
  DigitalConsentStatus,
  LeadFollowUpStatus,
  PostTreatmentFollowUpStatus,
  ReservationShareStatus,
  ReviewRequestStatus,
  TourismLeadSourceChannel,
  TourismLeadStatus,
  TourismPackageStatus
} from "@prisma/client";

export const tourismRoutes: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/dashboard/tourism", label: "Satış Akışı", icon: ChartNoAxesCombined },
  { href: "/dashboard/tourism/leads", label: "Lead Havuzu", icon: Handshake },
  { href: "/dashboard/tourism/package-builder", label: "Paket Oluşturucu", icon: PackagePlus },
  { href: "/dashboard/tourism/hotel-transfer", label: "Otel & Transfer", icon: Hotel },
  { href: "/dashboard/tourism/followups", label: "Otomatik Takipler", icon: Repeat },
  { href: "/dashboard/tourism/post-treatment", label: "Tedavi Sonrası", icon: HeartPulse },
  { href: "/dashboard/tourism/reviews", label: "Yorum Yönetimi", icon: Star },
  { href: "/dashboard/tourism/gallery", label: "Önce/Sonra", icon: GalleryHorizontalEnd },
  { href: "/dashboard/tourism/consents", label: "Turizm Onamları", icon: FileSignature },
  { href: "/dashboard/tourism/surveys", label: "Memnuniyet", icon: MessageCircle },
  { href: "/dashboard/tourism/chatbot", label: "AI Chatbot", icon: Bot },
  { href: "/dashboard/tourism/analytics", label: "Analitik", icon: ChartNoAxesCombined },
  { href: "/dashboard/tourism/integrations", label: "Entegrasyonlar", icon: Building2 }
];

export function sourceLabel(source: TourismLeadSourceChannel | string) {
  const labels: Record<string, string> = {
    WEB_FORM: "Web Form",
    WHATSAPP: "WhatsApp",
    INSTAGRAM_DM: "Instagram DM",
    MANUAL: "Manuel",
    N8N_WEBHOOK: "n8n Webhook",
    AIRTABLE: "Airtable"
  };
  return labels[source] ?? source;
}

export function leadStatusLabel(status: TourismLeadStatus | string) {
  const labels: Record<string, string> = {
    NEW: "Yeni",
    CONTACTED: "İletişildi",
    WAITING_REPLY: "Cevap Bekliyor",
    QUALIFIED: "Nitelikli",
    PACKAGE_SENT: "Paket Gönderildi",
    BOOKED: "Booked",
    TREATMENT_STARTED: "Tedavi Başladı",
    TREATMENT_COMPLETED: "Tedavi Tamamlandı",
    LOST: "Kaybedildi"
  };
  return labels[status] ?? status;
}

export function statusTone(status: string): "default" | "success" | "warning" | "danger" | "muted" {
  if (["BOOKED", "ACCEPTED", "SIGNED", "COMPLETED", "CONFIRMED", "PUBLISHED_WEBSITE", "PUBLISHED_SOCIAL", "SENT"].includes(status)) return "success";
  if (["WAITING_REPLY", "PACKAGE_SENT", "VIEWED", "SCHEDULED", "PENDING", "ACTIVE"].includes(status)) return "warning";
  if (["LOST", "REJECTED", "FAILED", "ISSUE_REPORTED", "DECLINED", "EXPIRED"].includes(status)) return "danger";
  if (["DRAFT", "PAUSED", "ARCHIVED", "STOPPED"].includes(status)) return "muted";
  return "default";
}

export function packageStatusLabel(status: TourismPackageStatus | string) {
  const labels: Record<string, string> = {
    DRAFT: "Taslak",
    SENT: "Gönderildi",
    VIEWED: "Görüldü",
    ACCEPTED: "Kabul",
    REJECTED: "Red",
    EXPIRED: "Süresi Doldu"
  };
  return labels[status] ?? status;
}

export function compactStatusLabel(status: TourismLeadStatus | TourismPackageStatus | ReservationShareStatus | LeadFollowUpStatus | PostTreatmentFollowUpStatus | ReviewRequestStatus | BeforeAfterStatus | DigitalConsentStatus | string) {
  return packageStatusLabel(leadStatusLabel(status));
}

export const tourismKpiTarget = {
  promise: "Satış kaybını azaltmak için her lead bir sonraki aksiyona bağlı kalır.",
  workflow: ["Lead", "Paket", "Follow-up", "Booked", "Rezervasyon", "Bakım", "Anket", "Yorum", "Galeri", "Analitik"]
};

export const gdprNotice = "KVKK/GDPR: Hasta onayı olmayan veri paylaşımı, galeri yayını veya partner rezervasyon aktarımı canlı sistemde engellenmelidir. Bu MVP demo amaçlı mock kayıt üretir.";

export { ShieldCheck };
