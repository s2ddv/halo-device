import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Recuperação e estresse — Vital" },
      {
        name: "description",
        content:
          "Pontuações de 0 a 100 para o nível de estresse e a capacidade de recuperação do seu corpo, medidas pela BAND.",
      },
      { property: "og:title", content: "Recuperação e estresse — Vital" },
      {
        property: "og:description",
        content: "Veja como seu corpo está se recuperando e qual seu nível de estresse hoje.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoveryPage,
});

const recovery = 78;
const stress = 32;

const hourly = [22, 28, 45, 61, 38, 30, 26, 41, 55, 34, 29, 24];

function Ring({ value, label, colorVar }: { value: number; label: string; colorVar: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="10"
            stroke={`color-mix(in oklab, var(${colorVar}) 20%, transparent)`}
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke={`var(${colorVar})`}
            strokeDasharray={`${(c * value) / 100} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-numeric text-numeric-data leading-none text-on-background">
            {value}
          </span>
          <span className="font-numeric text-[10px] text-on-surface-variant">de 100</span>
        </div>
      </div>
      <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

function RecoveryPage() {
  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <header className="flex flex-col gap-1">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          Hoje
        </span>
        <h1 className="font-display text-headline-mobile text-on-background">
          Recuperação e estresse
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          Duas pontuações de 0 a 100 para você entender se o corpo está pronto para acelerar ou
          pedindo um respiro.
        </p>
      </header>

      <section className="flex gap-sm rounded-xl border border-border bg-card p-md">
        <Ring value={recovery} label="Recuperação" colorVar="--activity" />
        <Ring value={stress} label="Estresse" colorVar="--heart" />
      </section>

      <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps text-on-background">Estresse ao longo do dia</span>
        <div className="flex h-24 items-end gap-1">
          {hourly.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: `${Math.max(8, v)}%`,
                backgroundImage:
                  "linear-gradient(to top, color-mix(in oklab, var(--heart) 20%, transparent), var(--heart))",
              }}
            />
          ))}
        </div>
        <span className="text-body-sm text-on-surface-variant">
          Pico às 15h — provavelmente carga de trabalho. Respirações lentas ajudam a baixar rápido.
        </span>
      </section>

      <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps text-on-background">O que fazer agora</span>
        {[
          { icon: "bolt", text: "Recuperação alta: dá pra treinar forte hoje." },
          { icon: "self_improvement", text: "5 min de respiração baixam o estresse em média 8 pontos." },
          { icon: "bedtime", text: "Dormir 30 min mais cedo sobe sua recuperação de amanhã." },
        ].map((t) => (
          <div key={t.text} className="flex items-start gap-sm">
            <Icon name={t.icon} className="text-[18px] text-on-surface-variant" />
            <span className="flex-1 text-body-sm text-on-background">{t.text}</span>
          </div>
        ))}
      </section>

      <p className="pb-md text-[11px] leading-4 text-on-surface-variant/70">
        Vital é um app de bem-estar. As pontuações são orientações motivacionais e não substituem
        avaliação médica.
      </p>
    </div>
  );
}
