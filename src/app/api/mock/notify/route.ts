import { CommunicationChannel } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { sendMessage } from "@/lib/services/notificationService";
import { getWritableBranchId } from "@/lib/services/tenantService";

export async function POST(request: Request) {
  if (!isDemoMode()) return NextResponse.json({ error: "Bu demo endpoint'i üretimde kapalıdır." }, { status: 404 });
  try {
    const session = await requireSession();
    const branchId = await getWritableBranchId(session);
    const payload = (await request.json()) as {
      to: string;
      message: string;
      patientId?: string;
      channel?: CommunicationChannel;
    };

    const result = await sendMessage({
      organizationId: session.organizationId,
      branchId,
      patientId: payload.patientId,
      to: payload.to,
      message: payload.message,
      channel: payload.channel ?? CommunicationChannel.WHATSAPP
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bildirim gonderilemedi." }, { status: 400 });
  }
}
