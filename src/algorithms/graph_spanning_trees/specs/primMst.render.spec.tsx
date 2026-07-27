import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generatePrimMstSteps, DEFAULT_PRIM_MST_INPUT } from "../primMst";

describe("primMst React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generatePrimMstSteps(DEFAULT_PRIM_MST_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["prim-mst"]}
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
    expect(screen.getAllByText(/Prim's Minimum Spanning Tree/i)[0]).toBeInTheDocument();
  });

  it("renders GraphVisualizer with generated snapshot steps", () => {
    const steps = generatePrimMstSteps(DEFAULT_PRIM_MST_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("graph");

    if (snapshot.kind === "graph") {
      render(
        <GraphVisualizer nodes={snapshot.nodes} edges={snapshot.edges} title="Prim MST Graph" />,
      );
      expect(screen.getByText("Prim MST Graph")).toBeInTheDocument();
    }
  });
});
