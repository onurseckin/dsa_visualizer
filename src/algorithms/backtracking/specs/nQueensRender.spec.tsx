import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { DEFAULT_NQUEENS_INPUT, generateNQueensSteps } from "../nQueens";

describe("NQueens React Component Spec", () => {
  it("renders algorithm title and problem header", () => {
    const steps = generateNQueensSteps(DEFAULT_NQUEENS_INPUT);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["n-queens"]}
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

    expect(screen.getByText("N-Queens Backtracking")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(screen.getByText(/placing N chess queens on an N×N chessboard/i)).toBeInTheDocument();
  });

  it("renders grid visualizer and auxiliary state for N-Queens steps", () => {
    const steps = generateNQueensSteps(DEFAULT_NQUEENS_INPUT);
    const midStep = steps[3];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["n-queens"]}
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

    expect(screen.getByText(/Place a queen/i)).toBeInTheDocument();
    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
    // Backtracking state (n, activeQueens, solutionsFound) renders as chips in the State row.
    expect(screen.getByText("activeQueens")).toBeInTheDocument();
    // solutionsFound also appears in the variables readout, so scope to the first match.
    expect(screen.getAllByText("solutionsFound")[0]).toBeInTheDocument();
  });
});
