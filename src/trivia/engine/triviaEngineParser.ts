import type { PuzzleLine, TriviaMeta } from "../../types/trivia";

/**
 * Splits a solution into drillable lines.
 *
 * Indentation is separated from content on purpose: Python's meaning depends on
 * it, but making the learner retype leading spaces tests typing, not recall, so
 * the UI shows the indent and grades only the content.
 */
export const parsePuzzleLines = (code: string, meta?: TriviaMeta): PuzzleLine[] => {
  const skip = new Set(meta?.skipLines ?? []);
  return code
    .replace(/\s+$/, "")
    .split("\n")
    .map((raw, index) => {
      const number = index + 1;
      const match = /^(\s*)(.*)$/.exec(raw);
      const indent = match ? match[1] : "";
      const content = match ? match[2] : raw;
      return {
        number,
        text: raw,
        indent,
        content,
        blankable: content.trim().length > 0 && !skip.has(number),
      };
    });
};

export const blankableLines = (lines: readonly PuzzleLine[]): number[] =>
  lines.filter((line) => line.blankable).map((line) => line.number);
