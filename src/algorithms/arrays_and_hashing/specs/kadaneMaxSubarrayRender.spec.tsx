import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateKadaneMaxSubarraySteps, kadaneMaxSubarray } from "../kadaneMaxSubarray";

describe("KadaneMaxSubarray React Component Spec", () => {
  it("renders algorithm title and problem description", () => {
    const steps = generateKadaneMaxSubarraySteps(kadaneMaxSubarray.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["kadane-max-subarray"]}
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

    expect(screen.getByText("Kadane's Algorithm (Maximum Subarray)")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(
      screen.getByText(/Kadane's Algorithm finds the maximum sum of a contiguous subarray/i),
    ).toBeInTheDocument();
    expect(screen.getByText(kadaneMaxSubarray.topicGuide.overview)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: kadaneMaxSubarray.topicGuide.sections[0].heading }),
    ).toBeInTheDocument();
    expect(screen.getByText("Key terms")).toBeInTheDocument();
  });

  it("renders step explanation for completed state", () => {
    const steps = generateKadaneMaxSubarraySteps(kadaneMaxSubarray.defaultInput);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["kadane-max-subarray"]}
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

    expect(screen.getByText(/Kadane's scan complete/i)).toBeInTheDocument();
  });
});
