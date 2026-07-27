import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import { DEFAULT_DAG_DP_INPUT, dagDpLongestPath, generateDagDpSteps } from "../dagDpLongestPath";

describe("dagDpLongestPath Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateDagDpSteps(DEFAULT_DAG_DP_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={dagDpLongestPath as AlgorithmDefinition}
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
      />,
    );

    expect(screen.getAllByText(/Longest Path in a DAG/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Finds the longest simple path in a Directed Acyclic Graph/i),
    ).toBeInTheDocument();
  });

  it("renders final step with longest path result", () => {
    const steps = generateDagDpSteps(DEFAULT_DAG_DP_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={dagDpLongestPath as AlgorithmDefinition}
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
      />,
    );

    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
    expect(screen.getAllByText(/Longest Path/i).length).toBeGreaterThan(0);
  });
});
