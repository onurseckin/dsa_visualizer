import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TRIVIA_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MIN_PANEL_HEIGHT_PX,
  TRIVIA_LAYOUT_KEY,
  TRIVIA_LAYOUT_RESET_EVENT,
  TriviaLayout,
  clampPanelHeight,
  clearTriviaLayout,
  readTriviaLayout,
  resetTriviaLayout,
  writeTriviaLayout,
} from "../triviaLayout";

const customLayout: TriviaLayout = {
  version: 3,
  puzzleSplitPercent: 55,
  panelHeights: {
    sessionList: null,
    deckBuilder: 200,
    settings: null,
    problem: 140,
    puzzle: null,
  },
  problemExpanded: true,
  problemSplitPercent: 45,
  panelVisibility: {
    problem: true,
    puzzle: true,
    tiles: true,
  },
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("triviaLayout helper clamping and events", () => {
  it("clamps panel heights through the exported helper", () => {
    expect(clampPanelHeight(null)).toBeNull();
    expect(clampPanelHeight(Number.POSITIVE_INFINITY)).toBeNull();
    expect(clampPanelHeight(10)).toBe(MIN_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(5000)).toBe(MAX_PANEL_HEIGHT_PX);
    expect(clampPanelHeight(200)).toBe(200);
  });

  it("never throws when clearing fails", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    expect(() => clearTriviaLayout()).not.toThrow();
  });

  it("clears the key only when asked, and then reads every panel back as automatic", () => {
    writeTriviaLayout(customLayout);
    expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).not.toBeNull();

    clearTriviaLayout();

    expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).toBeNull();
    expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
  });

  describe("reset announced to the trivia route", () => {
    it("clears storage and announces the reset on one named window event", () => {
      writeTriviaLayout(customLayout);
      const heard: string[] = [];
      const listener = () => heard.push("reset");
      window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);

      const result = resetTriviaLayout();

      window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);
      expect(TRIVIA_LAYOUT_RESET_EVENT).toBe("dsa:trivia-layout-reset");
      expect(heard).toEqual(["reset"]);
      expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).toBeNull();
      expect(result).toEqual(DEFAULT_TRIVIA_LAYOUT);
      expect(readTriviaLayout()).toEqual(DEFAULT_TRIVIA_LAYOUT);
    });

    it("announces nothing when it was never called, so no listener resets by accident", () => {
      writeTriviaLayout(customLayout);
      const heard: string[] = [];
      const listener = () => heard.push("reset");
      window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);

      writeTriviaLayout({ puzzleSplitPercent: 50 });

      window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);
      expect(heard).toEqual([]);
      expect(localStorage.getItem(TRIVIA_LAYOUT_KEY)).not.toBeNull();
    });
  });
});
