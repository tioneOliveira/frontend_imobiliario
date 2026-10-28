import type {
  Analysis,
  ModelInfo,
  PresentationConfig,
} from "../../domain/types";
import { money, decimal, dateTime } from "../../domain/calculations";
import { MetricCard } from "../../components/MetricCard";
import { Icon } from "../../components/Icon";
interface Props {
  result: Analysis | null;
  history: Analysis[];
  model: ModelInfo | null;
  config: PresentationConfig | null;
  onSimulate: () => void;
}
export function OverviewDashboard({
  result,
  history,
  model,
  config,
  onSimulate,
}: Props) {
  const eligible =
    model && (!result || model.model_version === result.modelVersion);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SEU RADAR IMOBILIÁRIO</div>
          <h1>
            Uma visão mais clara.
            <br />
            <span>Decisões com mais contexto.</span>
          </h1>
          <p>Explore estimativas, entenda os dados e compare possibilidades.</p>
        </div>
        <button className="button button-primary" onClick={onSimulate}>
          <Icon name="plus" size={18} />
          Nova análise
        </button>
      </div>
      <div className="metrics-grid">
        <MetricCard
          label="VALOR MEDIANO ESTIMADO"
          value={result ? money(result.valueUsd) : "—"}
          detail={
            result
              ? "Última análise · " + dateTime(result.completedAt) + " BRT"
              : "Seu próximo cenário começa aqui"
          }
          icon="home"
          accent
        />
        <MetricCard
          label="CENÁRIOS NO HISTÓRICO"
          value={
            <>
              {history.length}
              <span className="metric-suffix">/ 10</span>
            </>
          }
          detail="Comparações da sessão atual"
          icon="layers"
        />
        <MetricCard
          label="MODELO EM ANÁLISE"
          value={
            model
              ? {
                  random_forest: "Random Forest",
                  linear: "Linear",
                  ridge: "Ridge",
                  lasso: "Lasso",
                  decision_tree: "Árvore de decisão",
                }[model.candidate_family] || model.candidate_family
              : "—"
          }
          detail={
            model
              ? "Versão " + model.model_version.slice(0, 12)
              : "Aguardando informações do modelo"
          }
          icon="chart"
        />
      </div>
      <div className="overview-grid">
        <section className="panel landscape-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">EXPLORAR POSSIBILIDADES</span>
              <h2>Do perfil à perspectiva</h2>
            </div>
            <span className="tag">CALIFORNIA HOUSING</span>
          </div>
          <div className="landscape-grid" aria-hidden="true">
            <span className="landscape-ring ring-one" />
            <span className="landscape-ring ring-two" />
            <span className="landscape-ring ring-three" />
            <div className="landscape-house">
              <Icon name="home" size={42} />
            </div>
          </div>
          <div className="landscape-content">
            <span className="small-kicker">DADOS QUE ABREM CAMINHOS</span>
            <h3>
              {result
                ? "Um cenário é só o começo."
                : "Encontre o ponto de partida."}
            </h3>
            <p>
              {result
                ? "Ajuste as características regionais e descubra como a estimativa muda. Seus cenários ficam juntos nesta sessão."
                : "Renda, localização e características da região. Oito atributos para explorar uma estimativa do modelo."}
            </p>
            <button className="button button-secondary" onClick={onSimulate}>
              Explorar um cenário
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="panel-bottom">
            <Icon name="shield" size={14} />
            <span>
              Resultados do modelo publicado. Nenhuma cotação ou tendência
              simulada.
            </span>
          </div>
        </section>
        <section className="panel model-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TRANSPARÊNCIA DO MODELO</span>
              <h2>Além do resultado</h2>
            </div>
            <Icon name="info" size={18} />
          </div>
          <p className="panel-description">
            Indicadores de avaliação para entender o modelo, sem promessas de
            acerto individual.
          </p>
          {model && !eligible && (
            <div className="alert">
              Estas métricas são do modelo atual, de uma versão diferente da
              última análise.
            </div>
          )}
          <dl className="model-metrics">
            <div>
              <dt>
                MAE <span>Erro absoluto médio</span>
              </dt>
              <dd>
                {model && config
                  ? money(model.metrics.mae * config.prediction_multiplier)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>
                RMSE <span>Raiz do erro quadrático médio</span>
              </dt>
              <dd>
                {model && config
                  ? money(model.metrics.rmse * config.prediction_multiplier)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>
                R² <span>Coeficiente de determinação</span>
              </dt>
              <dd>{model ? decimal(model.metrics.r2, 4) : "—"}</dd>
            </div>
          </dl>
          <div className="model-source">
            <Icon name="layers" size={16} />
            <div>
              <strong>{model?.dataset_version || "Dados do modelo"}</strong>
              <span>
                {model
                  ? "Atualizado em " + dateTime(model.trained_at) + " BRT"
                  : "Informações adicionais indisponíveis"}
              </span>
            </div>
          </div>
        </section>
      </div>
      <section className="steps-strip">
        <div>
          <span className="step-number">01</span>
          <div>
            <h3>Defina o perfil</h3>
            <p>Características médias de uma região.</p>
          </div>
        </div>
        <Icon name="arrow" size={17} />
        <div>
          <span className="step-number">02</span>
          <div>
            <h3>Explore a estimativa</h3>
            <p>Um resultado real, com contexto.</p>
          </div>
        </div>
        <Icon name="arrow" size={17} />
        <div>
          <span className="step-number">03</span>
          <div>
            <h3>Compare cenários</h3>
            <p>Possibilidades lado a lado.</p>
          </div>
        </div>
      </section>
    </>
  );
}
