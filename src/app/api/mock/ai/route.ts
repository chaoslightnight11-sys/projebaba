import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { getAiAssistantSuggestion } from "@/lib/services/aiAssistantService";

export async function POST(request: Request) {
  if (!isDemoMode()) return NextResponse.json({ error: "Bu demo endpoint'i üretimde kapalıdır." }, { status: 404 });
  await requireSession();
  const payload = (await request.json()) as { topic?: "patient" | "appointments" | "finance" | "stock" | "general"; prompt?: string };
  const result = await getAiAssistantSuggestion({
    topic: payload.topic ?? "general",
    prompt: payload.prompt
  });
  return NextResponse.json(result);
}
