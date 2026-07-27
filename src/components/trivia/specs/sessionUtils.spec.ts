import { describe, expect, it } from "vitest";
import {
  buildProblemPatch,
  buildPuzzlePatch,
  buildTilesPatch,
  omit,
  tileTextOf,
  truthOf,
} from "../hooks/session/sessionUtils";
import type { TriviaRound } from "../../../types/trivia";

describe("sessionUtils", () => {
  const mockRound: TriviaRound = {
    algorithmId: "bubble-sort",
    level: 2,
    lines: [
      {
        number: 1,
        text: "def bubble_sort(arr):",
        indent: "",
        content: "def bubble_sort(arr):",
        blankable: true,
      },
      {
        number: 2,
        text: "    n = len(arr)",
        indent: "    ",
        content: "n = len(arr)",
        blankable: true,
      },
    ],
    blanks: [2],
    tiles: [
      { id: "t1", text: "n = len(arr)", correctFor: 2 },
      { id: "t2", text: "return arr", correctFor: null },
    ],
  };

  it("tileTextOf finds tile text or returns empty string", () => {
    expect(tileTextOf(mockRound, "t1")).toBe("n = len(arr)");
    expect(tileTextOf(mockRound, "non_existent")).toBe("");
  });

  it("truthOf finds line content or returns empty string", () => {
    expect(truthOf(mockRound, 2)).toBe("n = len(arr)");
    expect(truthOf(mockRound, 99)).toBe("");
  });

  it("omit excludes specified line key from Record<number, string>", () => {
    const map: Record<number, string> = { 1: "a", 2: "b", 3: "c" };
    expect(omit(map, 2)).toEqual({ 1: "a", 3: "c" });
    expect(omit(map, 99)).toEqual({ 1: "a", 2: "b", 3: "c" });
  });

  it("buildProblemPatch, buildPuzzlePatch and buildTilesPatch create correct layout patches", () => {
    expect(buildProblemPatch(250)).toEqual({ problem: 250 });
    expect(buildPuzzlePatch(null)).toEqual({ puzzle: null });
    expect(buildTilesPatch(180)).toEqual({ tiles: 180 });
  });
});
