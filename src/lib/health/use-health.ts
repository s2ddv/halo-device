import { useEffect, useState } from "react";
import { dailyWindow, healthStatus, localDay, SCORE_KEYS } from "./model";
import { readHealthOverview, subscribeHealth } from "./storage";
import type { HealthOverview } from "./storage";

export function useHealth() {
  const [data, setData] = useState<HealthOverview>({
    measurementCount: 0,
    observedDays: [],
    summaries: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(() => localDay(new Date()));
  useEffect(() => {
    let active = true;
    let generation = 0;
    const refresh = async () => {
      const current = ++generation;
      try {
        const next = await readHealthOverview();
        if (active && current === generation) {
          setData(next);
          setError(null);
          setToday(localDay(new Date()));
        }
      } catch (cause) {
        if (active && current === generation)
          setError(cause instanceof Error ? cause.message : "Falha ao ler o histórico local.");
      } finally {
        if (active && current === generation) setLoading(false);
      }
    };
    void refresh();
    let scheduled: number | undefined;
    const unsubscribe = subscribeHealth(() => {
      scheduled ??= window.setTimeout(() => {
        scheduled = undefined;
        void refresh();
      }, 500);
    });
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(interval);
      window.clearTimeout(scheduled);
    };
  }, []);
  const observedDays = [
    ...data.observedDays,
    ...data.summaries
      .filter((s) => SCORE_KEYS.some((key) => s.subScores[key] !== null))
      .map((s) => s.day),
  ];
  const start = observedDays.filter((day) => day <= today).sort()[0] ?? today;
  const days = dailyWindow(
    data.summaries,
    data.observedDays.map((day) => ({ day })),
    start,
    today,
  );
  return { ...data, days, status: healthStatus(days, observedDays), error, loading };
}
