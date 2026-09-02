/**
 * Sistema de pontuação Vital.
 * Camadas: sub-scores diários (0-100) -> score diário (0-1000)
 * -> score de nível (média móvel 30 dias) -> nível público (0-10).
 */

export type SubScoreKey =
  | "recovery"
  | "sleep"
  | "spo2"
  | "heartRate"
  | "activity"
  | "temperature";

export const SUB_SCORE_META: Record<
  SubScoreKey,
  { label: string; weight: number; icon: string; colorVar: string }
> = {
  recovery: { label: "Recuperação e estresse", weight: 0.25, icon: "self_improvement", colorVar: "--activity" },
  sleep: { label: "Sono", weight: 0.25, icon: "bedtime", colorVar: "--sleep" },
  spo2: { label: "Oxigênio (SpO2)", weight: 0.15, icon: "air", colorVar: "--oxygen" },
  heartRate: { label: "Frequência cardíaca", weight: 0.15, icon: "favorite", colorVar: "--heart" },
  activity: { label: "Atividade", weight: 0.15, icon: "directions_run", colorVar: "--sport" },
  temperature: { label: "Temperatura corporal", weight: 0.05, icon: "device_thermostat", colorVar: "--cycle" },
};

export const CALIBRATION_DAYS = 14;
export const RANKING_WINDOW = 30;
export const MIN_ACTIVE_DAYS = 20;

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

/** SpO2: 95-100% é faixa saudável; abaixo disso cai rápido. */
export function spo2SubScore(spo2: number): number {
  if (spo2 >= 97) return 100;
  if (spo2 >= 95) return 85 + (spo2 - 95) * 7.5;
  return clamp(85 - (95 - spo2) * 12);
}

/** Sono: duração + tempo em profundo/REM + eficiência. */
export function sleepSubScore(input: {
  durationHours: number;
  deepMinutes: number;
  remMinutes: number;
  efficiency: number; // 0-100
}): number {
  const duration = clamp((input.durationHours / 8) * 100);
  const totalMinutes = Math.max(1, input.durationHours * 60);
  const deepRatio = ((input.deepMinutes + input.remMinutes) / totalMinutes) * 100;
  const phases = clamp((deepRatio / 40) * 100);
  return Math.round(duration * 0.4 + phases * 0.3 + clamp(input.efficiency) * 0.3);
}

/** Atividade: % das metas diárias, com teto para não incentivar excesso. */
export function activitySubScore(input: {
  steps: number;
  stepsGoal: number;
  calories: number;
  caloriesGoal: number;
  workoutMinutes: number;
  workoutGoal: number;
}): number {
  const pct = (v: number, goal: number) => clamp((v / Math.max(1, goal)) * 100);
  return Math.round(
    pct(input.steps, input.stepsGoal) * 0.4 +
      pct(input.calories, input.caloriesGoal) * 0.35 +
      pct(input.workoutMinutes, input.workoutGoal) * 0.25,
  );
}

/** Desvio da baseline pessoal (FC de repouso e temperatura). */
export function baselineSubScore(
  value: number,
  baseline: number,
  stdDev: number,
  penalty = 18,
): number {
  if (!stdDev) return 100;
  const deviation = Math.abs((value - baseline) / stdDev);
  return Math.round(clamp(100 - deviation * penalty));
}

export function dailyScore(subScores: Record<SubScoreKey, number | null>): number {
  const keys = Object.keys(SUB_SCORE_META) as SubScoreKey[];
  const missing = keys.some((k) => subScores[k] == null);
  if (missing) return 0; // dia sem uso do dispositivo
  return Math.round(
    keys.reduce((acc, k) => acc + (subScores[k] as number) * SUB_SCORE_META[k].weight, 0) * 10,
  );
}

export function levelScore(dailyScores: number[]): number {
  const window = dailyScores.slice(-RANKING_WINDOW);
  if (!window.length) return 0;
  return Math.round(window.reduce((a, b) => a + b, 0) / window.length);
}

const LEVEL_RANGES: Array<[number, number]> = [
  [0, 99],
  [100, 199],
  [200, 299],
  [300, 399],
  [400, 499],
  [500, 599],
  [600, 699],
  [700, 799],
  [800, 874],
  [875, 949],
  [950, 1000],
];

export function levelFromScore(score: number): number {
  for (let i = LEVEL_RANGES.length - 1; i >= 0; i--) {
    const range = LEVEL_RANGES[i];
    if (range && score >= range[0]) return i;
  }
  return 0;
}

export function levelProgress(score: number): {
  level: number;
  min: number;
  max: number;
  pct: number;
  toNext: number;
} {
  const level = levelFromScore(score);
  const [min, max] = LEVEL_RANGES[level] ?? [0, 99];
  const pct = Math.round(((score - min) / (max - min + 1)) * 100);
  return { level, min, max, pct, toNext: level === 10 ? 0 : max + 1 - score };
}

export function isRanked(activeDays: number): boolean {
  return activeDays >= MIN_ACTIVE_DAYS;
}

export const LEVEL_COLORS: Record<number, string> = {
  0: "var(--on-surface-variant)",
  1: "var(--oxygen)",
  2: "var(--oxygen)",
  3: "var(--sleep)",
  4: "var(--sleep)",
  5: "var(--activity)",
  6: "var(--activity)",
  7: "var(--sport)",
  8: "var(--sport)",
  9: "var(--heart)",
  10: "var(--heart)",
};

// ---------- Dados de demonstração (substituíveis por dados reais da BAND) ----------

function seeded(i: number) {
  return (Math.sin(i * 12.9898) * 43758.5453) % 1;
}

export const todaySubScores: Record<SubScoreKey, number> = {
  recovery: 78,
  sleep: sleepSubScore({ durationHours: 7.4, deepMinutes: 92, remMinutes: 88, efficiency: 91 }),
  spo2: Math.round(spo2SubScore(97)),
  heartRate: baselineSubScore(58, 56, 3.4),
  activity: activitySubScore({
    steps: 8420,
    stepsGoal: 10000,
    calories: 612,
    caloriesGoal: 700,
    workoutMinutes: 35,
    workoutGoal: 45,
  }),
  temperature: baselineSubScore(36.6, 36.5, 0.25),
};

export const dailyHistory: number[] = Array.from({ length: 30 }, (_, i) => {
  const noise = Math.abs(seeded(i + 1));
  const missed = i === 6 || i === 19;
  if (missed) return 0;
  return Math.round(620 + i * 4 + noise * 90);
});

export const activeDaysLast30 = dailyHistory.filter((d) => d > 0).length;

export const leaderboard = [
  { name: "Marina R.", score: 921, position: 1 },
  { name: "Caio F.", score: 884, position: 2 },
  { name: "Lu Andrade", score: 851, position: 3 },
  { name: "Samuel", score: levelScore(dailyHistory), position: 12, isMe: true },
  { name: "Bia M.", score: 690, position: 13 },
  { name: "Pedro L.", score: 654, position: 14 },
].sort((a, b) => b.score - a.score);
