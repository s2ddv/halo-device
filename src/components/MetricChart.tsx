import type { DayInfo, Point } from "@/lib/metrics";

export function LineChart({
  series,
  colorVar,
  format = (v: number) => String(Math.round(v)),
}: {
  series: { key: string; points: Point[]; colorVar?: string }[];
  colorVar: string;
  format?: (v: number) => string;
}) {
  const all = series.flatMap((s) => s.points.map((p) => p.v));
  if (all.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-body-sm text-on-surface-variant">
        Selecione ao menos um dia para ver o gráfico.
      </div>
    );
  }
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const pad = (rawMax - rawMin || 1) * 0.15;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const W = 300;
  const H = 120;
  const x = (i: number, len: number) => (len <= 1 ? W / 2 : (i / (len - 1)) * W);
  const y = (v: number) => H - ((v - min) / (max - min)) * H;

  const labels = series[0]?.points.map((p) => p.t) ?? [];
  const tick = Math.max(1, Math.ceil(labels.length / 6));

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full">
        <svg
          className="h-40 w-full"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Gráfico de linha"
        >
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1="0"
              x2={W}
              y1={H * g}
              y2={H * g}
              stroke="var(--border)"
              strokeWidth="0.5"
            />
          ))}
          {series.map((s, si) => {
            const c = s.colorVar ?? colorVar;
            const d = s.points
              .map((p, i) => `${i === 0 ? "M" : "L"}${x(i, s.points.length)},${y(p.v)}`)
              .join(" ");
            return (
              <g key={s.key}>
                {series.length === 1 && (
                  <path
                    d={`${d} L${W},${H} L0,${H} Z`}
                    fill={`color-mix(in oklab, var(${c}) 18%, transparent)`}
                    stroke="none"
                  />
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={`var(${c})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={series.length > 1 ? 1 - si * 0.15 : 1}
                />
              </g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between py-0.5 font-numeric text-[10px] text-on-surface-variant">
          <span>{format(rawMax)}</span>
          <span>{format(rawMin)}</span>
        </div>
      </div>
      <div className="flex justify-between font-numeric text-[10px] text-on-surface-variant">
        {labels
          .filter((_, i) => i % tick === 0)
          .map((l, i) => (
            <span key={`${l}-${i}`}>{l}</span>
          ))}
      </div>
    </div>
  );
}

export function MinAvgMax({
  min,
  avg,
  max,
  unit,
  colorVar,
  format = (v: number) => String(Math.round(v)),
}: {
  min: number;
  avg: number;
  max: number;
  unit: string;
  colorVar: string;
  format?: (v: number) => string;
}) {
  const items = [
    { label: "Mínima", value: min, icon: "south" },
    { label: "Média", value: avg, icon: "timeline" },
    { label: "Máxima", value: max, icon: "north" },
  ];
  return (
    <div className="grid grid-cols-3 gap-sm">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-sm"
        >
          <span className="font-numeric text-[10px] uppercase tracking-widest text-on-surface-variant">
            {item.label}
          </span>
          <span
            className="font-numeric text-title-md leading-none"
            style={{ color: `var(${colorVar})` }}
          >
            {format(item.value)}
          </span>
          <span className="font-numeric text-[10px] text-on-surface-variant">{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function SingleDaySelector({
  days,
  selected,
  onSelect,
}: {
  days: DayInfo[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="-mx-container-padding flex gap-2 overflow-x-auto px-container-padding pb-1">
      {days.map((d) => (
        <button
          key={d.key}
          type="button"
          onClick={() => onSelect(d.key)}
          className={`shrink-0 rounded-full border px-4 py-2 font-numeric text-[11px] transition-colors ${
            selected === d.key
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-on-surface-variant"
          }`}
        >
          {d.short}
        </button>
      ))}
    </div>
  );
}

export function MultiDaySelector({
  days,
  selected,
  onToggle,
}: {
  days: DayInfo[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="-mx-container-padding flex gap-2 overflow-x-auto px-container-padding pb-1">
      {days.map((d) => {
        const active = selected.includes(d.key);
        return (
          <button
            key={d.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(d.key)}
            className={`shrink-0 rounded-full border px-4 py-2 font-numeric text-[11px] transition-colors ${
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-on-surface-variant"
            }`}
          >
            {d.short}
          </button>
        );
      })}
    </div>
  );
}
