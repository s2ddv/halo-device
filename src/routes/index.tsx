import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { FOCUS_META, usePreferences } from "@/lib/preferences";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HALO — Painel de saúde da sua BAND" },
      {
        name: "description",
        content:
          "Acompanhe health score, frequência cardíaca, sono, atividades e SpO2 medidos pela sua pulseira BAND.",
      },
      { property: "og:title", content: "HALO — Painel de saúde da sua BAND" },
      {
        property: "og:description",
        content: "Health score, batimentos, sono, atividades e SpO2 em um só painel.",
      },
    ],
  }),
  component: Dashboard,
});

function CardHeader({ label, date }: { label: string; date: string }) {
  return (
    <div className="relative z-10 flex w-full items-start justify-between">
      <div className="flex flex-col">
        <span className="mb-xs font-numeric text-label-caps text-on-background">{label}</span>
        <span className="font-numeric text-[10px] text-on-surface-variant/60">{date}</span>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-on-background backdrop-blur-md">
        <Icon name="chevron_right" className="text-[16px]" />
      </div>
    </div>
  );
}

function CardFooter({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative z-10 mt-auto flex w-full flex-col gap-1">
      <span className="font-display text-headline-mobile text-on-background">{title}</span>
      <span className="text-body-sm text-on-surface-variant">{subtitle}</span>
    </div>
  );
}

function Gauge({
  value,
  label,
  arc,
  colorVar,
}: {
  value: string;
  label: string;
  arc: string;
  colorVar: string;
}) {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-4">
      <div className="relative flex h-20 w-32 justify-center overflow-hidden">
        <svg className="absolute top-0 h-32 w-32" viewBox="0 0 100 100">
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke={`color-mix(in oklab, var(${colorVar}) 20%, transparent)`}
            strokeLinecap="round"
            strokeWidth="12"
          />
          <path
            d={arc}
            fill="none"
            stroke={`var(${colorVar})`}
            strokeLinecap="round"
            strokeWidth="12"
          />
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="font-numeric text-[28px] font-bold leading-none text-on-background">
            {value}
          </span>
          <span
            className="mt-1 font-numeric text-[10px]"
            style={{ color: `var(${colorVar})` }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

const cardBase =
  "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-md shadow-lg transition-transform active:scale-[0.98]";

function Glow({ colorVar }: { colorVar: string }) {
  return (
    <div
      className="absolute inset-0 z-0 opacity-50"
      style={{
        backgroundImage: `linear-gradient(to bottom, transparent, color-mix(in oklab, var(${colorVar}) 20%, transparent))`,
      }}
    />
  );
}

function Dashboard() {
  const { preferences } = usePreferences();
  const highlight =
    preferences.focus === "none" ? null : FOCUS_META[preferences.focus].highlight;
  const em = (key: string) =>
    highlight ? (highlight.includes(key) ? "ring-1 ring-primary/40" : "opacity-45") : "";

  return (
    <div className="flex w-full flex-col gap-lg px-container-padding">
      <section className="flex flex-col items-center justify-center gap-4 pt-md">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              className="text-surface-container-high"
              cx="60"
              cy="60"
              fill="none"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
            />
            <circle
              className="text-primary drop-shadow-[0_0_12px_rgba(198,198,198,0.5)]"
              cx="60"
              cy="60"
              fill="none"
              r="54"
              stroke="currentColor"
              strokeDasharray="339.29"
              strokeDashoffset="40"
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <div className="z-10 flex flex-col items-center">
            <span className="font-numeric text-display-lg text-on-background">88</span>
            <span className="mt-1 font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
              Health Score
            </span>
          </div>
        </div>
        <p className="max-w-[280px] text-center text-body-lg text-on-surface-variant">
          Seus sinais vitais estão estáveis e ótimos hoje.
        </p>
      </section>

      <div className="flex flex-col gap-md">
        <h2 className="font-display text-headline-mobile text-on-background">
          Tudo que a BAND monitora
        </h2>

        <div className="grid grid-cols-1 gap-sm">
          {/* Frequência cardíaca */}
          <Link to="/heart-rate" className={`${cardBase} min-h-[160px]` + ` ${em("heart")}`}>
            <Glow colorVar="--heart" />
            <CardHeader label="Frequência cardíaca" date="01/08/2025" />
            <div className="relative z-10 mt-auto flex w-full flex-col gap-1">
              <svg
                className="h-12 w-full text-heart"
                preserveAspectRatio="none"
                viewBox="0 0 100 30"
              >
                <path
                  d="M0,15 L20,15 L25,5 L30,25 L35,15 L100,15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M0,15 L20,15 L25,5 L30,25 L35,15 L100,15 L100,30 L0,30 Z"
                  fill="currentColor"
                  fillOpacity="0.1"
                  stroke="none"
                />
              </svg>
              <span className="font-display text-headline-mobile text-on-background">
                Frequência cardíaca
              </span>
              <span className="text-body-sm text-on-surface-variant">
                Batimentos em tempo real
              </span>
            </div>
          </Link>

          {/* Sono */}
          <Link to="/sleep" className={`${cardBase} min-h-[220px]` + ` ${em("sleep")}`}>
            <Glow colorVar="--sleep" />
            <CardHeader label="Sono" date="01/08/2025" />
            <Gauge value="76" label="Bom" arc="M 10,50 A 40,40 0 0,1 70,15" colorVar="--sleep" />
            <CardFooter title="Sono profundo" subtitle="REM, leve e profundo" />
          </Link>

          {/* Recuperação e estresse */}
          <Link to="/recovery" className={`${cardBase} min-h-[200px]` + ` ${em("recovery")}`}>
            <Glow colorVar="--activity" />
            <CardHeader label="Recuperação e estresse" date="Hoje" />
            <div className="relative z-10 flex flex-1 items-center justify-center gap-6 py-4">
              <div className="flex flex-col items-center gap-1">
                <span className="font-numeric text-[28px] font-bold leading-none text-activity">
                  78
                </span>
                <span className="font-numeric text-[10px] text-on-surface-variant">
                  Recuperação
                </span>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-numeric text-[28px] font-bold leading-none text-sport">
                  32
                </span>
                <span className="font-numeric text-[10px] text-on-surface-variant">Estresse</span>
              </div>
            </div>
            <CardFooter title="Recuperação" subtitle="Prontidão do corpo, de 0 a 100" />
          </Link>

          {/* Atividades */}
          <Link to="/workout" className={`${cardBase} min-h-[220px] ${em("activity")}`}>
            <Glow colorVar="--activity" />
            <CardHeader label="Atividades" date="Hoje" />
            <Gauge
              value="96"
              label="Excelente"
              arc="M 10,50 A 40,40 0 0,1 85,25"
              colorVar="--activity"
            />
            <CardFooter title="Atividades" subtitle="Passos, calorias e treinos" />
          </Link>


          {/* Recordes esportivos */}
          <Link to="/workout" className={`${cardBase} min-h-[220px] ${em("sport")}`}>
            <Glow colorVar="--sport" />
            <CardHeader label="Recordes Esportivos" date="01/08/2025" />
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-4">
              <div className="relative flex h-20 w-32 justify-center overflow-hidden">
                <svg className="absolute top-0 h-32 w-32" viewBox="0 0 100 100">
                  <path
                    d="M 10,50 A 40,40 0 0,1 90,50"
                    fill="none"
                    stroke="color-mix(in oklab, var(--sport) 20%, transparent)"
                    strokeLinecap="round"
                    strokeWidth="12"
                  />
                  <path
                    d="M 10,50 A 40,40 0 0,1 75,18"
                    fill="none"
                    stroke="var(--sport)"
                    strokeLinecap="round"
                    strokeWidth="12"
                  />
                </svg>
                <div className="absolute bottom-4 flex flex-col items-center">
                  <Icon name="directions_run" className="text-[20px] text-sport" />
                  <span className="mt-1 font-numeric text-[12px] text-on-background">Corrida</span>
                </div>
              </div>
            </div>
            <CardFooter title="Esportes" subtitle="Quebre Recordes" />
          </Link>

          {/* Oxigênio no sangue */}
          <Link to="/spo2" className={`${cardBase} min-h-[220px] ${em("spo2")}`}>
            <Glow colorVar="--oxygen" />
            <CardHeader label="Oxigênio no sangue" date="01/08/2025" />
            <div className="relative z-10 flex h-24 flex-1 items-end justify-center gap-2 py-4">
              {["80%", "100%", "90%", "95%"].map((h, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-gradient-to-t from-oxygen/20 to-oxygen"
                  style={{ height: h }}
                />
              ))}
            </div>
            <CardFooter title="Oxigênio no sangue" subtitle="Saturação SpO2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
