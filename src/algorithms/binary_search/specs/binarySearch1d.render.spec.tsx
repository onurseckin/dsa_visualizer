import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateBinarySearch1dSteps, binarySearch1d } from "../binarySearch1d";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("binarySearch1d React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generateBinarySearch1dSteps(binarySearch1d.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["binary-search-1d"] ?? binarySearch1d}
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

    expect(screen.getByText("1D Binary Search & Lower/Upper Bound")).toBeInTheDocument();
  });
});
