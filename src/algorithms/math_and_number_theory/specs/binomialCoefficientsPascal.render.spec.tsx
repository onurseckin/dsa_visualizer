import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatrixVisualizer } from "../../../components/primitives/MatrixVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateBinomialCoefficientsPascalSteps,
  DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
} from "../binomialCoefficientsPascal";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("binomialCoefficientsPascal React component spec", () => {
  it("renders MatrixVisualizer with Binomial Coefficients snapshot", () => {
    const steps = generateBinomialCoefficientsPascalSteps(
      DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
    );
    const snapshot = steps[0].primarySnapshot as MatrixVisualSnapshot;

    render(
      <MatrixVisualizer
        rows={snapshot.rows}
        cols={snapshot.cols}
        cells={snapshot.cells}
        rowHeaders={snapshot.rowHeaders}
        colHeaders={snapshot.colHeaders}
        title="Binomial Coefficients (Pascal's Triangle)"
      />,
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
