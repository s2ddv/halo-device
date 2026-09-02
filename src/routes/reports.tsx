import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Relatórios — Vital" },
      {
        name: "description",
        content:
          "Histórico semanal de batimentos, sono, SpO2 e ciclo sincronizado da sua pulseira BAND.",
      },
      { property: "og:title", content: "Relatórios — Vital" },
      {
        property: "og:description",
        content: "Histórico semanal de batimentos, sono, SpO2 e ciclo.",
      },
    ],
  }),
  component: Reports,
});

const series = [
  { label: "Frequência cardíaca", unit: "bpm", value: "72", colorVar: "--heart", bars: [60, 72, 68, 80, 74, 66, 71] },
  { label: "Sono", unit: "h", value: "7,4", colorVar: "--sleep", bars: [70, 55, 80, 62, 90, 76, 68] },
  { label: "SpO2", unit: "%", value: "97", colorVar: "--oxygen", bars: [92, 96, 94, 98, 95, 97, 96] },
  { label: "Atividades", unit: "kcal", value: "612", colorVar: "--activity", bars: [40, 62, 88, 54, 70, 95, 60] },
];

const days = ["S", "T", "Q", "Q", "S", "S", "D"];

function Reports() {
  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          Últimos 7 dias
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">Relatórios</h1>
      </header>

      <div className="flex flex-col gap-sm">
        {series.map((s) => (
          <section
            key={s.label}
            className="relative flex flex-col gap-md overflow-hidden rounded-xl border border-border bg-card p-md"
          >
            <div
              className="absolute inset-0 z-0 opacity-40"
              style={{
                backgroundImage: `linear-gradient(to bottom, transparent, color-mix(in oklab, var(${s.colorVar}) 18%, transparent))`,
              }}
            />
            <div className="relative z-10 flex items-end justify-between">
              <span className="font-numeric text-label-caps text-on-background">{s.label}</span>
              <div className="flex items-baseline gap-1">
                <span className="font-numeric text-numeric-data text-on-background">{s.value}</span>
                <span className="text-body-sm text-on-surface-variant">{s.unit}</span>
              </div>
            </div>
            <div className="relative z-10 flex h-24 items-end justify-between gap-2">
              {s.bars.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end">
                    <div
                      className="w-full rounded-full"
                      style={{
                        height: `${b}%`,
                        backgroundImage: `linear-gradient(to top, color-mix(in oklab, var(${s.colorVar}) 20%, transparent), var(${s.colorVar}))`,
                      }}
                    />
                  </div>
                  <span className="font-numeric text-[10px] text-on-surface-variant">
                    {days[i]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-container-low p-md">
        <Icon name="cloud_done" className="text-[18px] text-on-surface-variant" />
        <span className="text-body-sm text-on-surface-variant">
          Dados salvos no dispositivo e sincronizados quando houver conexão.
        </span>
      </div>
    </div>
  );
}
