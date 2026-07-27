import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateCountingBitsSteps, DEFAULT_COUNTING_BITS_INPUT } from "../countingBits";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("countingBits React component spec", () => {
  it("renders ArrayVisualizer with counting bits snapshot", () => {
    const steps = generateCountingBitsSteps(DEFAULT_COUNTING_BITS_INPUT);
    const snapshot = steps[steps.length - 1].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Counting Bits DP Array" />);

    expect(screen.getByText("Counting Bits DP Array")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with countingBits algorithm", () => {
    const steps = generateCountingBitsSteps(DEFAULT_COUNTING_BITS_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["counting-bits"]}
        currentStep={steps[0]}
        panels={{
          problem: true,
          solution: true,
          visualizer: true,
          code: true,
          tutorial: true,
          auxiliary: true,
        }}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/Counting Bits/i)[0]).toBeInTheDocument();
  });
});
