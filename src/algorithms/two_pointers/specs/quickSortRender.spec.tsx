import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { generateQuickSortSteps, quickSort } from "../quickSort";

const getWorkingDataCard = (): HTMLElement => {
  const card = screen.getByTestId("auxiliary-panel");
  if (!(card instanceof HTMLElement)) {
    throw new Error("Working data card not found");
  }
  return card;
};

describe("QuickSort React Component Spec", () => {
  it("renders algorithm title and problem description", () => {
    const steps = generateQuickSortSteps(quickSort.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["quick-sort"]}
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

    expect(screen.getByText("Quick Sort")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Quick Sort is an efficient divide-and-conquer sorting algorithm/i)[0],
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: quickSort.topicGuide.sections[0].heading }),
    ).toBeInTheDocument();
    expect(screen.getByText("Key terms")).toBeInTheDocument();
  });

  it("renders step visualizer with call stack auxiliary panel", () => {
    const steps = generateQuickSortSteps(quickSort.defaultInput);
    const stepWithStack = steps.find((s) => (s.auxiliaryState.stack?.length ?? 0) > 0) || steps[0];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["quick-sort"]}
        currentStep={stepWithStack}
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

    const aux = within(getWorkingDataCard());
    expect(aux.getByText("Stack")).toBeInTheDocument();
    expect(aux.getAllByText(/quickSort\(0, 6\)/)[0]).toBeInTheDocument();
  });
});
