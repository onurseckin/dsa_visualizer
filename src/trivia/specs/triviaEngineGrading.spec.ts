import { describe, expect, it } from "vitest";
import { gradeRound, isAnswerCorrect, parsePuzzleLines } from "../triviaEngine";
import type { PuzzleLine, TriviaRound } from "../../types/trivia";

const roundOf = (
  algorithmId: string,
  lines: readonly PuzzleLine[],
  blanks: number[],
  level = blanks.length,
): TriviaRound => ({ algorithmId, level, lines: [...lines], blanks, tiles: [] });

const SIMPLE_CODE = [
  "def f(n):",
  "    total = 0",
  "",
  "    for i in range(n):",
  "        total += i",
  "    return total",
].join("\n");

describe("isAnswerCorrect", () => {
  it("ignores leading and trailing whitespace on both sides", () => {
    expect(isAnswerCorrect("   total = 0  ", "total = 0")).toBe(true);
    expect(isAnswerCorrect("total = 0", "\ttotal = 0 ")).toBe(true);
  });

  it("collapses multiple internal spaces around an operator to a single space", () => {
    expect(isAnswerCorrect("x  =  1+1", "x = 1+1")).toBe(true);
    expect(isAnswerCorrect("total   =   0", "total = 0")).toBe(true);
  });

  it("collapses extra internal spacing inside array/tuple literals", () => {
    expect(isAnswerCorrect("[1,  2,   3]", "[1, 2, 3]")).toBe(true);
    expect(isAnswerCorrect("(1,   2)", "(1, 2)")).toBe(true);
  });

  it("does not treat an entirely absent space the same as a present one", () => {
    expect(isAnswerCorrect("total=0", "total = 0")).toBe(false);
    expect(isAnswerCorrect("[1,2,3]", "[1, 2,3]")).toBe(false);
  });

  it("is case sensitive", () => {
    expect(isAnswerCorrect("Return total", "return total")).toBe(false);
  });

  it("rejects an empty submission for a real line", () => {
    expect(isAnswerCorrect("", "return total")).toBe(false);
    expect(isAnswerCorrect("   ", "return total")).toBe(false);
  });

  it("still fails a genuine mismatch even after whitespace normalization", () => {
    expect(isAnswerCorrect("count  =  0", "total = 0")).toBe(false);
    expect(isAnswerCorrect("x  +  1", "x - 1")).toBe(false);
  });
});

describe("gradeRound", () => {
  const lines = parsePuzzleLines(SIMPLE_CODE);

  it("grades each blank against the line content, ignoring indentation", () => {
    const round = roundOf("alpha", lines, [2, 5]);
    const grade = gradeRound(round, { 2: "total = 0", 5: "        total += i" });

    expect(grade).toEqual({ perBlank: { 2: true, 5: true }, allCorrect: true });
  });

  it("counts a missing answer as wrong", () => {
    const round = roundOf("alpha", lines, [2, 5]);
    const grade = gradeRound(round, { 2: "total = 0" });

    expect(grade.perBlank[5]).toBe(false);
    expect(grade.allCorrect).toBe(false);
  });

  it("reports allCorrect only when every blank matches", () => {
    const round = roundOf("alpha", lines, [2, 4, 5]);

    expect(
      gradeRound(round, { 2: "total = 0", 4: "for i in range(n):", 5: "total += i" }).allCorrect,
    ).toBe(true);

    expect(
      gradeRound(round, { 2: "total = 0", 4: "for i in range(m):", 5: "total += i" }).allCorrect,
    ).toBe(false);
  });

  it("grades only the round blanks and ignores stray answer keys", () => {
    const round = roundOf("alpha", lines, [2]);
    const grade = gradeRound(round, { 2: "total = 0", 4: "garbage", 99: "garbage" });

    expect(grade.perBlank).toEqual({ 2: true });
    expect(grade.allCorrect).toBe(true);
  });

  it("accepts a blank whose internal spacing differs only by extra whitespace", () => {
    const round = roundOf("alpha", lines, [4]);

    expect(gradeRound(round, { 4: "for i  in range(n):" }).perBlank[4]).toBe(true);
  });

  it("still rejects a blank whose content genuinely differs, not just its spacing", () => {
    const round = roundOf("alpha", lines, [4]);

    expect(gradeRound(round, { 4: "for i  in range(m):" }).perBlank[4]).toBe(false);
  });
});
