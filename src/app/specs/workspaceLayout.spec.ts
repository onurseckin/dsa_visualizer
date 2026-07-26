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
  version: 7,
  splitPercent: 42,
  panelHeights: {
    stage: null,
    visualizer: null,
    tutorial: null,
    auxiliary: null,
    code: 180,
    complexity: 240,
  },
  detailsExpanded: false,
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('workspaceLayout persistence contract', () => {
  it('uses the v7 versioned localStorage key', () => {
    expect(WORKSPACE_LAYOUT_KEY).toBe('dsa_visualizer_workspace_layout_v7');
    expect(WORKSPACE_LAYOUT_VERSION).toBe(7);
    expect(DEFAULT_WORKSPACE_LAYOUT.version).toBe(7);
  });

  /* v7: every workspace section carries a height handle, not just a width one —
     the tutorial and working-data strips are resizable rows again and `stage`
     pins the whole stage. Each one starts automatic. */
  it('keeps a height slot for every resizable section, all automatic by default', () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.panelHeights).toEqual({
      stage: null,
      visualizer: null,
      tutorial: null,
      auxiliary: null,
      code: null,
      complexity: null,
    });
    expect(WORKSPACE_PANEL_KEYS).toEqual([
      'stage',
      'visualizer',
      'tutorial',
      'auxiliary',
      'code',
      'complexity',
    ]);
  });

  it('gives the visualizer column the wider default share of the stage', () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.splitPercent).toBe(70);
  });

  it('opens the details panel by default', () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.detailsExpanded).toBe(true);
    expect(readWorkspaceLayout().detailsExpanded).toBe(true);
  });

  it('returns defaults when nothing is stored', () => {
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores a payload left behind by the v6 key', () => {
    localStorage.setItem(
      'dsa_visualizer_workspace_layout_v6',
      JSON.stringify({
        version: 6,
        splitPercent: 40,
        panelHeights: { visualizer: null, code: null, complexity: 240 },
        detailsExpanded: false,
      }),
    );

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores a v6-shaped payload written under the v7 key', () => {
    seed({
      version: 6,
      splitPercent: 40,
      panelHeights: { visualizer: null, code: null, complexity: 240 },
      detailsExpanded: false,
    });

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  /* A v7 payload that predates one of the new row slots is a partial shape, not a
     usable layout: the missing key would read back as undefined. */
  it('ignores a v7-versioned payload that predates the tutorial and auxiliary slots', () => {
    seed({
      version: 7,
      splitPercent: 40,
      panelHeights: { stage: null, visualizer: null, code: null, complexity: 240 },
      detailsExpanded: false,
    });

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores a v7-versioned payload that predates detailsExpanded', () => {
    seed({ version: 7, splitPercent: 40, panelHeights: customLayout.panelHeights });

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores an old weight-shaped payload written under the v7 key', () => {
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
    first.detailsExpanded = false;

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(DEFAULT_WORKSPACE_LAYOUT.panelHeights.code).toBeNull();
    expect(DEFAULT_WORKSPACE_LAYOUT.detailsExpanded).toBe(true);
  });

  it('restores a previously written layout across a fresh read (reload / dev-server restart)', () => {
    writeWorkspaceLayout(customLayout);

    // A reload is just another read of the same key by a new module instance.
    expect(readWorkspaceLayout()).toEqual(customLayout);
  });

  it('round-trips a collapsed details panel and reopening it', () => {
    expect(writeWorkspaceLayout({ detailsExpanded: false }).detailsExpanded).toBe(false);
    expect(readWorkspaceLayout().detailsExpanded).toBe(false);

    expect(writeWorkspaceLayout({ detailsExpanded: true }).detailsExpanded).toBe(true);
    expect(readWorkspaceLayout().detailsExpanded).toBe(true);
  });

  it('keeps the details state when a later patch only touches geometry', () => {
    writeWorkspaceLayout({ detailsExpanded: false });

    const merged = writeWorkspaceLayout({ splitPercent: 55, panelHeights: { code: 200 } });

    expect(merged.detailsExpanded).toBe(false);
    expect(readWorkspaceLayout().detailsExpanded).toBe(false);
  });

  it('keeps the geometry when a later patch only toggles details', () => {
    writeWorkspaceLayout(customLayout);

    const merged = writeWorkspaceLayout({ detailsExpanded: true });

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
    });
  });

  it('pins a step row without disturbing the stage or the code column', () => {
    const merged = writeWorkspaceLayout({ panelHeights: { tutorial: 120 } });

    expect(merged.panelHeights).toEqual({
      stage: null,
      visualizer: null,
      tutorial: 120,
      auxiliary: null,
      code: null,
      complexity: null,
    });
    expect(readWorkspaceLayout().panelHeights.tutorial).toBe(120);
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
      { version: 7, panelHeights: customLayout.panelHeights, detailsExpanded: true },
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
        },
      },
    ],
    ['a string detailsExpanded', { ...customLayout, detailsExpanded: 'true' }],
    ['a null detailsExpanded', { ...customLayout, detailsExpanded: null }],
  ];

  it.each(invalidPayloads)('falls back to defaults for %s', (_label, payload) => {
    seed(payload);
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('drops unknown keys found in storage', () => {
    /* `band` is a slot a hand-edited or future payload might carry; it is not one
       of the six the app renders, so it must not survive the read. */
    seed({
      ...customLayout,
      rogue: 'value',
      panelHeights: { ...customLayout.panelHeights, band: 180 },
    });

    const layout = readWorkspaceLayout();

    expect(layout).toEqual(customLayout);
    expect(Object.keys(layout).sort()).toEqual([
      'detailsExpanded',
      'panelHeights',
      'splitPercent',
      'version',
    ]);
    expect(Object.keys(layout.panelHeights).sort()).toEqual([
      'auxiliary',
      'code',
      'complexity',
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
    copy.detailsExpanded = true;

    expect(customLayout.panelHeights.code).toBe(180);
    expect(customLayout.detailsExpanded).toBe(false);
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
