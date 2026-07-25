import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_ROW_WEIGHT,
  MAX_SPLIT_PERCENT,
  MIN_ROW_WEIGHT,
  MIN_SPLIT_PERCENT,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_VERSION,
  WorkspaceLayout,
  clearWorkspaceLayout,
  cloneWorkspaceLayout,
  readWorkspaceLayout,
  writeWorkspaceLayout,
} from '../workspaceLayout';

const seed = (value: unknown): void => {
  localStorage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify(value));
};

const customLayout: WorkspaceLayout = {
  version: 3,
  splitPercent: 42,
  leftRows: { visualizer: 50, tutorial: 30, auxiliary: 20 },
  rightRows: { code: 55, complexity: 45 },
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('workspaceLayout persistence contract', () => {
  it('uses one versioned localStorage key', () => {
    expect(WORKSPACE_LAYOUT_KEY).toBe('dsa_visualizer_workspace_layout_v3');
    expect(WORKSPACE_LAYOUT_VERSION).toBe(3);
    expect(DEFAULT_WORKSPACE_LAYOUT.version).toBe(3);
  });

  it('returns defaults when nothing is stored', () => {
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('hands out copies so callers cannot mutate the shared defaults', () => {
    const first = readWorkspaceLayout();
    first.splitPercent = 11;
    first.leftRows.visualizer = 11;

    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(DEFAULT_WORKSPACE_LAYOUT.splitPercent).not.toBe(11);
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
    expect(merged.leftRows).toEqual(customLayout.leftRows);
    expect(merged.rightRows).toEqual(customLayout.rightRows);
    expect(readWorkspaceLayout()).toEqual(merged);
  });

  it('merges nested row patches field by field', () => {
    writeWorkspaceLayout(customLayout);

    const merged = writeWorkspaceLayout({ leftRows: { tutorial: 25 } });

    expect(merged.leftRows).toEqual({ visualizer: 50, tutorial: 25, auxiliary: 20 });
  });

  it('clamps out-of-range values on write', () => {
    const merged = writeWorkspaceLayout({
      splitPercent: 250,
      leftRows: { visualizer: -40, tutorial: 999, auxiliary: Number.NaN },
    });

    expect(merged.splitPercent).toBe(MAX_SPLIT_PERCENT);
    expect(merged.leftRows.visualizer).toBe(MIN_ROW_WEIGHT);
    expect(merged.leftRows.tutorial).toBe(MAX_ROW_WEIGHT);
    // NaN is unusable, so the field falls back to its default weight.
    expect(merged.leftRows.auxiliary).toBe(DEFAULT_WORKSPACE_LAYOUT.leftRows.auxiliary);
  });

  it('clamps a below-minimum split percent up to the floor', () => {
    expect(writeWorkspaceLayout({ splitPercent: 1 }).splitPercent).toBe(MIN_SPLIT_PERCENT);
  });

  it('falls back to defaults for a stale version', () => {
    seed({ ...customLayout, version: 2 });
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('falls back to defaults for malformed JSON', () => {
    localStorage.setItem(WORKSPACE_LAYOUT_KEY, '{not json');
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  const invalidPayloads: [string, unknown][] = [
    ['a non-object payload', 42],
    [
      'a missing splitPercent',
      { version: 3, leftRows: customLayout.leftRows, rightRows: customLayout.rightRows },
    ],
    ['a null row group', { ...customLayout, leftRows: null }],
    ['an array row group', { ...customLayout, rightRows: [70, 30] }],
    ['a string weight', { ...customLayout, rightRows: { code: '70', complexity: 30 } }],
    ['an out-of-range splitPercent', { ...customLayout, splitPercent: 99 }],
    ['a zero weight', { ...customLayout, rightRows: { code: 0, complexity: 30 } }],
    ['a missing row key', { ...customLayout, leftRows: { visualizer: 50, tutorial: 30 } }],
  ];

  it.each(invalidPayloads)('falls back to defaults for %s', (_label, payload) => {
    seed(payload);
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('drops unknown keys found in storage', () => {
    seed({ ...customLayout, rogue: 'value' });

    const layout = readWorkspaceLayout();

    expect(layout).toEqual(customLayout);
    expect(Object.keys(layout).sort()).toEqual(['leftRows', 'rightRows', 'splitPercent', 'version']);
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

  it('clears the key only when asked, and then reads defaults again', () => {
    writeWorkspaceLayout(customLayout);
    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).not.toBeNull();

    clearWorkspaceLayout();

    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it('clones deeply so nested row objects are not shared', () => {
    const copy = cloneWorkspaceLayout(customLayout);
    copy.leftRows.visualizer = 1;

    expect(customLayout.leftRows.visualizer).toBe(50);
  });
});
