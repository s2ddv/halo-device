import { CALIBRATION_DAYS, SUB_SCORE_META, dailyScore, levelFromScore } from "../scoring.ts";
import type { SubScoreKey } from "../scoring.ts";

export const UNITS = {
  heartRate: "bpm",
  restingHeartRate: "bpm",
  spo2: "%",
  temperature: "°C",
  steps: "steps",
  sleepDuration: "minutes",
} as const;
export type Metric = keyof typeof UNITS;
export type Measurement = {
  id: string;
  metric: Metric;
  value: number;
  unit: (typeof UNITS)[Metric];
  recordedAt: string;
  receivedAt: string;
  day: string;
  timeZone: string;
  source: "ble";
  deviceId: string;
};
export type DailySummary = {
  day: string;
  subScores: Record<SubScoreKey, number | null>;
  source: "derived";
  algorithmVersion: string;
};
export const SCORE_KEYS = Object.keys(SUB_SCORE_META) as SubScoreKey[];
export function validDay(day: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day)) &&
    new Date(day).toISOString().slice(0, 10) === day
  );
}
export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDay(day: string, offset: number): string {
  if (!validDay(day)) throw new Error("Data inválida");
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function validateMeasurement(value: Measurement): void {
  if (
    !value ||
    !(value.metric in UNITS) ||
    value.unit !== UNITS[value.metric] ||
    !Number.isFinite(value.value) ||
    value.value < 0 ||
    value.source !== "ble" ||
    !value.id ||
    !value.deviceId ||
    !value.timeZone ||
    !validDay(value.day) ||
    !Number.isFinite(Date.parse(value.recordedAt)) ||
    !Number.isFinite(Date.parse(value.receivedAt))
  ) {
    throw new Error("Medição inválida");
  }
  const metric = value.metric;
  if (
    (metric === "spo2" && value.value > 100) ||
    ((metric === "heartRate" || metric === "restingHeartRate") &&
      (value.value === 0 || !Number.isInteger(value.value))) ||
    (metric === "steps" && !Number.isInteger(value.value))
  )
    throw new Error("Valor inválido");
  // The day is captured in the acquisition timezone; travel must not relabel old data.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: value.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value.recordedAt));
  const part = (kind: string) => parts.find((p) => p.type === kind)?.value;
  if (`${part("year")}-${part("month")}-${part("day")}` !== value.day)
    throw new Error("Data e fuso incompatíveis");
}
export function validateSummary(summary: DailySummary): void {
  if (
    !summary ||
    !validDay(summary.day) ||
    summary.source !== "derived" ||
    !summary.algorithmVersion ||
    !summary.subScores ||
    SCORE_KEYS.some((key) => {
      const value = summary.subScores[key];
      return value !== null && (!Number.isFinite(value) || value < 0 || value > 100);
    })
  )
    throw new Error("Resumo diário inválido");
}
export type HealthDay = {
  day: string;
  state: "missing" | "partial" | "complete";
  score: number | null;
};
/** Fixed calendar window. Days before enrollment are excluded, missing enrolled days are zero. */
export function dailyWindow(
  summaries: DailySummary[],
  measurements: Pick<Measurement, "day">[],
  startedOn: string,
  end: string,
): HealthDay[] {
  if (!validDay(startedOn) || !validDay(end) || startedOn > end) return [];
  summaries.forEach(validateSummary);
  const byDay = new Map(summaries.map((summary) => [summary.day, summary]));
  const observed = new Set(measurements.map((measurement) => measurement.day));
  const start = [startedOn, shiftDay(end, -29)].sort().at(-1)!;
  const days: HealthDay[] = [];
  for (let day = start; day <= end; day = shiftDay(day, 1)) {
    const summary = byDay.get(day);
    const complete = summary && SCORE_KEYS.every((key) => summary.subScores[key] !== null);
    const partial = summary || observed.has(day);
    days.push({
      day,
      state: complete ? "complete" : partial ? "partial" : "missing",
      score: complete ? dailyScore(summary.subScores) : partial ? null : 0,
    });
  }
  return days;
}
export function healthStatus(days: HealthDay[], observedDays: string[]) {
  const end = days.at(-1)?.day;
  const activeDays = new Set(observedDays.filter((day) => validDay(day) && end && day <= end)).size;
  const calibrationDays = Math.min(CALIBRATION_DAYS, activeDays);
  const state =
    activeDays === 0
      ? "empty"
      : calibrationDays < CALIBRATION_DAYS
        ? "calibrating"
        : days.some((day) => day.state === "partial")
          ? "partial"
          : "ready";
  const score =
    state === "ready" && days.length
      ? Math.round(days.reduce((sum, day) => sum + (day.score ?? 0), 0) / days.length)
      : null;
  return { state, calibrationDays, score, level: score === null ? null : levelFromScore(score) };
}
/** One mean per day avoids weighting high-frequency sampling more heavily. */
export function personalBaseline(
  measurements: Measurement[],
  metric: "restingHeartRate" | "temperature",
  before: string,
) {
  const start = shiftDay(before, -90);
  const values = new Map<string, { sum: number; count: number }>();
  for (const m of measurements) {
    if (m.metric !== metric || m.day < start || m.day >= before) continue;
    validateMeasurement(m);
    const day = values.get(m.day) ?? { sum: 0, count: 0 };
    day.sum += m.value;
    day.count += 1;
    values.set(m.day, day);
  }
  const means = [...values.values()].map((day) => day.sum / day.count);
  if (means.length < 60) return null;
  const mean = means.reduce((a, b) => a + b, 0) / means.length;
  const stdDev = Math.sqrt(
    means.reduce((sum, value) => sum + (value - mean) ** 2, 0) / means.length,
  );
  return { mean, stdDev, days: means.length };
}
