import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VectorVisualizer } from "../../../components/primitives/VectorVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateCatalanNumbersSteps, DEFAULT_CATALAN_NUMBERS_INPUT } from "../catalanNumbers";
import type { VectorVisualSnapshot } from "../../../types/dsa";

describe("catalanNumbers React component spec", () => {
  it("renders VectorVisualizer with Catalan Numbers snapshot", () => {
    const steps = generateCatalanNumbersSteps(DEFAULT_CATALAN_NUMBERS_INPUT);
    const snapshot = steps[0].primarySnapshot as VectorVisualSnapshot;

    render(<VectorVisualizer vectors={snapshot.vectors} planeTitle="Catalan Numbers" />);

    expect(screen.getByText("Catalan Numbers")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with catalanNumbers algorithm", () => {
    const steps = generateCatalanNumbersSteps(DEFAULT_CATALAN_NUMBERS_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["catalan-numbers"]}
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

    expect(screen.getAllByText(/Catalan Numbers/i)[0]).toBeInTheDocument();
  });
});
