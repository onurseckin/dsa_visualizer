import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MatrixVisualizer } from "../../../components/primitives/MatrixVisualizer";
import {
  generateInclusionExclusionSteps,
  DEFAULT_INCLUSION_EXCLUSION_INPUT,
} from "../inclusionExclusionPrinciple";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("inclusionExclusionPrinciple React component spec", () => {
  it("renders MatrixVisualizer with generated step snapshot", () => {
    const steps = generateInclusionExclusionSteps(DEFAULT_INCLUSION_EXCLUSION_INPUT);
    const snapshot = steps[0].primarySnapshot as MatrixVisualSnapshot;

    render(
      <MatrixVisualizer
        rows={snapshot.rows}
        cols={snapshot.cols}
        cells={snapshot.cells}
        rowHeaders={snapshot.rowHeaders}
        colHeaders={snapshot.colHeaders}
        title="Inclusion-Exclusion Principle"
      />,
    );

    expect(screen.getByText("Inclusion-Exclusion Principle")).toBeInTheDocument();
  });

  it("completes all steps without crashing", () => {
    const steps = generateInclusionExclusionSteps({ n: 15, primes: [2, 3] });
    expect(steps.length).toBeGreaterThan(1);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.total_count).toBe(10);
  });
});
