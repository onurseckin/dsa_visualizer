import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateMoAlgorithmSteps, moAlgorithm } from "../moAlgorithm";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("moAlgorithm React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generateMoAlgorithmSteps(moAlgorithm.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["mo-algorithm"] ?? moAlgorithm}
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

    expect(screen.getByText("Mo's Algorithm (Offline Range Queries)")).toBeInTheDocument();
  });
});
