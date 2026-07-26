import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../MainLayout";
import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PanelVisibility,
  TopicGuide,
} from "../../types/dsa";

vi.mock("../primitives/ProblemDescriptionCard", () => ({
  ProblemDescriptionCard: ({
    title,
    difficulty,
    description,
    expanded,
    onToggleExpanded,
  }: {
    title: string;
    difficulty?: string;
    description: string;
    expanded: boolean;
    onToggleExpanded: () => void;
  }) => (
    <div data-testid="problem-description-card">
      <span>{title}</span>
      <span>{difficulty}</span>
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Problem Details
      </button>
      {expanded && <p>{description}</p>}
    </div>
  ),
}));

vi.mock("../primitives/SolutionApproachCard", () => ({
  SolutionApproachCard: ({
    topicGuide,
    expanded,
    onToggleExpanded,
  }: {
    topicGuide: TopicGuide;
    expanded: boolean;
    onToggleExpanded: () => void;
  }) => (
    <div data-testid="solution-approach-card" data-topic-sections={topicGuide.sections.length}>
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Solution Details
      </button>
      {expanded && <p>{topicGuide.overview}</p>}
    </div>
  ),
}));

vi.mock("../ControlPanel", () => ({
  ControlPanel: () => <div data-testid="control-panel" />,
}));

const dummyTopicGuide: TopicGuide = {
  overview: "Sorting rearranges a collection so its elements sit in a predictable order.",
  sections: [
    {
      heading: "The core idea",
      body: "You repeatedly compare neighbours and push the larger one right.",
    },
    {
      heading: "Why it is correct",
      body: "After each pass the largest unsorted value has reached its final slot.",
    },
  ],
  keyTerms: [
    { term: "Pass", definition: "One full sweep from the start of the array to its unsorted end." },
  ],
};

const dummyAlgorithm: AlgorithmDefinition = {
  id: "bubble-sort",
  title: "Bubble Sort Algorithm",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description:
    "Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.",
  constraints: ["1 <= n <= 50"],
  examples: [{ input: "[3, 1, 2]", output: "[1, 2, 3]" }],
  code: "def bubble_sort(arr):\n    pass",
  timeComplexity: { best: "O(n)", average: "O(n^2)", worst: "O(n^2)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: { time: "O(n^2)", space: "O(1)" },
  topicGuide: dummyTopicGuide,
  defaultInput: { array: [3, 1, 2] },
  generateSteps: () => [],
};

const dummyStep: AlgorithmStep = {
  stepIndex: 0,
  codeLine: 1,
  explanation: { what: "Comparing 3 and 1", why: "Index 0 > index 1" },
  primarySnapshot: {
    kind: "array",
    elements: [
      { id: "0", value: 3, state: "active" },
      { id: "1", value: 1, state: "active" },
      { id: "2", value: 2, state: "default" },
    ],
  },
  auxiliaryState: { stack: ["bubble_sort(arr)"] },
  variables: { i: 0, j: 0 },
};

const allPanels = (): PanelVisibility => ({
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
});

const renderLayout = (
  overrides: Partial<ComponentProps<typeof MainLayout>> = {},
): ReturnType<typeof render> =>
  render(
    <MainLayout
      algorithm={dummyAlgorithm}
      currentStep={dummyStep}
      panels={allPanels()}
      onToggleTutorial={vi.fn()}
      onToggleAuxiliary={vi.fn()}
      {...overrides}
    />,
  );

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("MainLayoutHeaderExpanded Component Spec", () => {
  it("never blocks page scrolling: main keeps overflow-y auto in every state", () => {
    renderLayout();

    const main = screen.getByRole("main");
    expect(main).toHaveStyle({ display: "flex", overflowY: "auto" });
    expect(main.style.overflow).not.toBe("hidden");
    expect(main).toHaveAttribute("data-problem-expanded", "true");
    expect(main).toHaveAttribute("data-solution-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: "Problem Details" }));

    expect(main).toHaveAttribute("data-problem-expanded", "false");
    expect(main).toHaveAttribute("data-solution-expanded", "true");
    expect(main).toHaveStyle({ overflowY: "auto" });
    expect(main.style.overflow).not.toBe("hidden");
  });

  it("shows problem details expanded by default and lets the toggle collapse them", () => {
    renderLayout();

    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Problem Details" }));
    expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Problem Details" }));
    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();
  });

  it("shows solution details expanded by default and lets the toggle collapse them, independently of the problem panel", () => {
    renderLayout();

    expect(screen.getByText(dummyTopicGuide.overview)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Solution Details" }));
    expect(screen.queryByText(dummyTopicGuide.overview)).not.toBeInTheDocument();
    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Solution Details" }));
    expect(screen.getByText(dummyTopicGuide.overview)).toBeInTheDocument();
  });

  it("keeps each details panel collapsed across an algorithm change once the user collapsed it", () => {
    const { rerender } = renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Problem Details" }));
    fireEvent.click(screen.getByRole("button", { name: "Solution Details" }));
    expect(screen.getByRole("main")).toHaveAttribute("data-problem-expanded", "false");
    expect(screen.getByRole("main")).toHaveAttribute("data-solution-expanded", "false");

    rerender(
      <MainLayout
        algorithm={{ ...dummyAlgorithm, id: "insertion-sort" }}
        currentStep={dummyStep}
        panels={allPanels()}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );

    expect(screen.getByRole("main")).toHaveAttribute("data-problem-expanded", "false");
    expect(screen.getByRole("main")).toHaveAttribute("data-solution-expanded", "false");
  });
});
