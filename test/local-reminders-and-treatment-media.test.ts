import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("mobile/assets/app.js", "utf8");
const ios = fs.readFileSync("ios/ClinicNova/ViewController.swift", "utf8");
const android = fs.readFileSync("mobile/src/app/clinicnova/mobile/MainActivity.java", "utf8");

test("appointment reminders prepare idempotent local messages for manual WhatsApp sending", () => {
  assert.match(app, /weekEnabled \? 7/);
  assert.match(app, /dayEnabled \? 1/);
  assert.match(app, /const deliveryId = `\$\{appointment\.id\}:\$\{offset\}`/);
  assert.match(app, /status: "READY"/);
  assert.match(app, /data-copy-reminder/);
  assert.match(app, /https:\/\/wa\.me\//);
  assert.match(app, /data-complete-reminder/);
  assert.match(app, /showLocalNotification/);
  assert.match(app, /reminderSettingsForm/);
  assert.match(app, /Hatırlatma bildirimlerini aç/);
  assert.doesNotMatch(app, /fetch\(reminderSettings\.endpoint/);
  assert.doesNotMatch(app, /"Idempotency-Key": deliveryId/);
});

test("completed treatments carry compressed before and after photos in the mesh document", () => {
  assert.match(app, /name="beforePhoto"/);
  assert.match(app, /name="afterPhoto"/);
  assert.match(app, /record\.beforePhoto, record\.afterPhoto/);
  assert.match(app, /canvas\.toDataURL\("image\/jpeg"/);
  assert.match(app, /treatments, staffRecords/);
});

test("Android and iOS local records use their hardware-backed encrypted stores", () => {
  assert.match(android, /storageGet\(String key\).*meshRead/);
  assert.match(android, /AndroidKeyStore/);
  assert.match(ios, /storageGet:/);
  assert.match(ios, /store\.write\("records"/);
  assert.match(fs.readFileSync("ios/ClinicNova/SecureMeshStore.swift", "utf8"), /AES\.GCM\.seal/);
  assert.match(android, /POST_NOTIFICATIONS/);
  assert.match(android, /publishLocalNotification/);
  assert.match(ios, /UNUserNotificationCenter/);
});
