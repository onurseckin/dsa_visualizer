import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GraphVisualizer from "../../../components/primitives/GraphVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateTspBitmaskDpSteps, DEFAULT_TSP_BITMASK_INPUT } from "../tspBitmaskDp";

describe("tspBitmaskDp React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateTspBitmaskDpSteps(DEFAULT_TSP_BITMASK_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["tsp-bitmask-dp"]}
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
    expect(screen.getAllByText(/Traveling Salesperson Problem/i)[0]).toBeInTheDocument();
  });

  it("renders GraphVisualizer with generated snapshot steps", () => {
    const steps = generateTspBitmaskDpSteps(DEFAULT_TSP_BITMASK_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("graph");

    if (snapshot.kind === "graph") {
      render(<GraphVisualizer nodes={snapshot.nodes} edges={snapshot.edges} title="TSP Graph" />);
      expect(screen.getByText("TSP Graph")).toBeInTheDocument();
    }
  });
});
