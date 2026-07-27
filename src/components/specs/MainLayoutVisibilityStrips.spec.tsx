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
  TutorialCard: () => (
    <div data-testid="tutorial-card">
      <div>Dismiss explanation</div>
    </div>
  ),
  hasTutorialContent: (explanation?: StepExplanation, what?: string, why?: string) =>
    Boolean((what || explanation?.what || "").trim() || (why || explanation?.why || "").trim()),
}));

vi.mock("../primitives/AuxiliaryPanel", () => ({
  AuxiliaryPanel: () => (
    <div data-testid="auxiliary-panel">
      <div>Hide auxiliary panel</div>
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

const horizontalHandles = (): string[] =>
  screen
    .getAllByRole("separator")
    .filter((handle) => handle.getAttribute("aria-orientation") === "horizontal")
    .map((handle) => handle.getAttribute("aria-label") ?? "");

const panelRow = (container: HTMLElement, id: string): HTMLElement | null =>
  container.querySelector(`[data-row="${id}"]`);

const renderLayout = (
  overrides: Partial<ComponentProps<typeof MainLayout>> = {},
): ReturnType<typeof render> =>
  render(
    <MainLayout
      algorithm={dummyAlgorithm}
      currentStep={dummyStep}
      panels={allPanels()}

      {...overrides}
    />,
  );

afterEach(() => {
  localStorage.clear();
});

describe("MainLayoutVisibilityStrips Component Spec", () => {
  it("renders nothing at all for a hidden strip — no row, no handle, no gap", () => {
    const { container } = renderLayout({
      panels: allPanels({ tutorial: false, auxiliary: false }),
    });

    expect(panelRow(container, "tutorial")).toBeNull();
    expect(panelRow(container, "auxiliary")).toBeNull();
    expect(horizontalHandles()).toEqual([
      "Resize the problem description height",
      "Resize code and complexity rows",
      "Resize the stage height",
      "Resize the solution approach height",
    ]);
  });

  it("renders no working-data strip when the step carries an empty auxiliary state", () => {
    const { container } = renderLayout({
      currentStep: { ...dummyStep, auxiliaryState: {} },
      panels: allPanels(),
    });

    expect(container.querySelector('[data-region="working-data"]')).toBeNull();
    expect(screen.queryByTestId("auxiliary-panel")).not.toBeInTheDocument();
  });

  it("renders no working-data strip when every auxiliary collection is empty", () => {
    const { container } = renderLayout({
      currentStep: {
        ...dummyStep,
        auxiliaryState: { stack: [], queue: [], visited: [], hashMap: {} },
      },
      panels: allPanels(),
    });

    expect(container.querySelector('[data-region="working-data"]')).toBeNull();
  });

  it("renders no tutorial strip when the step explanation is blank", () => {
    const { container } = renderLayout({
      currentStep: { ...dummyStep, explanation: { what: "   ", why: "" } },
      panels: allPanels(),
    });

    expect(container.querySelector('[data-region="tutorial"]')).toBeNull();
    expect(screen.queryByTestId("tutorial-card")).not.toBeInTheDocument();
  });
});
