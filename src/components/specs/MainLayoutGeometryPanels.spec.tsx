import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../MainLayout";
import type { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../types/dsa";
import {
  MIN_PANEL_HEIGHT_PX,
  WORKSPACE_LAYOUT_KEY,
  WorkspaceLayout,
} from "../../app/workspaceLayout";

vi.mock("../primitives/ProblemDescriptionCard", () => ({
  ProblemDescriptionCard: () => <div data-testid="problem-description-card" />,
}));

vi.mock("../primitives/SolutionApproachCard", () => ({
  SolutionApproachCard: () => <div data-testid="solution-approach-card" />,
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

describe("MainLayoutGeometryPanels Component Spec", () => {
  it("pins the stage height from its own handle and gives it back on double-click", () => {
    const { container } = renderLayout();

    const stage = container.querySelector('[data-stage="workspace"]') as HTMLElement;
    const stageHandle = screen.getByRole("separator", { name: "Resize the stage height" });

    fireEvent.keyDown(stageHandle, { key: "ArrowDown" });

    expect(storedLayout()?.panelHeights.stage).toBe(MIN_PANEL_HEIGHT_PX);
    expect(stage.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);

    fireEvent.doubleClick(stageHandle);

    expect(storedLayout()?.panelHeights.stage).toBeNull();
    expect(stage.style.height).toContain("max(var(--stage-min-h)");
  });

  it("pins the problem panel height from its own handle, scrolls it, and restores automatic on double-click", () => {
    renderLayout();

    const problemWrapper = screen.getByTestId("problem-description-card")
      .parentElement as HTMLElement;
    const problemHandle = screen.getByRole("separator", {
      name: "Resize the problem description height",
    });

    expect(problemWrapper).toHaveAttribute("data-height-mode", "hug");
    expect(problemWrapper.style.height).toBe("");

    fireEvent.keyDown(problemHandle, { key: "ArrowDown" });

    expect(storedLayout()?.panelHeights.problem).toBe(MIN_PANEL_HEIGHT_PX);
    expect(problemWrapper).toHaveAttribute("data-height-mode", "pinned");
    expect(problemWrapper.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);
    expect(problemWrapper.style.overflowY).toBe("auto");
    expect(storedLayout()?.panelHeights.solution).toBeNull();

    fireEvent.doubleClick(problemHandle);

    expect(storedLayout()?.panelHeights.problem).toBeNull();
    expect(problemWrapper).toHaveAttribute("data-height-mode", "hug");
    expect(problemWrapper.style.height).toBe("");
    expect(problemWrapper.style.overflowY).toBe("");
  });

  it("pins the solution panel height from its own handle, scrolls it, and restores automatic on double-click", () => {
    renderLayout();

    const solutionWrapper = screen.getByTestId("solution-approach-card")
      .parentElement as HTMLElement;
    const solutionHandle = screen.getByRole("separator", {
      name: "Resize the solution approach height",
    });

    expect(solutionWrapper).toHaveAttribute("data-height-mode", "hug");

    fireEvent.keyDown(solutionHandle, { key: "ArrowDown" });

    expect(storedLayout()?.panelHeights.solution).toBe(MIN_PANEL_HEIGHT_PX);
    expect(solutionWrapper).toHaveAttribute("data-height-mode", "pinned");
    expect(solutionWrapper.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);
    expect(solutionWrapper.style.overflowY).toBe("auto");
    expect(storedLayout()?.panelHeights.problem).toBeNull();

    fireEvent.doubleClick(solutionHandle);

    expect(storedLayout()?.panelHeights.solution).toBeNull();
    expect(solutionWrapper).toHaveAttribute("data-height-mode", "hug");
    expect(solutionWrapper.style.overflowY).toBe("");
  });

  it("restores a pinned problem/solution height on mount from a stored v8 payload", () => {
    seedLayout({
      version: 8,
      splitPercent: 70,
      panelHeights: {
        stage: null,
        visualizer: null,
        tutorial: null,
        auxiliary: null,
        code: null,
        complexity: null,
        problem: 180,
        solution: 220,
      },
      problemExpanded: true,
      solutionExpanded: true,
    });

    renderLayout();

    const problemWrapper = screen.getByTestId("problem-description-card")
      .parentElement as HTMLElement;
    const solutionWrapper = screen.getByTestId("solution-approach-card")
      .parentElement as HTMLElement;

    expect(problemWrapper.style.height).toBe("180px");
    expect(problemWrapper.style.overflowY).toBe("auto");
    expect(solutionWrapper.style.height).toBe("220px");
    expect(solutionWrapper.style.overflowY).toBe("auto");
  });

  it("restores a pinned panel to automatic on double-click and persists that", () => {
    seedLayout({
      version: 8,
      splitPercent: 70,
      panelHeights: {
        stage: null,
        visualizer: null,
        tutorial: null,
        auxiliary: null,
        code: 240,
        complexity: null,
        problem: null,
        solution: null,
      },
      problemExpanded: true,
      solutionExpanded: true,
    });
    const { container } = renderLayout();

    expect((panelRow(container, "code") as HTMLElement).style.height).toBe("240px");

    fireEvent.doubleClick(
      screen.getByRole("separator", { name: "Resize code and complexity rows" }),
    );

    expect(panelRow(container, "code")).toHaveAttribute("data-height-mode", "hug");
    expect(storedLayout()?.panelHeights.code).toBeNull();
  });
});
