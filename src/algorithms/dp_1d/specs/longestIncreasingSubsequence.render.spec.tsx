import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateLisSteps, DEFAULT_LIS_INPUT } from "../longestIncreasingSubsequence";

describe("longestIncreasingSubsequence React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateLisSteps(DEFAULT_LIS_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["longest-increasing-subsequence"]}
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
    expect(screen.getAllByText(/Longest Increasing Subsequence/i)[0]).toBeInTheDocument();
  });

  it("renders ArrayVisualizer with generated snapshot steps", () => {
    const steps = generateLisSteps(DEFAULT_LIS_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("array");

    if (snapshot.kind === "array") {
      render(<ArrayVisualizer elements={snapshot.elements} title="LIS DP Table" />);
      expect(screen.getByText("LIS DP Table")).toBeInTheDocument();
    }
  });
});
