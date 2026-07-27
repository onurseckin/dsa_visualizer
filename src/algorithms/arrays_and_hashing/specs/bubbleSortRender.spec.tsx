import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MainLayout } from "../../../ui";
import { ALGORITHM_REGISTRY } from "../../registry";
import { bubbleSort, generateBubbleSortSteps } from "../bubbleSort";

describe("BubbleSort React Component Spec", () => {
  it("renders algorithm title and problem description", () => {
    const steps = generateBubbleSortSteps(bubbleSort.defaultInput);
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["bubble-sort"]}
        currentStep={steps[0]}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText("Bubble Sort")).toBeInTheDocument();

    // Problem details render expanded, so the description needs no disclosure click.
    expect(
      screen.getByText(/Bubble Sort is a simple comparison-based sorting algorithm/i),
    ).toBeInTheDocument();
    expect(screen.getByText(bubbleSort.topicGuide.overview)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: bubbleSort.topicGuide.sections[0].heading }),
    ).toBeInTheDocument();
    expect(screen.getByText("Key terms")).toBeInTheDocument();
  });

  it("renders step visualizer with element array state", () => {
    const steps = generateBubbleSortSteps(bubbleSort.defaultInput);
    const lastStep = steps[steps.length - 1];
    const noop = vi.fn();

    render(
      <MainLayout
        algorithm={ALGORITHM_REGISTRY["bubble-sort"]}
        currentStep={lastStep}
        panels={{ visualizer: true, code: true, tutorial: true, auxiliary: true }}
        onToggleTutorial={noop}
        onToggleAuxiliary={noop}
      />,
    );

    expect(screen.getByText(/Bubble Sort complete/i)).toBeInTheDocument();
  });
});
