import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_PREFIX_SUM_INPUT, generatePrefixSumSteps, prefixSum } from "../prefixSum";

describe("PrefixSum React Component Spec", () => {
  it("renders algorithm title and problem header", () => {
    const steps = generatePrefixSumSteps(DEFAULT_PREFIX_SUM_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["prefix-sum"]}
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

    expect(screen.getByText("Prefix Sum")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(
      screen.getByText(/Prefix Sum is a precomputation technique that builds running totals/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Prefix Sum is a foundational precomputation technique/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: prefixSum.topicGuide.sections[0].heading }),
    ).toBeInTheDocument();
    expect(screen.getByText("Key terms")).toBeInTheDocument();
  });

  it("renders step explanation and auxiliary prefix sum array state", () => {
    const steps = generatePrefixSumSteps(DEFAULT_PREFIX_SUM_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["prefix-sum"]}
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

    expect(screen.getByText(/Example Range Query|Complete prefix array build|Verification step/i)).toBeInTheDocument();
    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
    // The computed prefix values are surfaced through the Visited row with a count.
    expect(screen.getByText(/Visited \(\d+\)/)).toBeInTheDocument();
  });
});
