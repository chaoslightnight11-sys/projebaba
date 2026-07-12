import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shareReservation } from "@/lib/services/tourismService";
import { reservationShareSchema } from "@/lib/validations/tourism";
import { getWebhookOrganizationSlug, isWebhookRequestAuthorized } from "@/lib/webhook-auth";

export async function POST(request: Request) {
  if (!isWebhookRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Yetkisiz istek." }, { status: 401 });
  }

  try {
    const payload = reservationShareSchema.parse(await request.json());
    const slug = getWebhookOrganizationSlug(request);
    if (!slug) return NextResponse.json({ ok: false, error: "X-ClinicNova-Organization tenant başlığı gerekli." }, { status: 400 });
    const organization = await prisma.organization.findFirst({ where: { slug }, select: { id: true } });
    if (!organization) return NextResponse.json({ ok: false, error: "Organizasyon bulunamadı." }, { status: 404 });
    const tourismPackage = await prisma.tourismPackage.findFirst({ where: { id: payload.packageId, organizationId: organization.id } });
    if (!tourismPackage) {
      return NextResponse.json({ ok: false, error: "Paket bulunamadı." }, { status: 404 });
    }

    const reservation = await shareReservation(payload.packageId, tourismPackage.organizationId, payload.hotelPartnerId || null, payload.transferPartnerId || null);
    return NextResponse.json({ ok: true, reservationId: reservation?.id ?? null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Rezervasyon paylaşımı işlenemedi." }, { status: 400 });
  }
}
