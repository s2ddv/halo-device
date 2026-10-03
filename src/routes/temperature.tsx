import { useDetailPeriod } from "@/lib/demo/use-detail-period";
import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { MetricCard } from "@/components/health/Visuals";
import {
  DetailLayout,
  SummaryNumbers,
  TrendCard,
  DistributionCard,
  MetricNote,
  ExportDemo,
} from "@/components/metrics/DetailLayout";
import { detailSeries, summarize, distribution } from "@/lib/demo/detail";
export const Route = createFileRoute("/temperature")({
  head: () => ({ meta: [{ title: "Temperatura — HALO" }] }),
  component: TemperaturePage,
});
function TemperaturePage() {
  const controls = useDetailPeriod();
  const points = detailSeries("temperature", controls.period, controls.day);
  const s = summarize(points);
  const fmt = (v: number) => v.toFixed(1).replace(".", ",");
  const rows = distribution(points, [
    { label: "Acima de 37,2 °C", min: 37.21, max: 100, color: "--heart" },
    { label: "36,0–37,2 °C", min: 36, max: 37.2, color: "--activity" },
    { label: "Abaixo de 36,0 °C", min: 0, max: 35.99, color: "--sleep" },
  ]);
  return (
    <DetailLayout
      title="Temperatura"
      eyebrow="Variação térmica & biometria"
      color="--activity"
      controls={controls}
    >
      <div className="page-grid items-start">
        <MetricCard color="--activity">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant">
              Última amostra · demo
            </span>
            <Icon name="device_thermostat" className="text-activity" />
          </div>
          <p className="my-6 font-numeric text-[64px] font-bold leading-none">
            {fmt(points.at(-1)!.v)}
            <span className="ml-2 text-title-md text-on-surface-variant">°C</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-2 text-xs">
              Basal pessoal indisponível
            </span>
            <span className="rounded-full bg-surface-container-high px-3 py-2 text-xs">
              Sensor não integrado
            </span>
          </div>
          <p className="mt-5 text-body-sm text-on-surface-variant">
            A medição da pele não equivale à temperatura corporal central. A origem e a calibração
            precisam ser validadas.
          </p>
        </MetricCard>
        <TrendCard
          title="Curva térmica"
          eyebrow="Flutuação ao longo do período"
          points={points}
          color="--activity"
          format={fmt}
        />
      </div>
      <SummaryNumbers
        items={[
          { label: "Média", value: fmt(s.avg), unit: "°C", icon: "thermostat" },
          { label: "Mínimo", value: fmt(s.min), unit: "°C", icon: "bedtime" },
          { label: "Máximo", value: fmt(s.max), unit: "°C", icon: "local_fire_department" },
        ]}
      />
      <DistributionCard title="Composição por faixa térmica" rows={rows} />
      <MetricNote title="Ritmo térmico pessoal" icon="psychology">
        As faixas e a curva são demonstrações visuais. Não indicam febre, inflamação ou fase do
        sono. Comparações com a linha basal exigem histórico suficiente e uma fonte de temperatura
        validada.
      </MetricNote>
      <ExportDemo metric="temperature" controls={controls} points={points} />
    </DetailLayout>
  );
}
