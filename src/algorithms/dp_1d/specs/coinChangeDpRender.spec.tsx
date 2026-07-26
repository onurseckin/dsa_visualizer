import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../components/MainLayout";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateCoinChangeSteps, DEFAULT_COIN_CHANGE_INPUT } from "../coinChangeDp";

describe("coinChangeDp React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateCoinChangeSteps(DEFAULT_COIN_CHANGE_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["coin-change-dp"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/Coin Change Minimum Coins/i)[0]).toBeInTheDocument();
  });

  it("renders ArrayVisualizer with generated snapshot steps", () => {
    const steps = generateCoinChangeSteps(DEFAULT_COIN_CHANGE_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("array");

    if (snapshot.kind === "array") {
      render(<ArrayVisualizer elements={snapshot.elements} title="Coin Change DP Table" />);
      expect(screen.getByText("Coin Change DP Table")).toBeInTheDocument();
    }
  });
});
