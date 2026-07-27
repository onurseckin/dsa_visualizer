import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../../ui";
import type { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../types/dsa";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WorkspaceLayout,
  clearWorkspaceLayout,
} from "../../app/workspaceLayout";

vi.mock("../primitives/ProblemDescriptionCard", () => ({
  ProblemDescriptionCard: ({
    expanded,
    onToggleExpanded,
  }: {
    expanded: boolean;
    onToggleExpanded: () => void;
  }) => (
    <div data-testid="problem-description-card">
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Problem Details
      </button>
    </div>
  ),
}));

vi.mock("../primitives/SolutionApproachCard", () => ({
  SolutionApproachCard: ({
    expanded,
    onToggleExpanded,
  }: {
    expanded: boolean;
    onToggleExpanded: () => void;
  }) => (
    <div data-testid="solution-approach-card">
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Solution Details
      </button>
    </div>
  ),
}));

vi.mock("../ControlPanel", () => ({
  ControlPanel: () => <div data-testid="control-panel" />,
}));

const dummyAlgorithm: AlgorithmDefinition = {
  id: "bubble-sort",
  title: "Bubble Sort Algorithm",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description: "Repeatedly steps through",
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
  explanation: { what: "Step", why: "Why" },
  primarySnapshot: { kind: "array", elements: [{ id: "0", value: 3, state: "active" }] },
  auxiliaryState: { stack: ["bubble"] },
  variables: {},
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

const columnHandle = (): HTMLElement =>
  screen.getByRole("separator", { name: "Resize visualizer and code columns" });

const panelRow = (container: HTMLElement, id: string): HTMLElement | null =>
  container.querySelector(`[data-row="${id}"]`);

const storedLayout = (): WorkspaceLayout | null => {
  const raw = localStorage.getItem(WORKSPACE_LAYOUT_KEY);
  return raw === null ? null : (JSON.parse(raw) as WorkspaceLayout);
};

const seedLayout = (layout: WorkspaceLayout): void => {
  localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify(layout));
};

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

describe("MainLayoutResetEvents Component Spec", () => {
  const customLayout: WorkspaceLayout = {
    version: 8,
    splitPercent: 40,
    panelHeights: {
      stage: null,
      visualizer: null,
      tutorial: null,
      auxiliary: null,
      code: 320,
      complexity: 240,
      problem: null,
      solution: null,
    },
    problemExpanded: false,
    solutionExpanded: false,
  };

  it("renders no reset control and no confirm dialog of its own", () => {
    renderLayout();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reset layout/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Reset workspace layout?")).not.toBeInTheDocument();
  });

  it("reloads defaults live when the workspace-layout reset event fires", () => {
    seedLayout(customLayout);
    const { container } = renderLayout();

    expect(columnHandle()).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByRole("main")).toHaveAttribute("data-problem-expanded", "false");
    expect(screen.getByRole("main")).toHaveAttribute("data-solution-expanded", "false");

    clearWorkspaceLayout();
    fireEvent(window, new Event(WORKSPACE_LAYOUT_RESET_EVENT));

    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
    expect(columnHandle()).toHaveAttribute(
      "aria-valuenow",
      String(DEFAULT_WORKSPACE_LAYOUT.splitPercent),
    );
    expect(screen.getByRole("main")).toHaveAttribute("data-problem-expanded", "true");
    expect(screen.getByRole("main")).toHaveAttribute("data-solution-expanded", "true");
    for (const id of ["code", "complexity"]) {
      expect(panelRow(container, id)).toHaveAttribute("data-height-mode", "hug");
      expect((panelRow(container, id) as HTMLElement).style.height).toBe("");
    }
  });

  it("ignores the announcement once unmounted, so a reset cannot resurrect it", () => {
    seedLayout(customLayout);
    const { unmount } = renderLayout();

    unmount();
    clearWorkspaceLayout();

    expect(() => fireEvent(window, new Event(WORKSPACE_LAYOUT_RESET_EVENT))).not.toThrow();
  });

  it("re-reads whatever is stored, so an announcement without a clear keeps the layout", () => {
    seedLayout(customLayout);
    renderLayout();

    fireEvent(window, new Event(WORKSPACE_LAYOUT_RESET_EVENT));

    expect(columnHandle()).toHaveAttribute("aria-valuenow", "40");
    expect(storedLayout()).toEqual(customLayout);
  });
});
