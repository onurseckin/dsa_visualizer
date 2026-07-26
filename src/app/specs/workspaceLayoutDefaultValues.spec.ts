import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_VERSION,
  WORKSPACE_PANEL_KEYS,
  readWorkspaceLayout,
} from "../workspaceLayout";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("workspaceLayout default configurations", () => {
  it("uses the v8 versioned localStorage key", () => {
    expect(WORKSPACE_LAYOUT_KEY).toBe("dsa_visualizer_workspace_layout_v8");
    expect(WORKSPACE_LAYOUT_VERSION).toBe(8);
    expect(DEFAULT_WORKSPACE_LAYOUT.version).toBe(8);
  });

  it("keeps a height slot for every resizable section, all automatic by default", () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.panelHeights).toEqual({
      stage: null,
      visualizer: null,
      tutorial: null,
      auxiliary: null,
      code: null,
      complexity: null,
      problem: null,
      solution: null,
    });
    expect(WORKSPACE_PANEL_KEYS).toEqual([
      "stage",
      "visualizer",
      "tutorial",
      "auxiliary",
      "code",
      "complexity",
      "problem",
      "solution",
    ]);
  });

  it("gives the visualizer column the wider default share of the stage", () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.splitPercent).toBe(60);
  });

  it("opens both the problem and solution panels by default", () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.problemExpanded).toBe(true);
    expect(DEFAULT_WORKSPACE_LAYOUT.solutionExpanded).toBe(true);
    expect(readWorkspaceLayout().problemExpanded).toBe(true);
    expect(readWorkspaceLayout().solutionExpanded).toBe(true);
  });

  it("returns defaults when nothing is stored", () => {
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("hands out copies so callers cannot mutate the shared defaults", () => {
    const first = readWorkspaceLayout();
    first.splitPercent = 11;
    first.panelHeights.code = 999;
    first.problemExpanded = false;
    first.solutionExpanded = false;

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(DEFAULT_WORKSPACE_LAYOUT.panelHeights.code).toBeNull();
    expect(DEFAULT_WORKSPACE_LAYOUT.problemExpanded).toBe(true);
    expect(DEFAULT_WORKSPACE_LAYOUT.solutionExpanded).toBe(true);
  });
});
