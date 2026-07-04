import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createPatient, getPatients } from "@/lib/services/patientService";
import { getWritableBranchId } from "@/lib/services/tenantService";
import { patientSchema } from "@/lib/validations/patient";

export async function GET(request: Request) {
  const session = await requireSession();
  const { searchParams } = new URL(request.url);
  const patients = await getPatients(session.organizationId, searchParams.get("q") ?? undefined);
  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const branchId = await getWritableBranchId(session);
    const payload = patientSchema.parse(await request.json());
    const patient = await createPatient(session.organizationId, branchId, payload);
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hasta kaydedilemedi." }, { status: 400 });
  }
}
