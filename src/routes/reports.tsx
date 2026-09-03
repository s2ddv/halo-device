import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/AppShell";
import { LineChart, MinAvgMax, MultiDaySelector } from "@/components/MetricChart";
import { lastDays, stats, temperatureSeries } from "@/lib/metrics";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Relatórios — HALO" },
      {
        name: "description",
        content:
          "Histórico semanal de batimentos, sono, SpO2, atividades e temperatura corporal da sua pulseira BAND.",
      },
      { property: "og:title", content: "Relatórios — HALO" },
      {
        property: "og:description",
        content: "Histórico semanal de batimentos, sono, SpO2 e temperatura corporal.",
      },
    ],
  }),
  component: Reports,
});

const series = [
  { label: "Frequência cardíaca", unit: "bpm", value: "72", colorVar: "--heart", bars: [60, 72, 68, 80, 74, 66, 71] },
  { label: "Sono", unit: "h", value: "7,4", colorVar: "--sleep", bars: [70, 55, 80, 62, 90, 76, 68] },
  { label: "SpO2", unit: "%", value: "97", colorVar: "--oxygen", bars: [92, 96, 94, 98, 95, 97, 96] },
  { label: "Atividades", unit: "kcal", value: "612", colorVar: "--activity", bars: [40, 62, 88, 54, 70, 95, 60] },
];

const days = ["S", "T", "Q", "Q", "S", "S", "D"];

function Reports() {
  const [tab, setTab] = useState<"resumo" | "temperatura">("resumo");

  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          Últimos 7 dias
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">Relatórios</h1>
      </header>

      <div className="flex rounded-full bg-surface-container-high p-1">
        {(
          [
            { id: "resumo", label: "Resumo" },
            { id: "temperatura", label: "Temperatura" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full py-2.5 font-numeric text-label-caps uppercase tracking-widest transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "temperatura" ? <TemperatureTab /> : <SummaryTab />}
    </div>
  );
}

function TemperatureTab() {
  const dayList = useMemo(() => lastDays(14), []);
  const [selected, setSelected] = useState<string[]>(dayList.slice(-3).map((d) => d.key));
  const chart = useMemo(
    () =>
      dayList
        .filter((d) => selected.includes(d.key))
        .map((d) => ({ key: d.key, points: temperatureSeries(d.key) })),
    [dayList, selected],
  );
  const s = stats(chart.flatMap((c) => c.points));
  const fmt = (v: number) => v.toFixed(1).replace(".", ",");

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].sort(),
    );
  }

  return (
    <>
      <MultiDaySelector days={dayList} selected={selected} onToggle={toggle} />
      {chart.length > 0 && (
        <MinAvgMax
          min={s.min}
          avg={s.avg}
          max={s.max}
          unit="°C"
          colorVar="--cycle"
          format={fmt}
        />
      )}
      <section className="flex flex-col gap-md rounded-xl border border-border bg-card p-md">
        <div className="flex items-center gap-2">
          <Icon name="device_thermostat" className="text-[16px] text-on-surface-variant" />
          <span className="font-numeric text-label-caps text-on-background">
            Temperatura ao longo do dia
          </span>
        </div>
        <LineChart series={chart} colorVar="--cycle" format={fmt} />
      </section>
      <p className="text-body-sm text-on-surface-variant">
        A temperatura da pele varia naturalmente ao longo do dia. Compare vários dias para
        identificar seu padrão pessoal.
      </p>
    </>
  );
}

function SummaryTab() {
  return (
    <>


      <div className="flex flex-col gap-sm">
        {series.map((s) => (
          <section
            key={s.label}
            className="relative flex flex-col gap-md overflow-hidden rounded-xl border border-border bg-card p-md"
          >
            <div
              className="absolute inset-0 z-0 opacity-40"
              style={{
                backgroundImage: `linear-gradient(to bottom, transparent, color-mix(in oklab, var(${s.colorVar}) 18%, transparent))`,
              }}
            />
            <div className="relative z-10 flex items-end justify-between">
              <span className="font-numeric text-label-caps text-on-background">{s.label}</span>
              <div className="flex items-baseline gap-1">
                <span className="font-numeric text-numeric-data text-on-background">{s.value}</span>
                <span className="text-body-sm text-on-surface-variant">{s.unit}</span>
              </div>
            </div>
            <div className="relative z-10 flex h-24 items-end justify-between gap-2">
              {s.bars.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className="w-full rounded-full"
                      style={{
                        height: `${b}%`,
                        backgroundImage: `linear-gradient(to top, color-mix(in oklab, var(${s.colorVar}) 20%, transparent), var(${s.colorVar}))`,
                      }}
                    />
                  </div>
                  <span className="font-numeric text-[10px] text-on-surface-variant">
                    {days[i]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-container-low p-md">
        <Icon name="cloud_done" className="text-[18px] text-on-surface-variant" />
        <span className="text-body-sm text-on-surface-variant">
          Dados salvos no dispositivo e sincronizados quando houver conexão.
        </span>
      </div>
    </div>
  );
}
