import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/AppShell";
import { MetricCard, ScoreRing } from "@/components/health/Visuals";
import { InfoDialog } from "@/components/health/InfoDialog";
import { WorkoutTimer } from "@/components/workout/WorkoutTimer";
import { demoSports } from "@/lib/demo/dashboard";
import { usePreferences } from "@/lib/preferences";

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [
      { title: "Atividades e recordes — HALO" },
      { name: "description", content: "Atividades, metas e recordes pessoais no HALO." },
    ],
  }),
  component: Workout,
});

function Workout() {
  const [showAll, setShowAll] = useState(false);
  const { preferences } = usePreferences();
  return (
    <div className="flex flex-col gap-md px-container-padding pt-md">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-mobile">Atividades</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Seu movimento, todos os dias</p>
        </div>
        <Link
          to="/profile"
          className="icon-button bg-surface-container"
          aria-label="Ajustar metas no perfil"
        >
          <Icon name="tune" />
        </Link>
      </header>
      <div className="page-grid items-start">
        <div className="flex flex-col gap-md">
          <MetricCard color="--heart" className="rounded-[24px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-label-caps uppercase text-on-surface-variant">
                <Icon name="local_fire_department" className="text-heart" />
                Diário · exemplo
              </span>
              <InfoDialog
                title="Atividade diária"
                description="Este anel ilustra uma pontuação de atividade. Os valores abaixo são exemplos; as metas vêm das suas preferências locais."
                trigger={
                  <button
                    type="button"
                    aria-label="Sobre a pontuação diária"
                    className="icon-button bg-white/5"
                  >
                    <Icon name="chevron_right" />
                  </button>
                }
              />
            </div>
            <ScoreRing value={96} label="Excelente" color="--heart" />
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5 text-center">
              {[
                {
                  label: "Passos",
                  value: "12.376",
                  goal: preferences.goals.steps.toLocaleString("pt-BR"),
                },
                { label: "Distância", value: "9,56 km", goal: "Exemplo" },
                { label: "Calorias", value: "564", goal: `${preferences.goals.calories} kcal` },
              ].map((s) => (
                <div key={s.label} className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs text-on-surface-variant">{s.label}</span>
                  <strong className="font-numeric text-lg">{s.value}</strong>
                  <span className="text-xs text-on-surface-variant">
                    {s.goal === "Exemplo" ? s.goal : `/ ${s.goal}`}
                  </span>
                </div>
              ))}
            </div>
          </MetricCard>
          <Link
            to="/activity"
            className="flex min-h-12 items-center justify-between rounded-xl border border-border p-4 text-body-sm"
          >
            Ver atividades detalhadas
            <Icon name="arrow_forward" />
          </Link>
          <WorkoutTimer />
        </div>
        <div className="flex flex-col gap-md">
          <section className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-title-md">Esportes recentes</h2>
              <button
                type="button"
                className="min-h-11 px-2 text-body-sm"
                aria-expanded={showAll}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Ver menos" : "Ver todos"}
              </button>
            </div>
            {demoSports.slice(0, showAll ? 4 : 2).map((s) => (
              <InfoDialog
                key={s.id}
                title={`${s.name} · demonstração`}
                description={`Sessão ilustrativa: ${s.value} ${s.unit} em ${s.duration}. Não foi recebida da sua BAND e não está salva como atividade real.`}
                trigger={
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="icon-button bg-surface-container">
                        <Icon name={s.icon} />
                      </span>
                      <span>
                        <strong className="block text-body-lg font-medium">{s.name}</strong>
                        <span className="text-xs text-on-surface-variant">{s.date} · demo</span>
                      </span>
                    </span>
                    <span className="text-right">
                      <strong className="block font-numeric text-lg">
                        {s.value} <small className="text-xs font-normal">{s.unit}</small>
                      </strong>
                      <span className="text-xs text-on-surface-variant">{s.duration}</span>
                    </span>
                  </button>
                }
              />
            ))}
          </section>
          <Link
            to="/progress"
            className="flex items-center justify-between gap-3 rounded-[20px] border border-border bg-surface-container-high p-5"
          >
            <div>
              <h2 className="flex items-center gap-2 font-display text-title-md">
                <Icon name="emoji_events" />
                Quebre seus recordes
              </h2>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Acompanhe sua evolução sem comparação com outras pessoas.
              </p>
            </div>
            <Icon name="arrow_forward" />
          </Link>
        </div>
      </div>
    </div>
  );
}
