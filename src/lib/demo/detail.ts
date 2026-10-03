import type { Point } from "../metrics";
export type Period = "day" | "week" | "month";
export type DetailMetric = "heart" | "oxygen" | "temperature" | "stress" | "steps" | "calories";
const samples: Record<DetailMetric, number[]> = {
  heart: [
    62, 58, 55, 52, 57, 64, 76, 83, 71, 74, 82, 68, 73, 91, 78, 87, 108, 148, 95, 82, 76, 72, 66,
    60,
  ],
  oxygen: [
    98, 98, 97, 96, 93, 97, 98, 98, 99, 98, 97, 98, 98, 99, 98, 97, 98, 99, 98, 97, 98, 98, 97, 98,
  ],
  temperature: [
    36.4, 36.3, 36.2, 36.1, 36, 36.2, 36.4, 36.5, 36.6, 36.5, 36.4, 36.5, 36.6, 36.6, 36.5, 36.7,
    36.8, 37.1, 36.8, 36.7, 36.6, 36.5, 36.4, 36.3,
  ],
  stress: [
    24, 20, 18, 22, 19, 18, 26, 34, 42, 37, 30, 46, 52, 63, 78, 55, 42, 34, 28, 26, 24, 23, 20, 19,
  ],
  steps: [
    0, 0, 0, 0, 0, 120, 240, 1600, 700, 300, 400, 1100, 750, 280, 540, 430, 800, 1800, 2450, 500,
    260, 80, 26, 0,
  ],
  calories: [
    0, 0, 0, 0, 0, 5, 12, 70, 35, 15, 20, 45, 32, 17, 23, 18, 40, 120, 90, 22, 12, 5, 4, 0,
  ],
};
/** Explicit fixtures, never passed to the health persistence layer. */
export function detailSeries(metric: DetailMetric, period: Period, day: string): Point[] {
  const seed = [...day].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = samples[metric];
  const count = period === "day" ? 24 : period === "week" ? 7 : 30;
  return Array.from({ length: count }, (_, i) => {
    const raw = base[period === "day" ? i : (i * 3 + seed) % base.length]!;
    const offset = (seed % 5) - 2;
    const adjusted =
      metric === "temperature"
        ? Number((raw + offset * 0.1).toFixed(1))
        : metric === "oxygen"
          ? Math.min(100, Math.max(90, raw + offset))
          : Math.max(0, raw + offset * 2);
    const v =
      metric === "steps" || metric === "calories"
        ? period === "day"
          ? Math.round(raw * (1 + offset * 0.03))
          : Math.round(base.reduce((a, b) => a + b, 0) * (0.7 + ((i + seed) % 7) / 10))
        : adjusted;
    return { t: period === "day" ? `${String(i).padStart(2, "0")}h` : `${i + 1}`, v };
  });
}
export function summarize(points: Point[]) {
  const values = points.map((p) => p.v);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    total: values.reduce((a, b) => a + b, 0),
  };
}
export function distribution(
  points: Point[],
  ranges: { label: string; min: number; max: number; color: string }[],
) {
  return ranges.map((range) => ({
    ...range,
    count: points.filter((p) => p.v >= range.min && p.v <= range.max).length,
    pct: Math.round(
      (points.filter((p) => p.v >= range.min && p.v <= range.max).length / points.length) * 100,
    ),
  }));
}
export function demoCsv(metric: string, period: Period, day: string, points: Point[]) {
  return (
    "\uFEFFsource,metric,period,reference_day,label,value\n" +
    points.map((p) => ["demo", metric, period, day, p.t, p.v].join(",")).join("\n")
  );
}
