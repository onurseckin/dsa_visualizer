import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatrixVisualizer } from "../../../components/primitives/MatrixVisualizer";
import {
  generateMatrixExponentiationSteps,
  DEFAULT_MATRIX_EXPONENTIATION_INPUT,
} from "../matrixExponentiation";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("matrixExponentiation React component spec", () => {
  it("renders MatrixVisualizer with generated matrix snapshot", () => {
    const steps = generateMatrixExponentiationSteps(DEFAULT_MATRIX_EXPONENTIATION_INPUT);
    const snapshot = steps[0].primarySnapshot as MatrixVisualSnapshot;

    render(
      <MatrixVisualizer
        rows={snapshot.rows}
        cols={snapshot.cols}
        cells={snapshot.cells}
        rowHeaders={snapshot.rowHeaders}
        colHeaders={snapshot.colHeaders}
        title="Matrix Exponentiation"
      />,
    );

    expect(screen.getByText("Matrix Exponentiation")).toBeInTheDocument();
  });

  it("calculates F(10) accurately without crash", () => {
    const steps = generateMatrixExponentiationSteps({ n: 10, modulo: 1000000007 });
    expect(steps.length).toBeGreaterThan(1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(55);
  });
});
