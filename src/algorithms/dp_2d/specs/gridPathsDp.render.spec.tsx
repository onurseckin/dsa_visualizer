import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GridVisualizer from "../../../components/primitives/GridVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateGridPathsDpSteps,
  DEFAULT_GRID_PATHS_INPUT,
} from "../gridPathsDp";

describe("gridPathsDp React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateGridPathsDpSteps(DEFAULT_GRID_PATHS_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["grid-paths-dp"]}
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
    expect(screen.getAllByText(/Grid Paths Dynamic Programming/i)[0]).toBeInTheDocument();
  });

  it("renders GridVisualizer with generated snapshot steps", () => {
    const steps = generateGridPathsDpSteps(DEFAULT_GRID_PATHS_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("grid");

    if (snapshot.kind === "grid") {
      render(<GridVisualizer grid={snapshot.grid} title="Grid Paths DP" />);
      expect(screen.getByText("Grid Paths DP")).toBeInTheDocument();
    }
  });
});
