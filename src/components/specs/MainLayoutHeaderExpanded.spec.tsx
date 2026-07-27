import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../../ui";
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
  }: {
    title: string;
    difficulty?: string;
    description: string;
  }) => (
    <div data-testid="problem-description-card">
      <span>{title}</span>
      <span>{difficulty}</span>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock("../primitives/SolutionApproachCard", () => ({
  SolutionApproachCard: ({ topicGuide }: { topicGuide: TopicGuide }) => (
    <div data-testid="solution-approach-card" data-topic-sections={topicGuide.sections.length}>
      <p>{topicGuide.overview}</p>
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

const allPanels = (overrides: Partial<PanelVisibility> = {}): PanelVisibility => ({
  problem: true,
  solution: true,
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
  ...overrides,
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
  });

  it("shows problem details when panels.problem is true and hides when false", () => {
    const { rerender } = renderLayout();

    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();

    rerender(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        panels={allPanels({ problem: false })}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );
    expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();
  });

  it("shows solution details when panels.solution is true and hides when false", () => {
    const { rerender } = renderLayout();

    expect(screen.getByText(dummyTopicGuide.overview)).toBeInTheDocument();

    rerender(
      <MainLayout
        algorithm={dummyAlgorithm}
        currentStep={dummyStep}
        panels={allPanels({ solution: false })}
        onToggleTutorial={vi.fn()}
        onToggleAuxiliary={vi.fn()}
      />,
    );
    expect(screen.queryByText(dummyTopicGuide.overview)).not.toBeInTheDocument();
    expect(screen.getByText(dummyAlgorithm.description)).toBeInTheDocument();
  });
});
