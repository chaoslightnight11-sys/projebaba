import { IntegrationProvider } from "@prisma/client";
import { writeIntegrationLog } from "@/lib/services/integrationLogService";

type AirtableLead = {
  id: string;
  organizationId: string;
  branchId?: string | null;
  fullName?: string;
  leadStatus?: string;
};

export async function syncLeadToAirtable(lead: AirtableLead) {
  console.log("[airtable:mock] sync lead", lead.id);
  return writeIntegrationLog({
    organizationId: lead.organizationId,
    branchId: lead.branchId,
    provider: IntegrationProvider.AIRTABLE,
    eventType: "lead.sync",
    payloadJson: lead,
    responseJson: { ok: true, table: "Leads", mode: "mock" }
  });
}

export async function updateLeadInAirtable(lead: AirtableLead) {
  console.log("[airtable:mock] update lead", lead.id);
  return writeIntegrationLog({
    organizationId: lead.organizationId,
    branchId: lead.branchId,
    provider: IntegrationProvider.AIRTABLE,
    eventType: "lead.update",
    payloadJson: lead,
    responseJson: { ok: true, table: "Leads", mode: "mock" }
  });
}

export async function syncLeadStatus(leadId: string, status: string, organizationId: string, branchId?: string | null) {
  console.log("[airtable:mock] sync status", leadId, status);
  return writeIntegrationLog({
    organizationId,
    branchId,
    provider: IntegrationProvider.AIRTABLE,
    eventType: "lead.status",
    payloadJson: { leadId, status },
    responseJson: { ok: true, mode: "mock" }
  });
}
