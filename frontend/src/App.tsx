import { useEffect, useState } from "react";
import type { PresentationConfig, View } from "./domain/types";
import { api } from "./services/client";
import { parseConfig } from "./services/response-validation";
import { AppShell } from "./components/AppShell";
import { OverviewDashboard } from "./features/overview/OverviewDashboard";
import { useModelInfo } from "./features/overview/useModelInfo";
import { useSimulation } from "./features/simulation/useSimulation";
import { SimulationForm } from "./features/simulation/SimulationForm";
import { ResultCard } from "./features/simulation/ResultCard";
import { ScenariosPage } from "./features/scenarios/ScenariosPage";
import { Icon } from "./components/Icon";
function readView(): View {
  const hash = window.location.hash.slice(1);
  return hash === "simulation" || hash === "scenarios" ? hash : "overview";
}
export default function App() {
  const [config, setConfig] = useState<PresentationConfig | null>(null),
    [configError, setConfigError] = useState(false),
    [view, setView] = useState<View>(readView);
  const simulation = useSimulation(config),
    { state, dispatch } = simulation;
  const info = useModelInfo(state.result?.modelVersion);
  useEffect(() => {
    const controller = new AbortController();
    api("/config", { signal: controller.signal })
      .then(parseConfig)
      .then((value) => {
        if (!controller.signal.aborted) setConfig(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfigError(true);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const change = () => setView(readView());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const openSimulation = () => {
    window.location.hash = "simulation";
    setView("simulation");
  };
  return (
    <AppShell
      view={view}
      count={state.history.length}
      status={info.status}
      refresh={info.refresh}
    >
      {configError && (
        <div className="alert alert-error" role="alert">
          Não foi possível carregar a configuração da aplicação.{" "}
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      )}
      {view === "overview" ? (
        <OverviewDashboard
          result={state.result}
          history={state.history}
          model={info.model}
          config={config}
          onSimulate={openSimulation}
        />
      ) : view === "simulation" ? (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">UM PERFIL. NOVAS POSSIBILIDADES.</div>
              <h1>Explore o seu cenário.</h1>
              <p>
                Transforme características regionais em uma perspectiva de
                valor.
              </p>
            </div>
            <span className="tag">
              <Icon name="shield" size={14} /> MODELO PUBLICADO
            </span>
          </div>
          <div className="simulation-layout">
            <SimulationForm
              state={state}
              ready={!!config}
              submit={() => void simulation.submit()}
              clear={simulation.clear}
              load={simulation.load}
              edit={(field, value) => dispatch({ type: "edit", field, value })}
              retryAt={simulation.retryAt}
            />
            <ResultCard
              result={state.result}
              busy={!!state.active}
              dirty={
                !!state.result &&
                state.result.submittedRevision !== state.revision
              }
            />
          </div>
        </>
      ) : (
        <ScenariosPage
          state={state}
          toggle={(id) => dispatch({ type: "select", id })}
          reuse={(analysis) => {
            simulation.load({ ...analysis.profile });
            openSimulation();
          }}
          clear={() => dispatch({ type: "clearHistory" })}
          onSimulate={openSimulation}
        />
      )}
    </AppShell>
  );
}
