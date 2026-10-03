import { Icon } from "@/components/AppShell";
import { InfoDialog } from "@/components/health/InfoDialog";
import { FOCUS_META, GOAL_META, usePreferences, type FocusMode } from "@/lib/preferences";

export function SettingsPanel() {
  const { preferences, setGoal, setFocus, resetGoals } = usePreferences();

  return (
    <div className="flex flex-col gap-md">
      {/* Metas personalizadas */}
      <section className="flex flex-col gap-md rounded-xl border border-border bg-card p-md">
        <div className="flex items-center justify-between">
          <span className="font-numeric text-label-caps text-on-background">Minhas metas</span>
          <button
            type="button"
            onClick={resetGoals}
            className="min-h-11 px-2 font-numeric text-xs uppercase tracking-widest text-on-surface-variant"
          >
            Restaurar padrão
          </button>
        </div>
        {GOAL_META.map((g) => (
          <div key={g.key} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Icon name={g.icon} className="text-[16px] text-on-surface-variant" />
              <span className="flex-1 text-body-sm text-on-background">{g.label}</span>
              <span className="font-numeric text-[13px] text-on-background">
                {preferences.goals[g.key].toLocaleString("pt-BR")} {g.unit}
              </span>
            </div>
            <input
              type="range"
              min={g.min}
              max={g.max}
              step={g.step}
              value={preferences.goals[g.key]}
              onChange={(e) => setGoal(g.key, Number(e.target.value))}
              aria-label={g.label}
              className="goal-slider h-11 w-full cursor-pointer accent-primary"
              style={{ accentColor: `var(${g.colorVar})` }}
            />
          </div>
        ))}
      </section>

      {/* Modo Foco */}
      <section className="flex flex-col gap-sm rounded-xl border border-border bg-card p-md">
        <span className="font-numeric text-label-caps text-on-background">Modo Foco</span>
        <p className="text-body-sm text-on-surface-variant">
          Escolha o que quer priorizar. As métricas relacionadas ganham destaque na tela inicial.
        </p>
        <button
          type="button"
          onClick={() => setFocus("none")}
          aria-pressed={preferences.focus === "none"}
          className={`flex items-center gap-md rounded-xl border px-md py-3 text-left ${
            preferences.focus === "none"
              ? "border-primary bg-surface-container-high"
              : "border-border"
          }`}
        >
          <Icon name="tune" className="text-[18px] text-on-surface-variant" />
          <span className="flex-1 text-body-lg text-on-background">Sem foco</span>
          {preferences.focus === "none" && (
            <Icon name="check_circle" className="text-[18px] text-primary" />
          )}
        </button>
        {(Object.keys(FOCUS_META) as Exclude<FocusMode, "none">[]).map((key) => {
          const f = FOCUS_META[key];
          const active = preferences.focus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFocus(key)}
              aria-pressed={active}
              className={`flex items-start gap-md rounded-xl border px-md py-3 text-left ${
                active ? "bg-surface-container-high" : "border-border"
              }`}
              style={active ? { borderColor: `var(${f.colorVar})` } : undefined}
            >
              <Icon name={f.icon} className="mt-0.5 text-[18px]" />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-body-lg text-on-background">{f.label}</span>
                <span className="text-body-sm text-on-surface-variant">{f.description}</span>
              </span>
              {active && <Icon name="check_circle" className="text-[18px] text-primary" />}
            </button>
          );
        })}
      </section>

      <InfoDialog
        title="Preferências locais"
        description="Metas e Modo Foco são salvos neste navegador. O Modo Foco reorganiza os cards do início; não altera scores nem transforma exemplos em dados reais."
        trigger={
          <button type="button" className="min-h-11 rounded-xl border border-border p-4 text-left">
            Como funcionam minhas preferências?
          </button>
        }
      />

      <p className="text-body-sm text-on-surface-variant">
        Metas e Modo Foco ficam salvos apenas neste aparelho e nunca são compartilhados.
      </p>
    </div>
  );
}
