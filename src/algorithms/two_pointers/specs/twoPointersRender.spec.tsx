import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../components/MainLayout";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateTwoPointersSteps, twoPointers } from "../twoPointers";

describe("TwoPointers React Component Spec", () => {
  it("renders algorithm title and problem description", () => {
    const steps = generateTwoPointersSteps(twoPointers.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["two-pointers"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Two Pointers (Subarray Sum)")).toBeInTheDocument();

    expect(
      screen.getAllByText(/Finds a contiguous subarray that sums to a target value/i)[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText(/variable-size sliding window/i)[0]).toBeInTheDocument();
  });

  it("renders step visualizer with target sum found status", () => {
    const steps = generateTwoPointersSteps(twoPointers.defaultInput);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["two-pointers"]}
        currentStep={lastStep}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText(/Return the window \[1\.\.3\]/i)).toBeInTheDocument();
  });
});
