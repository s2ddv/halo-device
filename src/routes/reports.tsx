import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/AppShell";
import { MetricCard, Sparkline } from "@/components/health/Visuals";
import { SleepReport } from "@/components/health/SleepReport";
import { detailSeries, summarize } from "@/lib/demo/detail";
export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios de saúde — HALO" }] }),
  component: Reports,
});
function Reports() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const hr = detailSeries("heart", period, "2026-10-01");
  const oxygen = detailSeries("oxygen", period, "2026-10-01");
  const temperature = detailSeries("temperature", period, "2026-10-01");
  const stress = detailSeries("stress", period, "2026-10-01");
  const steps = detailSeries("steps", period, "2026-10-01");
  return (
    <div className="flex flex-col gap-md px-container-padding pt-md">
      <header>
        <h1 className="font-display text-headline-mobile">Relatórios de saúde</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Seu panorama · período demonstrativo
        </p>
      </header>
      <div className="segmented-control" aria-label="Período do relatório">
        <button type="button" aria-pressed={period === "week"} onClick={() => setPeriod("week")}>
          Semanal
        </button>
        <button type="button" aria-pressed={period === "month"} onClick={() => setPeriod("month")}>
          Mensal
        </button>
      </div>
      <div className="page-grid items-start">
        <SleepReport period={period} />
        <div className="grid grid-cols-2 gap-sm">
          {[
            {
              to: "/heart-rate",
              title: "Freq. cardíaca",
              icon: "favorite",
              color: "--heart",
              points: hr,
              unit: "bpm",
              decimals: 0,
            },
            {
              to: "/spo2",
              title: "Saturação SpO₂",
              icon: "water_drop",
              color: "--oxygen",
              points: oxygen,
              unit: "%",
              decimals: 1,
            },
          ].map((m) => (
            <Link key={m.to} to={m.to} className="min-w-0 rounded-[20px]">
              <MetricCard color={m.color} className="h-full !p-4">
                <Icon name={m.icon} className="mb-2 text-[20px]" />
                <h2 className="text-xs text-on-surface-variant">{m.title}</h2>
                <p className="mt-4 font-numeric text-3xl font-bold">
                  {summarize(m.points).avg.toFixed(m.decimals).replace(".", ",")}
                  <small className="ml-1 text-xs font-normal">{m.unit}</small>
                </p>
                <p className="my-2 text-[11px] text-on-surface-variant">
                  Mín {summarize(m.points).min} · Máx {summarize(m.points).max}
                </p>
                <Sparkline values={m.points.map((p) => p.v)} color={m.color} />
              </MetricCard>
            </Link>
          ))}
          <Link to="/activity" className="col-span-2 rounded-[20px]">
            <MetricCard color="--activity" className="!p-4">
              <h2 className="flex items-center gap-2 font-display text-title-md">
                <Icon name="directions_run" />
                Atividades físicas
              </h2>
              <div className="my-4 flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs text-on-surface-variant">Passos no período</p>
                  <strong className="font-numeric text-2xl">
                    {summarize(steps).total.toLocaleString("pt-BR")}
                  </strong>
                </div>
                <span className="text-xs text-activity">Ver detalhes →</span>
              </div>
              <div
                className="flex h-16 items-end gap-1.5"
                role="img"
                aria-label="Passos demonstrativos por dia"
              >
                {steps.map((p) => (
                  <span
                    key={p.t}
                    className="flex-1 rounded-t-sm bg-activity"
                    style={{ height: `${(p.v / summarize(steps).max) * 100}%` }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">
                {steps.length} dias · dados de exemplo
              </p>
            </MetricCard>
          </Link>
        </div>
      </div>
      <div className="page-grid">
        {[
          {
            to: "/temperature",
            title: "Temperatura",
            icon: "thermostat",
            color: "--activity",
            points: temperature,
            unit: "°C",
            decimals: 1,
          },
          {
            to: "/stress",
            title: "Nível de estresse",
            icon: "psychology",
            color: "--oxygen",
            points: stress,
            unit: "/ 100",
            decimals: 0,
          },
        ].map((m) => (
          <Link key={m.to} to={m.to} className="rounded-[20px]">
            <MetricCard color={m.color}>
              <h2 className="flex items-center gap-2 text-body-sm">
                <Icon name={m.icon} />
                {m.title}
              </h2>
              <p className="my-3 font-numeric text-numeric-data">
                {summarize(m.points).avg.toFixed(m.decimals).replace(".", ",")}{" "}
                <small className="text-body-sm font-normal">{m.unit}</small>
              </p>
              <Sparkline values={m.points.map((p) => p.v)} color={m.color} />
              <p className="mt-3 text-xs text-on-surface-variant">
                Média ilustrativa · ver análise →
              </p>
            </MetricCard>
          </Link>
        ))}
      </div>
      <MetricCard>
        <h2 className="font-display text-title-md">Ecossistema HALO</h2>
        <p className="my-3 text-body-sm text-on-surface-variant">
          Conheça as visualizações do seu dispositivo. Sensores, autonomia e sincronização dependem
          de validação e integração; a prévia não comprova essas capacidades.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/sleep"
            className="flex min-h-11 items-center gap-2 rounded-full border border-border px-3 text-xs"
          >
            <Icon name="favorite" className="text-[16px]" />
            VFC / HRV · exemplo
          </Link>
          <Link
            to="/profile"
            className="flex min-h-11 items-center gap-2 rounded-full border border-border px-3 text-xs"
          >
            <Icon name="bluetooth" className="text-[16px]" />
            Dispositivo e conexão
          </Link>
          <Link
            to="/progress"
            className="flex min-h-11 items-center gap-2 rounded-full border border-border px-3 text-xs"
          >
            <Icon name="trending_up" className="text-[16px]" />
            Progressão pessoal
          </Link>
        </div>
      </MetricCard>
    </div>
  );
}
