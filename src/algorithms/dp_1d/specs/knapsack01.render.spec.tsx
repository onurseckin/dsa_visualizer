import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateKnapsack01Steps,
  DEFAULT_KNAPSACK_01_INPUT,
} from "../knapsack01";

describe("knapsack01 React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateKnapsack01Steps(DEFAULT_KNAPSACK_01_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["knapsack-01"]}
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
    expect(screen.getAllByText(/0\/1 Knapsack Problem/i)[0]).toBeInTheDocument();
  });

  it("renders ArrayVisualizer with generated snapshot steps", () => {
    const steps = generateKnapsack01Steps(DEFAULT_KNAPSACK_01_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("array");

    if (snapshot.kind === "array") {
      render(<ArrayVisualizer elements={snapshot.elements} title="Knapsack DP Table" />);
      expect(screen.getByText("Knapsack DP Table")).toBeInTheDocument();
    }
  });
});
