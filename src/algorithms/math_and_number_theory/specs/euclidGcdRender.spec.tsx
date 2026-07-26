import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { MainLayout } from "../../../components/MainLayout";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateEuclidGcdSteps, DEFAULT_EUCLID_GCD_INPUT } from "../euclidGcd";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("euclidGcd React component spec", () => {
  it("renders ArrayVisualizer with Euclid GCD snapshot", () => {
    const steps = generateEuclidGcdSteps(DEFAULT_EUCLID_GCD_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Euclidean Algorithm (GCD)" />);

    expect(screen.getByText("Euclidean Algorithm (GCD)")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with euclidGcd algorithm", () => {
    const steps = generateEuclidGcdSteps(DEFAULT_EUCLID_GCD_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["euclid-gcd"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/Euclidean Algorithm/i)[0]).toBeInTheDocument();
  });
});
