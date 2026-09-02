import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", icon: "home", label: "Dashboard" },
  { to: "/reports", icon: "analytics", label: "Reports" },
  { to: "/workout", icon: "fitness_center", label: "Workout" },
  { to: "/profile", icon: "person", label: "Profile" },
] as const;

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className ?? ""}`} aria-hidden="true">
      {name}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-md bg-background/80 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-container-padding">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-6 w-2 rounded-full bg-primary" />
            <span className="font-display text-headline-mobile uppercase tracking-tighter text-on-surface">
              Vital
            </span>
          </Link>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Notificações"
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="notifications" />
            </button>
            <Link
              to="/profile"
              aria-label="Perfil"
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary"
            >
              <Icon name="person" className="text-[18px] text-primary-foreground" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex w-full flex-1 flex-col pb-32 pt-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md bg-surface-container-highest/90 pb-safe shadow-[0_-1px_12px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex h-20 items-center justify-around px-4">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.to === "/" }}
              className="flex h-16 min-w-[64px] flex-col items-center justify-center gap-1 text-on-surface-variant transition-all"
              activeProps={{ className: "text-primary" }}
            >
              <Icon name={tab.icon} />
              <span className="font-numeric text-label-caps">{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
