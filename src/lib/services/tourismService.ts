import {
  CommunicationChannel,
  CommunicationDirection,
  IntegrationProvider,
  LeadFollowUpStatus,
  NotificationType,
  ReservationShareChannel,
  ReservationShareStatus,
  TaskPriority,
  TaskStatus,
  TourismLeadSourceChannel,
  TourismLeadStatus,
  TourismPackageStatus
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncLeadToAirtable, updateLeadInAirtable } from "@/lib/services/integrations/airtableProvider";
import { sendLeadToN8n, sendPackageToN8n, shareReservationWithPartners, triggerFollowUpWorkflow } from "@/lib/services/integrations/n8nProvider";
import { writeAuditLog } from "@/lib/services/auditLogService";
import { writeIntegrationLog } from "@/lib/services/integrationLogService";

type IntakeLeadInput = {
  sourceChannel: TourismLeadSourceChannel | string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  country: string;
  city?: string | null;
  language?: string | null;
  interestedTreatment: string;
  estimatedBudget?: string | null;
  travelDate?: string | Date | null;
  message: string;
  gdprConsent?: boolean;
};

function parseDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function scoreTourismLead(input: Partial<IntakeLeadInput>) {
  let score = 35;
  if (input.phone) score += 15;
  if (input.email) score += 10;
  if (input.country) score += 8;
  if (input.interestedTreatment) score += 12;
  if (input.travelDate) score += 10;
  if (input.estimatedBudget) score += 10;
  if (input.sourceChannel === TourismLeadSourceChannel.WHATSAPP || input.sourceChannel === "WHATSAPP") score += 5;
  return Math.min(score, 100);
}

export async function createOrUpdateLeadFromIntake(input: IntakeLeadInput, context: { organizationId: string; branchId: string; userId?: string | null }) {
  const phone = input.phone?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  const duplicateFilters = [phone ? { phone } : null, email ? { email } : null].filter(Boolean) as Array<{ phone?: string; email?: string }>;
  const duplicate = duplicateFilters.length
    ? await prisma.lead.findFirst({ where: { organizationId: context.organizationId, OR: duplicateFilters } })
    : null;

  if (duplicate) {
    const lead = await prisma.lead.update({
      where: { id: duplicate.id },
      data: {
        message: input.message,
        lastContactAt: new Date(),
        leadScore: Math.max(Number(duplicate.leadScore ?? 0), scoreTourismLead(input)),
        leadStatus: duplicate.leadStatus === TourismLeadStatus.LOST ? TourismLeadStatus.NEW : duplicate.leadStatus,
        updatedAt: new Date()
      }
    });

    await prisma.leadMessage.create({
      data: {
        leadId: duplicate.id,
        organizationId: context.organizationId,
        branchId: duplicate.branchId ?? context.branchId,
        direction: CommunicationDirection.INBOUND,
        channel: input.sourceChannel === TourismLeadSourceChannel.WEB_FORM ? CommunicationChannel.EMAIL : CommunicationChannel.WHATSAPP,
        source: String(input.sourceChannel),
        subject: input.interestedTreatment,
        message: input.message
      }
    });

    await updateLeadInAirtable(lead);
    await writeAuditLog({ userId: context.userId, action: "DUPLICATE_LEAD_MESSAGE", module: "tourism", entityId: duplicate.id, metadata: { sourceChannel: String(input.sourceChannel) }, organizationId: context.organizationId, branchId: duplicate.branchId ?? context.branchId });
    return { lead, duplicate: true };
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: context.organizationId,
      branchId: context.branchId,
      sourceChannel: input.sourceChannel as TourismLeadSourceChannel,
      fullName: input.fullName,
      phone,
      email,
      country: input.country,
      city: input.city || null,
      language: input.language || "EN",
      interestedTreatment: input.interestedTreatment,
      estimatedBudget: input.estimatedBudget || null,
      travelDate: parseDate(input.travelDate),
      message: input.message,
      leadStatus: TourismLeadStatus.NEW,
      leadScore: scoreTourismLead(input),
      assignedToUserId: context.userId ?? null,
      nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      gdprConsent: input.gdprConsent ?? false
    }
  });

  await prisma.leadMessage.create({
    data: {
      leadId: lead.id,
      organizationId: context.organizationId,
      branchId: context.branchId,
      direction: CommunicationDirection.INBOUND,
      channel: input.sourceChannel === TourismLeadSourceChannel.WEB_FORM ? CommunicationChannel.EMAIL : CommunicationChannel.WHATSAPP,
      source: String(input.sourceChannel),
      subject: input.interestedTreatment,
      message: input.message
    }
  });

  await prisma.notification.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId ?? null,
      title: "Yeni sağlık turizmi lead'i",
      message: `${input.fullName} ${input.interestedTreatment} için bilgi istedi.`,
      type: NotificationType.LEAD,
      actionUrl: "/dashboard/tourism/leads"
    }
  });

  await syncLeadToAirtable(lead);
  await sendLeadToN8n(lead);
  await writeAuditLog({ userId: context.userId, action: "CREATE_LEAD", module: "tourism", entityId: lead.id, metadata: { sourceChannel: String(input.sourceChannel) }, organizationId: context.organizationId, branchId: context.branchId });
  return { lead, duplicate: false };
}

export async function markLeadStatus(leadId: string, status: TourismLeadStatus, organizationId: string) {
  const lead = await prisma.lead.update({ where: { id: leadId }, data: { leadStatus: status, lastContactAt: new Date() } });
  await updateLeadInAirtable(lead);
  return lead;
}

export async function startFollowUpForLead(leadId: string, organizationId: string) {
  const [lead, sequence] = await Promise.all([
    prisma.lead.findFirst({ where: { id: leadId, organizationId } }),
    prisma.followUpSequence.findFirst({ where: { organizationId, active: true }, orderBy: { createdAt: "asc" } })
  ]);
  if (!lead || !sequence) return null;

  const followUp = await prisma.leadFollowUp.create({
    data: {
      organizationId,
      branchId: lead.branchId,
      leadId: lead.id,
      sequenceId: sequence.id,
      currentStep: 0,
      nextRunAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: LeadFollowUpStatus.ACTIVE
    }
  });

  await triggerFollowUpWorkflow(lead);
  return followUp;
}

export async function shareReservation(packageId: string, organizationId: string, hotelPartnerId?: string | null, transferPartnerId?: string | null) {
  const tourismPackage = await prisma.tourismPackage.findFirst({ where: { id: packageId, organizationId } });
  if (!tourismPackage) return null;

  const [hotel, transfer] = await Promise.all([
    hotelPartnerId ? prisma.hotelPartner.findFirst({ where: { id: hotelPartnerId, organizationId } }) : prisma.hotelPartner.findFirst({ where: { organizationId, active: true } }),
    transferPartnerId ? prisma.transferPartner.findFirst({ where: { id: transferPartnerId, organizationId } }) : prisma.transferPartner.findFirst({ where: { organizationId, active: true } })
  ]);

  const reservation = await prisma.reservationShare.create({
    data: {
      organizationId,
      branchId: tourismPackage.branchId,
      packageId: tourismPackage.id,
      leadId: tourismPackage.leadId,
      hotelPartnerId: hotel?.id ?? null,
      transferPartnerId: transfer?.id ?? null,
      sharedVia: ReservationShareChannel.N8N,
      payloadJson: { packageId, hotel: hotel?.name, transfer: transfer?.name, airport: tourismPackage.arrivalAirport },
      status: ReservationShareStatus.SENT
    }
  });

  await shareReservationWithPartners(tourismPackage, hotel, transfer);
  return reservation;
}

export async function acceptTourismPackage(publicToken: string) {
  const tourismPackage = await prisma.tourismPackage.findFirst({ where: { publicToken } });
  if (!tourismPackage) return null;

  const updatedPackage = await prisma.tourismPackage.update({ where: { id: tourismPackage.id }, data: { packageStatus: TourismPackageStatus.ACCEPTED } });
  const lead = await prisma.lead.update({ where: { id: tourismPackage.leadId }, data: { leadStatus: TourismLeadStatus.BOOKED, lastContactAt: new Date() } });

  await prisma.notification.create({
    data: {
      organizationId: tourismPackage.organizationId,
      userId: tourismPackage.createdByUserId ?? null,
      title: "Paket kabul edildi",
      message: `${lead.fullName} paketi kabul etti. Otel ve transfer paylaşımı hazır.`,
      type: NotificationType.PACKAGE,
      actionUrl: "/dashboard/tourism/hotel-transfer"
    }
  });

  await prisma.task.create({
    data: {
      organizationId: tourismPackage.organizationId,
      branchId: tourismPackage.branchId,
      assignedToUserId: tourismPackage.createdByUserId ?? null,
      relatedLeadId: tourismPackage.leadId,
      relatedPatientId: tourismPackage.patientId ?? null,
      title: "BOOKED lead için rezervasyon paylaşımı",
      description: "Hasta paketi kabul etti. Otel ve transfer bilgilerini n8n mock ile partnerlere paylaşın.",
      priority: TaskPriority.URGENT,
      status: TaskStatus.TODO,
      dueDate: new Date()
    }
  });

  await sendPackageToN8n(updatedPackage);
  await shareReservation(tourismPackage.id, tourismPackage.organizationId);
  return updatedPackage;
}

export async function runDueFollowUps(organizationId?: string) {
  const due = await prisma.leadFollowUp.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      status: LeadFollowUpStatus.ACTIVE,
      nextRunAt: { lte: new Date() }
    },
    take: 50
  });

  let sent = 0;
  for (const followUp of due) {
    const [lead, sequence] = await Promise.all([
      prisma.lead.findFirst({ where: { id: followUp.leadId, organizationId: followUp.organizationId } }),
      prisma.followUpSequence.findFirst({ where: { id: followUp.sequenceId, organizationId: followUp.organizationId } })
    ]);
    if (!lead || !sequence) continue;
    const stopStatuses: TourismLeadStatus[] = [TourismLeadStatus.BOOKED, TourismLeadStatus.LOST, TourismLeadStatus.TREATMENT_STARTED];
    if (stopStatuses.includes(lead.leadStatus)) {
      await prisma.leadFollowUp.update({ where: { id: followUp.id }, data: { status: LeadFollowUpStatus.STOPPED } });
      continue;
    }

    const steps = Array.isArray(sequence.stepsJson) ? sequence.stepsJson as Array<{ dayOffset: number; channel: string; language: string; messageTemplate: string }> : [];
    const step = steps[followUp.currentStep] ?? steps[0];
    if (!step) continue;
    const message = step.messageTemplate.replaceAll("{{name}}", lead.fullName);

    await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        organizationId: lead.organizationId,
        branchId: lead.branchId,
        direction: CommunicationDirection.OUTBOUND,
        channel: step.channel === "EMAIL" ? CommunicationChannel.EMAIL : step.channel === "SMS" ? CommunicationChannel.SMS : CommunicationChannel.WHATSAPP,
        source: "auto-followup",
        subject: `${step.dayOffset}. gün follow-up`,
        message
      }
    });

    const nextStep = followUp.currentStep + 1;
    await prisma.leadFollowUp.update({
      where: { id: followUp.id },
      data: {
        currentStep: nextStep,
        lastMessageAt: new Date(),
        nextRunAt: steps[nextStep] ? new Date(Date.now() + Number(steps[nextStep].dayOffset) * 24 * 60 * 60 * 1000) : new Date(),
        status: steps[nextStep] ? LeadFollowUpStatus.ACTIVE : LeadFollowUpStatus.COMPLETED
      }
    });

    await writeIntegrationLog({
      organizationId: lead.organizationId,
      branchId: lead.branchId,
      provider: step.channel === "EMAIL" ? IntegrationProvider.EMAIL : step.channel === "SMS" ? IntegrationProvider.SMS : IntegrationProvider.WHATSAPP,
      eventType: "followup.sent",
      payloadJson: { leadId: lead.id, followUpId: followUp.id, message },
      responseJson: { queued: true, mode: "mock" }
    });
    sent += 1;
  }

  return { processed: due.length, sent };
}
