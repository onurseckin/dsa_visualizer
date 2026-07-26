import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  WORKSPACE_LAYOUT_KEY,
  WorkspaceLayout,
  cloneWorkspaceLayout,
  readWorkspaceLayout,
} from "../workspaceLayout";

type TestPayload =
  | string
  | number
  | boolean
  | null
  | WorkspaceLayout
  | Record<string, unknown>
  | Array<unknown>;

const seed = (value: TestPayload): void => {
  localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify(value));
};

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

describe("workspaceLayout payload validation", () => {
  it("ignores a payload left behind by the v7 key", () => {
    localStorage.setItem(
      "dsa_visualizer_workspace_layout_v7",
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
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("ignores a v7-shaped payload written under the v8 key", () => {
    seed({
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
    });
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("ignores a v8-versioned payload that predates the problem and solution height slots", () => {
    seed({
      version: 8,
      splitPercent: 40,
      panelHeights: {
        stage: null,
        visualizer: null,
        tutorial: null,
        auxiliary: null,
        code: null,
        complexity: 240,
      },
      problemExpanded: true,
      solutionExpanded: true,
    });
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("ignores a v8-versioned payload that predates problemExpanded and solutionExpanded", () => {
    seed({ version: 8, splitPercent: 40, panelHeights: customLayout.panelHeights });
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("ignores a v8-versioned payload that predates solutionExpanded only", () => {
    seed({
      version: 8,
      splitPercent: 40,
      panelHeights: customLayout.panelHeights,
      problemExpanded: true,
    });
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("ignores an old weight-shaped payload written under the v8 key", () => {
    seed({
      version: 3,
      splitPercent: 40,
      leftRows: { visualizer: 50, tutorial: 30, auxiliary: 20 },
      rightRows: { code: 55, complexity: 45 },
    });
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("falls back to defaults for malformed JSON", () => {
    localStorage.setItem(WORKSPACE_LAYOUT_KEY, "{not json");
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  const invalidPayloads: [string, TestPayload][] = [
    ["a non-object payload", 42],
    [
      "a missing splitPercent",
      {
        version: 8,
        panelHeights: customLayout.panelHeights,
        problemExpanded: true,
        solutionExpanded: true,
      },
    ],
    ["a null panelHeights group", { ...customLayout, panelHeights: null }],
    ["an array panelHeights group", { ...customLayout, panelHeights: [180, 240] }],
    [
      "a string height",
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, code: "180" } },
    ],
    ["an out-of-range splitPercent", { ...customLayout, splitPercent: 99 }],
    [
      "a height below the floor",
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, code: 4 } },
    ],
    [
      "a height above the ceiling",
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, code: 9000 } },
    ],
    [
      "a missing panel key",
      {
        ...customLayout,
        panelHeights: {
          stage: null,
          visualizer: null,
          tutorial: null,
          auxiliary: null,
          code: 180,
          problem: null,
        },
      },
    ],
    ["a string problemExpanded", { ...customLayout, problemExpanded: "true" }],
    ["a null problemExpanded", { ...customLayout, problemExpanded: null }],
    ["a string solutionExpanded", { ...customLayout, solutionExpanded: "true" }],
    ["a null solutionExpanded", { ...customLayout, solutionExpanded: null }],
  ];

  it.each(invalidPayloads)("falls back to defaults for %s", (_label, payload) => {
    seed(payload);
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("drops unknown keys found in storage", () => {
    seed({
      ...customLayout,
      rogue: "value",
      panelHeights: { ...customLayout.panelHeights, band: 180 },
    });

    const layout = readWorkspaceLayout();
    expect(layout).toEqual(customLayout);
    expect(Object.keys(layout).sort()).toEqual([
      "panelHeights",
      "problemExpanded",
      "solutionExpanded",
      "splitPercent",
      "version",
    ]);
    expect(Object.keys(layout.panelHeights).sort()).toEqual([
      "auxiliary",
      "code",
      "complexity",
      "problem",
      "solution",
      "stage",
      "tutorial",
      "visualizer",
    ]);
  });

  it("clones deeply so nested panel heights are not shared", () => {
    const copy = cloneWorkspaceLayout(customLayout);
    copy.panelHeights.code = 1;
    copy.problemExpanded = true;
    copy.solutionExpanded = true;

    expect(customLayout.panelHeights.code).toBe(180);
    expect(customLayout.problemExpanded).toBe(false);
    expect(customLayout.solutionExpanded).toBe(false);
  });
});
