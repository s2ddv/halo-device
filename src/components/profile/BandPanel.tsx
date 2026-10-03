import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/AppShell";
import type { LiveMetric } from "@/lib/ble/halo-protocol";
import { connectBand, isBluetoothSupported, type BandConnection } from "@/lib/band-ble";

export function BandPanel() {
  const connectionRef = useRef<BandConnection | null>(null);
  const connectionAttempt = useRef(0);
  const connectionAbort = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      connectionAttempt.current += 1;
      connectionAbort.current?.abort();
      connectionRef.current?.disconnect();
    },
    [],
  );
  const [supported, setSupported] = useState(false);
  const [band, setBand] = useState<BandConnection | null>(null);
  const [live, setLive] = useState<Partial<Record<LiveMetric, number>>>({});
  const [measuring, setMeasuring] = useState<LiveMetric | null>(null);
  const [charging, setCharging] = useState(false);
  const [readingBattery, setReadingBattery] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isBluetoothSupported());
  }, []);

  function handleDisconnect() {
    connectionAttempt.current += 1;
    connectionAbort.current?.abort();
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    setBand(null);
    setCharging(false);
    setLive({});
    setMeasuring(null);
    setReadingBattery(false);
    setBattery(null);
    setStatus("idle");
    setMessage(null);
  }

  async function handleConnect() {
    const attempt = ++connectionAttempt.current;
    connectionAbort.current?.abort();
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    setBand(null);
    setCharging(false);
    setLive({});
    setMeasuring(null);
    setReadingBattery(false);
    setBattery(null);
    connectionAbort.current = new AbortController();
    setStatus("connecting");
    setMessage(null);
    try {
      const connection = await connectBand({
        signal: connectionAbort.current.signal,
        onDisconnect: () => {
          if (attempt !== connectionAttempt.current) return;
          connectionRef.current = null;
          setCharging(false);
          setLive({});
          setMeasuring(null);
          setReadingBattery(false);
          setBattery(null);
          setStatus("idle");
          setBand(null);
        },
      });
      if (attempt !== connectionAttempt.current) {
        connection.disconnect();
        return;
      }
      connectionRef.current = connection;
      setBand(connection);
      setStatus("connected");
      await queryBattery(connection, attempt);
    } catch (error) {
      if (attempt !== connectionAttempt.current) return;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível conectar.");
    }
  }

  async function queryBattery(connection: BandConnection, attempt = connectionAttempt.current) {
    setReadingBattery(true);
    setMessage(null);
    setBattery(null);
    try {
      const result = await connection.readBattery();
      if (attempt !== connectionAttempt.current || connectionRef.current !== connection) return;
      setBattery(result.level);
      setCharging(result.charging);
    } catch (error) {
      if (attempt === connectionAttempt.current && connectionRef.current === connection) {
        setMessage(error instanceof Error ? error.message : "Falha ao consultar bateria.");
      }
    } finally {
      if (attempt === connectionAttempt.current) setReadingBattery(false);
    }
  }

  async function measure(metric: LiveMetric) {
    const connection = connectionRef.current;
    if (!connection) return;
    const attempt = connectionAttempt.current;
    setMeasuring(metric);
    setMessage(null);
    setLive((previous) => {
      const next = { ...previous };
      delete next[metric];
      return next;
    });
    try {
      const result = await connection.measure(metric);
      if (attempt === connectionAttempt.current && connectionRef.current === connection) {
        setLive((previous) => ({ ...previous, [metric]: result.value }));
      }
    } catch (error) {
      if (attempt === connectionAttempt.current) {
        setMessage(error instanceof Error ? error.message : "Falha na medição.");
      }
    } finally {
      if (attempt === connectionAttempt.current) setMeasuring(null);
    }
  }

  return (
    <section className="relative flex flex-col gap-md overflow-hidden rounded-xl border border-border bg-card p-md">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-oxygen/15 opacity-60" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-numeric text-label-caps text-on-background">
            Dispositivo · conexão experimental
          </span>
          <span className="font-display text-title-md text-on-background">
            {band?.name ?? "Nenhuma BAND conectada"}
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 font-numeric text-[10px] uppercase tracking-widest ${
            status === "connected"
              ? "bg-oxygen/20 text-oxygen"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          {status === "connected"
            ? "Conectada"
            : status === "connecting"
              ? "Conectando"
              : "Desconectada"}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-sm">
        <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-sm">
          <span className="font-numeric text-[10px] text-on-surface-variant">
            Leituras de saúde
          </span>
          <span className="font-numeric text-title-md text-on-background">
            {live.heartRate != null ? `${live.heartRate} bpm` : "— bpm"}
            {" · "}
            {live.spo2 != null ? `${live.spo2}% SpO₂` : "— SpO₂"}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-sm">
          <span className="font-numeric text-[10px] text-on-surface-variant">Bateria</span>
          <span className="font-numeric text-title-md text-on-background">
            {readingBattery
              ? "Consultando…"
              : battery != null
                ? `${battery}%${charging ? " · carregando" : ""}`
                : "—"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={status === "connected" ? handleDisconnect : handleConnect}
        disabled={!supported || status === "connecting"}
        className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-numeric text-label-caps uppercase tracking-widest text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        <Icon name="bluetooth_searching" className="text-[18px]" />
        {status === "connected" ? "Desconectar" : "Procurar dispositivo"}
      </button>

      {status === "connected" && band && (
        <button
          type="button"
          disabled={readingBattery || measuring !== null}
          onClick={() => void queryBattery(band)}
          className="relative z-10 rounded-full border border-border py-3 text-body-sm disabled:opacity-50"
        >
          Consultar bateria
        </button>
      )}
      {status === "connected" && (
        <div className="relative z-10 flex flex-wrap gap-2">
          {(["heartRate", "spo2"] as const).map((metric) => (
            <button
              key={metric}
              type="button"
              disabled={readingBattery || measuring !== null}
              onClick={() => void measure(metric)}
              className="flex-1 rounded-full border border-border px-3 py-3 text-body-sm disabled:opacity-50"
            >
              {measuring === metric
                ? "Medindo…"
                : metric === "heartRate"
                  ? "Medir batimentos"
                  : "Medir SpO₂"}
            </button>
          ))}
        </div>
      )}
      <p className="relative z-10 text-body-sm text-on-surface-variant">
        Use a pulseira e mantenha-se parado durante a medição (até 45 segundos). Valores
        experimentais desta sessão; ainda não são salvos nem usados no score.
      </p>
      <p className="relative z-10 text-body-sm text-on-surface-variant">
        Feche a conexão no QRing e no nRF Connect antes de conectar. A bateria usa compatibilidade
        experimental com QRing; as leituras de saúde ainda não alimentam o score.
      </p>
      {!supported && (
        <p className="relative z-10 text-body-sm text-on-surface-variant">
          Este navegador não suporta Bluetooth. Abra no Chrome para Android para parear a BAND.
        </p>
      )}
      {message && <p className="relative z-10 text-body-sm text-destructive">{message}</p>}
    </section>
  );
}
