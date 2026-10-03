import { MetricCard } from "@/components/health/Visuals";
import { sleepPhases, sleepSegments } from "@/lib/demo/sleep";
export function SleepArchitecture() {
  const total = sleepSegments.reduce((sum, s) => sum + s.minutes, 0);
  let elapsed = 0;
  return (
    <MetricCard color="--sleep">
      <p className="text-xs uppercase tracking-widest text-on-surface-variant">
        Arquitetura noturna
      </p>
      <h2 className="mb-5 mt-2 font-display text-title-md">Fases do sono</h2>
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
        <div className="flex flex-col justify-around text-[10px] text-on-surface-variant">
          {sleepPhases.map((p) => (
            <span key={p.label}>{p.label}</span>
          ))}
        </div>
        <svg
          viewBox="0 0 400 140"
          className="h-40 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Linha do tempo demonstrativa das fases do sono"
        >
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              x2="400"
              y1={i * 35 + 18}
              y2={i * 35 + 18}
              stroke="var(--border)"
            />
          ))}
          {sleepSegments.map((s, i) => {
            const x = (elapsed / total) * 400;
            elapsed += s.minutes;
            return (
              <rect
                key={i}
                x={x}
                y={s.phase * 35 + 6}
                width={(s.minutes / total) * 400}
                height="24"
                rx="3"
                fill={`var(${sleepPhases[s.phase]!.color})`}
              />
            );
          })}
        </svg>
      </div>
      <div className="ml-[72px] flex justify-between text-[10px] text-on-surface-variant">
        <span>23:15</span>
        <span>01h</span>
        <span>03h</span>
        <span>05h</span>
        <span>07h</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {sleepPhases.map((p) => (
          <div key={p.label} className="border-t border-border pt-3">
            <p className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: `var(${p.color})` }} />
              {p.label}
            </p>
            <p className="mt-2 font-numeric text-title-md">
              {Math.floor(p.minutes / 60) > 0 ? `${Math.floor(p.minutes / 60)}h ` : ""}
              {p.minutes % 60}min
            </p>
            <p className="text-xs text-on-surface-variant">
              {Math.round((p.minutes / total) * 100)}% do período
            </p>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
