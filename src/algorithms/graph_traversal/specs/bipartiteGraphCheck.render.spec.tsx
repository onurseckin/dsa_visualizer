import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import { DEFAULT_BIPARTITE_INPUT, bipartiteGraphCheck, generateBipartiteCheckSteps } from "../bipartiteGraphCheck";

describe("bipartiteGraphCheck Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateBipartiteCheckSteps(DEFAULT_BIPARTITE_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={bipartiteGraphCheck as AlgorithmDefinition}
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

    expect(screen.getAllByText(/Bipartite Graph Check/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Determines whether an undirected graph is bipartite/i)).toBeInTheDocument();
  });

  it("renders final step with bipartite check result", () => {
    const steps = generateBipartiteCheckSteps(DEFAULT_BIPARTITE_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={bipartiteGraphCheck as AlgorithmDefinition}
        currentStep={lastStep}
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
    expect(screen.getAllByText(/BIPARTITE/i).length).toBeGreaterThan(0);
  });
});
