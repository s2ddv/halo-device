import { activitySubScore, baselineSubScore, sleepSubScore, spo2SubScore } from "../scoring";
import type { SubScoreKey } from "../scoring";

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
