import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_VERSION,
  WORKSPACE_PANEL_KEYS,
  WorkspaceLayout,
  clampPanelHeight,
  clearWorkspaceLayout,
  cloneWorkspaceLayout,
  readWorkspaceLayout,
  writeWorkspaceLayout,
} from '../workspaceLayout';

const seed = (value: unknown): void => {
  localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify(value));
};

const customLayout: WorkspaceLayout = {
  version: 5,
  splitPercent: 42,
  panelHeights: {
    visualizer: null,
    code: 180,
    complexity: 240,
  },
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('workspaceLayout persistence contract', () => {
  it('uses the v5 versioned localStorage key', () => {
    expect(WORKSPACE_LAYOUT_KEY).toBe('dsa_visualizer_workspace_layout_v5');
    expect(WORKSPACE_LAYOUT_VERSION).toBe(5);
    expect(DEFAULT_WORKSPACE_LAYOUT.version).toBe(5);
  });

  it('keeps a height slot only for the panels that are still rows of a column', () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.panelHeights).toEqual({
      visualizer: null,
      code: null,
      complexity: null,
    });
    expect(WORKSPACE_PANEL_KEYS).toEqual(['visualizer', 'code', 'complexity']);
  });

  it('gives the visualizer column the wider default share of the stage', () => {
    expect(DEFAULT_WORKSPACE_LAYOUT.splitPercent).toBe(70);
  });

  it('returns defaults when nothing is stored', () => {
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores a payload left behind by the v4 key', () => {
    localStorage.setItem(
      'dsa_visualizer_workspace_layout_v4',
      JSON.stringify({
        version: 4,
        splitPercent: 40,
        panelHeights: { visualizer: null, tutorial: 180, auxiliary: null, code: null, complexity: 240 },
      }),
    );

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores a v4-shaped payload written under the v5 key', () => {
    seed({
      version: 4,
      splitPercent: 40,
      panelHeights: { visualizer: null, tutorial: 180, auxiliary: null, code: null, complexity: 240 },
    });

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('ignores an old weight-shaped payload written under the v5 key', () => {
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

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(DEFAULT_WORKSPACE_LAYOUT.panelHeights.code).toBeNull();
  });

  it('restores a previously written layout across a fresh read (reload / dev-server restart)', () => {
    writeWorkspaceLayout(customLayout);

    // A reload is just another read of the same key by a new module instance.
    expect(readWorkspaceLayout()).toEqual(customLayout);
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
      visualizer: null,
      code: 150,
      complexity: null,
    });
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

  const invalidPayloads: [string, unknown][] = [
    ['a non-object payload', 42],
    ['a missing splitPercent', { version: 5, panelHeights: customLayout.panelHeights }],
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
    ['a missing panel key', { ...customLayout, panelHeights: { visualizer: null, code: 180 } }],
  ];

  it.each(invalidPayloads)('falls back to defaults for %s', (_label, payload) => {
    seed(payload);
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('drops unknown keys found in storage', () => {
    seed({ ...customLayout, rogue: 'value', panelHeights: { ...customLayout.panelHeights, tutorial: 180 } });

    const layout = readWorkspaceLayout();

    expect(layout).toEqual(customLayout);
    expect(Object.keys(layout).sort()).toEqual(['panelHeights', 'splitPercent', 'version']);
    expect(Object.keys(layout.panelHeights).sort()).toEqual(['code', 'complexity', 'visualizer']);
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

    expect(customLayout.panelHeights.code).toBe(180);
  });
});
