import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/AppShell";
import { LineChart, MinAvgMax, SingleDaySelector } from "@/components/MetricChart";
import { heartRateSeries, lastDays, stats } from "@/lib/metrics";

export const Route = createFileRoute("/heart-rate")({
  head: () => ({
    meta: [
      { title: "Frequência cardíaca — HALO" },
      {
        name: "description",
        content:
          "Veja a variação da sua frequência cardíaca ao longo do dia, com mínima, média e máxima medidas pela BAND.",
      },
      { property: "og:title", content: "Frequência cardíaca — HALO" },
      {
        property: "og:description",
        content: "Gráfico diário de batimentos com mínima, média e máxima.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HeartRatePage,
});

function HeartRatePage() {
  const days = useMemo(() => lastDays(14), []);
  const [selected, setSelected] = useState(days[days.length - 1]!.key);
  const points = useMemo(() => heartRateSeries(selected), [selected]);
  const s = stats(points);
  const day = days.find((d) => d.key === selected);

  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          {day?.label}
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">
          Frequência cardíaca
        </h1>
      </header>

      <SingleDaySelector days={days} selected={selected} onSelect={setSelected} />

      <MinAvgMax min={s.min} avg={s.avg} max={s.max} unit="bpm" colorVar="--heart" />

      <section className="flex flex-col gap-md rounded-xl border border-border bg-card p-md">
        <div className="flex items-center gap-2">
          <Icon name="favorite" className="text-[16px] text-heart" />
          <span className="font-numeric text-label-caps text-on-background">
            Variação ao longo do dia
          </span>
        </div>
        <LineChart series={[{ key: selected, points }]} colorVar="--heart" />
      </section>

      <p className="text-body-sm text-on-surface-variant">
        Escolha um dia por vez para acompanhar como seus batimentos variaram hora a hora.
      </p>
    </div>
  );
}
