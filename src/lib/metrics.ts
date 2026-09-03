/**
 * Dados de demonstração determinísticos para as telas de métricas.
 * Cada dia gera séries estáveis (mesmo resultado a cada render).
 */

export type Point = { t: string; v: number };

export type DayInfo = { key: string; label: string; short: string; weekday: number };

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(str: string): number {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 2147483647;
  return h;
}

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

export function formatShort(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

/** Últimos `count` dias, do mais antigo para o mais recente. */
export function lastDays(count: number, from = new Date()): DayInfo[] {
  const out: DayInfo[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ key, label: formatDayLabel(key), short: formatShort(key), weekday: d.getDay() });
  }
  return out;
}

function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}h`;
}

/** Série intradiária de frequência cardíaca (24 pontos). */
export function heartRateSeries(key: string): Point[] {
  const rnd = seeded(hash(key + "hr"));
  return Array.from({ length: 24 }, (_, h) => {
    const circadian = h < 6 ? -12 : h < 10 ? 4 : h < 14 ? 8 : h < 19 ? 12 : h < 22 ? 2 : -8;
    const v = 66 + circadian + Math.round(rnd() * 14 - 6);
    return { t: hourLabel(h), v: Math.max(48, Math.min(160, v)) };
  });
}

/** Série de SpO2 de um dia (12 pontos, a cada 2h). */
export function spo2Series(key: string): Point[] {
  const rnd = seeded(hash(key + "spo2"));
  return Array.from({ length: 12 }, (_, i) => {
    const v = 96 + Math.round(rnd() * 3) - (i < 3 ? 1 : 0);
    return { t: hourLabel(i * 2), v: Math.max(90, Math.min(100, v)) };
  });
}

/** Série de temperatura corporal de um dia (12 pontos, a cada 2h). */
export function temperatureSeries(key: string): Point[] {
  const rnd = seeded(hash(key + "temp"));
  return Array.from({ length: 12 }, (_, i) => {
    const circadian = i < 3 ? -0.35 : i < 6 ? -0.1 : i < 9 ? 0.2 : 0.05;
    const v = 36.5 + circadian + (rnd() * 0.4 - 0.2);
    return { t: hourLabel(i * 2), v: Math.round(v * 10) / 10 };
  });
}

export function stats(points: Point[]) {
  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  return { min, max, avg };
}

/* ---------- Heatmap de atividade (estilo GitHub) ---------- */

export type ActivityDay = {
  key: string;
  label: string;
  level: 0 | 1 | 2 | 3 | 4;
  events: { time: string; icon: string; title: string; detail: string }[];
};

const EVENT_POOL: { icon: string; title: string; detail: string }[] = [
  { icon: "fitness_center", title: "Treino concluído", detail: "Força · 42 min · 380 kcal" },
  { icon: "directions_run", title: "Corrida registrada", detail: "5,2 km · ritmo 5'42\"/km" },
  { icon: "military_tech", title: "Subiu de nível", detail: "Novo nível no ranking HALO" },
  { icon: "bedtime", title: "Sono sincronizado", detail: "7h20 · eficiência 92%" },
  { icon: "sync", title: "Sincronização da BAND", detail: "Dados enviados para a nuvem" },
  { icon: "favorite", title: "Marco de saúde", detail: "FC de repouso no melhor valor do mês" },
  { icon: "air", title: "SpO2 estável", detail: "Média de 97% durante todo o dia" },
];

/** Últimas `weeks` semanas de atividade, agrupadas por semana (domingo a sábado). */
export function activityHeatmap(weeks = 20, from = new Date()): ActivityDay[][] {
  const end = new Date(from);
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const grid: ActivityDay[][] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const week: ActivityDay[] = [];
    for (let i = 0; i < 7; i++) {
      if (cursor > end) break;
      const key = dayKey(cursor);
      const rnd = seeded(hash(key + "act"));
      const roll = rnd();
      const level: ActivityDay["level"] =
        roll < 0.14 ? 0 : roll < 0.38 ? 1 : roll < 0.65 ? 2 : roll < 0.87 ? 3 : 4;
      const count = level === 0 ? 0 : level + 1;
      const events = Array.from({ length: count }, (_, i2) => {
        const pick = EVENT_POOL[Math.floor(rnd() * EVENT_POOL.length)] ?? EVENT_POOL[0]!;
        const hour = 21 - i2 * 3 - Math.floor(rnd() * 2);
        return { time: `${String(Math.max(6, hour)).padStart(2, "0")}:00`, ...pick };
      });
      week.push({ key, label: formatDayLabel(key), level, events });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

export const HEATMAP_LEVEL_OPACITY: Record<number, number> = {
  0: 0.07,
  1: 0.3,
  2: 0.5,
  3: 0.75,
  4: 1,
};
