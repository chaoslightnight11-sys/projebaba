import { IntegrationLogStatus, IntegrationProvider } from "@prisma/client";
import { dispatchOutboundEvent } from "@/lib/integrations/outboundWebhook";
import { writeIntegrationLog } from "@/lib/services/integrationLogService";

type N8nEntity = {
  id: string;
  organizationId: string;
  branchId?: string | null;
  [key: string]: unknown;
};

async function dispatchN8n(eventType: string, entity: N8nEntity) {
  const result = await dispatchOutboundEvent(eventType, entity);
  return writeIntegrationLog({
    organizationId: entity.organizationId,
    branchId: entity.branchId,
    provider: IntegrationProvider.N8N,
    eventType,
    payloadJson: entity,
    responseJson: result,
    status: result.ok ? IntegrationLogStatus.SUCCESS : IntegrationLogStatus.FAILED,
    errorMessage: result.ok ? null : result.message
  });
}

export function sendLeadToN8n(lead: N8nEntity) {
  return dispatchN8n("lead.created", lead);
}

export function sendPackageToN8n(tourismPackage: N8nEntity) {
  return dispatchN8n("package.sent", tourismPackage);
}

export function shareReservationWithPartners(tourismPackage: N8nEntity, hotel?: N8nEntity | null, transfer?: N8nEntity | null) {
  return dispatchN8n(
    "reservation.share",
    { ...tourismPackage, hotelPartner: hotel, transferPartner: transfer }
  );
}

export function triggerFollowUpWorkflow(lead: N8nEntity) {
  return dispatchN8n("followup.trigger", lead);
}

export function triggerReviewWorkflow(patient: N8nEntity) {
  return dispatchN8n("review.trigger", patient);
}
