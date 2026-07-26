import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  WORKSPACE_LAYOUT_KEY,
  WorkspaceLayout,
  clampPanelHeight,
  clampSplitPercent,
  clearWorkspaceLayout,
  readWorkspaceLayout,
  resetWorkspaceLayout,
  writeWorkspaceLayout,
} from "../workspaceLayout";

const customLayout: WorkspaceLayout = {
  version: 8,
  splitPercent: 42,
  panelHeights: {
    stage: null,
    visualizer: null,
    tutorial: null,
    auxiliary: null,
    code: 180,
    complexity: 240,
    problem: null,
    solution: null,
  },
  problemExpanded: false,
  solutionExpanded: false,
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("workspaceLayout read, write, patch and clamping operations", () => {
  it("restores a previously written layout across a fresh read (reload / dev-server restart)", () => {
    writeWorkspaceLayout(customLayout);

    expect(readWorkspaceLayout()).toEqual(customLayout);
  });

  it("round-trips a collapsed problem panel and reopening it", () => {
    expect(writeWorkspaceLayout({ problemExpanded: false }).problemExpanded).toBe(false);
    expect(readWorkspaceLayout().problemExpanded).toBe(false);

    expect(writeWorkspaceLayout({ problemExpanded: true }).problemExpanded).toBe(true);
    expect(readWorkspaceLayout().problemExpanded).toBe(true);
  });

  it("round-trips a collapsed solution panel independently of the problem panel", () => {
    expect(writeWorkspaceLayout({ solutionExpanded: false }).solutionExpanded).toBe(false);
    expect(readWorkspaceLayout().problemExpanded).toBe(true);

    expect(writeWorkspaceLayout({ solutionExpanded: true }).solutionExpanded).toBe(true);
    expect(readWorkspaceLayout().solutionExpanded).toBe(true);
  });

  it("keeps both expansion flags when a later patch only touches geometry", () => {
    writeWorkspaceLayout({ problemExpanded: false, solutionExpanded: false });

    const merged = writeWorkspaceLayout({ splitPercent: 55, panelHeights: { code: 200 } });

    expect(merged.problemExpanded).toBe(false);
    expect(merged.solutionExpanded).toBe(false);
    expect(readWorkspaceLayout().problemExpanded).toBe(false);
    expect(readWorkspaceLayout().solutionExpanded).toBe(false);
  });

  it("keeps the geometry when a later patch only toggles the panels", () => {
    writeWorkspaceLayout(customLayout);

    const merged = writeWorkspaceLayout({ problemExpanded: true, solutionExpanded: true });

    expect(merged.splitPercent).toBe(customLayout.splitPercent);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
  });

  it("merges a partial patch onto the stored layout instead of replacing it", () => {
    writeWorkspaceLayout(customLayout);

    const merged = writeWorkspaceLayout({ splitPercent: 33 });

    expect(merged.splitPercent).toBe(33);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
    expect(readWorkspaceLayout()).toEqual(merged);
  });

  it("pins only the panel named in the patch and leaves the rest automatic", () => {
    const merged = writeWorkspaceLayout({ panelHeights: { code: 150 } });

    expect(merged.panelHeights).toEqual({
      stage: null,
      visualizer: null,
      tutorial: null,
      auxiliary: null,
      code: 150,
      complexity: null,
      problem: null,
      solution: null,
    });
  });

  it("pins the problem panel height without disturbing the stage or the code column", () => {
    const merged = writeWorkspaceLayout({ panelHeights: { problem: 120 } });

    expect(merged.panelHeights).toEqual({
      stage: null,
      visualizer: null,
      tutorial: null,
      auxiliary: null,
      code: null,
      complexity: null,
      problem: 120,
      solution: null,
    });
    expect(readWorkspaceLayout().panelHeights.problem).toBe(120);
  });

  it("pins the solution panel height without disturbing the problem panel", () => {
    const merged = writeWorkspaceLayout({ panelHeights: { solution: 300 } });

    expect(merged.panelHeights.solution).toBe(300);
    expect(merged.panelHeights.problem).toBeNull();
    expect(readWorkspaceLayout().panelHeights.solution).toBe(300);
  });

  it('treats an explicit null as "back to automatic" and an absent key as "unchanged"', () => {
    writeWorkspaceLayout({ panelHeights: { code: 150, complexity: 300 } });

    const merged = writeWorkspaceLayout({ panelHeights: { code: null } });

    expect(merged.panelHeights.code).toBeNull();
    expect(merged.panelHeights.complexity).toBe(300);
  });

  it("clamps out-of-range heights on write and degrades unusable numbers to automatic", () => {
    const merged = writeWorkspaceLayout({
      splitPercent: 250,
      panelHeights: { visualizer: 1, complexity: 99999, code: Number.NaN },
    });

    expect(merged.splitPercent).toBe(MAX_SPLIT_PERCENT);
    expect(merged.panelHeights.visualizer).toBe(MIN_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.complexity).toBe(MAX_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.code).toBeNull();
  });

  it("clamps a below-minimum split percent up to the floor", () => {
    expect(writeWorkspaceLayout({ splitPercent: 1 }).splitPercent).toBe(MIN_SPLIT_PERCENT);
  });

  it("clamps panel heights through the exported helper", () => {
    expect(clampPanelHeight(null)).toBeNull();
    expect(clampPanelHeight(Number.POSITIVE_INFINITY)).toBeNull();
    expect(clampPanelHeight(10)).toBe(MIN_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(5000)).toBe(MAX_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(200)).toBe(200);

    expect(clampSplitPercent(Number.NaN)).toBe(60);
    expect(clampSplitPercent(Number.POSITIVE_INFINITY)).toBe(60);
    expect(clampSplitPercent(10)).toBe(MIN_SPLIT_PERCENT);
    expect(clampSplitPercent(95)).toBe(MAX_SPLIT_PERCENT);
  });

  it("never throws when storage reads fail", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    expect(() => readWorkspaceLayout()).not.toThrow();
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("never throws when storage writes fail and still returns the merged layout", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    const merged = writeWorkspaceLayout({ splitPercent: 44 });

    expect(merged.splitPercent).toBe(44);
  });

  it("never throws when clearing fails", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    expect(() => clearWorkspaceLayout()).not.toThrow();
  });

  it("clears the key only when asked, and then reads every panel back as automatic", () => {
    writeWorkspaceLayout(customLayout);
    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).not.toBeNull();

    clearWorkspaceLayout();

    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("resets layout and dispatches WORKSPACE_LAYOUT_RESET_EVENT on window", () => {
    writeWorkspaceLayout(customLayout);

    const listener = vi.fn();
    window.addEventListener("dsa:workspace-layout-reset", listener);

    const result = readWorkspaceLayout();
    expect(result.splitPercent).toBe(42);

    const resetLayout = resetWorkspaceLayout();
    expect(resetLayout).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener("dsa:workspace-layout-reset", listener);
  });

  it("returns default layout when stored JSON is invalid, wrong version, or has non-boolean expanded fields", () => {
    localStorage.setItem(WORKSPACE_LAYOUT_KEY, "{invalid json");
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);

    localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify("string-value"));
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);

    localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify({ version: 999 }));
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);

    localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify({ version: 8, splitPercent: 10 }));
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);

    localStorage.setItem(
      WORKSPACE_LAYOUT_KEY,
      JSON.stringify({
        version: 8,
        splitPercent: 60,
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
        problemExpanded: "yes",
        solutionExpanded: true,
      }),
    );
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("handles window.localStorage throwing on access gracefully", () => {
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("localStorage restricted");
      },
      configurable: true,
    });

    try {
      expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
      expect(writeWorkspaceLayout({ splitPercent: 50 }).splitPercent).toBe(50);
      expect(() => clearWorkspaceLayout()).not.toThrow();
    } finally {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  });

  it("handles window being undefined in SSR environment", () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error overriding globalThis.window for SSR simulation
      delete globalThis.window;
      expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
      expect(resetWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("handles window.localStorage being null", () => {
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, "localStorage", {
      get() {
        return null;
      },
      configurable: true,
    });

    try {
      expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    } finally {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    }
  });
});
