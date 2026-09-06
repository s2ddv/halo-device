import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/AppShell";
import { connectBand, isBluetoothSupported, type BandConnection } from "@/lib/band-ble";
import {
  SUB_SCORE_META,
  LEVEL_COLORS,
  activeDaysLast30,
  dailyHistory,
  dailyScore,
  isRanked,
  levelProgress,
  levelScore,
  todaySubScores,
  type SubScoreKey,
} from "@/lib/scoring";
import {
  activityHeatmap,
  HEATMAP_LEVEL_OPACITY,
  type ActivityDay,
} from "@/lib/metrics";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil e pontuação — HALO" },
      {
        name: "description",
        content:
          "Conecte sua BAND, veja seu score diário, sub-scores de 0 a 100, nível no ranking e progresso até o próximo nível.",
      },
      { property: "og:title", content: "Perfil e pontuação — HALO" },
      {
        property: "og:description",
        content: "Score diário, sub-scores, nível estilo Faceit e atividade recente na HALO.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [tab, setTab] = useState<"perfil" | "pontuacao" | "config">("perfil");
  const [scoreTab, setScoreTab] = useState<"hoje" | "ranking">("hoje");

  return (
    <div className="flex w-full flex-col gap-md px-container-padding pt-md">
      <div className="flex rounded-full bg-surface-container-high p-1">
        {(
          [
            { id: "perfil", label: "Perfil" },
            { id: "pontuacao", label: "Pontuação" },
            { id: "config", label: "Config" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full py-2.5 font-numeric text-label-caps uppercase tracking-widest transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "perfil" ? (
        <ProfileTab />
      ) : tab === "pontuacao" ? (
        <ScoreTab scoreTab={scoreTab} onScoreTab={setScoreTab} />
      ) : (
        <SettingsTab />
      )}
    </div>
  );
}

function ProfileTab() {
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
    <>
      <section className="flex items-center gap-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Icon name="person" className="text-[28px] text-primary-foreground" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-headline-mobile text-on-background">Samuel</span>
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 font-numeric text-[10px] uppercase tracking-widest"
              style={{
                color: "var(--verified)",
                backgroundColor: "color-mix(in oklab, var(--verified) 18%, transparent)",
              }}
              title="Perfil verificado"
            >
              <Icon name="verified" className="text-[14px]" />
              Verificado
            </span>
          </div>
          <span className="text-body-sm text-on-surface-variant">🇧🇷 Brasil</span>
        </div>
      </section>

      <ActivitySection />

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

    </>
  );
}

function SettingsTab() {
  return (
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
  );
}

function ActivitySection() {
  const grid = useMemo(() => activityHeatmap(20), []);
  const [day, setDay] = useState<ActivityDay | null>(null);

  return (
    <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
      <div className="flex items-baseline justify-between">
        <span className="font-numeric text-label-caps text-on-background">Atividade recente</span>
        <span className="font-numeric text-[10px] text-on-surface-variant">Últimas 20 semanas</span>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex gap-1">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDay(d)}
                  title={`${d.label} · ${d.events.length} atividades`}
                  className="h-3 w-3 rounded-[3px] transition-transform active:scale-90"
                  style={{
                    backgroundColor: "var(--activity)",
                    opacity: HEATMAP_LEVEL_OPACITY[d.level],
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <span className="font-numeric text-[10px] text-on-surface-variant">Menos</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            key={l}
            className="h-3 w-3 rounded-[3px]"
            style={{ backgroundColor: "var(--activity)", opacity: HEATMAP_LEVEL_OPACITY[l] }}
          />
        ))}
        <span className="font-numeric text-[10px] text-on-surface-variant">Mais</span>
      </div>

      {day && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
          onClick={() => setDay(null)}
        >
          <div
            className="w-full max-w-[430px] rounded-xl border border-border bg-card p-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-md flex items-center justify-between">
              <span className="font-display text-title-md text-on-background">{day.label}</span>
              <button
                type="button"
                onClick={() => setDay(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>
            {day.events.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                Nenhuma atividade registrada neste dia. Amanhã é um novo começo!
              </p>
            ) : (
              <div className="flex flex-col gap-sm">
                {day.events.map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high">
                      <Icon name={e.icon} className="text-[18px] text-activity" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-body-lg text-on-background">{e.title}</span>
                      <span className="text-body-sm text-on-surface-variant">{e.detail}</span>
                    </div>
                    <span className="font-numeric text-[10px] text-on-surface-variant">
                      {e.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ScoreTab({
  scoreTab,
  onScoreTab,
}: {
  scoreTab: "hoje" | "ranking";
  onScoreTab: (t: "hoje" | "ranking") => void;
}) {
  return (
    <>
      <div className="flex gap-2">
        {(
          [
            { id: "hoje", label: "Hoje" },
            { id: "ranking", label: "Ranking" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onScoreTab(t.id)}
            className={`flex-1 rounded-full border py-2 font-numeric text-label-caps uppercase tracking-widest transition-colors ${
              scoreTab === t.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {scoreTab === "hoje" ? <TodayScore /> : <Ranking />}
    </>
  );
}

function TodayScore() {
  const score = dailyScore(todaySubScores);
  return (
    <>
      <section className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps uppercase tracking-widest text-on-surface-variant">
          Score de hoje
        </span>
        <span className="font-numeric text-display-lg text-on-background">{score}</span>
        <span className="text-body-sm text-on-surface-variant">de 1000 pontos possíveis</span>
        <p className="mt-1 text-center text-body-sm text-on-surface-variant">
          Soma ponderada dos seus sub-scores do dia. Dias sem usar a BAND valem 0 — constância é
          tudo!
        </p>
      </section>

      <section className="flex flex-col gap-md rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps text-on-background">Sub-scores</span>
        {(Object.keys(SUB_SCORE_META) as SubScoreKey[]).map((key) => {
          const meta = SUB_SCORE_META[key];
          const value = todaySubScores[key];
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name={meta.icon} className="text-[16px] text-on-surface-variant" />
                  <span className="text-body-sm text-on-background">{meta.label}</span>
                </div>
                <span className="font-numeric text-body-sm text-on-background">{value}/100</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${value}%`,
                    backgroundColor: `var(${meta.colorVar})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

function Ranking() {
  const lvlScore = levelScore(dailyHistory);
  const progress = levelProgress(lvlScore);
  const ranked = isRanked(activeDaysLast30);
  const levelColor = LEVEL_COLORS[progress.level] ?? "var(--on-surface-variant)";
  const max = Math.max(...dailyHistory);

  return (
    <>
      <section className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-md">
        {ranked ? (
          <>
            <div
              className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2"
              style={{ borderColor: levelColor, backgroundColor: "var(--card)" }}
            >
              <span
                className="font-numeric text-display-lg leading-none"
                style={{ color: levelColor }}
              >
                {progress.level}
              </span>
              <span className="font-numeric text-[10px] uppercase tracking-widest text-on-surface-variant">
                Nível
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-numeric text-title-md text-on-background">
                {lvlScore} pts
              </span>
              <span className="text-body-sm text-on-surface-variant">
                Média dos últimos 30 dias
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            <Icon name="military_tech" className="text-[32px] text-on-surface-variant" />
            <span className="font-display text-title-md text-on-background">Não classificado</span>
            <span className="text-center text-body-sm text-on-surface-variant">
              Use a BAND por pelo menos 20 dos últimos 30 dias para entrar no ranking.
            </span>
          </div>
        )}

        {ranked && (
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex justify-between font-numeric text-[10px] text-on-surface-variant">
              <span>
                Nv. {progress.level} · {progress.min} pts
              </span>
              {progress.level < 10 && (
                <span>
                  Faltam {progress.toNext} pts · Nv. {progress.level + 1}
                </span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress.pct}%`, backgroundColor: levelColor }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
        <div className="flex items-baseline justify-between">
          <span className="font-numeric text-label-caps text-on-background">
            Evolução · 30 dias
          </span>
          <span className="font-numeric text-[10px] text-on-surface-variant">
            {activeDaysLast30}/30 dias ativos
          </span>
        </div>
        <div className="flex h-24 items-end gap-1">
          {dailyHistory.map((d, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${d === 0 ? 4 : Math.max(8, (d / max) * 100)}%`,
                backgroundColor:
                  d === 0 ? "var(--surface-container-high)" : "var(--primary)",
                opacity: d === 0 ? 0.5 : 0.4 + (d / max) * 0.6,
              }}
              title={d === 0 ? "Dia sem uso" : `${d} pts`}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-md">
        <p className="text-body-sm text-on-surface-variant">
          Níveis de 0 a 10: seu Score de Nível é a média móvel dos scores diários. Continue ativo
          para subir de patamar!
        </p>
      </section>
    </>
  );
}
