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
  ControlPanel: () => <div data-testid="control-panel" />,
}));

vi.mock("../primitives/TutorialCard", () => ({
  TutorialCard: () => <div data-testid="tutorial-card" />,
  hasTutorialContent: (explanation?: StepExplanation, what?: string, why?: string) =>
    Boolean((what || explanation?.what || "").trim() || (why || explanation?.why || "").trim()),
}));

vi.mock("../primitives/AuxiliaryPanel", () => ({
  AuxiliaryPanel: () => <div data-testid="auxiliary-panel" />,
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
      onToggleTutorial={vi.fn()}
      onToggleAuxiliary={vi.fn()}
      {...overrides}
    />,
  );

afterEach(() => {
  localStorage.clear();
});

describe("MainLayoutColumns Component Spec", () => {
  describe("the code column hugs its content", () => {
    it("sizes code and complexity to their content with neither one greedy", () => {
      const { container } = renderLayout();

      for (const id of ["code", "complexity"]) {
        const element = panelRow(container, id) as HTMLElement;
        expect(element).toHaveAttribute("data-height-mode", "hug");
        expect(element.style.flexGrow).toBe("0");
        expect(element.style.flexShrink).toBe("0");
        expect(element.style.flexBasis).toBe("auto");
        expect(element.style.height).toBe("");
        expect(element.style.overflowY).toBe("visible");
      }
    });

    it("puts the overflow on the column, so the complexity card follows the code directly", () => {
      const { container } = renderLayout();

      const code = panelRow(container, "code") as HTMLElement;
      const complexity = panelRow(container, "complexity") as HTMLElement;
      expect(code.nextElementSibling).toHaveAttribute("role", "separator");
      expect(code.nextElementSibling?.nextElementSibling).toBe(complexity);

      const column = code.parentElement as HTMLElement;
      expect(column.style.overflowY).toBe("auto");
    });

    it("keeps the visualizer as the one greedy panel of the stage", () => {
      const { container } = renderLayout();

      const visualizer = panelRow(container, "visualizer") as HTMLElement;
      expect(visualizer).toHaveAttribute("data-height-mode", "greedy");
      expect(visualizer.style.flexGrow).toBe("1");
      expect(visualizer.style.flexBasis).toBe("0%");
    });

    it("keeps both columns automatic as step content grows and shrinks", () => {
      const { container, rerender } = renderLayout();

      rerender(
        <MainLayout
          algorithm={dummyAlgorithm}
          currentStep={{
            ...dummyStep,
            auxiliaryState: { stack: ["a", "b", "c"], queue: [1, 2], visited: [3, 4, 5] },
            explanation: {
              what: "Comparing elements 3 and 1",
              why: "A much longer teacher sentence that wraps onto several lines and therefore makes this strip taller than it was on the previous step.",
            },
          }}
          panels={allPanels()}
          onToggleTutorial={vi.fn()}
          onToggleAuxiliary={vi.fn()}
        />,
      );

      expect(panelRow(container, "visualizer")).toHaveAttribute("data-height-mode", "greedy");
      for (const id of ["code", "complexity"]) {
        const element = panelRow(container, id) as HTMLElement;
        expect(element).toHaveAttribute("data-height-mode", "hug");
        expect(element.style.height).toBe("");
        expect(element.style.flexBasis).toBe("auto");
      }
      expect(horizontalHandles()).toEqual([
        "Resize the problem description height",
        "Resize tutorial and working data & variables rows",
        "Resize working data & variables and graph visualizer canvas rows",
        "Resize code and complexity rows",
        "Resize the stage height",
        "Resize the solution approach height",
      ]);
    });
  });
});
