export const PYTHON_RUNNER_LOAD_EVENT = "dsa:python-runner-load";

type RunnerLoader = () => Promise<unknown>;

const loadRunner: RunnerLoader = () => import("./pyodideRunnerClient");

export function registerPythonRunnerProbe(
  target: EventTarget,
  load: RunnerLoader = loadRunner,
): () => void {
  let requested = false;
  const listener = () => {
    if (requested) return;
    requested = true;
    void load().catch(() => undefined);
  };

  target.addEventListener(PYTHON_RUNNER_LOAD_EVENT, listener);
  return () => target.removeEventListener(PYTHON_RUNNER_LOAD_EVENT, listener);
}
