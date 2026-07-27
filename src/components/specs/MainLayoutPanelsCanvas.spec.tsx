import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../../ui";
import type { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../types/dsa";
import type { ControlPanelProps } from "../../ui";

vi.mock("../../ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../ui")>();
  return {
    ...actual,
    ProblemDescriptionCard: () => <div data-testid="problem-description-card" />,
    SolutionApproachCard: () => <div data-testid="solution-approach-card" />,
    ControlPanel: ({
      variant,
      currentStep,
      totalSteps,
    }: {
      variant?: string;
      currentStep: number;
      totalSteps: number;
    }) => (
      <div data-testid="control-panel" data-variant={variant}>
        <span>{`${currentStep} / ${totalSteps}`}</span>
      </div>
    ),
    TutorialCard: () => <div data-testid="tutorial-card" />,
    AuxiliaryPanel: () => <div data-testid="auxiliary-panel" />,
    hasAuxiliaryContent: () => true,
    CodeBlockViewer: () => <pre data-testid="code-viewer" />,
    ComplexityCard: () => <div data-testid="complexity-card" />,
  };
});
vi.mock("../primitives/ArrayVisualizer", () => ({
  ArrayVisualizer: ({ elements }: { elements: { value: number }[] }) => (
    <div data-testid="array-visualizer">{elements.map((el) => el.value).join(",")}</div>
  ),
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
  primarySnapshot: {
    kind: "array",
    elements: [
      { id: "0", value: 3, state: "active" },
      { id: "1", value: 1, state: "active" },
    ],
  },
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

const stagePanel = (container: HTMLElement): HTMLElement =>
  container.querySelector('[data-panel="visualizer"]') as HTMLElement;

const region = (container: HTMLElement, name: string): HTMLElement | null =>
  container.querySelector(`[data-region="${name}"]`);

const renderLayout = (overrides: Partial<ComponentProps<typeof MainLayout>> = {}) =>
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

describe("MainLayoutPanelsCanvas Component Spec", () => {
  it("renders tutorial, working data & variables, and visualizer canvas as separate rows", () => {
    const { container } = renderLayout({ controlProps: dummyControlProps });

    expect(screen.getByTestId("auxiliary-panel")).toBeInTheDocument();
    expect(screen.getByTestId("array-visualizer")).toBeInTheDocument();
    expect(screen.getByTestId("tutorial-card")).toBeInTheDocument();
    expect(screen.getByTestId("control-panel")).toBeInTheDocument();

    expect(panelRow(container, "tutorial")).toBeInTheDocument();
    expect(panelRow(container, "auxiliary")).toBeInTheDocument();
    expect(panelRow(container, "visualizer")).toBeInTheDocument();
  });

  it("hides the working-data row when disabled", () => {
    const { container } = renderLayout({
      panels: allPanels({ auxiliary: false }),
      controlProps: dummyControlProps,
    });

    expect(panelRow(container, "tutorial")).toBeInTheDocument();
    expect(panelRow(container, "auxiliary")).toBeNull();
    expect(panelRow(container, "visualizer")).toBeInTheDocument();
  });

  it("ranks rows independently in the left column", () => {
    const { container } = renderLayout();

    expect(panelRow(container, "visualizer")).toBeInTheDocument();
    expect(panelRow(container, "tutorial")).toBeInTheDocument();
    expect(panelRow(container, "auxiliary")).toBeInTheDocument();
  });

  it("renders no auxiliary panel when both strips are off", () => {
    const { container } = renderLayout({
      panels: allPanels({ tutorial: false, auxiliary: false }),
    });

    expect(panelRow(container, "auxiliary")).toBeNull();
  });

  it("gives the canvas every leftover pixel and never centres a child inside it", () => {
    const { container } = renderLayout();

    const canvas = region(container, "canvas") as HTMLElement;
    expect(canvas.style.flex).toBe("1 1 0%");
    expect(canvas.style.minHeight).toBe("0");
    expect(canvas.style.alignItems).toBe("");
    expect(canvas.style.justifyContent).toBe("");
    expect(canvas.style.padding).toBe("0px");
    expect(canvas.style.overflowY).toBe("hidden");
    expect(canvas.style.overflowX).toBe("auto");
  });

  it("embeds playback controls at the bottom edge of the visualizer panel", () => {
    renderLayout({ controlProps: dummyControlProps });

    const panel = screen.getByTestId("control-panel");
    expect(panel).toHaveAttribute("data-variant", "embedded");
    expect(panel).toHaveTextContent("0 / 5");
  });

  it("hands the canvas the space of a hidden strip and renders no wrapper for it", () => {
    const { container } = renderLayout({
      panels: allPanels({ tutorial: false, auxiliary: false }),
    });

    expect(region(container, "working-data")).toBeNull();
    expect(region(container, "tutorial")).toBeNull();
    expect(screen.queryByTestId("tutorial-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auxiliary-panel")).not.toBeInTheDocument();

    const canvas = region(container, "canvas") as HTMLElement;
    expect(canvas.style.flex).toBe("1 1 0%");
    expect(stagePanel(container)).toContainElement(canvas);
  });

  it("constructs resolvedControlProps when top-level control props are passed instead of controlProps object", () => {
    renderLayout({
      controlProps: undefined,
      isPlaying: true,
      onPlayPause: vi.fn(),
      onStepBack: vi.fn(),
      onStepForward: vi.fn(),
      onReset: vi.fn(),
      currentStepIndex: 2,
      totalSteps: 10,
      speed: 400,
    });

    const panel = screen.getByTestId("control-panel");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent("2 / 10");
  });
});
