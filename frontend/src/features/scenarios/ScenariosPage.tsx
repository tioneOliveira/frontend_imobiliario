import type { Analysis, AppState } from "../../domain/types";
import { compareAnalyses } from "../../domain/comparison";
import { HistoryPanel } from "./HistoryPanel";
import { ComparisonTable } from "./ComparisonTable";
import { ComparisonChart } from "./ComparisonChart";
import { Icon } from "../../components/Icon";
export function ScenariosPage({
  state,
  toggle,
  reuse,
  clear,
  onSimulate,
}: {
  state: AppState;
  toggle: (id: string) => void;
  reuse: (a: Analysis) => void;
  clear: () => void;
  onSimulate: () => void;
}) {
  const analyses = state.selectedIds
      .map((id) => state.history.find((a) => a.id === id))
      .filter((a): a is Analysis => !!a),
    comparison = compareAnalyses(analyses);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">POSSIBILIDADES LADO A LADO</div>
          <h1>Compare perspectivas.</h1>
          <p>Seus resultados, com as diferenças que merecem atenção.</p>
        </div>
        <button className="button button-primary" onClick={onSimulate}>
          <Icon name="plus" size={17} />
          Novo cenário
        </button>
      </div>
      {!state.history.length ? (
        <section className="panel empty-scenarios">
          <div className="result-orbit">
            <Icon name="layers" size={32} />
          </div>
          <h2>Ainda há possibilidades para explorar</h2>
          <p>
            Gere sua primeira análise para começar um histórico de cenários.
          </p>
          <button className="button button-primary" onClick={onSimulate}>
            Criar primeiro cenário
            <Icon name="arrow" size={17} />
          </button>
        </section>
      ) : (
        <>
          <HistoryPanel
            history={state.history}
            selected={state.selectedIds}
            toggle={toggle}
            reuse={reuse}
            clear={clear}
          />
          <section className="panel comparison-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">COMPARAÇÃO DE CENÁRIOS</span>
                <h2>
                  {analyses.length >= 2
                    ? "Diferentes perfis, novas perspectivas"
                    : "O que muda entre seus cenários?"}
                </h2>
              </div>
              <span className="tag">{analyses.length} / 5 SELECIONADOS</span>
            </div>
            {state.referenceChanged && (
              <div className="alert" role="status">
                A referência foi atualizada para o primeiro cenário da seleção
                atual.
              </div>
            )}
            {analyses.length < 2 ? (
              <div className="comparison-empty">
                <Icon name="chart" size={30} />
                <p>
                  Selecione pelo menos dois cenários no histórico para comparar.
                </p>
              </div>
            ) : (
              <>
                {comparison.versionsDiffer && (
                  <div className="alert">
                    Os cenários usam versões diferentes do modelo. As diferenças
                    não se devem apenas às entradas.
                  </div>
                )}
                <ComparisonChart rows={comparison.rows} />
                <ComparisonTable rows={comparison.rows} />
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}
