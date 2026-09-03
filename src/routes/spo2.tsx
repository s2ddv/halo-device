import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/AppShell";
import { LineChart, MinAvgMax, MultiDaySelector } from "@/components/MetricChart";
import { lastDays, spo2Series, stats } from "@/lib/metrics";

export const Route = createFileRoute("/spo2")({
  head: () => ({
    meta: [
      { title: "Oxigenação do sangue — HALO" },
      {
        name: "description",
        content:
          "Acompanhe sua saturação de oxigênio (SpO2) com mínima, média e máxima e compare vários dias no mesmo gráfico.",
      },
      { property: "og:title", content: "Oxigenação do sangue — HALO" },
      {
        property: "og:description",
        content: "SpO2 mínima, média e máxima com gráfico temporal por dia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Spo2Page,
});

function Spo2Page() {
  const days = useMemo(() => lastDays(14), []);
  const [selected, setSelected] = useState<string[]>(days.slice(-3).map((d) => d.key));

  const series = useMemo(
    () =>
      days
        .filter((d) => selected.includes(d.key))
        .map((d) => ({ key: d.key, points: spo2Series(d.key) })),
    [days, selected],
  );
  const s = stats(series.flatMap((x) => x.points));

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].sort(),
    );
  }

  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          {selected.length} dia{selected.length === 1 ? "" : "s"} selecionado
          {selected.length === 1 ? "" : "s"}
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">Oxigenação</h1>
      </header>

      <MultiDaySelector days={days} selected={selected} onToggle={toggle} />

      {series.length > 0 ? (
        <MinAvgMax min={s.min} avg={s.avg} max={s.max} unit="%" colorVar="--oxygen" />
      ) : null}

      <section className="flex flex-col gap-md rounded-xl border border-border bg-card p-md">
        <div className="flex items-center gap-2">
          <Icon name="air" className="text-[16px] text-oxygen" />
          <span className="font-numeric text-label-caps text-on-background">SpO2 ao longo do dia</span>
        </div>
        <LineChart series={series} colorVar="--oxygen" />
      </section>

      <p className="text-body-sm text-on-surface-variant">
        Entre 95% e 100% é a faixa considerada saudável. Toque nos dias para incluir ou remover do
        gráfico.
      </p>
    </div>
  );
}
