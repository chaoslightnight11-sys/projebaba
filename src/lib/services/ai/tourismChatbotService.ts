import { ChatConversationChannel, ChatConversationStatus, ChatMessageSender, TourismLeadSourceChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrUpdateLeadFromIntake } from "@/lib/services/tourismService";

export function detectLanguage(message: string) {
  return /merhaba|fiyat|otel|transfer|tedavi|implant/i.test(message) ? "TR" : "EN";
}

export function classifyIntent(message: string) {
  if (/pain|ache|bleeding|swelling|ağrı|kanama|şişlik|acil/i.test(message)) return "MEDICAL_ISSUE";
  if (/price|cost|fee|fiyat|ücret/i.test(message)) return "PRICE";
  if (/hotel|transfer|airport|otel|havalimani|havaalanı/i.test(message)) return "TRAVEL";
  if (/implant|veneer|crown|smile|whitening|zirconium|beyazlatma/i.test(message)) return "TREATMENT";
  return "GENERAL";
}

export function generateAnswer(message: string, language = detectLanguage(message)) {
  const intent = classifyIntent(message);
  if (intent === "MEDICAL_ISSUE") {
    return language === "TR"
      ? "Tıbbi acil veya ağrı durumlarında kesin teşhis koyamam. Sizi hemen klinik ekibine yönlendiriyorum; lütfen telefon numaranızı paylaşın."
      : "I cannot diagnose urgent medical symptoms here. I am forwarding you to our clinical team; please share your phone number.";
  }
  if (intent === "PRICE") {
    return language === "TR"
      ? "İmplant veya estetik tedavilerde net fiyat; röntgen, kemik durumu ve tedavi planına göre değişir. Fotoğraf veya röntgen paylaşırsanız tedavi, otel ve transfer dahil size özel paket hazırlanabilir."
      : "For dental treatments, the final price depends on your X-ray, bone condition and treatment plan. If you share photos or X-ray, our team can prepare a personalized package including treatment, hotel and airport transfer.";
  }
  if (intent === "TRAVEL") {
    return language === "TR"
      ? "Evet, anlaşmalı otel ve havalimanı transferi olan paketler hazırlıyoruz. Seyahat tarihinizi ve kaç kişi geleceğinizi paylaşırsanız planı netleştirebiliriz."
      : "Yes, we prepare packages including partner hotels and airport transfers. Share your travel dates and companion count so we can plan it.";
  }
  return language === "TR"
    ? "Size yardımcı olabilmem için ilgilendiğiniz tedaviyi, ülkenizi, seyahat tarihinizi ve telefon/e-posta bilginizi paylaşabilirsiniz."
    : "To help you, please share your treatment interest, country, travel date and phone/email.";
}

export function shouldEscalateToHuman(message: string) {
  return classifyIntent(message) === "MEDICAL_ISSUE" || extractLeadInfo(message).score >= 4;
}

export function extractLeadInfo(message: string) {
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = message.match(/(\+\d{1,3}[\s-]?)?\d{7,14}/)?.[0] ?? null;
  const treatment = message.match(/implant|veneer|crown|smile|whitening|zirconium|beyazlatma|kaplama/i)?.[0] ?? null;
  const budget = message.match(/\d{3,6}\s?(eur|usd|gbp|try|€|\$|£)/i)?.[0] ?? null;
  const travelDate = message.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  const country = message.match(/united kingdom|germany|netherlands|france|usa|saudi arabia|turkey|ingiltere|almanya|fransa/i)?.[0] ?? null;
  const score = [email, phone, treatment, budget, travelDate, country].filter(Boolean).length;
  return { email, phone, treatment, budget, travelDate, country, score };
}

export async function createLeadFromChat(input: {
  organizationId: string;
  branchId: string;
  conversationId: string;
  message: string;
  channel: ChatConversationChannel;
  userId?: string | null;
}) {
  const extracted = extractLeadInfo(input.message);
  if (extracted.score < 3) return null;

  const result = await createOrUpdateLeadFromIntake(
    {
      sourceChannel: input.channel === ChatConversationChannel.INSTAGRAM ? TourismLeadSourceChannel.INSTAGRAM_DM : input.channel === ChatConversationChannel.WHATSAPP ? TourismLeadSourceChannel.WHATSAPP : TourismLeadSourceChannel.WEB_FORM,
      fullName: extracted.email?.split("@")[0]?.replace(/[._-]/g, " ") || "Chat Lead",
      phone: extracted.phone,
      email: extracted.email,
      country: extracted.country ?? "Unknown",
      language: detectLanguage(input.message),
      interestedTreatment: extracted.treatment ?? "Dental Treatment",
      estimatedBudget: extracted.budget,
      travelDate: extracted.travelDate,
      message: input.message,
      gdprConsent: false
    },
    { organizationId: input.organizationId, branchId: input.branchId, userId: input.userId }
  );

  await prisma.chatConversation.update({
    where: { id: input.conversationId },
    data: { leadId: result.lead.id, status: ChatConversationStatus.HUMAN_NEEDED }
  });
  return result.lead;
}

export async function runChatbotTest(input: { organizationId: string; branchId: string; message: string; channel: ChatConversationChannel; userId?: string | null }) {
  const language = detectLanguage(input.message);
  const answer = generateAnswer(input.message, language);
  const escalate = shouldEscalateToHuman(input.message);
  const conversation = await prisma.chatConversation.create({
    data: {
      organizationId: input.organizationId,
      branchId: input.branchId,
      channel: input.channel,
      language,
      status: escalate ? ChatConversationStatus.HUMAN_NEEDED : ChatConversationStatus.BOT_HANDLED
    }
  });

  await prisma.chatMessage.createMany({
    data: [
      { organizationId: input.organizationId, conversationId: conversation.id, sender: ChatMessageSender.PATIENT, message: input.message },
      { organizationId: input.organizationId, conversationId: conversation.id, sender: ChatMessageSender.BOT, message: answer }
    ]
  });

  const lead = escalate ? await createLeadFromChat({ ...input, conversationId: conversation.id }) : null;
  return { conversation, answer, lead, escalate };
}
