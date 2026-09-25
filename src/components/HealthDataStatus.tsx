import { useHealth } from "@/lib/health/use-health";

export function HealthDataStatus() {
  const { measurementCount, status, error, loading } = useHealth();
  return (
    <section className="rounded-xl border border-border bg-card p-md" aria-live="polite">
      <h2 className="font-display text-title-md">Histórico real neste navegador</h2>
      <p className="text-body-sm text-on-surface-variant">
        {loading
          ? "Carregando histórico…"
          : (error ??
            (measurementCount === 0
              ? "Nenhuma medição recebida. Aguardando uma pulseira compatível."
              : `${measurementCount} medições salvas. ${status.calibrationDays}/14 dias de calibração.`))}
      </p>
      {!loading && !error && measurementCount > 0 && (
        <p className="text-body-sm text-on-surface-variant">
          {status.score === null
            ? "Health Score indisponível: aguardando calibração e métricas completas."
            : `Health Score: ${status.score}/1000 · Nível ${status.level}`}
        </p>
      )}
      <p className="mt-2 text-body-sm text-on-surface-variant">
        Dados locais, sem envio à nuvem. Apagar os dados do site remove este histórico.
      </p>
    </section>
  );
}
