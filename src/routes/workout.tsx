import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [
      { title: "Treinos — Vital" },
      {
        name: "description",
        content: "Inicie treinos, acompanhe passos, calorias e recordes esportivos com a BAND.",
      },
      { property: "og:title", content: "Treinos — Vital" },
      {
        property: "og:description",
        content: "Passos, calorias, tempo ativo e recordes esportivos.",
      },
    ],
  }),
  component: Workout,
});

const stats = [
  { icon: "footprint", label: "Passos", value: "8.412", colorVar: "--activity" },
  { icon: "local_fire_department", label: "Calorias", value: "612", colorVar: "--heart" },
  { icon: "timer", label: "Tempo ativo", value: "54 min", colorVar: "--sport" },
];

const sports = [
  { icon: "directions_run", name: "Corrida", record: "5 km — 26:altura".replace("altura", "12") },
  { icon: "directions_bike", name: "Ciclismo", record: "18,4 km — 48:30" },
  { icon: "pool", name: "Natação", record: "1.200 m — 32:05" },
  { icon: "fitness_center", name: "Força", record: "12 séries — 41:00" },
];

function Workout() {
  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          Hoje
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">Treinos</h1>
      </header>

      <div className="grid grid-cols-3 gap-sm">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-md"
          >
            <Icon name={s.icon} className="text-[18px]" />
            <span className="font-numeric text-[10px] text-on-surface-variant">{s.label}</span>
            <span className="font-numeric text-title-md text-on-background">{s.value}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-numeric text-label-caps uppercase tracking-widest text-primary-foreground transition-transform active:scale-[0.98]"
      >
        <Icon name="play_arrow" className="text-[18px]" />
        Iniciar treino
      </button>

      <h2 className="font-display text-title-md text-on-background">Recordes esportivos</h2>
      <div className="flex flex-col gap-sm">
        {sports.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-md rounded-xl border border-border bg-card p-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
              <Icon name={s.icon} className="text-[18px] text-sport" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-display text-body-lg text-on-background">{s.name}</span>
              <span className="text-body-sm text-on-surface-variant">{s.record}</span>
            </div>
            <Icon name="chevron_right" className="text-[16px] text-on-surface-variant" />
          </div>
        ))}
      </div>
    </div>
  );
}
