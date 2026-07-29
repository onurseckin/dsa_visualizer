import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../../ui";
import type {
  AlgorithmDefinition,
  AlgorithmStep,
  AuxiliaryState,
  PanelVisibility,
  StepExplanation,
  TopicGuide,
} from "../../types/dsa";
import { getPythonStarterCode } from "../../playground/executionSpecs";

const codeWorkspaceCapture = vi.hoisted(() => ({
  starterCode: undefined as string | undefined,
}));

vi.mock("../primitives/ProblemDescriptionCard", () => ({
  ProblemDescriptionCard: () => <div data-testid="problem-description-card" />,
}));

vi.mock("../primitives/SolutionApproachCard", () => ({
  SolutionApproachCard: () => <div data-testid="solution-approach-card" />,
}));

vi.mock("../ControlPanel", () => ({
  ControlPanel: ({
    variant,
    currentStep,
    totalSteps,
    onPlayPause,
  }: {
    variant?: string;
    currentStep: number;
    totalSteps: number;
    onPlayPause: () => void;
  }) => (
    <div data-testid="control-panel" data-variant={variant}>
      <button onClick={onPlayPause}>Play</button>
      <span>{`${currentStep} / ${totalSteps}`}</span>
    </div>
  ),
}));

vi.mock("../primitives/TutorialCard", () => ({
  TutorialCard: ({ what }: { what?: string }) => (
    <div data-testid="tutorial-card">
      <span>{what}</span>
    </div>
  ),
  hasTutorialContent: (explanation?: StepExplanation, what?: string, why?: string) =>
    Boolean((what || explanation?.what || "").trim() || (why || explanation?.why || "").trim()),
}));

vi.mock("../primitives/AuxiliaryPanel", () => ({
  AuxiliaryPanel: () => (
    <div data-testid="auxiliary-panel">
      <span>Working Data & Variables</span>
    </div>
  ),
  hasAuxiliaryContent: (state?: AuxiliaryState) =>
    Boolean(
      state &&
      ((state.stack?.length ?? 0) > 0 ||
        (state.queue?.length ?? 0) > 0 ||
        (state.visited?.length ?? 0) > 0 ||
        Object.keys(state.hashMap ?? {}).length > 0 ||
        Object.keys(state.distanceTable ?? {}).length > 0 ||
        Object.keys(state.customState ?? {}).length > 0),
    ),
}));

vi.mock("../primitives/CodeBlockViewer", () => ({
  CodeBlockViewer: ({ code, activeLine }: { code: string; activeLine: number }) => (
    <pre data-testid="code-viewer" data-active-line={activeLine}>
      {code}
    </pre>
  ),
}));

vi.mock("../../ui/organisms/code-workspace/CodeWorkspace", () => ({
  CodeWorkspace: ({
    activeLine,
    referenceCode,
    starterCode,
  }: {
    activeLine: number;
    referenceCode: string;
    starterCode?: string;
  }) => {
    codeWorkspaceCapture.starterCode = starterCode;
    return (
      <pre data-testid="code-viewer" data-active-line={activeLine}>
        {referenceCode}
      </pre>
    );
  },
}));

vi.mock("../ComplexityCard", () => ({
  ComplexityCard: ({
    complexityAnalysis,
  }: {
    complexityAnalysis: { time: string; space: string };
  }) => (
    <div data-testid="complexity-card">
      <p>{complexityAnalysis.time}</p>
      <p>{complexityAnalysis.space}</p>
    </div>
  ),
}));

vi.mock("../primitives/ArrayVisualizer", () => ({
  ArrayVisualizer: ({ elements }: { elements: { value: number }[] }) => (
    <div data-testid="array-visualizer">{elements.map((el) => el.value).join(",")}</div>
  ),
}));

const dummyTopicGuide: TopicGuide = { overview: "", sections: [], keyTerms: [] };

const dummyAlgorithm: AlgorithmDefinition = {
  id: "bubble-sort",
  title: "Bubble Sort Algorithm",
  topicIds: ["arrays_and_hashing"],
  difficulty: "Easy",
  description: "Repeatedly steps through the list",
  constraints: [],
  examples: [],
  code: "def bubble_sort(arr):\n    pass",
  timeComplexity: { best: "O(n)", average: "O(n^2)", worst: "O(n^2)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "We sweep the array repeatedly, so in the worst case the work grows quadratically — O(n^2).",
    space: "Swaps happen in place, so extra memory stays constant — O(1).",
  },
  topicGuide: dummyTopicGuide,
  defaultInput: { array: [3, 1, 2] },
  generateSteps: () => [],
};

const dummyStep: AlgorithmStep = {
  stepIndex: 0,
  codeLine: 1,
  explanation: { what: "Comparing elements 3 and 1", why: "Index 0 is greater" },
  primarySnapshot: {
    kind: "array",
    elements: [
      { id: "0", value: 3, state: "active" },
      { id: "1", value: 1, state: "active" },
      { id: "2", value: 2, state: "default" },
    ],
  },
  auxiliaryState: { stack: ["bubble_sort(arr)"] },
  variables: {},
};

const allPanels = (overrides: Partial<PanelVisibility> = {}): PanelVisibility => ({
  problem: true,
  solution: true,
  examples: true,
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
  complexity: true,
  ...overrides,
});

const columnHandle = (): HTMLElement =>
  screen.getByRole("separator", { name: "Resize visualizer and code columns" });

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
  localStorage.clear();
});

describe("MainLayoutPanelsContent Component Spec", () => {
  it("renders visualizer, code viewer and complexity prose when every panel is on", () => {
    renderLayout();

    expect(screen.getByTestId("array-visualizer")).toHaveTextContent("3,1,2");
    expect(screen.getByTestId("code-viewer")).toHaveTextContent("def bubble_sort");
    expect(screen.getByTestId("complexity-card")).toBeInTheDocument();
    expect(screen.getByTestId("tutorial-card")).toBeInTheDocument();
    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
    expect(columnHandle()).toBeInTheDocument();
  });

  it("passes complexityAnalysis from the algorithm definition to ComplexityCard", () => {
    renderLayout();

    const card = screen.getByTestId("complexity-card");
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.time);
    expect(card).toHaveTextContent(dummyAlgorithm.complexityAnalysis.space);
  });

  it("passes the authored Python starter from MainStage to CodeWorkspace", () => {
    renderLayout();

    expect(codeWorkspaceCapture.starterCode).toBe(getPythonStarterCode(dummyAlgorithm.id));
    expect(codeWorkspaceCapture.starterCode).toContain("def bubble_sort(arr):");
  });

  it("omits playback controls when neither controlProps nor playback callbacks are provided", () => {
    renderLayout();

    expect(screen.queryByTestId("control-panel")).not.toBeInTheDocument();
  });
});
