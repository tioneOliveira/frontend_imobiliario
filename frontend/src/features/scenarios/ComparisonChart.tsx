import type { ComparisonRow } from "../../domain/types";
import { money } from "../../domain/calculations";
export function ComparisonChart({ rows }: { rows: ComparisonRow[] }) {
  const max = Math.max(...rows.map((row) => row.analysis.valueUsd), 1);
  return (
    <svg
      className="comparison-chart"
      viewBox={"0 0 600 " + (rows.length * 70 + 24)}
      role="img"
      aria-labelledby="chart-title chart-desc"
    >
      <title id="chart-title">Comparação dos valores estimados em USD</title>
      <desc id="chart-desc">
        Barras dos cenários selecionados. Os valores completos e as diferenças
        estão na tabela abaixo.
      </desc>
      {rows.map((row, index) => (
        <g
          key={row.analysis.id}
          transform={"translate(0," + (index * 70 + 16) + ")"}
        >
          <text x="0" y="17" className="chart-label">
            {"Cenário " + (index + 1)}
          </text>
          <rect
            x="100"
            y="0"
            width="480"
            height="25"
            rx="5"
            fill="var(--surface-3)"
          />
          <rect
            x="100"
            y="0"
            width={Math.max(2, (row.analysis.valueUsd / max) * 480)}
            height="25"
            rx="5"
            fill={index === 0 ? "var(--accent)" : "var(--chart-secondary)"}
          />
          <text x="100" y="46" className="chart-label">
            {money(row.analysis.valueUsd)}
          </text>
        </g>
      ))}
    </svg>
  );
}
