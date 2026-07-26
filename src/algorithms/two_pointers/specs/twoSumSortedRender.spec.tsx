import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../components/MainLayout";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_TWO_SUM_SORTED_INPUT, generateTwoSumSortedSteps } from "../twoSumSorted";

describe("TwoSumSorted React Component Spec", () => {
  it("renders title and algorithm information correctly", () => {
    const steps = generateTwoSumSortedSteps(DEFAULT_TWO_SUM_SORTED_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["two-sum-sorted"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Two Sum II (Sorted)")).toBeInTheDocument();

    expect(screen.getAllByText(/Find two numbers in a sorted array/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/converging two-pointer technique/i)[0]).toBeInTheDocument();
  });

  it("renders step visualizer with two pointers and match status", () => {
    const steps = generateTwoSumSortedSteps(DEFAULT_TWO_SUM_SORTED_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["two-sum-sorted"]}
        currentStep={lastStep}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText(/Return the pair \[0, 6\]/i)).toBeInTheDocument();
    expect(screen.getAllByText("MATCH").length).toBeGreaterThan(0);
  });
});
