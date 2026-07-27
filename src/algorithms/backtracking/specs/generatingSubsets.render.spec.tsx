import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  DEFAULT_GENERATING_SUBSETS_INPUT,
  generateGeneratingSubsetsSteps,
  generatingSubsets,
} from "../generatingSubsets";

describe("GeneratingSubsets Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateGeneratingSubsetsSteps(DEFAULT_GENERATING_SUBSETS_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={generatingSubsets as AlgorithmDefinition}
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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Generating Subsets/i);
  });

  it("renders array visualizer and auxiliary panel for subset steps", () => {
    const steps = generateGeneratingSubsetsSteps(DEFAULT_GENERATING_SUBSETS_INPUT);
    const midStep = steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={generatingSubsets as AlgorithmDefinition}
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
