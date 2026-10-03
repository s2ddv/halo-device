import type { CSSProperties, ReactNode } from "react";

export function MetricCard({
  children,
  color = "--primary",
  className = "",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <section
      className={`metric-card ${className}`}
      style={{ "--metric-color": `var(${color})` } as CSSProperties}
    >
      {children}
    </section>
  );
}

export function ScoreRing({
  value,
  label,
  color = "--primary",
  max = 100,
}: {
  value: number | null;
  label: string;
  color?: string;
  max?: number;
}) {
  const percent = value === null ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="score-ring" style={{ color: `var(${color})` }}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".12"
          strokeWidth="14"
        />
        <circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${percent} 100`}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="score-ring-label">
        <strong>{value ?? "—"}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function HalfGauge({
  value,
  label,
  color,
}: {
  value: number | null;
  label: string;
  color: string;
}) {
  return (
    <div className="half-gauge" style={{ color: `var(${color})` }}>
      <svg viewBox="0 0 140 85" aria-hidden="true">
        <path
          d="M14 70 A56 56 0 0 1 126 70"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".15"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M14 70 A56 56 0 0 1 126 70"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${value ?? 0} 100`}
        />
      </svg>
      <div>
        <strong>{value ?? "—"}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values),
    span = Math.max(...values) - min || 1;
  const points = values
    .map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${35 - ((v - min) / span) * 28}`)
    .join(" ");
  return (
    <svg className="h-16 w-full" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={`var(${color})`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
