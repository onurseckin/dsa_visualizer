import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TRIVIA_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  TRIVIA_LAYOUT_KEY,
  TRIVIA_LAYOUT_RESET_EVENT,
  TRIVIA_LAYOUT_VERSION,
  TRIVIA_PANEL_KEYS,
  TriviaLayout,
  clampPanelHeight,
  clearTriviaLayout,
  cloneTriviaLayout,
  readTriviaLayout,
  resetTriviaLayout,
  writeTriviaLayout,
} from '../triviaLayout';

type TestPayload = string | number | boolean | null | TriviaLayout | Record<string, unknown> | Array<unknown>;

const seed = (value: TestPayload): void => {
  localStorage.setItem(TRIVIA_LAYOUT_KEY, JSON.stringify(value));
};

const customLayout: TriviaLayout = {
  version: 2,
  puzzleSplitPercent: 55,
  panelHeights: {
    sessionList: null,
    deckBuilder: 200,
    settings: null,
    problem: 140,
    puzzle: null,
  },
  problemExpanded: false,
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('triviaLayout persistence contract (TASKS.md 9.8)', () => {
  it('uses the v2 versioned localStorage key', () => {
    expect(TRIVIA_LAYOUT_KEY).toBe('dsa_visualizer_trivia_layout_v2');
    expect(TRIVIA_LAYOUT_VERSION).toBe(2);
    expect(DEFAULT_TRIVIA_LAYOUT.version).toBe(2);
  });

  it('keeps a height slot for every trivia panel across Home, Setup, and Drill, all automatic by default', () => {
    expect(DEFAULT_TRIVIA_LAYOUT.panelHeights).toEqual({
      sessionList: null,
      deckBuilder: null,
      settings: null,
      problem: null,
      puzzle: null,
    });
    expect(TRIVIA_PANEL_KEYS).toEqual(['sessionList', 'deckBuilder', 'settings', 'problem', 'puzzle']);
  });

  it('gives the puzzle column the wider default share of the drill row', () => {
    expect(DEFAULT_TRIVIA_LAYOUT.puzzleSplitPercent).toBe(65);
  });

  /* v2: the Drill screen's problem-description panel joins the persisted
     record instead of resetting to expanded every session (same reasoning
     workspaceLayout.ts's v6/v8 applied to its own problem/solution panels). */
  it('opens the problem panel by default', () => {
    expect(DEFAULT_TRIVIA_LAYOUT.problemExpanded).toBe(true);
    expect(readTriviaLayout().problemExpanded).toBe(true);
  });

  it('returns defaults when nothing is stored', () => {
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it('ignores a payload left behind by the v1 key', () => {
    localStorage.setItem(
      'dsa_visualizer_trivia_layout_v1',
      JSON.stringify({
        version: 1,
        puzzleSplitPercent: 40,
        panelHeights: {
          sessionList: null,
          deckBuilder: null,
          settings: null,
          problem: null,
          puzzle: null,
        },
      }),
    );

    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it('ignores a v1-shaped payload written under the v2 key', () => {
    seed({
      version: 1,
      puzzleSplitPercent: 40,
      panelHeights: {
        sessionList: null,
        deckBuilder: null,
        settings: null,
        problem: null,
        puzzle: null,
      },
    });

    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  /* A v2 payload that predates problemExpanded is a partial shape, not a
     usable layout: the missing key would read back as undefined. */
  it('ignores a v2-versioned payload that predates problemExpanded', () => {
    seed({ version: 2, puzzleSplitPercent: 40, panelHeights: customLayout.panelHeights });

    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it('hands out copies so callers cannot mutate the shared defaults', () => {
    const first = readTriviaLayout();
    first.puzzleSplitPercent = 11;
    first.panelHeights.puzzle = 999;
    first.problemExpanded = false;

    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
    expect(DEFAULT_TRIVIA_LAYOUT.panelHeights.puzzle).toBeNull();
    expect(DEFAULT_TRIVIA_LAYOUT.problemExpanded).toBe(true);
  });

  it('restores a previously written layout across a fresh read (reload / dev-server restart)', () => {
    writeTriviaLayout(customLayout);
    expect(readTriviaLayout()).toEqual(customLayout);
  });

  it('round-trips a collapsed problem panel and reopening it', () => {
    expect(writeTriviaLayout({ problemExpanded: false }).problemExpanded).toBe(false);
    expect(readTriviaLayout().problemExpanded).toBe(false);

    expect(writeTriviaLayout({ problemExpanded: true }).problemExpanded).toBe(true);
    expect(readTriviaLayout().problemExpanded).toBe(true);
  });

  it('keeps problemExpanded when a later patch only touches geometry', () => {
    writeTriviaLayout({ problemExpanded: false });

    const merged = writeTriviaLayout({ puzzleSplitPercent: 55, panelHeights: { problem: 200 } });

    expect(merged.problemExpanded).toBe(false);
    expect(readTriviaLayout().problemExpanded).toBe(false);
  });

  it('keeps the geometry when a later patch only toggles the panel', () => {
    writeTriviaLayout(customLayout);

    const merged = writeTriviaLayout({ problemExpanded: true });

    expect(merged.puzzleSplitPercent).toBe(customLayout.puzzleSplitPercent);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
  });

  it('merges a partial patch onto the stored layout instead of replacing it', () => {
    writeTriviaLayout(customLayout);

    const merged = writeTriviaLayout({ puzzleSplitPercent: 70 });

    expect(merged.puzzleSplitPercent).toBe(70);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
    expect(readTriviaLayout()).toEqual(merged);
  });

  it('pins only the panel named in the patch and leaves the rest automatic', () => {
    const merged = writeTriviaLayout({ panelHeights: { problem: 150 } });

    expect(merged.panelHeights).toEqual({
      sessionList: null,
      deckBuilder: null,
      settings: null,
      problem: 150,
      puzzle: null,
    });
  });

  it('treats an explicit null as "back to automatic" and an absent key as "unchanged"', () => {
    writeTriviaLayout({ panelHeights: { deckBuilder: 150, settings: 300 } });

    const merged = writeTriviaLayout({ panelHeights: { deckBuilder: null } });

    expect(merged.panelHeights.deckBuilder).toBeNull();
    expect(merged.panelHeights.settings).toBe(300);
  });

  it('clamps out-of-range heights and split percent on write, and degrades unusable numbers to automatic', () => {
    const merged = writeTriviaLayout({
      puzzleSplitPercent: 250,
      panelHeights: { deckBuilder: 1, settings: 99999, problem: Number.NaN },
    });

    expect(merged.puzzleSplitPercent).toBe(MAX_SPLIT_PERCENT);
    expect(merged.panelHeights.deckBuilder).toBe(MIN_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.settings).toBe(MAX_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.problem).toBeNull();
  });

  it('clamps a below-minimum split percent up to the floor', () => {
    expect(writeTriviaLayout({ puzzleSplitPercent: 1 }).puzzleSplitPercent).toBe(MIN_SPLIT_PERCENT);
  });

  it('clamps panel heights through the exported helper', () => {
    expect(clampPanelHeight(null)).toBeNull();
    expect(clampPanelHeight(Number.POSITIVE_INFINITY)).toBeNull();
    expect(clampPanelHeight(10)).toBe(MIN_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(5000)).toBe(MAX_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(200)).toBe(200);
  });

  it('falls back to defaults for malformed JSON', () => {
    localStorage.setItem(TRIVIA_LAYOUT_KEY, '{not json');
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  const invalidPayloads: [string, TestPayload][] = [
    ['a non-object payload', 42],
    ['a missing puzzleSplitPercent', { version: 2, panelHeights: customLayout.panelHeights, problemExpanded: true }],
    ['a stale version', { ...customLayout, version: 3 }],
    ['a null panelHeights group', { ...customLayout, panelHeights: null }],
    ['an array panelHeights group', { ...customLayout, panelHeights: [180, 240] }],
    [
      'a string height',
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, puzzle: '180' } },
    ],
    ['an out-of-range puzzleSplitPercent', { ...customLayout, puzzleSplitPercent: 99 }],
    [
      'a height below the floor',
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, puzzle: 4 } },
    ],
    [
      'a height above the ceiling',
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, puzzle: 9000 } },
    ],
    [
      'a missing panel key',
      {
        ...customLayout,
        panelHeights: { sessionList: null, deckBuilder: 200, settings: null, problem: 140 },
      },
    ],
    ['a string problemExpanded', { ...customLayout, problemExpanded: 'true' }],
    ['a null problemExpanded', { ...customLayout, problemExpanded: null }],
  ];

  it.each(invalidPayloads)('falls back to defaults for %s', (_label, payload) => {
    seed(payload);
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it('drops unknown keys found in storage', () => {
    seed({
      ...customLayout,
      rogue: 'value',
      panelHeights: { ...customLayout.panelHeights, band: 180 },
    });

    const layout = readTriviaLayout();

    expect(layout).toEqual(customLayout);
    expect(Object.keys(layout).sort()).toEqual(['panelHeights', 'problemExpanded', 'puzzleSplitPercent', 'version']);
    expect(Object.keys(layout.panelHeights).sort()).toEqual([
      'deckBuilder',
      'problem',
      'puzzle',
      'sessionList',
      'settings',
    ]);
  });

  it('never throws when storage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => readTriviaLayout()).not.toThrow();
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it('never throws when storage writes fail and still returns the merged layout', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const merged = writeTriviaLayout({ puzzleSplitPercent: 44 });
    expect(merged.puzzleSplitPercent).toBe(44);
  });

  it('never throws when clearing fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => clearTriviaLayout()).not.toThrow();
  });

  it('clears the key only when asked, and then reads every panel back as automatic', () => {
    writeTriviaLayout(customLayout);
    expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).not.toBeNull();

    clearTriviaLayout();

    expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).toBeNull();
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it('clones deeply so nested panel heights are not shared', () => {
    const copy = cloneTriviaLayout(customLayout);
    copy.panelHeights.deckBuilder = 1;
    copy.problemExpanded = true;

    expect(customLayout.panelHeights.deckBuilder).toBe(200);
    expect(customLayout.problemExpanded).toBe(false);
  });

  describe('reset announced to the trivia route', () => {
    it('clears storage and announces the reset on one named window event', () => {
      writeTriviaLayout(customLayout);
      const heard: string[] = [];
      const listener = () => heard.push('reset');
      window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);

      const result = resetTriviaLayout();

      window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);
      expect(TRIVIA_LAYOUT_RESET_EVENT).toBe('dsa:trivia-layout-reset');
      expect(heard).toEqual(['reset']);
      expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).toBeNull();
      expect(result).toEqual(DEFAULT_TRIVIA_LAYOUT);
      expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
    });

    it('announces nothing when it was never called, so no listener resets by accident', () => {
      writeTriviaLayout(customLayout);
      const heard: string[] = [];
      const listener = () => heard.push('reset');
      window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);

      writeTriviaLayout({ puzzleSplitPercent: 50 });

      window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);
      expect(heard).toEqual([]);
      expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).not.toBeNull();
    });
  });
});
