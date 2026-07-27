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
import type { ControlPanelProps } from "../../ui";

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
  ControlPanel: (props: ControlPanelProps) => (
    <div
      data-testid="control-panel"
      data-speed={props.speed}
      data-datasize={props.dataSize}
      data-customsize={String(props.supportsCustomSize)}
      data-currentstep={props.currentStep}
      data-totalsteps={props.totalSteps}
    >
      <button data-testid="cp-speed" onClick={() => props.onSpeedChange?.(500)}>
        speed
      </button>
      <button data-testid="cp-datasize" onClick={() => props.onDataSizeChange?.(20)}>
        datasize
      </button>
      <button data-testid="cp-random" onClick={() => props.onGenerateRandom?.()}>
        random
      </button>
    </div>
  ),
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
  problem: true,
  solution: true,
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
  complexity: true,
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

describe("MainLayoutHeaderRender Component Spec", () => {
  it("renders the problem description card with algorithm identity above the stage", () => {
    renderLayout();

    expect(screen.getByTestId("problem-description-card")).toBeInTheDocument();
    expect(screen.getByText("Bubble Sort Algorithm")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("renders the solution approach card with the topic guide, below every other section", () => {
    renderLayout();

    const solutionCard = screen.getByTestId("solution-approach-card");
    expect(solutionCard).toHaveAttribute("data-topic-sections", "2");
    expect(screen.getByText(dummyTopicGuide.overview)).toBeInTheDocument();

    const main = screen.getByRole("main");
    const mainChildren = Array.from(main.children);
    expect(mainChildren[mainChildren.length - 1].contains(solutionCard)).toBe(true);
  });

  it("sizes the stage from the viewport with a floor so short screens scroll instead of squeezing", () => {
    const { container } = renderLayout();

    const stage = container.querySelector('[data-stage="workspace"]') as HTMLElement;
    expect(stage.style.height).toContain("max(var(--stage-min-h)");
    expect(stage.style.height).toContain("100dvh");
    expect(stage.style.height).toContain("var(--navbar-h)");
  });

  it("resolves individual playback props into resolvedControlProps with fallbacks when optional handlers are omitted", () => {
    renderLayout({
      isPlaying: true,
      onPlayPause: vi.fn(),
      onStepBack: vi.fn(),
      onStepForward: vi.fn(),
      onReset: vi.fn(),
    });

    const cp = screen.getByTestId("control-panel");
    expect(cp).toHaveAttribute("data-speed", "300");
    expect(cp).toHaveAttribute("data-datasize", "10");
    expect(cp).toHaveAttribute("data-customsize", "false");
    expect(cp).toHaveAttribute("data-currentstep", "0");
    expect(cp).toHaveAttribute("data-totalsteps", "0");

    // Trigger dummy fallback callbacks
    screen.getByTestId("cp-speed").click();
    screen.getByTestId("cp-datasize").click();
    screen.getByTestId("cp-random").click();
  });

  it("uses currentStep.stepIndex when currentStepIndex is undefined in individual playback props", () => {
    renderLayout({
      isPlaying: true,
      onPlayPause: vi.fn(),
      onStepBack: vi.fn(),
      onStepForward: vi.fn(),
      onReset: vi.fn(),
      currentStep: { ...dummyStep, stepIndex: 3 },
      currentStepIndex: undefined,
    });

    const cp = screen.getByTestId("control-panel");
    expect(cp).toHaveAttribute("data-currentstep", "3");
  });
});
