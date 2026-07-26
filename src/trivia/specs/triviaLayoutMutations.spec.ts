import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TRIVIA_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  TRIVIA_LAYOUT_KEY,
  TriviaLayout,
  cloneTriviaLayout,
  readTriviaLayout,
  writeTriviaLayout,
} from "../triviaLayout";

type TestPayload =
  | string
  | number
  | boolean
  | null
  | TriviaLayout
  | Record<string, unknown>
  | Array<unknown>;

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

describe("triviaLayout mutations & validation", () => {
  it("restores a previously written layout across a fresh read (reload / dev-server restart)", () => {
    writeTriviaLayout(customLayout);
    expect(readTriviaLayout()).toEqual(customLayout);
  });

  it("round-trips a collapsed problem panel and reopening it", () => {
    expect(writeTriviaLayout({ problemExpanded: false }).problemExpanded).toBe(false);
    expect(readTriviaLayout().problemExpanded).toBe(false);

    expect(writeTriviaLayout({ problemExpanded: true }).problemExpanded).toBe(true);
    expect(readTriviaLayout().problemExpanded).toBe(true);
  });

  it("keeps problemExpanded when a later patch only touches geometry", () => {
    writeTriviaLayout({ problemExpanded: false });

    const merged = writeTriviaLayout({ puzzleSplitPercent: 55, panelHeights: { problem: 200 } });

    expect(merged.problemExpanded).toBe(false);
    expect(readTriviaLayout().problemExpanded).toBe(false);
  });

  it("keeps the geometry when a later patch only toggles the panel", () => {
    writeTriviaLayout(customLayout);

    const merged = writeTriviaLayout({ problemExpanded: true });

    expect(merged.puzzleSplitPercent).toBe(customLayout.puzzleSplitPercent);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
  });

  it("merges a partial patch onto the stored layout instead of replacing it", () => {
    writeTriviaLayout(customLayout);

    const merged = writeTriviaLayout({ puzzleSplitPercent: 70 });

    expect(merged.puzzleSplitPercent).toBe(70);
    expect(merged.panelHeights).toEqual(customLayout.panelHeights);
    expect(readTriviaLayout()).toEqual(merged);
  });

  it("pins only the panel named in the patch and leaves the rest automatic", () => {
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

  it("clamps out-of-range heights and split percent on write, and degrades unusable numbers to automatic", () => {
    const merged = writeTriviaLayout({
      puzzleSplitPercent: 250,
      panelHeights: { deckBuilder: 1, settings: 99999, problem: Number.NaN },
    });

    expect(merged.puzzleSplitPercent).toBe(MAX_SPLIT_PERCENT);
    expect(merged.panelHeights.deckBuilder).toBe(MIN_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.settings).toBe(MAX_PANEL_HEIGHT_PX);
    expect(merged.panelHeights.problem).toBeNull();
  });

  it("clamps a below-minimum split percent up to the floor", () => {
    expect(writeTriviaLayout({ puzzleSplitPercent: 1 }).puzzleSplitPercent).toBe(MIN_SPLIT_PERCENT);
  });

  it("falls back to defaults for malformed JSON", () => {
    localStorage.setItem(TRIVIA_LAYOUT_KEY, "{not json");
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  const invalidPayloads: [string, TestPayload][] = [
    ["a non-object payload", 42],
    [
      "a missing puzzleSplitPercent",
      { version: 2, panelHeights: customLayout.panelHeights, problemExpanded: true },
    ],
    ["a stale version", { ...customLayout, version: 3 }],
    ["a null panelHeights group", { ...customLayout, panelHeights: null }],
    ["an array panelHeights group", { ...customLayout, panelHeights: [180, 240] }],
    [
      "a string height",
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, puzzle: "180" } },
    ],
    ["an out-of-range puzzleSplitPercent", { ...customLayout, puzzleSplitPercent: 99 }],
    [
      "a height below the floor",
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, puzzle: 4 } },
    ],
    [
      "a height above the ceiling",
      { ...customLayout, panelHeights: { ...customLayout.panelHeights, puzzle: 9000 } },
    ],
    [
      "a missing panel key",
      {
        ...customLayout,
        panelHeights: { sessionList: null, deckBuilder: 200, settings: null, problem: 140 },
      },
    ],
    ["a string problemExpanded", { ...customLayout, problemExpanded: "true" }],
    ["a null problemExpanded", { ...customLayout, problemExpanded: null }],
  ];

  it.each(invalidPayloads)("falls back to defaults for %s", (_label, payload) => {
    seed(payload);
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it("drops unknown keys found in storage", () => {
    seed({
      ...customLayout,
      rogue: "value",
      panelHeights: { ...customLayout.panelHeights, band: 180 },
    });

    const layout = readTriviaLayout();

    expect(layout).toEqual(customLayout);
    expect(Object.keys(layout).sort()).toEqual([
      "panelHeights",
      "problemExpanded",
      "puzzleSplitPercent",
      "version",
    ]);
    expect(Object.keys(layout.panelHeights).sort()).toEqual([
      "deckBuilder",
      "problem",
      "puzzle",
      "sessionList",
      "settings",
    ]);
  });

  it("never throws when storage reads fail", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    expect(() => readTriviaLayout()).not.toThrow();
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it("never throws when storage writes fail and still returns the merged layout", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    const merged = writeTriviaLayout({ puzzleSplitPercent: 44 });
    expect(merged.puzzleSplitPercent).toBe(44);
  });

  it("clones deeply so nested panel heights are not shared", () => {
    const copy = cloneTriviaLayout(customLayout);
    copy.panelHeights.deckBuilder = 1;
    copy.problemExpanded = true;

    expect(customLayout.panelHeights.deckBuilder).toBe(200);
    expect(customLayout.problemExpanded).toBe(false);
  });
});
