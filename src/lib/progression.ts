/**
 * Progressão pessoal: histórico de níveis, recordes, insights e avisos.
 * Tudo individual e privado — nenhuma comparação com outros usuários.
 */

import { dailyHistory, levelFromScore, levelScore } from "@/lib/scoring";

export type MonthPoint = { month: string; score: number; level: number };

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Evolução do Score de Nível nos últimos `count` meses (mais antigo primeiro). */
export function levelHistory(count = 9, from = new Date()): MonthPoint[] {
  const current = levelScore(dailyHistory);
  const rnd = seeded(4211);
  const out: MonthPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const drift = i * 34 + Math.round(rnd() * 40 - 20);
    const score = i === 0 ? current : Math.max(120, Math.min(1000, current - drift));
    out.push({
      month: `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      score,
      level: levelFromScore(score),
    });
  }
  return out;
}

export function bestMonth(history: MonthPoint[]): MonthPoint | null {
  return history.reduce<MonthPoint | null>(
    (best, m) => (!best || m.score > best.score ? m : best),
    null,
  );
}

export type PersonalRecord = {
  key: string;
  label: string;
  value: string;
  unit: string;
  date: string;
  icon: string;
  colorVar: string;
  detail: string;
};

export const personalRecords: PersonalRecord[] = [
  {
    key: "steps",
    label: "Mais passos em um dia",
    value: "18.420",
    unit: "passos",
    date: "12/08/2026",
    icon: "directions_walk",
    colorVar: "--activity",
    detail: "Seu recorde anterior era 15.870 passos.",
  },
  {
    key: "sleep",
    label: "Melhor noite de sono",
    value: "94",
    unit: "/100",
    date: "27/07/2026",
    icon: "bedtime",
    colorVar: "--sleep",
    detail: "8h10 de sono com 96% de eficiência.",
  },
  {
    key: "rhr",
    label: "Menor FC de repouso",
    value: "49",
    unit: "bpm",
    date: "03/08/2026",
    icon: "favorite",
    colorVar: "--heart",
    detail: "Sua média dos últimos 30 dias é 56 bpm.",
  },
  {
    key: "run",
    label: "Corrida mais longa",
    value: "14,2",
    unit: "km",
    date: "18/07/2026",
    icon: "directions_run",
    colorVar: "--sport",
    detail: "Ritmo médio de 5'38\"/km.",
  },
  {
    key: "recovery",
    label: "Maior recuperação",
    value: "97",
    unit: "/100",
    date: "22/08/2026",
    icon: "self_improvement",
    colorVar: "--activity",
    detail: "Depois de dois dias de descanso ativo.",
  },
  {
    key: "streak",
    label: "Maior sequência de uso",
    value: "31",
    unit: "dias",
    date: "atual",
    icon: "local_fire_department",
    colorVar: "--sport",
    detail: "Dias seguidos com a BAND sincronizada.",
  },
];

export type Insight = {
  key: string;
  icon: string;
  colorVar: string;
  title: string;
  body: string;
};

/** Correlações observadas no próprio histórico do usuário. */
export const insights: Insight[] = [
  {
    key: "sleep-recovery",
    icon: "insights",
    colorVar: "--sleep",
    title: "Dormir 7h30+ eleva sua recuperação",
    body: "Nas noites com mais de 7h30, sua recuperação no dia seguinte foi em média 14 pontos maior.",
  },
  {
    key: "training-sleep",
    icon: "fitness_center",
    colorVar: "--activity",
    title: "Treino de manhã, sono melhor",
    body: "Quando você treina antes das 10h, seu sono profundo aumenta cerca de 18 minutos.",
  },
  {
    key: "steps-stress",
    icon: "directions_walk",
    colorVar: "--sport",
    title: "Caminhar reduz seu estresse",
    body: "Dias acima de 9.000 passos terminaram com estresse 11% abaixo da sua média.",
  },
  {
    key: "late-meal",
    icon: "bedtime",
    colorVar: "--oxygen",
    title: "Noites curtas pesam no dia seguinte",
    body: "Depois de dormir menos de 6h, sua FC de repouso subiu 5 bpm em média.",
  },
];

export type GentleAlert = {
  key: string;
  icon: string;
  colorVar: string;
  title: string;
  body: string;
};

/** Avisos suaves — bem-estar, nunca diagnóstico médico. */
export const gentleAlerts: GentleAlert[] = [
  {
    key: "rhr-up",
    icon: "monitor_heart",
    colorVar: "--heart",
    title: "FC de repouso um pouco acima do seu padrão",
    body: "Nos últimos 3 dias ela ficou 6 bpm acima da sua baseline. Pode ser cansaço — considere um dia mais leve.",
  },
  {
    key: "sleep-down",
    icon: "bedtime",
    colorVar: "--sleep",
    title: "Seu sono encurtou nesta semana",
    body: "Média de 6h20, contra 7h15 nas semanas anteriores.",
  },
];
