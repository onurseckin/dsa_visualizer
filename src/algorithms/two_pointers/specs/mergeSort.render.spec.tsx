import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateMergeSortSteps, mergeSort } from "../mergeSort";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("mergeSort React component spec", () => {
  it("renders algorithm title in MainLayout", () => {
    const steps = generateMergeSortSteps(mergeSort.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["merge-sort"] ?? mergeSort}
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

    expect(screen.getByText("Merge Sort (Divide and Conquer)")).toBeInTheDocument();
  });
});
