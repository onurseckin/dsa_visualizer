import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ArrayVisualizer from "../../../components/primitives/ArrayVisualizer";
import { generateInclusionExclusionSteps, DEFAULT_INCLUSION_EXCLUSION_INPUT } from "../inclusionExclusionPrinciple";
import type { ArrayVisualSnapshot } from "../../../types/dsa";

describe("inclusionExclusionPrinciple React component spec", () => {
  it("renders ArrayVisualizer with generated step snapshot", () => {
    const steps = generateInclusionExclusionSteps(DEFAULT_INCLUSION_EXCLUSION_INPUT);
    const snapshot = steps[0].primarySnapshot as ArrayVisualSnapshot;

    render(<ArrayVisualizer elements={snapshot.elements} title="Inclusion-Exclusion Principle" />);

    expect(screen.getByText("Inclusion-Exclusion Principle")).toBeInTheDocument();
  });

  it("completes all steps without crashing", () => {
    const steps = generateInclusionExclusionSteps({ n: 15, primes: [2, 3] });
    expect(steps.length).toBeGreaterThan(1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.total_count).toBe(10);
  });
});
