import test from "node:test";
import assert from "node:assert/strict";
import {
  dailyWindow,
  healthStatus,
  personalBaseline,
  shiftDay,
  validateMeasurement,
  validateSummary,
  SCORE_KEYS,
} from "../src/lib/health/model.ts";
import type { Measurement, DailySummary } from "../src/lib/health/model.ts";
import { parseHeartRate } from "../src/lib/health/heart-rate.ts";

function measurement(day: string, value = 60): Measurement {
  return {
    id: day,
    deviceId: "fixture",
    metric: "heartRate",
    unit: "bpm",
    value,
    recordedAt: `${day}T12:00:00Z`,
    receivedAt: `${day}T12:00:00Z`,
    day,
    timeZone: "UTC",
    source: "ble",
  };
}
function summary(day: string): DailySummary {
  return {
    day,
    source: "derived",
    algorithmVersion: "test",
    subScores: Object.fromEntries(SCORE_KEYS.map((key) => [key, 80])) as DailySummary["subScores"],
  };
}
test("calendar gaps score zero, partial data stays unknown, complete days score 800", () => {
  const days = dailyWindow(
    [summary("2026-09-01")],
    [measurement("2026-09-03")],
    "2026-09-01",
    "2026-09-03",
  );
  assert.deepEqual(
    days.map((day) => [day.state, day.score]),
    [
      ["complete", 800],
      ["missing", 0],
      ["partial", null],
    ],
  );
});
test("window uses 30 calendar days and excludes pre-enrollment days", () => {
  const days = dailyWindow([], [], "2026-01-01", "2026-03-01");
  assert.equal(days.length, 30);
  assert.equal(days[0]?.day, "2026-01-31");
  assert.equal(dailyWindow([], [], "2026-03-01", "2026-03-01").length, 1);
  assert.equal(shiftDay("2024-03-01", -1), "2024-02-29");
});
test("calibration counts distinct observed days and never publishes partial scores", () => {
  const dates = Array.from({ length: 14 }, (_, i) => shiftDay("2026-09-01", i));
  const days = dailyWindow(dates.map(summary), [], dates[0]!, dates.at(-1)!);
  assert.equal(healthStatus(days, Array(30).fill(dates[0])).calibrationDays, 1);
  assert.equal(healthStatus(days, dates.slice(0, 13)).score, null);
  assert.equal(healthStatus(days, dates).score, 800);
  assert.equal(
    healthStatus([{ day: "2026-09-14", state: "partial", score: null }], dates).score,
    null,
  );
  assert.equal(healthStatus(days, []).state, "empty");
});
test("mean includes missing dates as zero after calibration", () => {
  const dates = Array.from({ length: 14 }, (_, i) => shiftDay("2026-09-01", i));
  const days = dailyWindow(dates.map(summary), [], "2026-09-01", "2026-09-15");
  assert.equal(healthStatus(days, dates).score, Math.round((14 * 800) / 15));
});
test("baseline requires 60 distinct days, excludes target day and instantaneous HR", () => {
  const rows = Array.from({ length: 60 }, (_, i): Measurement => ({
    ...measurement(shiftDay("2026-06-01", i)),
    metric: "restingHeartRate",
  }));
  const before = "2026-07-31";
  assert.equal(personalBaseline(rows.slice(0, 59), "restingHeartRate", before), null);
  assert.equal(personalBaseline(Array(100).fill(rows[0]), "restingHeartRate", before), null);
  const baseline = personalBaseline(
    [
      ...rows,
      { ...measurement(before, 200), metric: "restingHeartRate" },
      measurement("2026-06-01", 200),
    ],
    "restingHeartRate",
    before,
  );
  assert.deepEqual(baseline, { mean: 60, stdDev: 0, days: 60 });
});
test("storage boundary rejects wrong units, invalid dates, non-finite values and demo origin", () => {
  validateMeasurement(measurement("2026-09-01"));
  for (const override of [
    { value: NaN },
    { unit: "%" },
    { day: "2026-02-30" },
    { source: "demo" },
    { value: 0 },
    { timeZone: "invalid" },
  ]) {
    assert.throws(() =>
      validateMeasurement({ ...measurement("2026-09-01"), ...override } as Measurement),
    );
  }
  assert.throws(() =>
    validateSummary({
      ...summary("2026-09-01"),
      subScores: { ...summary("2026-09-01").subScores, sleep: 101 },
    }),
  );
});
test("timezone day is validated against capture time, not UTC date", () => {
  const row = {
    ...measurement("2026-09-01"),
    recordedAt: "2026-09-02T01:00:00Z",
    timeZone: "America/Sao_Paulo",
  };
  validateMeasurement(row);
  assert.throws(() => validateMeasurement({ ...row, day: "2026-09-02" }));
});
test("standard HR decoder reads 8/16 bit payloads and rejects truncation", () => {
  const view = (...bytes: number[]) => new DataView(Uint8Array.from(bytes).buffer);
  assert.equal(parseHeartRate(view(0, 72)), 72);
  assert.equal(parseHeartRate(view(1, 44, 1)), 300);
  for (const bytes of [[], [0], [1, 44], [0, 0]])
    assert.throws(() => parseHeartRate(view(...bytes)));
});
