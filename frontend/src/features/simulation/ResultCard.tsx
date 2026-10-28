import type { Analysis } from "../../domain/types";
import { money, dateTime, decimal } from "../../domain/calculations";
import { FIELDS } from "../../../shared/housing.mjs";
import { Icon } from "../../components/Icon";
import "./ResultCard.css";
export function ResultCard({
  result,
  busy,
  dirty,
}: {
  result: Analysis | null;
  busy: boolean;
  dirty: boolean;
}) {
  return (
    <aside className="result-column">
      <section
        className={"panel result-card " + (result ? "has-result" : "")}
        aria-live="polite"
      >
        <div className="panel-heading">
          <span className="eyebrow">RESULTADO DA ANÁLISE</span>
          <Icon name="chart" size={18} />
        </div>
        {result ? (
          <>
            <span className="result-badge">
              {dirty ? "Análise anterior" : "Estimativa concluída"}
            </span>
            <p className="result-label">Valor mediano estimado</p>
            <div className="result-price">{money(result.valueUsd)}</div>
            <div className="result-currency">
              USD <span>·</span> Dólar americano
            </div>
            <div className="result-divider" />
            <dl className="result-meta">
              <div>
                <dt>Modelo</dt>
                <dd>{result.modelVersion}</dd>
              </div>
              <div>
                <dt>Consulta</dt>
                <dd>{dateTime(result.completedAt)} BRT</dd>
              </div>
            </dl>
            {dirty && (
              <div className="alert">
                Os campos foram alterados. Gere uma nova análise para este
                perfil.
              </div>
            )}
            {result.atypicalZero && (
              <div className="alert">
                O modelo retornou zero, um valor atípico. Interprete com
                cautela.
              </div>
            )}
            <details className="profile-details">
              <summary>Ver os dados desta análise</summary>
              <dl>
                {FIELDS.map((field) => (
                  <div key={field.key}>
                    <dt>{field.label}</dt>
                    <dd>{decimal(result.profile[field.key], 6)}</dd>
                  </div>
                ))}
              </dl>
              <small>Referência: {result.id}</small>
            </details>
          </>
        ) : (
          <div className="empty-result">
            <div className={"result-orbit " + (busy ? "is-loading" : "")}>
              <Icon name={busy ? "refresh" : "home"} size={32} />
            </div>
            <h3>{busy ? "Analisando seu cenário" : "Uma nova perspectiva"}</h3>
            <p>
              {busy
                ? "Consultando o modelo para encontrar a estimativa deste perfil."
                : "Preencha o perfil e gere uma análise para visualizar a estimativa."}
            </p>
            <span className="empty-result-tag">
              <Icon name="shield" size={13} /> Estimativa baseada em dados
            </span>
          </div>
        )}
        {busy && result && (
          <p role="status" className="processing">
            <span className="spinner" />
            Consultando novo cenário…
          </p>
        )}
      </section>
      <div className="context-note">
        <Icon name="info" size={17} />
        <p>
          Estimativa de valor mediano <strong>regional</strong>, baseada no
          California Housing, originado no censo de 1990. É uma referência
          histórica para simulação, sem avaliação atual de um imóvel individual
          ou recomendação financeira.
        </p>
      </div>
    </aside>
  );
}
