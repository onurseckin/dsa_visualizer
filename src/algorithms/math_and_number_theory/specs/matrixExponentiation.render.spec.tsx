import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GridVisualizer from "../../../components/primitives/GridVisualizer";
import { generateMatrixExponentiationSteps, DEFAULT_MATRIX_EXPONENTIATION_INPUT } from "../matrixExponentiation";
import type { GridVisualSnapshot } from "../../../types/dsa";

describe("matrixExponentiation React component spec", () => {
  it("renders GridVisualizer with generated matrix snapshot", () => {
    const steps = generateMatrixExponentiationSteps(DEFAULT_MATRIX_EXPONENTIATION_INPUT);
    const snapshot = steps[0].primarySnapshot as GridVisualSnapshot;

    render(<GridVisualizer grid={snapshot.grid} title="Matrix Exponentiation" />);

    expect(screen.getByText("Matrix Exponentiation")).toBeInTheDocument();
  });

  it("calculates F(10) accurately without crash", () => {
    const steps = generateMatrixExponentiationSteps({ n: 10, modulo: 1000000007 });
    expect(steps.length).toBeGreaterThan(1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.result).toBe(55);
  });
});
