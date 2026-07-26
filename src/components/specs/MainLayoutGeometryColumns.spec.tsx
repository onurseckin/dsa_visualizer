import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { MainLayout } from "../MainLayout";
import type { AlgorithmDefinition, AlgorithmStep, PanelVisibility } from "../../types/dsa";
import {
  DEFAULT_WORKSPACE_LAYOUT,
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

describe("MainLayoutGeometryColumns Component Spec", () => {
  it("gives the visualizer column the wider default share of the stage", () => {
    renderLayout();

    expect(columnHandle()).toHaveAttribute("aria-valuenow", "60");
    expect(DEFAULT_WORKSPACE_LAYOUT.splitPercent).toBe(60);
  });

  it("restores persisted sizes on mount, including the step rows", () => {
    seedLayout({
      version: 8,
      splitPercent: 40,
      panelHeights: {
        stage: null,
        visualizer: null,
        tutorial: 96,
        auxiliary: null,
        code: 320,
        complexity: 240,
        problem: null,
        solution: null,
      },
      problemExpanded: true,
      solutionExpanded: true,
    });

    const { container } = renderLayout();

    expect(columnHandle()).toHaveAttribute("aria-valuenow", "40");
    expect((panelRow(container, "code") as HTMLElement).style.height).toBe("320px");
    expect((panelRow(container, "complexity") as HTMLElement).style.height).toBe("240px");
    expect((panelRow(container, "tutorial") as HTMLElement).style.height).toBe("96px");
    expect(panelRow(container, "tutorial")).toHaveAttribute("data-height-mode", "pinned");
    expect(panelRow(container, "auxiliary")).toHaveAttribute("data-height-mode", "hug");
    expect(panelRow(container, "visualizer")).toHaveAttribute("data-height-mode", "greedy");
  });

  it("ignores a payload from the previous v7 schema", () => {
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

    const { container } = renderLayout();

    expect(columnHandle()).toHaveAttribute(
      "aria-valuenow",
      String(DEFAULT_WORKSPACE_LAYOUT.splitPercent),
    );
    expect(panelRow(container, "complexity")).toHaveAttribute("data-height-mode", "hug");
    expect(screen.getByRole("main")).toHaveAttribute("data-problem-expanded", "true");
    expect(screen.getByRole("main")).toHaveAttribute("data-solution-expanded", "true");
  });

  it("persists a keyboard nudge of the column split so it survives a reload", () => {
    renderLayout();

    fireEvent.keyDown(columnHandle(), { key: "ArrowRight" });

    expect(columnHandle()).toHaveAttribute("aria-valuenow", "62");
    expect(storedLayout()?.splitPercent).toBe(62);
    expect(storedLayout()?.panelHeights).toEqual(DEFAULT_WORKSPACE_LAYOUT.panelHeights);
  });

  it("pins only the resized panel and leaves every other panel automatic", () => {
    const { container } = renderLayout();

    const rowHandle = screen.getByRole("separator", { name: "Resize code and complexity rows" });
    fireEvent.keyDown(rowHandle, { key: "ArrowDown" });

    expect(storedLayout()?.panelHeights).toEqual({
      stage: null,
      visualizer: null,
      tutorial: null,
      auxiliary: null,
      code: MIN_PANEL_HEIGHT_PX,
      complexity: null,
      problem: null,
      solution: null,
    });
    const code = panelRow(container, "code") as HTMLElement;
    expect(code).toHaveAttribute("data-height-mode", "pinned");
    expect(code.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);
    expect(code.style.overflowY).toBe("auto");
    expect(panelRow(container, "complexity")).toHaveAttribute("data-height-mode", "hug");
  });

  it("pins the tutorial row from the step handle and leaves the rest automatic", () => {
    const { container } = renderLayout();

    fireEvent.keyDown(
      screen.getByRole("separator", { name: "Resize tutorial and working data & variables rows" }),
      { key: "ArrowDown" },
    );

    expect(storedLayout()?.panelHeights).toEqual({
      stage: null,
      visualizer: null,
      tutorial: MIN_PANEL_HEIGHT_PX,
      auxiliary: null,
      code: null,
      complexity: null,
      problem: null,
      solution: null,
    });
    const tutorial = panelRow(container, "tutorial") as HTMLElement;
    expect(tutorial).toHaveAttribute("data-height-mode", "pinned");
    expect(tutorial.style.height).toBe(`${MIN_PANEL_HEIGHT_PX}px`);
    expect(panelRow(container, "auxiliary")).toHaveAttribute("data-height-mode", "hug");
    expect(panelRow(container, "visualizer")).toHaveAttribute("data-height-mode", "greedy");
  });
});
