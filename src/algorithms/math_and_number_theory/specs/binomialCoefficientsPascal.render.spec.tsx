import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GridVisualizer from "../../../components/primitives/GridVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateBinomialCoefficientsPascalSteps,
  DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
} from "../binomialCoefficientsPascal";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("binomialCoefficientsPascal React component spec", () => {
  it("renders GridVisualizer with Binomial Coefficients snapshot", () => {
    const steps = generateBinomialCoefficientsPascalSteps(
      DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
    );
    const snapshot = steps[0].primarySnapshot as GridVisualSnapshot;

    render(
      <GridVisualizer grid={snapshot.grid} title="Binomial Coefficients (Pascal's Triangle)" />,
    );

    expect(screen.getByText("Binomial Coefficients (Pascal's Triangle)")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with binomialCoefficientsPascal algorithm", () => {
    const steps = generateBinomialCoefficientsPascalSteps(
      DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
    );

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["binomial-coefficients-pascal"]}
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

    expect(screen.getAllByText(/Binomial Coefficients/i)[0]).toBeInTheDocument();
  });
});
