import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { InfoDialog } from "@/components/health/InfoDialog";

const tabs = [
  { to: "/", icon: "home", label: "Início" },
  { to: "/reports", icon: "analytics", label: "Relatórios" },
  { to: "/workout", icon: "fitness_center", label: "Atividades" },
  { to: "/profile", icon: "person", label: "Perfil" },
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
    <div className="halo-shell">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <header className="halo-header pt-safe">
        <div className="flex h-16 items-center justify-between px-container-padding">
          <Link to="/" aria-label="HALO, início" className="flex min-h-11 items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-primary" />
            <span className="font-display text-headline-mobile font-bold tracking-tighter">
              HALO
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <InfoDialog
              title="Notificações"
              description="Você está em dia. Os alertas de saúde ainda não estão conectados a uma fonte de dados validada."
              trigger={
                <button type="button" aria-label="Notificações" className="icon-button">
                  <Icon name="notifications" />
                </button>
              }
            />
            <Link to="/profile" aria-label="Abrir perfil" className="icon-button">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon name="person" className="text-[18px]" />
              </span>
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="halo-main">
        <aside className="demo-notice">
          <Icon name="science" className="text-[18px]" />
          <p>
            <strong>Prévia do HALO</strong> · Métricas e insights são demonstrativos. Conexão
            Bluetooth e histórico local ficam identificados no perfil.
          </p>
        </aside>
        {children}
      </main>
      <nav aria-label="Navegação principal" className="halo-nav pb-safe">
        <div>
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: true }}
              className="nav-item"
              activeProps={{ className: "nav-item-active", "aria-current": "page" }}
            >
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
