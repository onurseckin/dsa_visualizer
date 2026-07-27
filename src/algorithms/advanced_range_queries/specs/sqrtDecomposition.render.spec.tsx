import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateSqrtDecompositionSteps, sqrtDecomposition } from "../sqrtDecomposition";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("sqrtDecomposition React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generateSqrtDecompositionSteps(sqrtDecomposition.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["sqrt-decomposition"] ?? sqrtDecomposition}
        currentStep={steps[0]}
        panels={{
          problem: true,
          solution: true,
          visualizer: true,
          code: true,
          tutorial: true,
          auxiliary: true,
        }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("SQRT Decomposition (Range Queries & Updates)")).toBeInTheDocument();
  });
});
