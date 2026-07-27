import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GridVisualizer from "../../../components/primitives/GridVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateNumberOfIslandsSteps, DEFAULT_NUMBER_OF_ISLANDS_INPUT } from "../numberOfIslands";

describe("numberOfIslands React component spec", () => {
  it("renders GridVisualizer with generated snapshot steps", () => {
    const steps = generateNumberOfIslandsSteps(DEFAULT_NUMBER_OF_ISLANDS_INPUT);
    const snapshot = steps[0].primarySnapshot;

    if (snapshot.kind === "grid") {
      render(<GridVisualizer grid={snapshot.grid} title="Number of Islands" />);
    }

    expect(screen.getByText("Number of Islands")).toBeInTheDocument();
  });

  it("renders visited and active grid states properly without crash", () => {
    const steps = generateNumberOfIslandsSteps(DEFAULT_NUMBER_OF_ISLANDS_INPUT);
    const midStep = steps[Math.floor(steps.length / 2)];
    const snapshot = midStep.primarySnapshot;

    if (snapshot.kind === "grid") {
      const { container } = render(<GridVisualizer grid={snapshot.grid} />);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it("renders MainLayout cleanly with numberOfIslands step snapshot", () => {
    const steps = generateNumberOfIslandsSteps(DEFAULT_NUMBER_OF_ISLANDS_INPUT);
    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["number-of-islands"]}
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
    expect(screen.getAllByText(/Number of Islands/i)[0]).toBeInTheDocument();
  });
});
