import { Gender, PatientTag } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PatientInput } from "@/lib/validations/patient";

function optional(value?: string | null) {
  return value && value.length > 0 ? value : null;
}

export async function getPatients(organizationId: string, query?: string) {
  return prisma.patient.findMany({
    where: {
      organizationId,
      OR: query
        ? [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } }
          ]
        : undefined
    },
    include: {
      branch: { select: { name: true } },
      appointments: { orderBy: { startsAt: "desc" }, take: 1 },
      payments: { orderBy: { paidAt: "desc" }, take: 3 }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function getPatientById(organizationId: string, id: string) {
  return prisma.patient.findFirst({
    where: { id, organizationId },
    include: {
      branch: true,
      appointments: { include: { doctor: { select: { name: true } } }, orderBy: { startsAt: "desc" } },
      treatmentPlans: { include: { doctor: { select: { name: true } } }, orderBy: { plannedAt: "desc" } },
      treatments: { include: { doctor: { select: { name: true } } }, orderBy: { performedAt: "desc" } },
      payments: { orderBy: { paidAt: "desc" } },
      consents: { orderBy: { createdAt: "desc" } },
      surveyResponses: { include: { survey: true }, orderBy: { createdAt: "desc" } },
      communication: { orderBy: { createdAt: "desc" } },
      recalls: { orderBy: { dueDate: "asc" } }
    }
  });
}

export async function createPatient(organizationId: string, branchId: string, input: PatientInput) {
  return prisma.patient.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      nationalId: optional(input.nationalId),
      phone: input.phone,
      email: optional(input.email),
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      gender: input.gender as Gender,
      address: optional(input.address),
      allergies: optional(input.allergies),
      chronicDiseases: optional(input.chronicDiseases),
      notes: optional(input.notes),
      tag: input.tag as PatientTag,
      organizationId,
      branchId
    }
  });
}

export async function updatePatient(organizationId: string, id: string, input: PatientInput) {
  return prisma.patient.updateMany({
    where: { id, organizationId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      nationalId: optional(input.nationalId),
      phone: input.phone,
      email: optional(input.email),
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      gender: input.gender as Gender,
      address: optional(input.address),
      allergies: optional(input.allergies),
      chronicDiseases: optional(input.chronicDiseases),
      notes: optional(input.notes),
      tag: input.tag as PatientTag
    }
  });
}

export async function deletePatient(organizationId: string, id: string) {
  return prisma.patient.deleteMany({ where: { id, organizationId } });
}
