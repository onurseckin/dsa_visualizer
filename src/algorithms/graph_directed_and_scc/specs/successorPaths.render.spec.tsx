import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  DEFAULT_SUCCESSOR_INPUT,
  generateSuccessorPathsSteps,
  successorPaths,
} from "../successorPaths";

describe("successorPaths Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateSuccessorPathsSteps(DEFAULT_SUCCESSOR_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={successorPaths as AlgorithmDefinition}
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

    expect(
      screen.getAllByText(/Successor Paths & Floyd's Cycle Detection/i)[0],
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Analyzes functional graphs where every node has out-degree 1/i),
    ).toBeInTheDocument();
  });

  it("renders final step with computed cycle details", () => {
    const steps = generateSuccessorPathsSteps(DEFAULT_SUCCESSOR_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={successorPaths as AlgorithmDefinition}
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
    expect(screen.getAllByText(/Cycle Start/i).length).toBeGreaterThan(0);
  });
});
