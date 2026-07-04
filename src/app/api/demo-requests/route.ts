import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { demoRequestSchema } from "@/lib/validations/demo";

export async function POST(request: Request) {
  try {
    const payload = demoRequestSchema.parse(await request.json());
    const demoRequest = await prisma.demoRequest.create({
      data: {
        fullName: payload.fullName,
        clinicName: payload.clinicName,
        phone: payload.phone,
        email: payload.email,
        city: payload.city,
        clinicSize: payload.clinicSize,
        message: payload.message || null
      }
    });
    return NextResponse.json({ demoRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Demo talebi kaydedilemedi." }, { status: 400 });
  }
}
