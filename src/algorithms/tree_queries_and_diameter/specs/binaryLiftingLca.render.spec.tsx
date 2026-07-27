import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  binaryLiftingLca,
  DEFAULT_BINARY_LIFTING_LCA_INPUT,
  generateBinaryLiftingLcaSteps,
} from "../binaryLiftingLca";

describe("BinaryLiftingLca Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateBinaryLiftingLcaSteps(DEFAULT_BINARY_LIFTING_LCA_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={binaryLiftingLca as AlgorithmDefinition}
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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Binary Lifting for LCA/i);
  });

  it("renders tree canvas and auxiliary panel for binary lifting steps", () => {
    const steps = generateBinaryLiftingLcaSteps(DEFAULT_BINARY_LIFTING_LCA_INPUT);
    const midStep = steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={binaryLiftingLca as AlgorithmDefinition}
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
