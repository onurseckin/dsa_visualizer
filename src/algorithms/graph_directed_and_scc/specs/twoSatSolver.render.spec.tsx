import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import { DEFAULT_TWO_SAT_INPUT, generateTwoSatSteps, twoSatSolver } from "../twoSatSolver";

describe("twoSatSolver Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateTwoSatSteps(DEFAULT_TWO_SAT_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoSatSolver as AlgorithmDefinition}
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

    expect(screen.getAllByText(/2-SAT Solver/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Solves the 2-Satisfiability/i)).toBeInTheDocument();
  });

  it("renders final step with satisfiability result", () => {
    const steps = generateTwoSatSteps(DEFAULT_TWO_SAT_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={twoSatSolver as AlgorithmDefinition}
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
    expect(screen.getAllByText(/SATISFIABLE/i).length).toBeGreaterThan(0);
  });
});
