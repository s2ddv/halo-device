import { Icon } from "@/components/AppShell";
import { activeDaysLast30, dailyHistory, todaySubScores } from "@/lib/demo/scoring";
import {
  SUB_SCORE_META,
  LEVEL_COLORS,
  dailyScore,
  isRanked,
  levelProgress,
  levelScore,
  type SubScoreKey,
} from "@/lib/scoring";

export function ScorePanel({
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
            { id: "ranking", label: "Nível pessoal" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onScoreTab(t.id)}
            aria-pressed={scoreTab === t.id}
            className={`min-h-11 flex-1 rounded-full border py-2 font-numeric text-label-caps uppercase tracking-widest transition-colors ${
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
          Exemplo de soma ponderada. No histórico real, dias parciais não publicam score definitivo
          e o cálculo respeita a calibração.
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
              <span className="font-numeric text-title-md text-on-background">{lvlScore} pts</span>
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
              Exemplo de progressão pessoal; não representa seu histórico real.
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
                backgroundColor: d === 0 ? "var(--surface-container-high)" : "var(--primary)",
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
