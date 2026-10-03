import { useState, type ReactNode } from "react";
import type { useDetailPeriod } from "@/lib/demo/use-detail-period";
import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { LineChart } from "@/components/MetricChart";
import { MetricCard } from "@/components/health/Visuals";
import { demoCsv, type Period } from "@/lib/demo/detail";
import type { Point } from "@/lib/metrics";

export function DetailLayout({
  title,
  eyebrow,
  color,
  controls,
  children,
}: {
  title: string;
  eyebrow: string;
  color: string;
  controls: ReturnType<typeof useDetailPeriod>;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-md px-container-padding pt-md">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Link
            to="/"
            className="mb-3 inline-flex min-h-11 items-center gap-1 text-xs text-on-surface-variant"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Painel de saúde
          </Link>
          <p className="text-xs uppercase tracking-widest" style={{ color: `var(${color})` }}>
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-headline-mobile md:text-headline-lg">{title}</h1>
        </div>
      </header>
      <div className="segmented-control" aria-label="Período">
        {(
          [
            { id: "day", label: "Dia" },
            { id: "week", label: "Semana" },
            { id: "month", label: "Mês" },
          ] as const
        ).map((p) => (
          <button
            type="button"
            key={p.id}
            aria-pressed={controls.period === p.id}
            onClick={() => controls.setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-on-surface-variant">
          Dados de demonstração ·{" "}
          {controls.period === "day"
            ? "24 amostras horárias"
            : controls.period === "week"
              ? "7 médias diárias"
              : "30 médias diárias"}
        </span>
        <label className="flex items-center gap-2 text-xs">
          Data de referência
          <input
            aria-label="Data de referência"
            type="date"
            value={controls.day}
            onChange={(e) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) controls.setDay(e.target.value);
            }}
            className="min-h-11 min-w-0 rounded-lg border border-border bg-card px-2"
          />
        </label>
      </div>
      {children}
    </div>
  );
}
export function SummaryNumbers({
  items,
}: {
  items: { label: string; value: string; unit: string; icon: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-on-surface-variant">
            <span>{item.label}</span>
            <Icon name={item.icon} className="text-[16px]" />
          </div>
          <p className="mt-3 font-numeric text-xl font-bold sm:text-2xl">{item.value}</p>
          <p className="text-xs text-on-surface-variant">{item.unit}</p>
        </div>
      ))}
    </div>
  );
}
export function TrendCard({
  title,
  eyebrow,
  points,
  color,
  format,
}: {
  title: string;
  eyebrow: string;
  points: Point[];
  color: string;
  format?: (v: number) => string;
}) {
  return (
    <MetricCard color={color}>
      <p className="text-xs uppercase tracking-widest text-on-surface-variant">{eyebrow}</p>
      <h2 className="mb-5 mt-2 font-display text-title-md">{title}</h2>
      <LineChart
        series={[{ key: title, points }]}
        colorVar={color}
        {...(format ? { format } : {})}
      />
    </MetricCard>
  );
}
export function DistributionCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; color: string; pct: number; count: number }[];
}) {
  return (
    <MetricCard>
      <p className="text-xs uppercase tracking-widest text-on-surface-variant">
        Distribuição das amostras
      </p>
      <h2 className="mb-5 mt-2 font-display text-title-md">{title}</h2>
      <div className="flex flex-col gap-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex justify-between gap-3 text-body-sm">
              <span>{row.label}</span>
              <strong className="font-numeric">{row.pct}%</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div
                style={{ width: `${row.pct}%`, background: `var(${row.color})` }}
                className="h-full rounded-full"
              />
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">{row.count} amostras de exemplo</p>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
export function MetricNote({
  title,
  children,
  icon = "info",
}: {
  title: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <section className="flex items-start gap-3 rounded-xl border border-border bg-surface-container-low p-5">
      <Icon name={icon} className="text-on-surface-variant" />
      <div>
        <h2 className="font-display text-title-md">{title}</h2>
        <div className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">{children}</div>
      </div>
    </section>
  );
}
export function ExportDemo({
  metric,
  controls,
  points,
}: {
  metric: string;
  controls: ReturnType<typeof useDetailPeriod>;
  points: Point[];
}) {
  const [message, setMessage] = useState("");
  function download() {
    const blob = new Blob([demoCsv(metric, controls.period, controls.day, points)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `halo-demo-${metric}-${controls.day}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Arquivo demonstrativo exportado em CSV.");
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={download}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border p-4 text-body-sm"
      >
        <Icon name="file_download" />
        Exportar dados demonstrativos
      </button>
      <p role="status" className="text-xs text-on-surface-variant">
        {message}
      </p>
    </div>
  );
}
