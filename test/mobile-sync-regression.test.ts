import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mobileBundle = readFileSync(new URL("../mobile/assets/app.js", import.meta.url), "utf8");
const syncService = readFileSync(new URL("../src/lib/services/mobileSyncService.ts", import.meta.url), "utf8");

test("stock movement retries check the movement table and restored offers verify existence", () => {
  assert.match(syncService, /tx\.stockMovement\.findFirst\(\{ where: \{ id: existingId, organizationId, branchId \}/);
  assert.doesNotMatch(syncService, /entityType === "STOCK_MOVEMENT"[\s\S]{0,300}tx\.stockOffer\.findFirst/);
  assert.match(syncService, /existingId && await tx\.stockOffer\.findFirst/);
});

test("mobile queue never mutates an attempted operation and keeps in-flight deletes ordered", () => {
  assert.match(mobileBundle, /item\.attemptedAt \|\|= attemptedAt/);
  assert.match(mobileBundle, /!item\.attemptedAt && !inFlightOperationIds\.has\(item\.operationId\)/);
  assert.match(mobileBundle, /hasAttemptedCreate/);
  assert.match(mobileBundle, /inFlightOperationIds = new Set\(operations\.map/);
});

test("failed pending changes replace their server twin instead of duplicating it", () => {
  assert.match(mobileBundle, /const mergePending = \(pending, type, serverItems\)/);
  assert.match(mobileBundle, /!pendingServerIds\.has\(String\(item\.serverId\)\)/);
  assert.match(mobileBundle, /state\.patients = mergePending\(pendingPatients, "PATIENT", collections\.PATIENT\)/);
});

test("completed clinical records preserve stock usage across snapshots and restores", () => {
  assert.match(syncService, /treatment\.findMany\([\s\S]*stockMovements/);
  assert.match(mobileBundle, /prepareRestoredClinicalRecords/);
  assert.match(mobileBundle, /linkedRecipes\.forEach\(\(item\) => queueDelete\("STOCK_RECIPE"/);
  assert.match(mobileBundle, /payload\.linkedResponses \|\| \[\]/);
});
