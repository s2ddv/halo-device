import test from "node:test";
import assert from "node:assert/strict";
import { detailSeries, distribution, demoCsv, summarize } from "../src/lib/demo/detail.ts";

test("detail fixtures respond to dates and periods without changing determinism", () => {
  const a = detailSeries("heart", "day", "2026-10-01");
  assert.deepEqual(a, detailSeries("heart", "day", "2026-10-01"));
  assert.notDeepEqual(a, detailSeries("heart", "day", "2026-10-02"));
  assert.equal(a.length, 24);
  assert.equal(detailSeries("heart", "week", "2026-10-01").length, 7);
  assert.equal(detailSeries("heart", "month", "2026-10-01").length, 30);
});
test("sample distributions count all selected observations and export demo provenance", () => {
  const points = detailSeries("oxygen", "month", "2026-10-01");
  const bins = distribution(points, [
    { label: "low", min: 0, max: 94, color: "red" },
    { label: "mid", min: 95, max: 97, color: "blue" },
    { label: "high", min: 98, max: 100, color: "green" },
  ]);
  assert.equal(
    bins.reduce((sum, b) => sum + b.count, 0),
    points.length,
  );
  assert.ok(points.every((p) => p.v <= 100));
  const csv = demoCsv("spo2", "month", "2026-10-01", points);
  assert.equal(csv.split("\n").length, 31);
  assert.ok(
    csv
      .split("\n")
      .slice(1)
      .every((row) => row.startsWith("demo,spo2,month,2026-10-01,")),
  );
  assert.equal(
    summarize([
      { t: "a", v: 4 },
      { t: "b", v: 8 },
    ]).avg,
    6,
  );
});
