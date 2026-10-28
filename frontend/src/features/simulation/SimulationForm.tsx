import type { AppState, FieldName, HousingInstance } from "../../domain/types";
import { FIELDS } from "../../../shared/housing.mjs";
import { EXAMPLE } from "./example";
import { Icon } from "../../components/Icon";
import "./SimulationForm.css";
interface Props {
  state: AppState;
  ready: boolean;
  submit: () => void;
  clear: () => void;
  load: (profile: HousingInstance) => void;
  edit: (field: FieldName, value: string) => void;
  retryAt: number | null;
}
export function SimulationForm({
  state,
  ready,
  submit,
  clear,
  load,
  edit,
  retryAt,
}: Props) {
  const waiting = retryAt !== null;
  return (
    <section className="panel simulation-form">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PERFIL DA REGIÃO</span>
          <h2>Os dados do seu cenário</h2>
        </div>
        <button
          className="button button-quiet"
          type="button"
          onClick={() => load(EXAMPLE)}
        >
          <Icon name="layers" size={16} />
          Usar exemplo
        </button>
      </div>
      <p className="panel-description">
        Informe as características médias do grupo regional. Você pode ajustar
        um exemplo para começar.
      </p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="fields-grid">
          {FIELDS.map((field, index) => (
            <div className="field" key={field.key}>
              <label htmlFor={field.key}>
                {field.label}
                <span aria-hidden="true"> *</span>
              </label>
              <div className="input-wrap">
                <input
                  id={field.key}
                  name={field.key}
                  value={state.fields[field.key]}
                  onChange={(event) => edit(field.key, event.target.value)}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  aria-invalid={!!state.fieldErrors[field.key]}
                  aria-describedby={
                    field.key +
                    "-help" +
                    (state.fieldErrors[field.key]
                      ? " " + field.key + "-error"
                      : "")
                  }
                  placeholder={
                    index === 6 ? "37,88" : index === 7 ? "-122,23" : "0,00"
                  }
                />
                {index === 1 && <span className="input-unit">anos</span>}
              </div>
              <span className="field-help" id={field.key + "-help"}>
                {field.help}
              </span>
              {state.fieldErrors[field.key] && (
                <span className="field-error" id={field.key + "-error"}>
                  {state.fieldErrors[field.key]}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="form-note">
          <Icon name="info" size={16} />
          <span>
            Use vírgula ou ponto para decimais, sem separadores de milhar. Todos
            os campos são obrigatórios.
          </span>
        </div>
        {state.error && (
          <div className="alert alert-error" role="alert">
            <strong>Não foi possível concluir</strong>
            <p>{state.error.message}</p>
            {state.error.request_id && (
              <small>Referência: {state.error.request_id}</small>
            )}
          </div>
        )}
        {waiting && (
          <div className="alert" role="status">
            Limite de consultas atingido. Aguarde até{" "}
            {new Date(retryAt!).toLocaleTimeString("pt-BR")} para tentar
            novamente.
          </div>
        )}
        <div className="form-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={clear}
          >
            Limpar campos
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={!ready || !!state.active || waiting}
          >
            {state.active ? (
              <>
                <span className="spinner" />
                Analisando cenário…
              </>
            ) : (
              <>
                Gerar análise <Icon name="arrow" size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
