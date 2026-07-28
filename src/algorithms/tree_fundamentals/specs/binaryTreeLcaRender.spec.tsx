import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_BINARY_TREE_LCA_INPUT, generateBinaryTreeLcaSteps } from "../binaryTreeLca";

describe("BinaryTreeLca React Component Spec", () => {
  it("renders algorithm title and problem header", () => {
    const steps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["binary-tree-lca"]}
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

    expect(screen.getByText("Lowest Common Ancestor of a Binary Tree")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(
      screen.getAllByText(/find the lowest common ancestor \(LCA\) node/i)[0],
    ).toBeInTheDocument();
  });

  it("renders tree visualizer and call stack auxiliary state", () => {
    const steps = generateBinaryTreeLcaSteps(DEFAULT_BINARY_TREE_LCA_INPUT);
    const midStep =
      steps.find((s) => s.explanation.what.toLowerCase().includes("evaluate")) || steps[2];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["binary-tree-lca"]}
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

    expect(screen.getAllByText(/Evaluate/i)[0]).toBeInTheDocument();
    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
  });
});
