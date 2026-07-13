import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createAppointment, getAppointments } from "@/lib/services/appointmentService";
import { appointmentSchema } from "@/lib/validations/appointment";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  const session = await requireSession();
  if (!canAccess(session.role, "appointments")) return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  const appointments = await getAppointments(session.organizationId);
  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!canAccess(session.role, "appointments")) return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
    const payload = appointmentSchema.parse(await request.json());
    const appointment = await createAppointment(session.organizationId, payload);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Randevu kaydedilemedi." }, { status: 400 });
  }
}
