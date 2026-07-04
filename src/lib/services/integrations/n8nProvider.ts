import { IntegrationProvider } from "@prisma/client";
import { writeIntegrationLog } from "@/lib/services/integrationLogService";

type N8nEntity = {
  id: string;
  organizationId: string;
  branchId?: string | null;
  [key: string]: unknown;
};

async function mockN8n(eventType: string, entity: N8nEntity, responseJson: object = { ok: true, workflow: "mock" }) {
  console.log(`[n8n:mock] ${eventType}`, entity.id);
  return writeIntegrationLog({
    organizationId: entity.organizationId,
    branchId: entity.branchId,
    provider: IntegrationProvider.N8N,
    eventType,
    payloadJson: entity,
    responseJson
  });
}

export function sendLeadToN8n(lead: N8nEntity) {
  return mockN8n("lead.created", lead, { ok: true, workflow: "lead-intake" });
}

export function sendPackageToN8n(tourismPackage: N8nEntity) {
  return mockN8n("package.sent", tourismPackage, { ok: true, workflow: "package-delivery" });
}

export function shareReservationWithPartners(tourismPackage: N8nEntity, hotel?: N8nEntity | null, transfer?: N8nEntity | null) {
  return mockN8n(
    "reservation.share",
    { ...tourismPackage, hotelPartner: hotel, transferPartner: transfer },
    { ok: true, workflow: "hotel-transfer-reservation" }
  );
}

export function triggerFollowUpWorkflow(lead: N8nEntity) {
  return mockN8n("followup.trigger", lead, { ok: true, workflow: "3-7-14-followup" });
}

export function triggerReviewWorkflow(patient: N8nEntity) {
  return mockN8n("review.trigger", patient, { ok: true, workflow: "review-request" });
}
