import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_TWO_SUM_INPUT, generateTwoSumSteps, twoSum } from "../twoSum";

describe("TwoSum React Component Spec", () => {
  it("renders title and algorithm description", () => {
    const steps = generateTwoSumSteps(DEFAULT_TWO_SUM_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["two-sum"]}
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

    expect(screen.getByText("Two Sum")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(
      screen.getByText(/Two Sum determines the/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Two Sum is the fundamental paradigm shift/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: twoSum.topicGuide.sections[0].heading }),
    ).toBeInTheDocument();
    expect(screen.getByText("Key terms")).toBeInTheDocument();
  });

  it("renders step visualizer with hash map auxiliary state", () => {
    const steps = generateTwoSumSteps(DEFAULT_TWO_SUM_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["two-sum"]}
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

    expect(screen.getByText(/Verification step|Return matching indices/i)).toBeInTheDocument();
  });
});
