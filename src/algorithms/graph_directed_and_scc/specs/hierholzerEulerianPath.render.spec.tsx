import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_HIERHOLZER_INPUT, generateHierholzerSteps, hierholzerEulerianPath } from "../hierholzerEulerianPath";

describe("hierholzerEulerianPath Render Spec", () => {
  it("renders algorithm title and description in MainLayout", () => {
    const steps = generateHierholzerSteps(DEFAULT_HIERHOLZER_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={hierholzerEulerianPath as AlgorithmDefinition}
        currentStep={steps[0]}
        panels={{
          problem: true,
          solution: true,
          visualizer: true,
          code: true,
          tutorial: true,
          auxiliary: true,
        }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getAllByText(/Hierholzer's Algorithm/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Finds an Eulerian path or Eulerian circuit/i)).toBeInTheDocument();
  });

  it("renders steps and auxiliary panel stack updates", () => {
    const steps = generateHierholzerSteps(DEFAULT_HIERHOLZER_INPUT);
    const midStep = steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["hierholzer-eulerian-path"] || (hierholzerEulerianPath as AlgorithmDefinition)}
        currentStep={midStep}
        panels={{
          problem: true,
          solution: true,
          visualizer: true,
          code: true,
          tutorial: true,
          auxiliary: true,
        }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />
    );

    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
    expect(screen.getAllByText(/Stack/i).length).toBeGreaterThan(0);
  });
});
