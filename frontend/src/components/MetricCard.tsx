import type { ReactNode } from "react";
import { Icon } from "./Icon";
export function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <section className={"metric-card " + (accent ? "metric-accent" : "")}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </section>
  );
}
