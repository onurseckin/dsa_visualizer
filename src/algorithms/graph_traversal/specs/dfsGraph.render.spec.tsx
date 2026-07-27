import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import { DEFAULT_DFS_GRAPH_INPUT, dfsGraph, generateDfsGraphSteps } from "../dfsGraph";

describe("dfsGraph Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateDfsGraphSteps(DEFAULT_DFS_GRAPH_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={dfsGraph as AlgorithmDefinition}
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

    expect(screen.getAllByText(/DFS Graph Traversal/i)[0]).toBeInTheDocument();
    expect(
      screen.getByText(
        /Depth-First Search \(DFS\) traverses a graph by exploring as deep as possible/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders final step with traversal sequence", () => {
    const steps = generateDfsGraphSteps(DEFAULT_DFS_GRAPH_INPUT);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={dfsGraph as AlgorithmDefinition}
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
    expect(screen.getAllByText(/Final Traversal/i).length).toBeGreaterThan(0);
  });
});
