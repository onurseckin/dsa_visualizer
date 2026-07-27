import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_BELLMAN_FORD_INPUT, generateBellmanFordSteps } from "../bellmanFord";

describe("bellmanFord React component spec", () => {
  it("renders algorithm title and the description in MainLayout", () => {
    const steps = generateBellmanFordSteps(DEFAULT_BELLMAN_FORD_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["bellman-ford"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Bellman-Ford Shortest Path")).toBeInTheDocument();

    // Details are expanded by default, so the description renders without any interaction.
    expect(
      screen.getByText(/computes shortest paths from one source vertex to every other vertex/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Relax everything, then do it again/i)).toBeInTheDocument();
  });

  it("renders auxiliary distance table and graph visualizer without crashing", () => {
    const steps = generateBellmanFordSteps(DEFAULT_BELLMAN_FORD_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["bellman-ford"]}
        currentStep={midStep}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText(/Working Data/i)).toBeInTheDocument();
    expect(screen.getAllByText("Distances")[0]).toBeInTheDocument();
    expect(screen.getByText("Visited (5)")).toBeInTheDocument();
  });
});
