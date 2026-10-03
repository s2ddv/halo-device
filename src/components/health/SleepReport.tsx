import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/AppShell";
import { MetricCard } from "./Visuals";
import { demoMonthlySleep, demoSleep } from "@/lib/demo/dashboard";

export function SleepReport({ period }: { period: "week" | "month" }) {
  const rows = period === "week" ? demoSleep : demoMonthlySleep;
  const average = rows.reduce((sum, row) => sum + row.deep + row.light + row.rem, 0) / rows.length;
  const minutes = Math.round(average * 60);
  return (
    <MetricCard color="--sleep" className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-numeric text-label-caps uppercase tracking-wider text-on-surface-variant">
            Análise do sono
          </h2>
          <p className="mt-2 font-numeric text-title-md">
            {Math.floor(minutes / 60)}h {String(minutes % 60).padStart(2, "0")}m{" "}
            <span className="text-body-sm text-on-surface-variant">média demo</span>
          </p>
        </div>
        <Link
          to="/sleep"
          aria-label="Ver análise detalhada do sono"
          className="icon-button bg-white/5"
        >
          <Icon name="chevron_right" />
        </Link>
      </div>
      <div className="flex h-44 items-end justify-between gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="flex h-36 w-full max-w-12 flex-col justify-end gap-0.5"
              role="img"
              aria-label={`${row.label}: profundo ${row.deep}h, leve ${row.light}h, REM ${row.rem}h`}
            >
              {[
                { v: row.deep, c: "--sleep" },
                { v: row.light, c: "--sleep-light" },
                { v: row.rem, c: "--oxygen" },
              ].map(({ v, c }) => (
                <span key={c} style={{ height: `${(v / 9) * 100}%`, background: `var(${c})` }} />
              ))}
            </div>
            <span className="text-xs text-on-surface-variant">{row.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
        {[
          { label: "Profundo", c: "--sleep" },
          { label: "Leve", c: "--sleep-light" },
          { label: "REM", c: "--oxygen" },
        ].map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-2 text-xs text-on-surface-variant"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: `var(${item.c})` }} />
            {item.label}
          </span>
        ))}
      </div>
    </MetricCard>
  );
}
