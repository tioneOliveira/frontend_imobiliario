import type { ReactNode } from "react";
import type { View } from "../domain/types";
import { Navigation, VIEWS } from "./Navigation";
import { Icon } from "./Icon";
import "./AppShell.css";
export function AppShell({
  view,
  count,
  status,
  refresh,
  children,
}: {
  view: View;
  count: number;
  status: string;
  refresh: () => void;
  children: ReactNode;
}) {
  const ready = status === "ready";
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Habita, início">
          <span className="brand-mark">
            <Icon name="home" size={23} />
          </span>
          <span>
            habita<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">INTELIGÊNCIA IMOBILIÁRIA</div>
        <div className="nav-section-label">WORKSPACE</div>
        <Navigation view={view} count={count} />
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="eyebrow">
              <Icon name="shield" size={15} /> DADOS, NÃO PALPITES
            </span>
            <p>Mais contexto para explorar cada possibilidade.</p>
          </div>
          <a
            className="docs-link"
            href="https://houseprice-1793126048-13837.northcentralus.cloudapp.azure.com/docs#/"
            target="_blank"
            rel="noreferrer"
          >
            Sobre o modelo <Icon name="external" size={15} />
          </a>
          <div className="sidebar-footer">
            <span className="mini-mark">H</span>
            <span>
              Habita Analytics<small>Workspace de análise</small>
            </span>
            <span className="version-tag">v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>
            <strong>{VIEWS.find((v) => v.id === view)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className={"service-pill " + (ready ? "ready" : "")}
              onClick={refresh}
              title="Atualizar disponibilidade do modelo"
            >
              <span className="status-dot" />
              {ready
                ? "Modelo disponível"
                : status === "unavailable"
                  ? "Modelo indisponível"
                  : "Verificando modelo"}
              <Icon name="refresh" size={13} />
            </button>
            <div className="topbar-divider" />
            <span className="avatar" aria-label="Workspace Habita">
              H
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="page-footer">
          <span>
            Habita Analytics <span className="muted-dot">·</span> Inteligência
            para explorar possibilidades
          </span>
          <span>
            <Icon name="shield" size={13} /> Dados do California Housing
          </span>
        </footer>
      </div>
    </div>
  );
}
