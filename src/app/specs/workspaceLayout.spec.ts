import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WORKSPACE_LAYOUT_VERSION,
  WORKSPACE_PANEL_KEYS,
  WorkspaceLayout,
  clampPanelHeight,
  clearWorkspaceLayout,
  cloneWorkspaceLayout,
  readWorkspaceLayout,
  resetWorkspaceLayout,
  writeWorkspaceLayout,
} from '../workspaceLayout';
type TestPayload = string | number | boolean | null | WorkspaceLayout | Record<string, unknown> | Array<unknown>;

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

describe('workspaceLayout persistence contract', () => {
  it('uses the v8 versioned localStorage key', () => {
    expect(WORKSPACE_LAYOUT_KEY).toBe('dsa_visualizer_workspace_layout_v8');
    expect(WORKSPACE_LAYOUT_VERSION).toBe(8);
    expect(DEFAULT_WORKSPACE_LAYOUT.version).toBe(8);
  });

  /* v8: ProblemHeader split into ProblemDescriptionCard and SolutionApproachCard
     (TASKS.md 9.6), so `problem` and `solution` join every other section's height
     slot. Each one starts automatic. */
  it('keeps a height slot for every resizable section, all automatic by default', () => {
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
      'stage',
      'visualizer',
      'tutorial',
      'auxiliary',
      'code',
      'complexity',
      'problem',
      'solution',
    ]);
  });

  it('gives the visualizer column the wider default share of the stage', () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.splitPercent).toBe(60);
  });

  it('opens both the problem and solution panels by default', () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.problemExpanded).toBe(true);
    expect(DEFAULT_WORKSPACE_LAYOUT.solutionExpanded).toBe(true);
    expect(readWorkspaceLayout().problemExpanded).toBe(true);
    expect(readWorkspaceLayout().solutionExpanded).toBe(true);
  });

  it('returns defaults when nothing is stored', () => {
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores a payload left behind by the v7 key', () => {
    localStorage.setItem(
      'dsa_visualizer_workspace_layout_v7',
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

  it('ignores a v7-shaped payload written under the v8 key', () => {
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

  /* A v8 payload that predates the problem/solution slots is a partial shape,
     not a usable layout: the missing keys would read back as undefined. */
  it('ignores a v8-versioned payload that predates the problem and solution height slots', () => {
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

  it('ignores a v8-versioned payload that predates problemExpanded and solutionExpanded', () => {
    seed({ version: 8, splitPercent: 40, panelHeights: customLayout.panelHeights });

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores a v8-versioned payload that predates solutionExpanded only', () => {
    seed({
      version: 8,
      splitPercent: 40,
      panelHeights: customLayout.panelHeights,
      problemExpanded: true,
    });

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores an old weight-shaped payload written under the v8 key', () => {
    seed({
      version: 3,
      splitPercent: 40,
      leftRows: { visualizer: 50, tutorial: 30, auxiliary: 20 },
      rightRows: { code: 55, complexity: 45 },
    });

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('hands out copies so callers cannot mutate the shared defaults', () => {
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

  it('restores a previously written layout across a fresh read (reload / dev-server restart)', () => {
    writeWorkspaceLayout(customLayout);

    // A reload is just another read of the same key by a new module instance.
    expect(readWorkspaceLayout()).toEqual(customLayout);
  });

  it('round-trips a collapsed problem panel and reopening it', () => {
    expect(writeWorkspaceLayout({ problemExpanded: false }).problemExpanded).toBe(false);
    expect(readWorkspaceLayout().problemExpanded).toBe(false);

    expect(writeWorkspaceLayout({ problemExpanded: true }).problemExpanded).toBe(true);
    expect(readWorkspaceLayout().problemExpanded).toBe(true);
  });

  it('round-trips a collapsed solution panel independently of the problem panel', () => {
    expect(writeWorkspaceLayout({ solutionExpanded: false }).solutionExpanded).toBe(false);
    expect(readWorkspaceLayout().problemExpanded).toBe(true);

    expect(writeWorkspaceLayout({ solutionExpanded: true }).solutionExpanded).toBe(true);
    expect(readWorkspaceLayout().solutionExpanded).toBe(true);
  });

  it('keeps both expansion flags when a later patch only touches geometry', () => {
    writeWorkspaceLayout({ problemExpanded: false, solutionExpanded: false });

    const merged = writeWorkspaceLayout({ splitPercent: 55, panelHeights: { code: 200 } });

    expect(merged.problemExpanded).toBe(false);
    expect(merged.solutionExpanded).toBe(false);
    expect(readWorkspaceLayout().problemExpanded).toBe(false);
    expect(readWorkspaceLayout().solutionExpanded).toBe(false);
  });

  it('keeps the geometry when a later patch only toggles the panels', () => {
    writeWorkspaceLayout(customLayout);

    const merged = writeWorkspaceLayout({ problemExpanded: true, solutionExpanded: true });

    expect(merged.splitPercent).toBe(customLayout.splitPercent);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
  });

  it('merges a partial patch onto the stored layout instead of replacing it', () => {
    writeWorkspaceLayout(customLayout);

    const merged = writeWorkspaceLayout({ splitPercent: 33 });

    expect(merged.splitPercent).toBe(33);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
    expect(readWorkspaceLayout()).toEqual(merged);
  });

  it('pins only the panel named in the patch and leaves the rest automatic', () => {
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

  it('pins the problem panel height without disturbing the stage or the code column', () => {
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

  it('pins the solution panel height without disturbing the problem panel', () => {
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

  it('clamps out-of-range heights on write and degrades unusable numbers to automatic', () => {
    const merged = writeWorkspaceLayout({
      splitPercent: 250,
      panelHeights: { visualizer: 1, complexity: 99999, code: Number.NaN },
    });

    expect(merged.splitPercent).toBe(MAX_SPLIT_PERCENT);
    expect(merged.panelHeights.visualizer).toBe(MIN_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.complexity).toBe(MAX_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.code).toBeNull();
  });

  it('clamps a below-minimum split percent up to the floor', () => {
    expect(writeWorkspaceLayout({ splitPercent: 1 }).splitPercent).toBe(MIN_SPLIT_PERCENT);
  });

  it('clamps panel heights through the exported helper', () => {
    expect(clampPanelHeight(null)).toBeNull();
    expect(clampPanelHeight(Number.POSITIVE_INFINITY)).toBeNull();
    expect(clampPanelHeight(10)).toBe(MIN_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(5000)).toBe(MAX_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(200)).toBe(200);
  });

  it('falls back to defaults for malformed JSON', () => {
    localStorage.setItem(WORKSPACE_LAYOUT_KEY, '{not json');
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  const invalidPayloads: [string, TestPayload][] = [
    ['a non-object payload', 42],
    [
      'a missing splitPercent',
      {
        version: 8,
        panelHeights: customLayout.panelHeights,
        problemExpanded: true,
        solutionExpanded: true,
      },
    ],
    ['a null panelHeights group', { ...customLayout, panelHeights: null }],
    ['an array panelHeights group', { ...customLayout, panelHeights: [180, 240] }],
    [
      'a string height',
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, code: '180' } },
    ],
    ['an out-of-range splitPercent', { ...customLayout, splitPercent: 99 }],
    [
      'a height below the floor',
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, code: 4 } },
    ],
    [
      'a height above the ceiling',
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, code: 9000 } },
    ],
    [
      'a missing panel key',
      {
        ...customLayout,
        panelHeights: {
          stage: null,
          visualizer: null,
          tutorial: null,
          auxiliary: null,
          code: 180,
          problem: null,
          solution: null,
        },
      },
    ],
    ['a string problemExpanded', { ...customLayout, problemExpanded: 'true' }],
    ['a null problemExpanded', { ...customLayout, problemExpanded: null }],
    ['a string solutionExpanded', { ...customLayout, solutionExpanded: 'true' }],
    ['a null solutionExpanded', { ...customLayout, solutionExpanded: null }],
  ];

  it.each(invalidPayloads)('falls back to defaults for %s', (_label, payload) => {
    seed(payload);
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('drops unknown keys found in storage', () => {
    /* `band` is a slot a hand-edited or future payload might carry; it is not one
       of the eight the app renders, so it must not survive the read. */
    seed({
      ...customLayout,
      rogue: 'value',
      panelHeights: { ...customLayout.panelHeights, band: 180 },
    });

    const layout = readWorkspaceLayout();

    expect(layout).toEqual(customLayout);
    expect(Object.keys(layout).sort()).toEqual([
      'panelHeights',
      'problemExpanded',
      'solutionExpanded',
      'splitPercent',
      'version',
    ]);
    expect(Object.keys(layout.panelHeights).sort()).toEqual([
      'auxiliary',
      'code',
      'complexity',
      'problem',
      'solution',
      'stage',
      'tutorial',
      'visualizer',
    ]);
  });

  it('never throws when storage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => readWorkspaceLayout()).not.toThrow();
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('never throws when storage writes fail and still returns the merged layout', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const merged = writeWorkspaceLayout({ splitPercent: 44 });

    expect(merged.splitPercent).toBe(44);
  });

  it('never throws when clearing fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => clearWorkspaceLayout()).not.toThrow();
  });

  it('clears the key only when asked, and then reads every panel back as automatic', () => {
    writeWorkspaceLayout(customLayout);
    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).not.toBeNull();

    clearWorkspaceLayout();

    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('clones deeply so nested panel heights are not shared', () => {
    const copy = cloneWorkspaceLayout(customLayout);
    copy.panelHeights.code = 1;
    copy.problemExpanded = true;
    copy.solutionExpanded = true;

    expect(customLayout.panelHeights.code).toBe(180);
    expect(customLayout.problemExpanded).toBe(false);
    expect(customLayout.solutionExpanded).toBe(false);
  });

  describe('reset announced to the workspace', () => {
    it('clears storage and announces the reset on one named window event', () => {
      writeWorkspaceLayout(customLayout);
      const heard: string[] = [];
      const listener = () => heard.push('reset');
      window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);

      const result = resetWorkspaceLayout();

      window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);
      expect(WORKSPACE_LAYOUT_RESET_EVENT).toBe('dsa:workspace-layout-reset');
      expect(heard).toEqual(['reset']);
      expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
      expect(result).toEqual(DEFAULT_WORKSPACE_LAYOUT);
      expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    });

    it('announces nothing when it was never called, so no listener resets by accident', () => {
      writeWorkspaceLayout(customLayout);
      const heard: string[] = [];
      const listener = () => heard.push('reset');
      window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);

      writeWorkspaceLayout({ splitPercent: 50 });

      window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);
      expect(heard).toEqual([]);
      expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).not.toBeNull();
    });
  });
});
