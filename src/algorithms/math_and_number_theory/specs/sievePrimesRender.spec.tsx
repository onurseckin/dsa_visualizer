import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VectorVisualizer } from "../../../components/primitives/VectorVisualizer";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateSieveSteps, DEFAULT_SIEVE_INPUT } from "../sievePrimes";
import type { VectorVisualSnapshot } from "../../../types/dsa";

describe("sievePrimes React component spec", () => {
  it("renders VectorVisualizer with sieve snapshot", () => {
    const steps = generateSieveSteps(DEFAULT_SIEVE_INPUT);
    const snapshot = steps[0].primarySnapshot as VectorVisualSnapshot;

    render(<VectorVisualizer vectors={snapshot.vectors} planeTitle="Sieve of Eratosthenes" />);

    expect(screen.getByText("Sieve of Eratosthenes")).toBeInTheDocument();
  });

  it("renders MainLayout cleanly with sievePrimes algorithm", () => {
    const steps = generateSieveSteps(DEFAULT_SIEVE_INPUT);

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["sieve-primes"]}
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

    expect(screen.getAllByText(/Sieve of Eratosthenes/i)[0]).toBeInTheDocument();
  });
});
