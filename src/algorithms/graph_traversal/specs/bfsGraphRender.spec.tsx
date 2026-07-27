import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateBFSGraphSteps, DEFAULT_BFS_INPUT } from "../bfsGraph";

describe("bfsGraph React component spec", () => {
  it("renders GraphVisualizer with generated graph snapshot", () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    const snapshot = steps[0].primarySnapshot;

    if (snapshot.kind === "graph") {
      render(
        <GraphVisualizer
          nodes={snapshot.nodes}
          edges={snapshot.edges}
          title="BFS Graph Traversal"
        />,
      );
    }

    expect(screen.getByText("BFS Graph Traversal")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with bfsGraph step snapshot", () => {
    const steps = generateBFSGraphSteps(DEFAULT_BFS_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["bfs-graph"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/BFS Graph Traversal/i)[0]).toBeInTheDocument();
  });
});
