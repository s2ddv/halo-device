import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Icon } from "@/components/AppShell";
import { LineChart } from "@/components/MetricChart";
import {
  bestMonth,
  gentleAlerts,
  insights,
  levelHistory,
  personalRecords,
} from "@/lib/progression";
import { levelProgress } from "@/lib/scoring";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progressão — HALO" },
      {
        name: "description",
        content:
          "Sua jornada pessoal no HALO: histórico de níveis, recordes pessoais, insights do seu próprio histórico e avisos suaves.",
      },
      { property: "og:title", content: "Progressão — HALO" },
      {
        property: "og:description",
        content: "Histórico de níveis, recordes pessoais e insights privados da sua evolução.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

function Progress() {
  const history = useMemo(() => levelHistory(9), []);
  const best = bestMonth(history);
  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  const delta = current && previous ? current.score - previous.score : 0;
  const progress = levelProgress(current?.score ?? 0);

  const chart = useMemo(
    () => [{ key: "levels", points: history.map((m) => ({ t: m.month, v: m.score })) }],
    [history],
  );

  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          Só você contra você
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">Progressão</h1>
      </header>

      {/* Nível atual */}
      <section className="flex flex-col gap-md rounded-xl border border-border bg-card p-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-numeric text-label-caps text-on-surface-variant">
              Nível atual
            </span>
            <span className="font-display text-display-lg leading-none text-on-background">
              {progress.level}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-numeric text-numeric-data text-on-background">
              {current?.score ?? 0}
            </span>
            <span
              className="font-numeric text-[10px]"
              style={{ color: delta >= 0 ? "var(--activity)" : "var(--heart)" }}
            >
              {delta >= 0 ? "+" : ""}
              {delta} vs mês anterior
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(4, progress.pct)}%` }}
            />
          </div>
          <span className="text-body-sm text-on-surface-variant">
            {progress.toNext > 0
              ? `Faltam ${progress.toNext} pontos para o nível ${progress.level + 1}.`
              : "Você está no nível máximo."}
          </span>
        </div>
      </section>

      {/* Histórico de níveis */}
      <section className="flex flex-col gap-md rounded-xl border border-border bg-card p-md">
        <div className="flex items-center gap-2">
          <Icon name="timeline" className="text-[16px] text-on-surface-variant" />
          <span className="font-numeric text-label-caps text-on-background">
            Histórico de níveis
          </span>
        </div>
        <LineChart series={chart} colorVar="--activity" />
        <div className="flex flex-wrap gap-1.5">
          {history.map((m) => (
            <div
              key={m.month}
              className="flex flex-col items-center rounded-lg bg-surface-container-high px-2 py-1.5"
            >
              <span className="font-numeric text-[13px] text-on-background">Nv {m.level}</span>
              <span className="font-numeric text-[9px] text-on-surface-variant">{m.month}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Melhor mês */}
      {best && (
        <section className="flex items-center gap-md rounded-xl border border-border bg-surface-container-low p-md">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "color-mix(in oklab, var(--sport) 22%, transparent)" }}
          >
            <Icon name="trophy" className="text-[20px] text-sport" />
          </div>
          <div className="flex flex-col">
            <span className="font-numeric text-label-caps text-on-surface-variant">Melhor mês</span>
            <span className="text-body-lg text-on-background">
              {best.month} · nível {best.level} ({best.score} pts)
            </span>
          </div>
        </section>
      )}

      {/* Recordes pessoais */}
      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-mobile text-on-background">Recordes pessoais</h2>
        <div className="grid grid-cols-2 gap-sm">
          {personalRecords.map((r) => (
            <div
              key={r.key}
              className="relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-md"
            >
              <div
                className="absolute inset-0 z-0 opacity-40"
                style={{
                  backgroundImage: `linear-gradient(to bottom, transparent, color-mix(in oklab, var(${r.colorVar}) 16%, transparent))`,
                }}
              />
              <span className="relative z-10" style={{ color: `var(${r.colorVar})` }}>
                <Icon name={r.icon} className="text-[18px]" />
              </span>
              <div className="relative z-10 flex items-baseline gap-1">
                <span className="font-numeric text-numeric-data text-on-background">{r.value}</span>
                <span className="text-body-sm text-on-surface-variant">{r.unit}</span>
              </div>
              <span className="relative z-10 text-body-sm text-on-background">{r.label}</span>
              <span className="relative z-10 font-numeric text-[10px] text-on-surface-variant">
                {r.date}
              </span>
              <span className="relative z-10 text-[11px] leading-snug text-on-surface-variant">
                {r.detail}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Insights */}
      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-mobile text-on-background">
          Insights do seu histórico
        </h2>
        {insights.map((i) => (
          <div
            key={i.key}
            className="flex gap-md rounded-xl border border-border bg-card p-md"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: `color-mix(in oklab, var(${i.colorVar}) 22%, transparent)` }}
            >
              <Icon name={i.icon} className="text-[18px]" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-body-lg text-on-background">{i.title}</span>
              <span className="text-body-sm text-on-surface-variant">{i.body}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Avisos suaves */}
      <section className="flex flex-col gap-sm">
        <h2 className="font-display text-headline-mobile text-on-background">Fique de olho</h2>
        {gentleAlerts.map((a) => (
          <div
            key={a.key}
            className="flex gap-md rounded-xl border p-md"
            style={{
              borderColor: `color-mix(in oklab, var(${a.colorVar}) 35%, transparent)`,
              background: `color-mix(in oklab, var(${a.colorVar}) 10%, transparent)`,
            }}
          >
            <Icon name={a.icon} className="mt-0.5 shrink-0 text-[18px]" />
            <div className="flex flex-col gap-1">
              <span className="text-body-lg text-on-background">{a.title}</span>
              <span className="text-body-sm text-on-surface-variant">{a.body}</span>
            </div>
          </div>
        ))}
        <p className="text-body-sm text-on-surface-variant">
          O HALO é um app de bem-estar e não faz diagnóstico médico. Em caso de dúvida, procure um
          profissional de saúde.
        </p>
      </section>
    </div>
  );
}
