import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../components/MainLayout";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_KRUSKAL_INPUT, generateKruskalSteps } from "../kruskalMst";

describe("kruskalMst React component spec", () => {
  it("renders algorithm title and description header in MainLayout", () => {
    const steps = generateKruskalSteps(DEFAULT_KRUSKAL_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["kruskal-mst"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Kruskal's Minimum Spanning Tree")).toBeInTheDocument();
    // Details are expanded by default, so the topic guide renders without any interaction.
    expect(screen.getByText("Union-find is the engine")).toBeInTheDocument();
    expect(screen.getByText("Cut property")).toBeInTheDocument();
  });
});
