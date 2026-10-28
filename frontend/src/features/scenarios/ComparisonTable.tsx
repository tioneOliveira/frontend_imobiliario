import type { ComparisonRow } from "../../domain/types";
import { money, decimal } from "../../domain/calculations";
import "./Comparison.css";
export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <caption className="sr-only">
          Valores estimados e diferenças em relação ao primeiro cenário
          selecionado
        </caption>
        <thead>
          <tr>
            <th scope="col">Cenário</th>
            <th scope="col">Estimativa (USD)</th>
            <th scope="col">Diferença</th>
            <th scope="col">Variação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.analysis.id}>
              <th scope="row">
                Selecionado {index + 1}
                {index === 0 && <small>Referência</small>}
              </th>
              <td data-label="Estimativa">{money(row.analysis.valueUsd)}</td>
              <td data-label="Diferença">{money(row.absoluteDifferenceUsd)}</td>
              <td data-label="Variação">
                {row.percentageDifference === null
                  ? "Indisponível"
                  : decimal(row.percentageDifference, 2) + "%"}
                {row.percentageDifference === null && (
                  <small>
                    {rows[0]?.analysis.valueUsd === 0
                      ? "Referência igual a zero"
                      : "Cálculo fora do intervalo numérico"}
                  </small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows[0]?.analysis.valueUsd === 0 && (
        <p className="panel-description">
          Variação percentual indisponível porque a referência é zero.
        </p>
      )}
    </div>
  );
}
