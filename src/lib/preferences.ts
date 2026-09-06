/**
 * Preferências pessoais: metas customizáveis e Modo Foco.
 * Persistidas localmente (privadas, nunca compartilhadas).
 */

import { useEffect, useState } from "react";

export type FocusMode = "none" | "sleep" | "stress" | "activity" | "recovery";

export type Goals = {
  steps: number;
  calories: number;
  workoutMinutes: number;
  sleepHours: number;
};

export const DEFAULT_GOALS: Goals = {
  steps: 10000,
  calories: 700,
  workoutMinutes: 45,
  sleepHours: 8,
};

export const GOAL_META: {
  key: keyof Goals;
  label: string;
  unit: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  colorVar: string;
}[] = [
  { key: "steps", label: "Passos por dia", unit: "passos", icon: "directions_walk", min: 2000, max: 25000, step: 500, colorVar: "--activity" },
  { key: "calories", label: "Calorias ativas", unit: "kcal", icon: "local_fire_department", min: 200, max: 1500, step: 25, colorVar: "--sport" },
  { key: "workoutMinutes", label: "Minutos de treino", unit: "min", icon: "fitness_center", min: 10, max: 180, step: 5, colorVar: "--heart" },
  { key: "sleepHours", label: "Horas de sono", unit: "h", icon: "bedtime", min: 5, max: 10, step: 0.5, colorVar: "--sleep" },
];

/** Métricas destacadas por cada Modo Foco. */
export const FOCUS_META: Record<
  Exclude<FocusMode, "none">,
  { label: string; icon: string; colorVar: string; description: string; highlight: string[] }
> = {
  sleep: {
    label: "Dormir melhor",
    icon: "bedtime",
    colorVar: "--sleep",
    description: "Sono e recuperação ganham destaque na tela inicial.",
    highlight: ["sleep", "recovery"],
  },
  stress: {
    label: "Reduzir estresse",
    icon: "self_improvement",
    colorVar: "--activity",
    description: "Recuperação, estresse e frequência cardíaca em primeiro plano.",
    highlight: ["recovery", "heart"],
  },
  activity: {
    label: "Mais atividade",
    icon: "directions_run",
    colorVar: "--sport",
    description: "Atividades e recordes esportivos aparecem primeiro.",
    highlight: ["activity", "sport"],
  },
  recovery: {
    label: "Melhorar recuperação",
    icon: "monitor_heart",
    colorVar: "--heart",
    description: "Recuperação, sono e oxigenação em destaque.",
    highlight: ["recovery", "sleep", "spo2"],
  },
};

export type Preferences = { goals: Goals; focus: FocusMode };

export const DEFAULT_PREFERENCES: Preferences = { goals: DEFAULT_GOALS, focus: "none" };

const STORAGE_KEY = "halo:preferences";
const EVENT = "halo:preferences-changed";

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      goals: { ...DEFAULT_GOALS, ...(parsed.goals ?? {}) },
      focus: parsed.focus ?? "none",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(next: Preferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Lê as preferências apenas depois da hidratação (evita divergência no SSR). */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPrefs(readPreferences());
    const sync = () => setPrefs(readPreferences());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    preferences: prefs,
    setGoal(key: keyof Goals, value: number) {
      const next = { ...prefs, goals: { ...prefs.goals, [key]: value } };
      setPrefs(next);
      writePreferences(next);
    },
    setFocus(focus: FocusMode) {
      const next = { ...prefs, focus };
      setPrefs(next);
      writePreferences(next);
    },
    resetGoals() {
      const next = { ...prefs, goals: DEFAULT_GOALS };
      setPrefs(next);
      writePreferences(next);
    },
  };
}
