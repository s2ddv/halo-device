import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const leftTabs = [
  { to: "/", icon: "home", label: "Dashboard" },
  { to: "/progress", icon: "trending_up", label: "Progressão" },
] as const;

const extraTabs = [{ to: "/reports", icon: "analytics", label: "Relatórios" }] as const;

const rightTabs = [{ to: "/profile", icon: "person", label: "Perfil" }] as const;

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className ?? ""}`} aria-hidden="true">
      {name}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-[430px] bg-background/80 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-container-padding">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-6 w-2 rounded-full bg-primary" />
            <span className="font-display text-headline-mobile uppercase tracking-tighter text-on-surface">
              HALO
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

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] px-4 pb-safe">
        <div className="mb-3 flex h-16 items-center justify-around rounded-full border border-border bg-surface-container-highest/90 px-6 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {leftTabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: true }}
              aria-label={tab.label}
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-all"
              activeProps={{ className: "text-primary" }}
            >
              <Icon name={tab.icon} className="text-[24px]" />
            </Link>
          ))}

          <Link
            to="/workout"
            aria-label="Treino"
            className="-mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(0,0,0,0.5)] ring-4 ring-background transition-transform active:scale-95"
          >
            <Icon name="fitness_center" className="text-[26px]" />
          </Link>

          {[...extraTabs, ...rightTabs].map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: true }}
              aria-label={tab.label}
              className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-all"
              activeProps={{ className: "text-primary" }}
            >
              <Icon name={tab.icon} className="text-[24px]" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
