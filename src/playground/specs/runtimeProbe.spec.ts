import { describe, expect, it, vi } from "vitest";

import { PYTHON_RUNNER_LOAD_EVENT, registerPythonRunnerProbe } from "../runtimeProbe";

describe("production Python runner probe", () => {
  it("keeps the runner lazy and imports it only once after the playground signal", () => {
    const target = new EventTarget();
    const load = vi.fn(async () => undefined);
    const unregister = registerPythonRunnerProbe(target, load);

    expect(load).not.toHaveBeenCalled();
    target.dispatchEvent(new Event(PYTHON_RUNNER_LOAD_EVENT));
    target.dispatchEvent(new Event(PYTHON_RUNNER_LOAD_EVENT));

    expect(load).toHaveBeenCalledOnce();
    unregister();
  });

  it("can unregister before the runner is requested", () => {
    const target = new EventTarget();
    const load = vi.fn(async () => undefined);
    const unregister = registerPythonRunnerProbe(target, load);

    unregister();
    target.dispatchEvent(new Event(PYTHON_RUNNER_LOAD_EVENT));

    expect(load).not.toHaveBeenCalled();
  });
});
