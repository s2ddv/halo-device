import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { HalfGauge, MetricCard, ScoreRing, Sparkline } from "@/components/health/Visuals";
import { dashboardMetrics } from "@/lib/demo/dashboard";
import { FOCUS_META, usePreferences } from "@/lib/preferences";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HALO — Seu painel de saúde" },
      {
        name: "description",
        content:
          "Saúde e progresso pessoal em um só lugar. Explore a prévia do HALO e seu histórico local.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { preferences } = usePreferences();
  const focus = preferences.focus === "none" ? null : FOCUS_META[preferences.focus];
  const metrics = [...dashboardMetrics].sort(
    (a, b) =>
      Number(focus?.highlight.includes(b.key) ?? false) -
      Number(focus?.highlight.includes(a.key) ?? false),
  );
  return (
    <div className="flex flex-col gap-8 px-container-padding pt-md">
      <section className="dashboard-hero flex flex-col items-center gap-5">
        <ScoreRing value={88} label="Health Score" />
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
            Seu bem-estar, em perspectiva
          </span>
          <h1 className="font-display text-headline-mobile md:text-headline-lg">Cada dia conta.</h1>
          <p className="max-w-[400px] text-body-lg text-on-surface-variant">
            Conheça seus sinais, acompanhe hábitos e descubra sua própria evolução.
          </p>
          <span className="text-xs text-on-surface-variant">Score ilustrativo · 88 de 100</span>
          <Link to="/progress" className="flex min-h-11 items-center gap-2 text-body-sm">
            Minha progressão <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </section>
      <section className="flex flex-col gap-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-headline-mobile">Tudo que a HALO monitora</h2>
          {focus && (
            <span className="flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-2 text-xs">
              <Icon name={focus.icon} className="text-[16px]" />
              {focus.label}
            </span>
          )}
        </div>
        <div className="dashboard-grid">
          {metrics.map((metric) => (
            <Link
              key={metric.key}
              to={metric.to}
              className="rounded-[20px] transition-transform active:scale-[.99]"
            >
              <MetricCard color={metric.color} className="flex h-full min-h-[248px] flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-numeric text-label-caps">{metric.label}</h3>
                    <span className="text-xs text-on-surface-variant">Demonstração</span>
                  </div>
                  <span className="icon-button bg-white/5">
                    <Icon name="chevron_right" className="text-[18px]" />
                  </span>
                </div>
                {metric.kind === "gauge" ? (
                  <HalfGauge value={metric.value} label={metric.unit} color={metric.color} />
                ) : metric.kind === "sport" ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
                    <Icon name="directions_run" className="text-[40px] text-sport" />
                    <p className="font-display text-title-md">Corrida</p>
                    <p className="text-body-sm text-on-surface-variant">42m 10s · exemplo</p>
                  </div>
                ) : metric.kind === "thermal" ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
                    <Icon name="device_thermostat" className="text-[32px] text-activity" />
                    <p className="font-numeric text-numeric-data">
                      36,6 <span className="text-body-sm">°C</span>
                    </p>
                    <span className="text-xs text-on-surface-variant">Sensor não integrado</span>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col justify-center gap-3 py-3">
                    <p className="font-numeric text-numeric-data">
                      {metric.value}
                      <span className="ml-2 text-body-sm text-on-surface-variant">
                        {metric.unit}
                      </span>
                    </p>
                    {metric.kind === "line" ? (
                      <Sparkline
                        values={[68, 69, 68, 92, 52, 76, 68, 68, 70, 68]}
                        color={metric.color}
                      />
                    ) : (
                      <div className="flex h-14 items-end justify-center gap-3" aria-hidden="true">
                        {[80, 95, 90, 98, 85, 99, 92].map((h, i) => (
                          <span
                            key={i}
                            className="w-3 rounded-full bg-oxygen"
                            style={{ height: `${h}%`, opacity: 0.45 + i * 0.07 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-auto">
                  <p className="font-display text-title-md">{metric.label}</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{metric.subtitle}</p>
                </div>
              </MetricCard>
            </Link>
          ))}
        </div>
      </section>
      <Link
        to="/profile"
        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-container-low p-md"
      >
        <div>
          <p className="font-display text-title-md">Sua BAND, seu histórico</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Conecte um dispositivo e consulte os dados locais.
          </p>
        </div>
        <Icon name="arrow_forward" />
      </Link>
    </div>
  );
}
