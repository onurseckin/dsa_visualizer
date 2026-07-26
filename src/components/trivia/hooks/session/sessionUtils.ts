import type { TriviaRound } from "../../../../types/trivia";
import type { TriviaPanelHeights } from "../../../../trivia/triviaLayout";

export const tileTextOf = (round: TriviaRound, tileId: string): string =>
  round.tiles.find((tile) => tile.id === tileId)?.text ?? "";

export const truthOf = (round: TriviaRound, line: number): string =>
  round.lines.find((candidate) => candidate.number === line)?.content ?? "";

export const omit = (
  source: Readonly<Record<number, string>>,
  line: number,
): Record<number, string> => {
  const next: Record<number, string> = {};
  Object.entries(source).forEach(([key, value]) => {
    if (Number(key) !== line) next[Number(key)] = value;
  });
  return next;
};

export const buildProblemPatch = (value: number | null): Partial<TriviaPanelHeights> => ({
  problem: value,
});
export const buildPuzzlePatch = (value: number | null): Partial<TriviaPanelHeights> => ({
  puzzle: value,
});
