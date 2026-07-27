import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_TREE_DIAMETER_INPUT, generateTreeDiameterSteps } from "../treeDiameter";

describe("TreeDiameter React Component Spec", () => {
  it("renders algorithm title and problem header", () => {
    const steps = generateTreeDiameterSteps(DEFAULT_TREE_DIAMETER_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["tree-diameter"]}
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

    expect(screen.getByText("Tree Diameter (2-DFS Algorithm)")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(screen.getAllByText(/longest simple path/i)[0]).toBeInTheDocument();
  });

  it("renders tree visualizer and auxiliary state", () => {
    const steps = generateTreeDiameterSteps(DEFAULT_TREE_DIAMETER_INPUT);
    const midStep = steps[4];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["tree-diameter"]}
        currentStep={midStep}
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

    expect(screen.getAllByText(/DFS 1/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Working Data/i)).toBeInTheDocument();
  });
});
