import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { dijkstraShortestPath } from "../dijkstraShortestPath";

describe("dijkstraShortestPath React component spec", () => {
  it("renders algorithm title and layout properly", () => {
    const steps = dijkstraShortestPath.generateSteps(dijkstraShortestPath.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["dijkstra-shortest-path"]}
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

    expect(screen.getByText("Dijkstra's Shortest Path Algorithm")).toBeInTheDocument();
    // Details are expanded by default, so the topic guide renders without any interaction.
    expect(screen.getByText("The greedy frontier")).toBeInTheDocument();
    expect(screen.getByText("Relaxation")).toBeInTheDocument();
  });
});
