import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  DEFAULT_DE_BRUIJN_INPUT,
  deBruijnSequence,
  generateDeBruijnSteps,
} from "../deBruijnSequence";

describe("deBruijnSequence Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateDeBruijnSteps(DEFAULT_DE_BRUIJN_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={deBruijnSequence as AlgorithmDefinition}
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

    expect(screen.getAllByText(/De Bruijn Sequence/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/A De Bruijn sequence B\(k, n\) is a cyclic sequence/i),
    ).toBeInTheDocument();
  });

  it("renders final step with calculated sequence", () => {
    const steps = generateDeBruijnSteps(DEFAULT_DE_BRUIJN_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={deBruijnSequence as AlgorithmDefinition}
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
    expect(screen.getAllByText(/De Bruijn Sequence/i).length).toBeGreaterThan(0);
  });
});
