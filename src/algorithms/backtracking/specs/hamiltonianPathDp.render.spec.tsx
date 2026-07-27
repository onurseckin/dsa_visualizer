import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  DEFAULT_HAMILTONIAN_PATH_INPUT,
  generateHamiltonianPathDpSteps,
  hamiltonianPathDp,
} from "../hamiltonianPathDp";

describe("HamiltonianPathDp Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateHamiltonianPathDpSteps(DEFAULT_HAMILTONIAN_PATH_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={hamiltonianPathDp as AlgorithmDefinition}
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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Hamiltonian Path & Circuit/i);
  });

  it("renders graph canvas and auxiliary panel", () => {
    const steps = generateHamiltonianPathDpSteps(DEFAULT_HAMILTONIAN_PATH_INPUT);
    const midStep = steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={hamiltonianPathDp as AlgorithmDefinition}
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
      />,
    );

    expect(screen.getAllByTestId("canvas-container")[0]).toBeInTheDocument();
    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
  });
});
