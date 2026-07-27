import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../../ui";
import type { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../types/dsa";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_VERSION,
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
  problem: true,
  solution: true,
  visualizer: true,
  code: true,
  tutorial: true,
  auxiliary: true,
});

const storedLayout = (): WorkspaceLayout | null => {
  const raw = localStorage.getItem(WORKSPACE_LAYOUT_KEY);
  return raw === null ? null : (JSON.parse(raw) as WorkspaceLayout);
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

const seedLayout = (layout: WorkspaceLayout): void => {
  localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify(layout));
};

describe("MainLayoutDetailsPersistence Component Spec", () => {
  it("persists workspace layout version key geometry", () => {
    seedLayout(DEFAULT_WORKSPACE_LAYOUT);
    renderLayout();

    expect(storedLayout()?.version).toBe(WORKSPACE_LAYOUT_VERSION);
    expect(storedLayout()?.splitPercent).toBe(DEFAULT_WORKSPACE_LAYOUT.splitPercent);
    expect(storedLayout()?.panelHeights).toEqual(DEFAULT_WORKSPACE_LAYOUT.panelHeights);
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

    expect(screen.getByTestId("problem-description-card")).toBeInTheDocument();
    expect(screen.getByTestId("solution-approach-card")).toBeInTheDocument();
  });
});
