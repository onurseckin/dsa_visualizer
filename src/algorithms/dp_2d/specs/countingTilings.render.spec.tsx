import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GridVisualizer from "../../../components/primitives/GridVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateCountingTilingsSteps, DEFAULT_COUNTING_TILINGS_INPUT } from "../countingTilings";

describe("countingTilings React component spec", () => {
  it("renders layout cleanly with MainLayout", () => {
    const steps = generateCountingTilingsSteps(DEFAULT_COUNTING_TILINGS_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["counting-tilings"]}
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
    expect(screen.getAllByText(/Counting Tilings/i)[0]).toBeInTheDocument();
  });

  it("renders GridVisualizer with generated snapshot steps", () => {
    const steps = generateCountingTilingsSteps(DEFAULT_COUNTING_TILINGS_INPUT);
    const snapshot = steps[0].primarySnapshot;
    expect(snapshot.kind).toBe("grid");

    if (snapshot.kind === "grid") {
      render(<GridVisualizer grid={snapshot.grid} title="Counting Tilings Grid" />);
      expect(screen.getByText("Counting Tilings Grid")).toBeInTheDocument();
    }
  });
});
