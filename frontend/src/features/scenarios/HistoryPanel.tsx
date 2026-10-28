import type { Analysis } from "../../domain/types";
import { money, dateTime } from "../../domain/calculations";
import { Icon } from "../../components/Icon";
import "./HistoryPanel.css";
export function HistoryPanel({
  history,
  selected,
  toggle,
  reuse,
  clear,
}: {
  history: Analysis[];
  selected: string[];
  toggle: (id: string) => void;
  reuse: (analysis: Analysis) => void;
  clear: () => void;
}) {
  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HISTÓRICO DA SESSÃO</span>
          <h2>
            Seus cenários <span className="count-badge">{history.length}</span>
          </h2>
        </div>
        <button
          className="button button-quiet"
          onClick={clear}
          disabled={!history.length}
        >
          <Icon name="trash" size={15} />
          Limpar histórico
        </button>
      </div>
      <p className="panel-description">
        Selecione de 2 a 5 cenários. O primeiro selecionado será a referência.
      </p>
      <div className="history-list">
        {history.map((item, index) => (
          <div
            className={
              "history-item " + (selected.includes(item.id) ? "selected" : "")
            }
            key={item.id}
          >
            <label className="history-select">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                disabled={!selected.includes(item.id) && selected.length >= 5}
                onChange={() => toggle(item.id)}
                aria-label={"Selecionar cenário " + (history.length - index)}
              />
              <span className="history-name">
                Cenário {history.length - index}
                <small>{dateTime(item.completedAt)} BRT</small>
              </span>
            </label>
            <div className="history-price">
              <strong>{money(item.valueUsd)}</strong>
              <span>
                {item.modelVersion.slice(0, 12)}
                {selected[0] === item.id && <em>Referência</em>}
              </span>
            </div>
            <button
              className="icon-button"
              onClick={() => reuse(item)}
              title={"Reutilizar cenário " + (history.length - index)}
              aria-label={"Reutilizar cenário " + (history.length - index)}
            >
              <Icon name="refresh" size={17} />
            </button>
          </div>
        ))}
      </div>
      <p className="history-caption">
        <Icon name="clock" size={14} /> Até 10 análises. O histórico é
        descartado ao recarregar ou fechar a página.
      </p>
    </section>
  );
}
