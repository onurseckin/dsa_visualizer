import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateIntervalSchedulingSteps,
  DEFAULT_INTERVAL_SCHEDULING_INPUT,
} from "../intervalScheduling";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("intervalScheduling React component spec", () => {
  it("renders ArrayVisualizer with Interval Scheduling snapshot", () => {
    const steps = generateIntervalSchedulingSteps(DEFAULT_INTERVAL_SCHEDULING_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Interval Scheduling" />);

    expect(screen.getByText("Interval Scheduling")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with intervalScheduling algorithm", () => {
    const steps = generateIntervalSchedulingSteps(DEFAULT_INTERVAL_SCHEDULING_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["interval-scheduling"]}
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

    expect(screen.getAllByText(/Interval Scheduling/i)[0]).toBeInTheDocument();
  });
});
