import test from "node:test";
import assert from "node:assert/strict";
import {
  heartRateParser,
  heartRateRequest,
  stepsParser,
  stepsRequest,
} from "../src/lib/ble/colmi-history.ts";
import { makePrimaryCommand } from "../src/lib/ble/halo-protocol.ts";
import { colmiLiveMeasurement, colmiMeasurements } from "../src/lib/health/colmi.ts";
const now = new Date("2026-10-03T12:00:00Z");
const day = "2026-10-02";
const packet = (command: number, payload: number[]) =>
  makePrimaryCommand(command, new Uint8Array(payload));
function hrFrames(date = day) {
  const timestamp = [...heartRateRequest(date).slice(1, 5)];
  return [
    packet(0x15, [0, 24, 5]),
    packet(0x15, [1, ...timestamp, 70]),
    ...Array.from({ length: 22 }, (_, i) => packet(0x15, [i + 2, 80])),
  ];
}

test("Colmi requests use unsigned little-endian epoch and documented step constants", () => {
  assert.equal(
    new DataView(heartRateRequest(day).buffer).getUint32(1, true),
    Date.parse(`${day}T00:00:00Z`) / 1000,
  );
  assert.deepEqual(
    [...stepsRequest(day, now)],
    [67, 1, 15, 0, 95, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 179],
  );
  for (const date of ["2026-09-26", "2026-10-04", "2026-02-30", "bad"])
    assert.throws(() => stepsRequest(date, now));
});

test("HR assembles 24 packets, filters missing values and preserves five-minute timestamps", () => {
  const parse = heartRateParser(day, now);
  const frames = hrFrames();
  frames.slice(0, -1).forEach((frame) => assert.equal(parse(frame), null));
  const samples = parse(frames.at(-1)!)!;
  assert.equal(samples.length, 23);
  assert.deepEqual(samples[0], {
    metric: "heartRate",
    value: 70,
    recordedAt: "2026-10-02T00:00:00.000Z",
  });
  assert.equal(samples[1]!.recordedAt, "2026-10-02T00:45:00.000Z");
});

test("HR ignores corrupt and unrelated frames and rejects gaps, mismatched dates and unsupported interval", () => {
  const parse = heartRateParser(day, now);
  assert.equal(parse(packet(3, [50])), null);
  const damaged = hrFrames()[0]!;
  damaged[15] ^= 1;
  assert.equal(parse(damaged), null);
  parse(hrFrames()[0]!);
  assert.throws(() => parse(hrFrames()[2]!), /fora de ordem/);
  const wrongDate = heartRateParser(day, now);
  wrongDate(hrFrames()[0]!);
  assert.throws(() => wrongDate(hrFrames("2026-10-01")[1]!), /data recebida/);
  assert.throws(() => heartRateParser(day, now)(packet(0x15, [0, 24, 1])), /não suportado/);
  assert.throws(() => heartRateParser(day, now)(packet(0x95, [])), /rejeitada/);
});

test("today HR drops future and current incomplete slots", () => {
  const parse = heartRateParser(day, new Date("2026-10-02T00:04:00Z"));
  let result;
  for (const frame of hrFrames()) result = parse(frame);
  assert.deepEqual(result, []);
});

test("steps decode the upstream documented MIT test vector", () => {
  const parse = stepsParser("2024-10-15", now);
  assert.equal(parse(Uint8Array.from([67, 240, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 53])), null);
  assert.deepEqual(
    parse(Uint8Array.from([67, 36, 16, 21, 92, 0, 1, 121, 0, 21, 0, 16, 0, 0, 0, 135])),
    [{ metric: "steps", value: 21, recordedAt: "2024-10-15T23:00:00.000Z" }],
  );
});

test("steps reject duplicate slots, gaps, wrong dates and invalid BCD", () => {
  const parse = stepsParser(day, now);
  parse(packet(0x43, [240, 2, 1]));
  assert.equal(parse(packet(0x43, [0x26, 0x10, 2, 4, 0, 2, 0, 0, 4])), null);
  assert.throws(() => parse(packet(0x43, [0x26, 0x10, 2, 4, 1, 2, 0, 0, 4])), /inválido/);
  for (const payload of [
    [0x26, 0x10, 2, 4, 1, 2],
    [0x26, 0x10, 1, 4, 0, 1],
    [0x26, 0x1a, 2, 4, 0, 1],
  ])
    assert.throws(() => stepsParser(day, now)(packet(0x43, payload)));
});

test("empty history is distinct from missing replies", () => {
  assert.deepEqual(heartRateParser(day, now)(packet(0x15, [255])), []);
  assert.deepEqual(stepsParser(day, now)(packet(0x43, [255])), []);
});

test("imports use stable IDs per device, metric and UTC slot; live HR stays instantaneous", () => {
  const samples = [{ metric: "steps" as const, value: 21, recordedAt: "2026-10-02T23:00:00.000Z" }];
  const first = colmiMeasurements("a", samples, now)[0]!;
  const second = colmiMeasurements("a", samples, new Date(now.getTime() + 1000))[0]!;
  assert.equal(first.id, second.id);
  assert.notEqual(first.id, colmiMeasurements("b", samples, now)[0]!.id);
  assert.equal(first.timeZone, "UTC");
  assert.equal(first.day, day);
  const live = colmiLiveMeasurement("a", { metric: "heartRate", value: 80 }, now);
  assert.equal(live.metric, "heartRate");
  assert.equal(live.source, "ble");
  assert.throws(() => colmiLiveMeasurement("a", { metric: "spo2", value: 110 }, now));
});
