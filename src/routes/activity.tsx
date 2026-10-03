import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { MetricCard, ScoreRing } from "@/components/health/Visuals";
import {
  DetailLayout,
  useDetailPeriod,
  TrendCard,
  MetricNote,
  ExportDemo,
} from "@/components/metrics/DetailLayout";
import { detailSeries, summarize } from "@/lib/demo/detail";
import { usePreferences } from "@/lib/preferences";
export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Atividades detalhadas — HALO" }] }),
  component: ActivityPage,
});
function ActivityPage() {
  const controls = useDetailPeriod();
  const { preferences } = usePreferences();
  const steps = detailSeries("steps", controls.period, controls.day);
  const calories = detailSeries("calories", controls.period, controls.day);
  const stepSummary = summarize(steps);
  const calorieSummary = summarize(calories);
  const days = controls.period === "day" ? 1 : controls.period === "week" ? 7 : 30;
  const completion = Math.min(
    100,
    Math.round((stepSummary.total / (preferences.goals.steps * days)) * 100),
  );
  return (
    <DetailLayout
      title="Atividades físicas"
      eyebrow="Performance & movimento"
      color="--activity"
      controls={controls}
    >
      <div className="page-grid items-start">
        <MetricCard color="--activity">
          <p className="text-xs uppercase tracking-widest text-on-surface-variant">
            Meta de passos · exemplo
          </p>
          <ScoreRing value={completion} label="% da meta no período" color="--activity" />
          <p className="text-body-sm text-on-surface-variant">
            Progresso calculado com passos demonstrativos e sua meta local. Não representa um
            recorde biológico.
          </p>
        </MetricCard>
        <MetricCard>
          <h2 className="font-display text-title-md">Métricas principais</h2>
          <div className="mt-5 flex flex-col gap-5">
            {[
              {
                label: "Passos",
                value: stepSummary.total.toLocaleString("pt-BR"),
                unit: `/ ${(preferences.goals.steps * days).toLocaleString("pt-BR")} no período`,
                icon: "directions_walk",
                c: "--activity",
              },
              {
                label: "Calorias",
                value: calorieSummary.total.toLocaleString("pt-BR"),
                unit: `kcal · meta ${preferences.goals.calories * days}`,
                icon: "local_fire_department",
                c: "--heart",
              },
              {
                label: "Distância",
                value: (9.56 * days).toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
                unit: "km · exemplo",
                icon: "straighten",
                c: "--oxygen",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-3 border-b border-border pb-4 last:border-0"
              >
                <Icon name={m.icon} className="text-[24px]" />
                <div>
                  <p className="text-body-sm">{m.label}</p>
                  <p className="font-numeric text-numeric-data" style={{ color: `var(${m.c})` }}>
                    {m.value}
                  </p>
                  <p className="text-xs text-on-surface-variant">{m.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </MetricCard>
      </div>
      <div className="page-grid">
        <TrendCard
          title="Distribuição de passos"
          eyebrow="Movimento no período"
          points={steps}
          color="--activity"
        />
        <TrendCard
          title="Gasto calórico"
          eyebrow="Calorias de exemplo"
          points={calories}
          color="--heart"
        />
      </div>
      {controls.period === "day" && (
        <MetricCard>
          <h2 className="font-display text-title-md">Quilometragem por período</h2>
          <p className="mb-4 mt-1 text-xs text-on-surface-variant">
            Sessões de demonstração · 9,56 km no total
          </p>
          {[
            { name: "Corrida matinal", time: "07:15–08:00", value: "5,20", icon: "directions_run" },
            {
              name: "Caminhada no almoço",
              time: "12:30–13:00",
              value: "1,80",
              icon: "directions_walk",
            },
            { name: "Pedal noturno", time: "18:10–18:45", value: "2,56", icon: "directions_bike" },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-3 border-t border-border py-4">
              <Icon name={s.icon} />
              <div className="flex-1">
                <p className="text-body-sm">{s.name}</p>
                <p className="text-xs text-on-surface-variant">{s.time}</p>
              </div>
              <span className="font-numeric">
                {s.value} <small>km</small>
              </span>
            </div>
          ))}
        </MetricCard>
      )}
      <MetricNote title="Metas e constância" icon="emoji_events">
        A meta acompanha o período selecionado. Edite os objetivos no perfil e acompanhe sua
        progressão pessoal, sem comparação social.
      </MetricNote>
      <div className="flex flex-wrap gap-3">
        <Link to="/workout" className="primary-button">
          Esportes e cronômetro
        </Link>
        <Link to="/profile" className="min-h-12 rounded-xl border border-border p-3">
          Editar metas
        </Link>
      </div>
      <ExportDemo metric="steps" controls={controls} points={steps} />
    </DetailLayout>
  );
}
