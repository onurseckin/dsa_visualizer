import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TRIVIA_LAYOUT,
  TRIVIA_LAYOUT_KEY,
  TRIVIA_LAYOUT_VERSION,
  TRIVIA_PANEL_KEYS,
  TriviaLayout,
  readTriviaLayout,
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
  version: 5,
  puzzleSplitPercent: 55,
  panelHeights: {
    sessionList: null,
    deckBuilder: 200,
    settings: null,
    problem: 140,
    puzzle: null,
    tiles: null,
  },
  problemExpanded: true,
  problemSplitPercent: 45,
  panelVisibility: {
    problem: true,
    puzzle: true,
    tiles: true,
    lineInfo: true,
  },
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("triviaLayout defaults & schema contract", () => {
  it("uses the v6 versioned localStorage key", () => {
    expect(TRIVIA_LAYOUT_KEY).toBe("dsa_visualizer_trivia_layout_v6");
    expect(TRIVIA_LAYOUT_VERSION).toBe(6);
    expect(DEFAULT_TRIVIA_LAYOUT.version).toBe(6);
  });

  it("keeps a height slot for every trivia panel across Home, Setup, and Drill, all automatic by default", () => {
    expect(DEFAULT_TRIVIA_LAYOUT.panelHeights).toEqual({
      sessionList: null,
      deckBuilder: null,
      settings: null,
      problem: null,
      puzzle: null,
      tiles: null,
    });
    expect(TRIVIA_PANEL_KEYS).toEqual([
      "sessionList",
      "deckBuilder",
      "settings",
      "problem",
      "puzzle",
      "tiles",
    ]);
  });

  it("gives the tiles column 35% default share of the drill row", () => {
    expect(DEFAULT_TRIVIA_LAYOUT.puzzleSplitPercent).toBe(35);
  });

  it("opens the problem panel by default", () => {
    expect(DEFAULT_TRIVIA_LAYOUT.problemExpanded).toBe(true);
    expect(readTriviaLayout().problemExpanded).toBe(true);
  });

  it("returns defaults when nothing is stored", () => {
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it("ignores a payload left behind by the v1 key", () => {
    localStorage.setItem(
      "dsa_visualizer_trivia_layout_v1",
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

  it("ignores a v1-shaped payload written under the v2 key", () => {
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

  it("ignores a v2-versioned payload that predates problemExpanded", () => {
    seed({ version: 2, puzzleSplitPercent: 40, panelHeights: customLayout.panelHeights });

    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  it("hands out copies so callers cannot mutate the shared defaults", () => {
    const first = readTriviaLayout();
    first.puzzleSplitPercent = 11;
    first.panelHeights.puzzle = 999;
    first.problemExpanded = false;

    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
    expect(DEFAULT_TRIVIA_LAYOUT.panelHeights.puzzle).toBeNull();
    expect(DEFAULT_TRIVIA_LAYOUT.problemExpanded).toBe(true);
  });
});
