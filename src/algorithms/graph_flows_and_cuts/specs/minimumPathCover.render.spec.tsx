import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateMinimumPathCoverSteps,
  DEFAULT_MINIMUM_PATH_COVER_INPUT,
} from "../minimumPathCover";

describe("minimumPathCover React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateMinimumPathCoverSteps(DEFAULT_MINIMUM_PATH_COVER_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["minimum-path-cover"]}
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
    expect(screen.getAllByText(/Minimum Path Cover in DAG/i)[0]).toBeInTheDocument();
  });

  it("renders GraphVisualizer with generated snapshot steps", () => {
    const steps = generateMinimumPathCoverSteps(DEFAULT_MINIMUM_PATH_COVER_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("graph");

    if (snapshot.kind === "graph") {
      render(
        <GraphVisualizer
          nodes={snapshot.nodes}
          edges={snapshot.edges}
          title="Minimum Path Cover Graph"
        />,
      );
      expect(screen.getByText("Minimum Path Cover Graph")).toBeInTheDocument();
    }
  });
});
