import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateExtendedEuclideanSteps,
  DEFAULT_EXTENDED_EUCLIDEAN_INPUT,
} from "../extendedEuclideanAlgorithm";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("extendedEuclideanAlgorithm React component spec", () => {
  it("renders ArrayVisualizer with Extended Euclidean Algorithm snapshot", () => {
    const steps = generateExtendedEuclideanSteps(DEFAULT_EXTENDED_EUCLIDEAN_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Extended Euclidean Algorithm" />);

    expect(screen.getByText("Extended Euclidean Algorithm")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with extendedEuclideanAlgorithm algorithm", () => {
    const steps = generateExtendedEuclideanSteps(DEFAULT_EXTENDED_EUCLIDEAN_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["extended-euclidean-algorithm"]}
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

    expect(screen.getAllByText(/Extended Euclidean Algorithm/i)[0]).toBeInTheDocument();
  });
});
