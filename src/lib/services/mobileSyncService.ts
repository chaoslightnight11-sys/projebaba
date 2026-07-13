import { createHash } from "node:crypto";
import { AppointmentStatus, PaymentMethod, PaymentStatus, PaymentType, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getWritableBranchId } from "@/lib/services/tenantService";
import type { MobileSyncBatch, MobileSyncOperation } from "@/lib/validations/mobile-sync";

const patientPayload = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(8).max(40),
  email: z.string().email().or(z.literal("")).optional(),
  tag: z.enum(["NEW", "ACTIVE", "PASSIVE", "RISKY", "VIP"]).default("NEW"),
  treatment: z.string().max(160).optional(),
  note: z.string().max(4000).optional()
});

const appointmentPayload = z.object({
  patientId: z.union([z.string(), z.number()]).transform(String),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.coerce.number().int().min(15).max(240),
  treatment: z.string().trim().min(2).max(200),
  doctor: z.string().trim().max(160).optional(),
  room: z.string().max(80).optional(),
  status: z.enum(["PLANNED", "ARRIVED", "NO_SHOW", "CANCELLED", "COMPLETED"]).default("PLANNED")
});

const paymentPayload = z.object({
  patientId: z.union([z.string(), z.number()]).transform(String),
  amount: z.coerce.number().positive().max(100_000_000),
  totalAmount: z.coerce.number().positive().max(100_000_000).optional(),
  remainingAmount: z.coerce.number().min(0).max(100_000_000).optional(),
  method: z.string().max(40).optional(),
  description: z.string().max(1000).optional(),
  detail: z.string().max(1000).optional(),
  isDeposit: z.boolean().optional()
});

type SyncResult = { operationId: string; status: "synced" | "failed"; serverEntityId?: string; error?: string };

function payloadHash(operation: MobileSyncOperation) {
  return createHash("sha256").update(JSON.stringify({ entityType: operation.entityType, action: operation.action, clientId: operation.clientId, payload: operation.payload })).digest("hex");
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts.shift()!, lastName: parts.join(" ") || "Hasta" };
}

function paymentMethod(value?: string) {
  const normalized = value?.toLocaleUpperCase("tr-TR") ?? "";
  if (normalized.includes("NAKİT") || normalized.includes("NAKIT") || normalized === "CASH") return PaymentMethod.CASH;
  if (normalized.includes("TRANSFER")) return PaymentMethod.TRANSFER;
  if (normalized.includes("ONLINE")) return PaymentMethod.ONLINE;
  return PaymentMethod.CARD;
}

async function mappedEntityId(tx: Prisma.TransactionClient, organizationId: string, deviceId: string, entityType: string, clientId: string) {
  const mapping = await tx.mobileSyncRecord.findFirst({
    where: { organizationId, deviceId, entityType, clientId, serverEntityId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { serverEntityId: true }
  });
  return mapping?.serverEntityId ?? null;
}

async function applyOperation(tx: Prisma.TransactionClient, session: AuthSession, branchId: string, deviceId: string, operation: MobileSyncOperation) {
  const organizationId = session.organizationId;
  if (operation.entityType === "PATIENT") {
    const existingId = await mappedEntityId(tx, organizationId, deviceId, "PATIENT", operation.clientId);
    if (operation.action === "DELETE") {
      if (existingId) await tx.patient.updateMany({ where: { id: existingId, organizationId, deletedAt: null }, data: { deletedAt: new Date(), purgeAt: new Date(Date.now() + 30 * 86_400_000), deletedById: session.userId } });
      return existingId;
    }
    const payload = patientPayload.parse(operation.payload);
    const names = splitName(payload.name);
    if (existingId) {
      await tx.patient.updateMany({ where: { id: existingId, organizationId }, data: { ...names, phone: payload.phone, phoneNormalized: normalizePhone(payload.phone), email: payload.email || null, tag: payload.tag, notes: payload.note || null, deletedAt: null, purgeAt: null } });
      return existingId;
    }
    const patient = await tx.patient.create({ data: { ...names, phone: payload.phone, phoneNormalized: normalizePhone(payload.phone), email: payload.email || null, tag: payload.tag, notes: payload.note || null, organizationId, branchId } });
    return patient.id;
  }

  if (operation.entityType === "APPOINTMENT") {
    const existingId = await mappedEntityId(tx, organizationId, deviceId, "APPOINTMENT", operation.clientId);
    if (operation.action === "DELETE") {
      if (existingId) await tx.appointment.updateMany({ where: { id: existingId, organizationId }, data: { status: AppointmentStatus.CANCELLED } });
      return existingId;
    }
    const payload = appointmentPayload.parse(operation.payload);
    if (existingId && operation.action === "UPDATE") {
      await tx.appointment.updateMany({ where: { id: existingId, organizationId }, data: { status: payload.status as AppointmentStatus } });
      return existingId;
    }
    const patientId = await mappedEntityId(tx, organizationId, deviceId, "PATIENT", payload.patientId);
    if (!patientId) throw new Error("Önce bağlı hasta eşitlenmelidir.");
    const doctor = await tx.user.findFirst({
      where: { organizationId, active: true, role: { in: [Role.DOCTOR, Role.CLINIC_OWNER] }, ...(payload.doctor ? { name: payload.doctor } : {}) },
      orderBy: { createdAt: "asc" }, select: { id: true }
    }) ?? await tx.user.findFirst({ where: { organizationId, active: true, role: { in: [Role.DOCTOR, Role.CLINIC_OWNER] } }, orderBy: { createdAt: "asc" }, select: { id: true } });
    if (!doctor) throw new Error("Sunucuda aktif doktor bulunamadı.");
    const startsAt = new Date(`${payload.date}T${payload.time}:00`);
    const endsAt = new Date(startsAt.getTime() + payload.duration * 60_000);
    const candidates = await tx.appointment.findMany({
      where: { organizationId, doctorId: doctor.id, status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] }, startsAt: { gte: new Date(startsAt.getTime() - 4 * 60 * 60_000), lt: endsAt } },
      select: { startsAt: true, durationMinutes: true }
    });
    if (candidates.some((item) => item.startsAt < endsAt && new Date(item.startsAt.getTime() + item.durationMinutes * 60_000) > startsAt)) throw new Error("Doktorun bu saat aralığında başka randevusu var.");
    const appointment = await tx.appointment.create({ data: { patientId, doctorId: doctor.id, startsAt, durationMinutes: payload.duration, room: payload.room || null, treatmentType: payload.treatment, status: payload.status as AppointmentStatus, notes: "Android yerel kaydından eşitlendi.", organizationId, branchId } });
    return appointment.id;
  }

  const existingId = await mappedEntityId(tx, organizationId, deviceId, "PAYMENT", operation.clientId);
  if (operation.action === "DELETE") {
    if (existingId) await tx.payment.updateMany({ where: { id: existingId, organizationId }, data: { status: PaymentStatus.CANCELLED } });
    return existingId;
  }
  if (existingId) return existingId;
  const payload = paymentPayload.parse(operation.payload);
  const patientId = await mappedEntityId(tx, organizationId, deviceId, "PATIENT", payload.patientId);
  if (!patientId) throw new Error("Önce bağlı hasta eşitlenmelidir.");
  const totalAmount = payload.totalAmount ?? payload.amount;
  const payment = await tx.payment.create({ data: {
    patientId, type: PaymentType.INCOME, amount: payload.amount, listAmount: totalAmount,
    isDeposit: payload.isDeposit ?? (payload.remainingAmount ?? Math.max(0, totalAmount - payload.amount)) > 0,
    method: paymentMethod(payload.method), description: payload.description || payload.detail || "Android yerel tahsilatı",
    status: PaymentStatus.PAID, organizationId, branchId
  } });
  return payment.id;
}

export async function syncMobileOperations(session: AuthSession, batch: MobileSyncBatch) {
  const branchId = await getWritableBranchId(session);
  const results: SyncResult[] = [];

  for (const operation of batch.operations) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.mobileSyncRecord.findUnique({
          where: { organizationId_deviceId_operationId: { organizationId: session.organizationId, deviceId: batch.deviceId, operationId: operation.operationId } }
        });
        const hash = payloadHash(operation);
        if (existing) {
          if (existing.payloadHash !== hash) throw new Error("Aynı işlem kimliği farklı veriyle tekrar kullanılamaz.");
          return existing.serverEntityId ?? undefined;
        }
        const serverEntityId = await applyOperation(tx, session, branchId, batch.deviceId, operation);
        await tx.mobileSyncRecord.create({ data: {
          organizationId: session.organizationId, deviceId: batch.deviceId, operationId: operation.operationId,
          entityType: operation.entityType, action: operation.action, clientId: operation.clientId,
          serverEntityId, payloadHash: hash
        } });
        return serverEntityId ?? undefined;
      });
      results.push({ operationId: operation.operationId, status: "synced", serverEntityId: result });
    } catch (error) {
      const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Kayıt eşitlenemedi.";
      results.push({ operationId: operation.operationId, status: "failed", error: message || "Kayıt eşitlenemedi." });
    }
  }
  return results;
}
