import { PaymentMethod, PaymentStatus, PaymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import type { PaymentInput } from "@/lib/validations/finance";

export async function getFinanceOverview(organizationId: string) {
  const [payments, invoices, patients] = await Promise.all([
    prisma.payment.findMany({
      where: { organizationId },
      include: { patient: { select: { firstName: true, lastName: true } }, branch: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
      take: 80
    }),
    prisma.invoice.findMany({
      where: { organizationId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.patient.findMany({ where: { organizationId }, orderBy: { firstName: "asc" }, take: 200 })
  ]);

  const income = payments.filter((payment) => payment.type === PaymentType.INCOME && payment.status === PaymentStatus.PAID).reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const pending = payments.filter((payment) => payment.type === PaymentType.INCOME && payment.status === PaymentStatus.PENDING).reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const expenses = payments.filter((payment) => payment.type === PaymentType.EXPENSE && payment.status === PaymentStatus.PAID).reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  return { payments, invoices, patients, income, pending, expenses, net: income - expenses };
}

export async function createPayment(organizationId: string, fallbackBranchId: string, input: PaymentInput) {
  const patient = input.patientId
    ? await prisma.patient.findFirst({ where: { id: input.patientId, organizationId }, select: { id: true, branchId: true } })
    : null;

  return prisma.payment.create({
    data: {
      patientId: patient?.id ?? null,
      type: input.type as PaymentType,
      amount: input.amount,
      method: input.method as PaymentMethod,
      description: input.description || null,
      status: input.status as PaymentStatus,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      organizationId,
      branchId: patient?.branchId ?? fallbackBranchId
    }
  });
}
