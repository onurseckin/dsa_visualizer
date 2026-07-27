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
} from "../../types/dsa";
import type { ControlPanelProps } from "../../ui";

vi.mock("../primitives/ProblemDescriptionCard", () => ({
  ProblemDescriptionCard: () => <div data-testid="problem-description-card" />,
}));

vi.mock("../primitives/SolutionApproachCard", () => ({
  SolutionApproachCard: () => <div data-testid="solution-approach-card" />,
}));

vi.mock("../ControlPanel", () => ({
  ControlPanel: ({ variant }: { variant?: string }) => (
    <div data-testid="control-panel" data-variant={variant} />
  ),
}));

vi.mock("../primitives/TutorialCard", () => ({
  TutorialCard: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="tutorial-card">
      <button onClick={onClose}>Dismiss explanation</button>
    </div>
  ),
  hasTutorialContent: (explanation?: StepExplanation, what?: string, why?: string) =>
    Boolean((what || explanation?.what || "").trim() || (why || explanation?.why || "").trim()),
}));

vi.mock("../primitives/AuxiliaryPanel", () => ({
  AuxiliaryPanel: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="auxiliary-panel">
      <button onClick={onClose}>Hide auxiliary panel</button>
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
  CodeBlockViewer: () => <pre data-testid="code-viewer" />,
}));

vi.mock("../ComplexityCard", () => ({
  ComplexityCard: () => <div data-testid="complexity-card" />,
}));

vi.mock("../primitives/ArrayVisualizer", () => ({
  ArrayVisualizer: () => <div data-testid="array-visualizer" />,
}));

const dummyAlgorithm: AlgorithmDefinition = {
  id: "bubble-sort",
  title: "Bubble Sort Algorithm",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description: "Repeatedly steps through the list",
  constraints: [],
  examples: [],
  code: "def bubble_sort(arr):\n    pass",
  timeComplexity: { best: "O(n)", average: "O(n^2)", worst: "O(n^2)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: { time: "", space: "" },
  topicGuide: { overview: "", sections: [], keyTerms: [] },
  defaultInput: { array: [3, 1, 2] },
  generateSteps: () => [],
};

const dummyStep: AlgorithmStep = {
  stepIndex: 0,
  codeLine: 1,
  explanation: { what: "Comparing elements 3 and 1", why: "Index 0 is greater" },
  primarySnapshot: { kind: "array", elements: [] },
  auxiliaryState: { stack: ["bubble_sort(arr)"] },
  variables: {},
};

const dummyControlProps: ControlPanelProps = {
  isPlaying: false,
  onPlayPause: vi.fn(),
  onStepBack: vi.fn(),
  onStepForward: vi.fn(),
  onReset: vi.fn(),
  currentStep: 0,
  totalSteps: 5,
  speed: 300,
  onSpeedChange: vi.fn(),
  dataSize: 10,
  onDataSizeChange: vi.fn(),
  onGenerateRandom: vi.fn(),
  supportsCustomSize: true,
};

const allPanels = (overrides: Partial<PanelVisibility> = {}): PanelVisibility => ({
  problem: true,
  solution: true,
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
  complexity: true,
  ...overrides,
});

const panelRow = (container: HTMLElement, id: string): HTMLElement | null =>
  container.querySelector(`[data-row="${id}"]`);

const region = (container: HTMLElement, name: string): HTMLElement | null =>
  container.querySelector(`[data-region="${name}"]`);

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

describe("MainLayoutVisibilityColumns Component Spec", () => {
  it("drops the whole code column, complexity card and column handle when code is off", () => {
    const { container } = renderLayout({ panels: allPanels({ code: false, complexity: false }) });

    expect(screen.queryByTestId("code-viewer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("complexity-card")).not.toBeInTheDocument();
    expect(panelRow(container, "code")).toBeNull();
    expect(
      screen.queryByRole("separator", { name: "Resize visualizer and code columns" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("array-visualizer")).toBeInTheDocument();
  });

  it("drops the canvas but keeps the step strips when the visualizer is off", () => {
    const { container } = renderLayout({
      panels: allPanels({ visualizer: false }),
      controlProps: dummyControlProps,
    });

    expect(region(container, "canvas")).toBeNull();
    expect(screen.queryByTestId("array-visualizer")).not.toBeInTheDocument();
    expect(screen.getByTestId("code-viewer")).toBeInTheDocument();

    expect(screen.getByTestId("tutorial-card")).toBeInTheDocument();
    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();

    const panel = screen.getByTestId("control-panel");
    expect(panel).toHaveAttribute("data-variant", "standalone");
    expect(region(container, "controls")).toBeNull();
  });

  it("shows a calm empty state instead of a blank stage when every panel is off", () => {
    const { container } = renderLayout({
      panels: {
        problem: false,
        solution: false,
        visualizer: false,
        code: false,
        tutorial: false,
        auxiliary: false,
        complexity: false,
      },
      controlProps: dummyControlProps,
    });

    expect(screen.getByText("Every panel is hidden")).toBeInTheDocument();
    expect(
      screen.getByText(/Turn on Visualizer, Code, Tutorial or Aux data in the navbar/),
    ).toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll<HTMLElement>('[role="separator"]')).map((handle) =>
        handle.getAttribute("aria-label"),
      ),
    ).toEqual([]);
    expect(panelRow(container, "code")).toBeNull();
    expect(panelRow(container, "visualizer")).toBeNull();
    expect(screen.queryByTestId("control-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("problem-description-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("solution-approach-card")).not.toBeInTheDocument();
  });

  it("renders the canvas fallback and no strips when currentStep is null", () => {
    const { container } = renderLayout({ currentStep: null });

    expect(screen.getByText("No visual snapshot available")).toBeInTheDocument();
    expect(region(container, "working-data")).toBeNull();
    expect(region(container, "tutorial")).toBeNull();
    expect(region(container, "canvas")).toBeInTheDocument();
  });

  it("passes trivia lineExplanations to CodeBlockViewer when present on algorithm", () => {
    renderLayout({
      algorithm: {
        ...dummyAlgorithm,
        trivia: {
          lineExplanations: { 1: "Line 1 explanation" },
        },
      },
    });

    expect(screen.getByTestId("code-viewer")).toBeInTheDocument();
  });
});
