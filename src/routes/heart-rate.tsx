import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { MetricCard, Sparkline } from "@/components/health/Visuals";
import {
  DetailLayout,
  useDetailPeriod,
  SummaryNumbers,
  TrendCard,
  DistributionCard,
  MetricNote,
  ExportDemo,
} from "@/components/metrics/DetailLayout";
import { detailSeries, summarize, distribution } from "@/lib/demo/detail";
export const Route = createFileRoute("/heart-rate")({
  head: () => ({ meta: [{ title: "Frequência cardíaca — HALO" }] }),
  component: HeartRatePage,
});
function HeartRatePage() {
  const controls = useDetailPeriod();
  const points = detailSeries("heart", controls.period, controls.day);
  const summary = summarize(points);
  const zones = distribution(points, [
    { label: "Faixa 5 · ≥160 bpm", min: 160, max: 999, color: "--heart" },
    { label: "Faixa 4 · 140–159 bpm", min: 140, max: 159, color: "--activity" },
    { label: "Faixa 3 · 120–139 bpm", min: 120, max: 139, color: "--sport" },
    { label: "Faixa 2 · 100–119 bpm", min: 100, max: 119, color: "--oxygen" },
    { label: "Faixa 1 · <100 bpm", min: 0, max: 99, color: "--sleep" },
  ]);
  return (
    <DetailLayout
      title="Frequência cardíaca"
      eyebrow="Cardiovascular & ritmo"
      color="--heart"
      controls={controls}
    >
      <div className="page-grid items-start">
        <div className="flex flex-col gap-md">
          <MetricCard color="--heart">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant">
                Última amostra · demo
              </span>
              <Icon name="favorite" className="text-heart" />
            </div>
            <p className="my-6 font-numeric text-[64px] font-bold leading-none">
              {points.at(-1)?.v}
              <span className="ml-2 text-body-lg font-normal text-on-surface-variant">bpm</span>
            </p>
            <Sparkline values={points.map((p) => p.v)} color="--heart" />
            <p className="mt-3 text-body-sm text-on-surface-variant">
              Exemplo de leitura. Não há sensor transmitindo nesta tela.
            </p>
          </MetricCard>
          <SummaryNumbers
            items={[
              {
                label: "Média",
                value: Math.round(summary.avg).toString(),
                unit: "bpm",
                icon: "show_chart",
              },
              { label: "Mínimo", value: String(summary.min), unit: "bpm", icon: "arrow_downward" },
              { label: "Máximo", value: String(summary.max), unit: "bpm", icon: "arrow_upward" },
            ]}
          />
        </div>
        <TrendCard
          title={controls.period === "day" ? "Frequência em 24h" : "Médias no período"}
          eyebrow="Ritmo ao longo do tempo"
          points={points}
          color="--heart"
        />
      </div>
      <MetricNote title="FC em repouso (RHR)" icon="bedtime">
        Uma leitura instantânea não é sua frequência cardíaca de repouso. A linha de base pessoal
        depende de histórico validado; ainda não está disponível nesta demonstração.
      </MetricNote>
      <DistributionCard title="Faixas de frequência cardíaca" rows={zones} />
      <p className="text-xs text-on-surface-variant">
        Faixas ilustrativas do design. Percentuais representam amostras, não tempo em exercício nem
        zonas personalizadas.
      </p>
      <ExportDemo metric="heart-rate" controls={controls} points={points} />
    </DetailLayout>
  );
}
