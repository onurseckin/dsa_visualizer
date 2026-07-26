import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../MainLayout";
import type { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../types/dsa";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  WORKSPACE_LAYOUT_KEY,
  WorkspaceLayout,
} from "../../app/workspaceLayout";

vi.mock("../primitives/ProblemDescriptionCard", () => ({
  ProblemDescriptionCard: ({
    description,
    expanded,
    onToggleExpanded,
  }: {
    description: string;
    expanded: boolean;
    onToggleExpanded: () => void;
  }) => (
    <div data-testid="problem-description-card">
      <button aria-expanded={expanded} onClick={onToggleExpanded}>
        Problem Details
      </button>
      {expanded && <p>{description}</p>}
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
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
});

const columnHandle = (): HTMLElement =>
  screen.getByRole("separator", { name: "Resize visualizer and code columns" });

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

describe("MainLayoutDetailsPersistence Component Spec", () => {
  const problemExpandedAttr = (): string | null =>
    screen.getByRole("main").getAttribute("data-problem-expanded");
  const solutionExpandedAttr = (): string | null =>
    screen.getByRole("main").getAttribute("data-solution-expanded");

  it("persists a collapse to the v8 key without disturbing the geometry", () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Problem Details" }));

    expect(problemExpandedAttr()).toBe("false");
    expect(storedLayout()?.problemExpanded).toBe(false);
    expect(storedLayout()?.solutionExpanded).toBe(true);
    expect(storedLayout()?.version).toBe(8);
    expect(storedLayout()?.splitPercent).toBe(DEFAULT_WORKSPACE_LAYOUT.splitPercent);
    expect(storedLayout()?.panelHeights).toEqual(DEFAULT_WORKSPACE_LAYOUT.panelHeights);
  });

  it("restores a collapsed problem panel on mount, and reopening persists too", () => {
    seedLayout({
      version: 8,
      splitPercent: 55,
      panelHeights: {
        stage: null,
        visualizer: null,
        tutorial: null,
        auxiliary: null,
        code: null,
        complexity: null,
        problem: null,
        solution: null,
      },
      problemExpanded: false,
      solutionExpanded: true,
    });

    renderLayout();

    expect(problemExpandedAttr()).toBe("false");
    expect(screen.queryByText(dummyAlgorithm.description)).not.toBeInTheDocument();
    expect(columnHandle()).toHaveAttribute("aria-valuenow", "55");

    fireEvent.click(screen.getByRole("button", { name: "Problem Details" }));

    expect(problemExpandedAttr()).toBe("true");
    expect(storedLayout()?.problemExpanded).toBe(true);
    expect(storedLayout()?.splitPercent).toBe(55);
  });

  it("keeps the problem panel state through a later geometry drag", () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Problem Details" }));
    fireEvent.keyDown(columnHandle(), { key: "ArrowRight" });

    expect(storedLayout()?.splitPercent).toBe(62);
    expect(storedLayout()?.problemExpanded).toBe(false);
    expect(problemExpandedAttr()).toBe("false");
  });

  it("collapsing the solution panel never disturbs the problem panel, and vice versa", () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Solution Details" }));

    expect(solutionExpandedAttr()).toBe("false");
    expect(problemExpandedAttr()).toBe("true");
    expect(storedLayout()?.solutionExpanded).toBe(false);
    expect(storedLayout()?.problemExpanded).toBe(true);
  });

  it("opens both panels when the stored payload is from an older schema", () => {
    localStorage.setItem(
      WORKSPACE_LAYOUT_KEY,
      JSON.stringify({
        version: 7,
        splitPercent: 40,
        panelHeights: {
          stage: null,
          visualizer: null,
          tutorial: null,
          auxiliary: null,
          code: null,
          complexity: 240,
        },
        detailsExpanded: false,
      }),
    );

    renderLayout();

    expect(problemExpandedAttr()).toBe("true");
    expect(solutionExpandedAttr()).toBe("true");
  });
});
