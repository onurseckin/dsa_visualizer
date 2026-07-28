import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ArrayVisualizer } from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateCatalanNumbersSteps, DEFAULT_CATALAN_NUMBERS_INPUT } from "../catalanNumbers";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("catalanNumbers React component spec", () => {
  it("renders ArrayVisualizer with Catalan Numbers snapshot", () => {
    const steps = generateCatalanNumbersSteps(DEFAULT_CATALAN_NUMBERS_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Catalan Numbers" />);

    expect(snapshot.kind).toBe("array");
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
