import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/AppShell";
import { connectBand, isBluetoothSupported, type BandConnection } from "@/lib/band-ble";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil e dispositivo — Vital" },
      {
        name: "description",
        content:
          "Conecte sua pulseira BAND por Bluetooth, veja bateria, batimentos ao vivo e status de sincronização.",
      },
      { property: "og:title", content: "Perfil e dispositivo — Vital" },
      {
        property: "og:description",
        content: "Conexão Bluetooth com a BAND, bateria e sincronização.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [supported, setSupported] = useState(false);
  const [band, setBand] = useState<BandConnection | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setSupported(isBluetoothSupported());
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function handleConnect() {
    setStatus("connecting");
    setMessage(null);
    try {
      const connection = await connectBand({
        onHeartRate: setBpm,
        onBattery: setBattery,
        onDisconnect: () => {
          setStatus("idle");
          setBand(null);
        },
      });
      setBand(connection);
      setBpm(connection.heartRate);
      setBattery(connection.batteryLevel);
      setStatus("connected");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível conectar.");
    }
  }

  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <section className="flex items-center gap-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Icon name="person" className="text-[28px] text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-headline-mobile text-on-background">Samuel</span>
          <span className="text-body-sm text-on-surface-variant">Plano Vital · desde 2025</span>
        </div>
      </section>

      <section className="relative flex flex-col gap-md overflow-hidden rounded-xl border border-border bg-card p-md">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-oxygen/15 opacity-60" />
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-numeric text-label-caps text-on-background">Dispositivo</span>
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
            <span className="font-numeric text-[10px] text-on-surface-variant">Batimentos</span>
            <span className="font-numeric text-title-md text-on-background">
              {bpm != null ? `${bpm} bpm` : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-sm">
            <span className="font-numeric text-[10px] text-on-surface-variant">Bateria</span>
            <span className="font-numeric text-title-md text-on-background">
              {battery != null ? `${battery}%` : "—"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConnect}
          disabled={!supported || status === "connecting"}
          className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-numeric text-label-caps uppercase tracking-widest text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          <Icon name="bluetooth_searching" className="text-[18px]" />
          {status === "connected" ? "Reconectar BAND" : "Procurar BAND"}
        </button>

        {!supported && (
          <p className="relative z-10 text-body-sm text-on-surface-variant">
            Este navegador não suporta Bluetooth. Abra no Chrome para Android para parear a BAND.
          </p>
        )}
        {message && <p className="relative z-10 text-body-sm text-destructive">{message}</p>}
      </section>

      <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps text-on-background">Sincronização</span>
        <div className="flex items-center gap-2">
          <Icon
            name={online ? "cloud_done" : "cloud_off"}
            className="text-[18px] text-on-surface-variant"
          />
          <span className="text-body-sm text-on-surface-variant">
            {online
              ? "Conectado — medições enviadas automaticamente."
              : "Sem conexão — as medições ficam salvas e sobem depois."}
          </span>
        </div>
      </section>

      <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        {[
          { icon: "notifications", label: "Notificações" },
          { icon: "shield", label: "Privacidade dos dados" },
          { icon: "straighten", label: "Unidades e metas" },
          { icon: "help", label: "Ajuda" },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex items-center gap-md border-b border-border px-md py-4 text-left last:border-b-0"
          >
            <Icon name={item.icon} className="text-[18px] text-on-surface-variant" />
            <span className="flex-1 text-body-lg text-on-background">{item.label}</span>
            <Icon name="chevron_right" className="text-[16px] text-on-surface-variant" />
          </button>
        ))}
      </section>
    </div>
  );
}
