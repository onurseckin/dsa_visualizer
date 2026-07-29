import type { PuzzleLine, TriviaLineRole, TriviaMeta } from "../../types/trivia";

export interface PuzzleLineSemantics {
  role: TriviaLineRole;
  semanticWeight: number;
}

const ROLE_WEIGHTS: Readonly<Record<TriviaLineRole, number>> = Object.freeze({
  boilerplate: 1,
  "control-flow": 3,
  result: 3,
  boundary: 4,
  "state-update": 4,
  invariant: 5,
});

export const semanticWeightForRole = (role: TriviaLineRole): number => ROLE_WEIGHTS[role];

/**
 * A deliberately conservative syntax heuristic. It improves retrieval
 * selection without claiming to understand arbitrary Python semantics;
 * authors can override the role through `TriviaMeta.semanticLines`.
 */
export const classifyPuzzleLine = (content: string): PuzzleLineSemantics => {
  const value = content.trim();
  let role: TriviaLineRole;
  if (/^(?:from\s+\S+\s+import|import\s+|def\s+|class\s+|@|pass\b|"""|''')/.test(value)) {
    role = "boilerplate";
  } else if (/^(?:if|elif)\b/.test(value) || /^assert\b/.test(value)) {
    role = "boundary";
  } else if (/^(?:for|while|try|except|finally|with|else)\b/.test(value)) {
    role = "control-flow";
  } else if (/^return\b/.test(value) || /^yield\b/.test(value)) {
    role = "result";
  } else if (
    /(?:\+=|-=|\*=|\/=|\/\/=|%=|\|=|&=|\^=|<<=|>>=)/.test(value) ||
    /(?:\.append|\.extend|\.add|\.remove|\.discard|\.update|\.push|\.pop)\s*\(/.test(value) ||
    /(?:\[[^\]]+\]|\.[A-Za-z_]\w*)\s*=/.test(value)
  ) {
    role = "state-update";
  } else if (/\b(?:invariant|monotonic|sorted|visited|frontier)\b/i.test(value)) {
    role = "invariant";
  } else {
    role = "control-flow";
  }
  return { role, semanticWeight: ROLE_WEIGHTS[role] };
};

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
