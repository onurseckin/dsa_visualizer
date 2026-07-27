import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateNearestSmallerElementSteps,
  DEFAULT_NEAREST_SMALLER_INPUT,
} from "../nearestSmallerElement";

describe("nearestSmallerElement React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateNearestSmallerElementSteps(DEFAULT_NEAREST_SMALLER_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["nearest-smaller-element"]}
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
    expect(screen.getAllByText(/Nearest Smaller Element/i)[0]).toBeInTheDocument();
  });

  it("renders ArrayVisualizer with generated snapshot steps", () => {
    const steps = generateNearestSmallerElementSteps(DEFAULT_NEAREST_SMALLER_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("array");

    if (snapshot.kind === "array") {
      render(
        <ArrayVisualizer elements={snapshot.elements} title="Nearest Smaller Element Array" />,
      );
      expect(screen.getByText("Nearest Smaller Element Array")).toBeInTheDocument();
    }
  });
});
