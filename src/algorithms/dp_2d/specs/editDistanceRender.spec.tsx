import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GridVisualizer from "../../../components/primitives/GridVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateEditDistanceSteps, DEFAULT_EDIT_DISTANCE_INPUT } from "../editDistance";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("editDistance React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateEditDistanceSteps(DEFAULT_EDIT_DISTANCE_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["edit-distance"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/Edit Distance/i)[0]).toBeInTheDocument();
  });

  it("renders GridVisualizer with initial DP snapshot", () => {
    const steps = generateEditDistanceSteps(DEFAULT_EDIT_DISTANCE_INPUT);
    const snapshot = steps[0].primarySnapshot as GridVisualSnapshot;

    render(<GridVisualizer grid={snapshot.grid} title="Edit Distance DP Table" />);

    expect(screen.getByText("Edit Distance DP Table")).toBeInTheDocument();
  });

  it("renders active cell and comparison cells during tabulation", () => {
    const steps = generateEditDistanceSteps(DEFAULT_EDIT_DISTANCE_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const snapshot = midStep.primarySnapshot as GridVisualSnapshot;

    const { container } = render(<GridVisualizer grid={snapshot.grid} showDistance={true} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
