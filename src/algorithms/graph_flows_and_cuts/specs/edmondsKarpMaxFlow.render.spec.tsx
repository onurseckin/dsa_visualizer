import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  DEFAULT_EDMONDS_KARP_INPUT,
  edmondsKarpMaxFlow,
  generateEdmondsKarpSteps,
} from "../edmondsKarpMaxFlow";

describe("edmondsKarpMaxFlow Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateEdmondsKarpSteps(DEFAULT_EDMONDS_KARP_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={edmondsKarpMaxFlow as AlgorithmDefinition}
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

    expect(screen.getAllByText(/Edmonds-Karp Max Flow/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Edmonds-Karp computes the Maximum Flow in a flow network/i),
    ).toBeInTheDocument();
  });

  it("renders final step with max flow result", () => {
    const steps = generateEdmondsKarpSteps(DEFAULT_EDMONDS_KARP_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={edmondsKarpMaxFlow as AlgorithmDefinition}
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
    expect(screen.getAllByText(/MAX FLOW/i).length).toBeGreaterThan(0);
  });
});
