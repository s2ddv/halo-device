import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/AppShell";
import { HealthDataStatus } from "@/components/HealthDataStatus";
import { BandPanel } from "@/components/profile/BandPanel";
import { SettingsPanel } from "@/components/profile/SettingsPanel";
import { ScorePanel } from "@/components/profile/ScorePanel";
import { InfoDialog } from "@/components/health/InfoDialog";
import { usePreferences } from "@/lib/preferences";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Meu perfil — HALO" },
      {
        name: "description",
        content: "Dispositivo, metas pessoais, privacidade e histórico local no HALO.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [tab, setTab] = useState<"perfil" | "pontuacao" | "config">("perfil");
  const [scoreTab, setScoreTab] = useState<"hoje" | "ranking">("hoje");
  const { preferences } = usePreferences();
  return (
    <div className="flex flex-col gap-md px-container-padding pt-md">
      <header>
        <h1 className="font-display text-headline-mobile">Meu perfil</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">Seu espaço de cuidado pessoal</p>
      </header>
      <div className="segmented-control" aria-label="Seção do perfil">
        {(
          [
            { id: "perfil", label: "Perfil" },
            { id: "pontuacao", label: "Pontuação" },
            { id: "config", label: "Preferências" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {/* Keep the device panel mounted when changing tabs, preserving the connection. */}
      <div
        hidden={tab !== "perfil"}
        className={tab === "perfil" ? "flex flex-col gap-md" : undefined}
      >
        <section className="flex flex-col items-center gap-3 py-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high ring-1 ring-border">
            <Icon name="person" className="text-[40px]" />
          </div>
          <h2 className="font-display text-headline-mobile">Seu perfil HALO</h2>
          <div className="flex gap-2">
            <span className="rounded-full bg-surface-container-high px-3 py-1.5 text-xs">
              Pessoal
            </span>
            <span className="rounded-full border border-border px-3 py-1.5 text-xs">
              Neste navegador
            </span>
          </div>
        </section>
        <div className="page-grid items-start">
          <div className="flex flex-col gap-md">
            <h2 className="font-display text-title-md">Dispositivos conectados</h2>
            <BandPanel />
            <HealthDataStatus />
          </div>
          <div className="flex flex-col gap-md">
            <h2 className="font-display text-title-md">Metas de saúde</h2>
            <div className="grid grid-cols-2 gap-sm">
              {[
                {
                  label: "Passos diários",
                  value: preferences.goals.steps.toLocaleString("pt-BR"),
                  unit: "passos / dia",
                  icon: "directions_run",
                  color: "text-activity",
                },
                {
                  label: "Meta de sono",
                  value: preferences.goals.sleepHours.toLocaleString("pt-BR"),
                  unit: "horas / noite",
                  icon: "bedtime",
                  color: "text-sleep",
                },
              ].map((goal) => (
                <button
                  type="button"
                  key={goal.label}
                  onClick={() => setTab("config")}
                  className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left"
                  aria-label={`Editar ${goal.label}`}
                >
                  <span className="flex w-full items-center justify-between">
                    <Icon name={goal.icon} className={goal.color} />
                    <Icon name="edit" className="text-[16px] text-on-surface-variant" />
                  </span>
                  <span className="text-body-sm">{goal.label}</span>
                  <strong className="font-numeric text-2xl">{goal.value}</strong>
                  <span className="text-xs text-on-surface-variant">{goal.unit}</span>
                </button>
              ))}
            </div>
            <Link
              to="/progress"
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5"
            >
              <span className="flex items-center gap-3">
                <Icon name="trending_up" />
                Minha progressão
              </span>
              <Icon name="chevron_right" />
            </Link>
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-title-md">Conta e privacidade</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {[
                  {
                    title: "Privacidade dos dados",
                    icon: "shield",
                    description:
                      "O histórico real fica no IndexedDB deste navegador. Não há conta, backup automático nem envio à nuvem. Apagar os dados do site remove o histórico local.",
                  },
                  {
                    title: "Integrações",
                    icon: "sync",
                    description:
                      "Apple Health, Health Connect e serviços externos ainda não estão integrados. A conexão Bluetooth experimental está disponível nesta página.",
                  },
                  {
                    title: "Sobre o HALO",
                    icon: "help",
                    description:
                      "O HALO acompanha bem-estar e progresso pessoal. As telas demonstrativas não descrevem sua saúde. A conexão proprietária da BAND está em validação e não fornece sono ou recuperação automaticamente.",
                  },
                ].map((item) => (
                  <InfoDialog
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    trigger={
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 border-b border-border p-4 text-left last:border-0"
                      >
                        <Icon name={item.icon} className="text-on-surface-variant" />
                        <span className="flex-1 text-body-sm">{item.title}</span>
                        <Icon name="chevron_right" className="text-[18px]" />
                      </button>
                    }
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      {tab === "pontuacao" && (
        <>
          <p className="text-body-sm text-on-surface-variant">
            Demonstração da pontuação. Para medições reais, consulte o histórico na aba Perfil.
          </p>
          <ScorePanel scoreTab={scoreTab} onScoreTab={setScoreTab} />
        </>
      )}
      {tab === "config" && <SettingsPanel />}
    </div>
  );
}
