import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlgorithmDefinition } from "../../../types/dsa";
import { MainLayout } from "../../../ui";
import {
  DEFAULT_DISJOINT_SET_UNION_INPUT,
  disjointSetUnion,
  generateDisjointSetUnionSteps,
} from "../disjointSetUnion";

describe("DisjointSetUnion Render Spec", () => {
  it("renders algorithm title and description", () => {
    const steps = generateDisjointSetUnionSteps(DEFAULT_DISJOINT_SET_UNION_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={disjointSetUnion as AlgorithmDefinition}
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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Disjoint Set Union/i);
  });

  it("renders graph visualizer and auxiliary panel for DSU steps", () => {
    const steps = generateDisjointSetUnionSteps(DEFAULT_DISJOINT_SET_UNION_INPUT);
    const midStep = steps[1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={disjointSetUnion as AlgorithmDefinition}
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

    expect(screen.getAllByTestId("canvas-container")[0]).toBeInTheDocument();
    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
  });
});
