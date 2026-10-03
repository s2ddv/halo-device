import { useDetailPeriod } from "@/lib/demo/use-detail-period";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MetricCard, ScoreRing } from "@/components/health/Visuals";
import { BreathingExercise } from "@/components/metrics/BreathingExercise";
import {
  DetailLayout,
  SummaryNumbers,
  TrendCard,
  DistributionCard,
  MetricNote,
} from "@/components/metrics/DetailLayout";
import { detailSeries, summarize, distribution } from "@/lib/demo/detail";
export const Route = createFileRoute("/stress")({
  head: () => ({ meta: [{ title: "Nível de estresse — HALO" }] }),
  component: StressPage,
});
function StressPage() {
  const controls = useDetailPeriod();
  const points = detailSeries("stress", controls.period, controls.day);
  const s = summarize(points);
  const rows = distribution(points, [
    { label: "Relaxado · 0–29", min: 0, max: 29, color: "--oxygen" },
    { label: "Equilibrado · 30–59", min: 30, max: 59, color: "--sleep" },
    { label: "Moderado · 60–79", min: 60, max: 79, color: "--sport" },
    { label: "Alto · 80–100", min: 80, max: 100, color: "--heart" },
  ]);
  return (
    <DetailLayout
      title="Nível de estresse"
      eyebrow="Bem-estar & recuperação"
      color="--oxygen"
      controls={controls}
    >
      <div className="page-grid items-start">
        <MetricCard color="--oxygen">
          <p className="text-xs uppercase tracking-widest text-on-surface-variant">
            Pontuação média · demonstração
          </p>
          <ScoreRing value={Math.round(s.avg)} label="Índice ilustrativo" color="--oxygen" />
          <p className="text-body-sm text-on-surface-variant">
            Os índices exemplificam a visualização do Stitch. Não há leitura validada de estresse ou
            sincronização ativa.
          </p>
        </MetricCard>
        <div className="flex flex-col gap-md">
          <SummaryNumbers
            items={[
              {
                label: "Média",
                value: Math.round(s.avg).toString(),
                unit: "pontos",
                icon: "equalizer",
              },
              { label: "Mínimo", value: String(s.min), unit: "pontos", icon: "arrow_downward" },
              { label: "Máximo", value: String(s.max), unit: "pontos", icon: "arrow_upward" },
            ]}
          />
          <TrendCard
            title="Variação ao longo do tempo"
            eyebrow="Cronograma do período"
            points={points}
            color="--oxygen"
          />
        </div>
      </div>
      <DistributionCard title="Estados de estresse" rows={rows} />
      <MetricNote title="Pausa de 3 minutos" icon="air">
        <p className="mb-4">
          Use um guia de respiração com ritmo visual. O exercício funciona independentemente da BAND
          e não promete mudanças em métricas.
        </p>
        <BreathingExercise />
      </MetricNote>
      <Link to="/recovery" className="min-h-11 rounded-xl border border-border p-4 text-body-sm">
        Ver recuperação e contexto pessoal →
      </Link>
    </DetailLayout>
  );
}
