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
export const Route = createFileRoute("/spo2")({
  head: () => ({ meta: [{ title: "Oxigênio no sangue — HALO" }] }),
  component: OxygenPage,
});
function OxygenPage() {
  const controls = useDetailPeriod();
  const points = detailSeries("oxygen", controls.period, controls.day);
  const s = summarize(points);
  const rows = distribution(points, [
    { label: "98–100%", min: 98, max: 100, color: "--oxygen" },
    { label: "95–97%", min: 95, max: 97, color: "--sleep" },
    { label: "Abaixo de 95%", min: 0, max: 94, color: "--activity" },
  ]);
  return (
    <DetailLayout
      title="Oxigênio no sangue"
      eyebrow="Respiratório & biometria"
      color="--oxygen"
      controls={controls}
    >
      <div className="page-grid items-start">
        <MetricCard color="--oxygen">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant">
              Última amostra · demo
            </span>
            <Icon name="water_drop" className="text-oxygen" />
          </div>
          <p className="my-6 font-numeric text-[72px] font-bold leading-none">
            {points.at(-1)?.v}
            <span className="ml-2 text-title-md text-on-surface-variant">%</span>
          </p>
          <p className="text-body-sm leading-relaxed text-on-surface-variant">
            Visualização de saturação SpO₂. Os valores são exemplos do layout e não uma avaliação da
            sua oxigenação.
          </p>
        </MetricCard>
        <TrendCard
          title={controls.period === "day" ? "Distribuição contínua · 24h" : "SpO₂ no período"}
          eyebrow="Biomonitoramento"
          points={points}
          color="--oxygen"
        />
      </div>
      <SummaryNumbers
        items={[
          {
            label: "Média",
            value: s.avg.toFixed(1).replace(".", ","),
            unit: "%",
            icon: "equalizer",
          },
          { label: "Mínimo", value: String(s.min), unit: "%", icon: "arrow_downward" },
          { label: "Máximo", value: String(s.max), unit: "%", icon: "arrow_upward" },
        ]}
      />
      <DistributionCard title="Composição da saturação" rows={rows} />
      <MetricNote title="Oxigenação noturna" icon="bedtime">
        O gráfico inclui valores ilustrativos mais baixos durante a noite. Sem uma fonte validada,
        não é possível atribuí-los a fases do sono ou concluir que uma variação é segura. Nenhum
        alerta clínico é produzido por esta prévia.
      </MetricNote>
      <ExportDemo metric="spo2" controls={controls} points={points} />
    </DetailLayout>
  );
}
