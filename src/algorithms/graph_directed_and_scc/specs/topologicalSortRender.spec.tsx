import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../components/MainLayout";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_TOPO_SORT_INPUT, generateTopologicalSortSteps } from "../topologicalSort";

describe("topologicalSort React component spec", () => {
  it("renders algorithm title and description header in MainLayout", () => {
    const steps = generateTopologicalSortSteps(DEFAULT_TOPO_SORT_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["topological-sort"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Topological Sort (Kahn's Algorithm)")).toBeInTheDocument();
    // Details are expanded by default, so the topic guide renders without any interaction.
    expect(screen.getByText("Ready means nothing is pointing at you")).toBeInTheDocument();
    expect(screen.getByText("In-degree")).toBeInTheDocument();
  });
});
