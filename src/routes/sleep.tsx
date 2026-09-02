import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { sleepSubScore } from "@/lib/scoring";

export const Route = createFileRoute("/sleep")({
  head: () => ({
    meta: [
      { title: "Qualidade do sono — Vital" },
      {
        name: "description",
        content:
          "Avaliação detalhada da qualidade do descanso: duração, eficiência e fases do sono (leve, profundo e REM).",
      },
      { property: "og:title", content: "Qualidade do sono — Vital" },
      {
        property: "og:description",
        content: "Duração, eficiência e fases do sono medidas pela sua BAND.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SleepPage,
});

const night = {
  durationHours: 7.4,
  deepMinutes: 92,
  remMinutes: 88,
  lightMinutes: 244,
  awakeMinutes: 20,
  efficiency: 91,
  bedtime: "23h42",
  wakeup: "07h06",
};

const phases = [
  { key: "Profundo", minutes: night.deepMinutes, colorVar: "--sleep", ideal: "20-25%" },
  { key: "REM", minutes: night.remMinutes, colorVar: "--oxygen", ideal: "20-25%" },
  { key: "Leve", minutes: night.lightMinutes, colorVar: "--activity", ideal: "45-55%" },
  { key: "Acordado", minutes: night.awakeMinutes, colorVar: "--heart", ideal: "< 5%" },
];

const total = phases.reduce((a, p) => a + p.minutes, 0);
const score = sleepSubScore(night);

const week = [72, 64, 81, 58, 88, 79, score];
const days = ["S", "T", "Q", "Q", "S", "S", "D"];

function fmt(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function SleepPage() {
  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          Última noite · {night.bedtime} – {night.wakeup}
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">Qualidade do sono</h1>
      </header>

      <section className="relative flex flex-col gap-md overflow-hidden rounded-xl border border-border bg-card p-md">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-sleep/15" />
        <div className="relative z-10 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="font-numeric text-label-caps text-on-background">Pontuação do descanso</span>
            <span className="text-body-sm text-on-surface-variant">
              {night.durationHours.toString().replace(".", ",")} h dormidas ·{" "}
              {night.efficiency}% de eficiência
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-numeric text-numeric-data text-on-background">{score}</span>
            <span className="text-body-sm text-on-surface-variant">/100</span>
          </div>
        </div>

        <div className="relative z-10 flex h-3 w-full overflow-hidden rounded-full">
          {phases.map((p) => (
            <div
              key={p.key}
              style={{ width: `${(p.minutes / total) * 100}%`, background: `var(${p.colorVar})` }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col gap-sm">
          {phases.map((p) => (
            <div key={p.key} className="flex items-center gap-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: `var(${p.colorVar})` }}
              />
              <span className="flex-1 text-body-sm text-on-background">{p.key}</span>
              <span className="font-numeric text-body-sm text-on-background">{fmt(p.minutes)}</span>
              <span className="w-14 text-right font-numeric text-[10px] text-on-surface-variant">
                {Math.round((p.minutes / total) * 100)}% · {p.ideal}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps text-on-background">Últimos 7 dias</span>
        <div className="flex h-24 items-end justify-between gap-2">
          {week.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end">
                <div
                  className="w-full rounded-full"
                  style={{
                    height: `${v}%`,
                    backgroundImage:
                      "linear-gradient(to top, color-mix(in oklab, var(--sleep) 20%, transparent), var(--sleep))",
                  }}
                />
              </div>
              <span className="font-numeric text-[10px] text-on-surface-variant">{days[i]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps text-on-background">Como melhorar</span>
        {[
          { icon: "schedule", text: "Deitar sempre no mesmo horário aumenta o sono profundo." },
          { icon: "coffee", text: "Sem cafeína depois das 16h — REM agradece." },
          { icon: "dark_mode", text: "Quarto mais frio ajuda a reduzir despertares." },
        ].map((t) => (
          <div key={t.text} className="flex items-start gap-sm">
            <Icon name={t.icon} className="text-[18px] text-on-surface-variant" />
            <span className="flex-1 text-body-sm text-on-background">{t.text}</span>
          </div>
        ))}
      </section>

      <p className="pb-md text-[11px] leading-4 text-on-surface-variant/70">
        Estimativas de bem-estar baseadas nos sensores da BAND, sem finalidade diagnóstica.
      </p>
    </div>
  );
}
