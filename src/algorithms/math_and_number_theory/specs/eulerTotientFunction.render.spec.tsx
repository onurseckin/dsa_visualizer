import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VectorVisualizer } from "../../../components/primitives/VectorVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateEulerTotientSteps, DEFAULT_EULER_TOTIENT_INPUT } from "../eulerTotientFunction";
import type { VectorVisualSnapshot } from "../../../types/dsa";

describe("eulerTotientFunction React component spec", () => {
  it("renders VectorVisualizer with Euler Totient Function snapshot", () => {
    const steps = generateEulerTotientSteps(DEFAULT_EULER_TOTIENT_INPUT);
    const snapshot = steps[0].primarySnapshot as VectorVisualSnapshot;

    render(<VectorVisualizer vectors={snapshot.vectors} planeTitle="Euler's Totient Function" />);

    expect(screen.getByText("Euler's Totient Function")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with eulerTotientFunction algorithm", () => {
    const steps = generateEulerTotientSteps(DEFAULT_EULER_TOTIENT_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["euler-totient-function"]}
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

    expect(screen.getAllByText(/Euler's Totient Function/i)[0]).toBeInTheDocument();
  });
});
