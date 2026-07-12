import { IntegrationLogStatus, IntegrationProvider } from "@prisma/client";
import { dispatchOutboundEvent } from "@/lib/integrations/outboundWebhook";
import { writeIntegrationLog } from "@/lib/services/integrationLogService";

type AirtableLead = {
  id: string;
  organizationId: string;
  branchId?: string | null;
  fullName?: string;
  leadStatus?: string;
};

async function dispatchAirtable(eventType: string, lead: AirtableLead) {
  const result = await dispatchOutboundEvent(eventType, { ...lead });
  return writeIntegrationLog({
    organizationId: lead.organizationId,
    branchId: lead.branchId,
    provider: IntegrationProvider.AIRTABLE,
    eventType,
    payloadJson: lead,
    responseJson: result,
    status: result.ok ? IntegrationLogStatus.SUCCESS : IntegrationLogStatus.FAILED,
    errorMessage: result.ok ? null : result.message
  });
}

export async function syncLeadToAirtable(lead: AirtableLead) {
  return dispatchAirtable("airtable.lead.sync", lead);
}

export async function updateLeadInAirtable(lead: AirtableLead) {
  return dispatchAirtable("airtable.lead.update", lead);
}

export async function syncLeadStatus(leadId: string, status: string, organizationId: string, branchId?: string | null) {
  return dispatchAirtable("airtable.lead.status", { id: leadId, leadStatus: status, organizationId, branchId });
}
