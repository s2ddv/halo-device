import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { MetricCard, ScoreRing, Sparkline } from "@/components/health/Visuals";
import { SleepReport } from "@/components/health/SleepReport";
import { SleepArchitecture } from "@/components/metrics/SleepArchitecture";
import { DetailLayout, useDetailPeriod, MetricNote } from "@/components/metrics/DetailLayout";
import { nightSignals } from "@/lib/demo/sleep";
import { usePreferences } from "@/lib/preferences";
export const Route = createFileRoute("/sleep")({
  head: () => ({ meta: [{ title: "Análise do sono — HALO" }] }),
  component: SleepPage,
});
function SleepPage() {
  const controls = useDetailPeriod();
  const { preferences } = usePreferences();
  return (
    <DetailLayout
      title="Análise do sono"
      eyebrow="Descanso & recuperação"
      color="--sleep"
      controls={controls}
    >
      {controls.period !== "day" ? (
        <SleepReport period={controls.period} />
      ) : (
        <>
          <div className="page-grid items-start">
            <MetricCard color="--sleep">
              <div className="flex justify-between text-body-sm">
                <span>Desempenho geral</span>
                <span className="text-sleep">Exemplo</span>
              </div>
              <ScoreRing value={88} label="Score ilustrativo" color="--sleep" />
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Tempo dormindo</p>
                  <p className="mt-1 font-numeric text-title-md">7h 20m</p>
                  <p className="text-xs text-on-surface-variant">
                    / {preferences.goals.sleepHours}h de meta
                  </p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Eficiência ilustrativa</p>
                  <p className="mt-1 font-numeric text-title-md">95%</p>
                  <p className="text-xs text-on-surface-variant">23:15–07:00 na cama</p>
                </div>
              </div>
            </MetricCard>
            <SleepArchitecture />
          </div>
          <MetricNote title="Entenda seu descanso" icon="auto_awesome">
            A arquitetura e os sinais abaixo reproduzem a visualização do Stitch com dados
            demonstrativos. Sono e recuperação ainda não são decodificados da sua BAND.
          </MetricNote>
          <div className="page-grid">
            {nightSignals.map((signal) => (
              <MetricCard key={signal.title} color={signal.color}>
                <h2 className="flex items-center gap-2 text-body-sm">
                  <Icon name={signal.icon} className="text-[20px]" />
                  {signal.title}
                </h2>
                <p className="my-4 font-numeric text-numeric-data">
                  {signal.value}
                  <span className="ml-2 text-xs font-normal text-on-surface-variant">
                    {signal.unit}
                  </span>
                </p>
                <Sparkline values={signal.values} color={signal.color} />
                <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
                  <span>23h</span>
                  <span>03h</span>
                  <span>07h</span>
                </div>
              </MetricCard>
            ))}
          </div>
        </>
      )}
      <p className="text-xs text-on-surface-variant">
        A data organiza a prévia de uma noite ilustrativa. Não representa medições reais ou
        diagnóstico.
      </p>
    </DetailLayout>
  );
}
