import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  DEFAULT_EULER_TOUR_INPUT,
  eulerTourTechnique,
  generateEulerTourTechniqueSteps,
} from "../eulerTourTechnique";

describe("EulerTourTechnique Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateEulerTourTechniqueSteps(DEFAULT_EULER_TOUR_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={eulerTourTechnique as AlgorithmDefinition}
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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Euler Tour Technique/i);
  });

  it("renders tree visualizer and auxiliary panel for euler tour steps", () => {
    const steps = generateEulerTourTechniqueSteps(DEFAULT_EULER_TOUR_INPUT);
    const midStep = steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={eulerTourTechnique as AlgorithmDefinition}
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
