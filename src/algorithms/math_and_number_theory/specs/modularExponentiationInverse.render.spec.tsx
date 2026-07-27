import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import {
  generateModularExponentiationInverseSteps,
  DEFAULT_MODULAR_EXPONENTIATION_INVERSE_INPUT,
} from "../modularExponentiationInverse";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("modularExponentiationInverse React component spec", () => {
  it("renders ArrayVisualizer with Modular Exponentiation snapshot", () => {
    const steps = generateModularExponentiationInverseSteps(
      DEFAULT_MODULAR_EXPONENTIATION_INVERSE_INPUT,
    );
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Modular Exponentiation & Inverse" />);

    expect(screen.getByText("Modular Exponentiation & Inverse")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with modularExponentiationInverse algorithm", () => {
    const steps = generateModularExponentiationInverseSteps(
      DEFAULT_MODULAR_EXPONENTIATION_INVERSE_INPUT,
    );

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["modular-exponentiation-inverse"]}
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

    expect(screen.getAllByText(/Modular Exponentiation/i)[0]).toBeInTheDocument();
  });
});
