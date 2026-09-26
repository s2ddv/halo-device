import test from "node:test";
import assert from "node:assert/strict";
import { HALO_CHANNELS, inspectPrimaryFrame } from "../src/lib/ble/halo-protocol.ts";
import { parseNrfNotifications, summarizeNrfLog } from "../src/lib/ble/nrf-log.ts";

// Synthetic fixtures only: no health readings, timestamps or identifiers from the owner.
function frame() {
  const bytes = Uint8Array.from([0x42, ...Array(14).fill(0xff), 0]);
  bytes[15] = bytes.subarray(0, 15).reduce((a, b) => a + b, 0) & 255;
  return bytes;
}
function line(bytes: Uint8Array, uuid: string = HALO_CHANNELS.primary.notify) {
  return `I\t00:00:00.000\tNotification received from ${uuid}, value: (0x) ${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("-")}`;
}
test("primary framing handles checksum overflow and returns a detached payload", () => {
  const bytes = frame();
  const result = inspectPrimaryFrame(bytes);
  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.equal(result.type, 0x42);
  assert.equal(result.payload.length, 14);
  result.payload[0] = 0;
  assert.equal(bytes[1], 255);
});
test("primary framing rejects truncation, concatenation and corrupted data", () => {
  assert.deepEqual(inspectPrimaryFrame(frame().slice(0, 15)), { valid: false, reason: "length" });
  assert.deepEqual(inspectPrimaryFrame(new Uint8Array(32)), { valid: false, reason: "length" });
  const bytes = frame();
  bytes[3] = 0;
  assert.deepEqual(inspectPrimaryFrame(bytes), { valid: false, reason: "checksum" });
});
test("log parser preserves repeated notifications but ignores rendered duplicate lines", () => {
  const record = line(frame());
  const log = `${record}\r\nA\t00:00:00.000\t"example" received\r\n${record}`;
  assert.equal(parseNrfNotifications(log).length, 2);
  assert.equal(summarizeNrfLog(log).channels[HALO_CHANNELS.primary.notify]?.validPrimaryFrames, 2);
});
test("secondary notifications are counted without assuming primary framing", () => {
  const log = line(new Uint8Array([0xbc, 1, 2, 3, 4, 5, 6]), HALO_CHANNELS.secondary.notify);
  const summary = summarizeNrfLog(log).channels[HALO_CHANNELS.secondary.notify]!;
  assert.deepEqual(summary.lengths, { 7: 1 });
  assert.equal(summary.validPrimaryFrames, 0);
  assert.equal(summary.invalidPrimaryFrames, 0);
});
test("parser rejects malformed hex and summary does not expose raw payloads", () => {
  assert.equal(parseNrfNotifications(line(frame()) + "-GG").length, 0);
  const summary = JSON.stringify(summarizeNrfLog(line(frame())));
  assert.ok(!summary.includes("00:00:00"));
  assert.ok(!summary.includes("payload"));
  assert.equal(summarizeNrfLog("Services discovered").notifications, 0);
});
