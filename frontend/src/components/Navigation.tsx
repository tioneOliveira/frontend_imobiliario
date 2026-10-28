import { Icon } from "./Icon";
import type { View } from "../domain/types";
export const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Visão geral", icon: "grid" },
  { id: "simulation", label: "Nova análise", icon: "plus" },
  { id: "scenarios", label: "Meus cenários", icon: "layers" },
];
export function Navigation({ view, count }: { view: View; count: number }) {
  return (
    <nav aria-label="Navegação principal">
      {VIEWS.map((item) => (
        <a
          key={item.id}
          href={"#" + item.id}
          className={"nav-link " + (view === item.id ? "active" : "")}
          aria-current={view === item.id ? "page" : undefined}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
          {item.id === "scenarios" && (
            <span className="nav-count">{count}</span>
          )}
        </a>
      ))}
    </nav>
  );
}
