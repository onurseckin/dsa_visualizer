import type {
  PuzzleLine,
  TriviaConfig,
  TriviaMeta,
  TriviaMode,
  TriviaProgress,
  TriviaRound,
  TriviaTile,
} from "../../types/trivia";
import { clampInt, normalizeConfig } from "./triviaEngineConfig";
import { blankableLines } from "./triviaEngineParser";
import { remainingAt, statFor } from "./triviaEngineProgress";

export type Rng = () => number;

const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = out[j];
    out[j] = out[i];
    out[i] = swap;
  }
  return out;
};

/**
 * Weighted pick without replacement. Weight is `misses + 1`, so a line you have
 * fumbled resurfaces sooner while never starving the lines you know.
 */
const pickWeighted = (
  candidates: readonly number[],
  count: number,
  weightOf: (line: number) => number,
  rng: Rng,
): number[] => {
  const pool = [...candidates];
  const chosen: number[] = [];
  while (chosen.length < count && pool.length > 0) {
    const weights = pool.map((line) => Math.max(weightOf(line), 0.0001));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let ticket = rng() * total;
    let index = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      ticket -= weights[i];
      if (ticket <= 0) {
        index = i;
        break;
      }
    }
    chosen.push(pool[index]);
    pool.splice(index, 1);
  }
  return chosen;
};

export interface PickRoundOptions {
  config: TriviaConfig;
  progress: TriviaProgress;
  /** algorithmId -> parsed lines, for every id in the deck. */
  sources: ReadonlyMap<string, readonly PuzzleLine[]>;
  /** algorithmId -> author metadata, for distractor tiles. */
  meta?: ReadonlyMap<string, TriviaMeta | undefined>;
  rng?: Rng;
}

/**
 * Builds the next round: chooses an algorithm that still has uncovered lines,
 * hides `level` of them (preferring undrilled, then most-missed), and — in choice
 * mode — assembles the tile tray.
 *
 * Returns null when the deck is empty or the configured ceiling is covered.
 */
export const pickRound = ({
  config,
  progress,
  sources,
  meta,
  rng = Math.random,
}: PickRoundOptions): TriviaRound | null => {
  const normalized = normalizeConfig(config);
  if (sources.size === 0 || progress.completed) return null;

  const level = clampInt(progress.level, normalized.minBlanks, normalized.maxBlanks);

  /* Algorithms that can actually supply this many lines. Preferring the ones with
     uncovered lines is what makes a multi-question deck converge instead of
     re-drilling one lucky solution. */
  const eligible = [...sources.entries()].filter(
    ([, lines]) => blankableLines(lines).length >= level,
  );
  if (eligible.length === 0) return null;

  const uncovered = eligible.filter(
    ([id, lines]) => remainingAt(progress, id, lines, level).length > 0,
  );
  const pool = uncovered.length > 0 ? uncovered : eligible;
  const [algorithmId, lines] = pool[Math.floor(rng() * pool.length) % pool.length];

  const remaining = remainingAt(progress, algorithmId, lines, level);
  const all = blankableLines(lines);
  const weightOf = (line: number) => statFor(progress, algorithmId, line).misses + 1;

  // Fill from undrilled lines first, then top up from the rest of the solution.
  const primary = pickWeighted(remaining, level, weightOf, rng);
  const filler =
    primary.length < level
      ? pickWeighted(
          all.filter((n) => !primary.includes(n)),
          level - primary.length,
          weightOf,
          rng,
        )
      : [];
  const blanks = [...primary, ...filler].sort((a, b) => a - b);

  return {
    algorithmId,
    level,
    lines: [...lines],
    blanks,
    tiles:
      normalized.mode === "choice"
        ? buildTiles(
            lines,
            blanks,
            normalized.includeDistractors ? meta?.get(algorithmId) : undefined,
            rng,
          )
        : [],
  };
};

/**
 * Tiles for choice mode: one per blank, plus decoys.
 *
 * The decoys are other real lines from the same solution — the user's own idea,
 * and a good one, because a plausible line from the same function is far harder
 * to reject than random text. Author-supplied distractors are added on top.
 */
export const buildTiles = (
  lines: readonly PuzzleLine[],
  blanks: readonly number[],
  meta: TriviaMeta | undefined,
  rng: Rng,
): TriviaTile[] => {
  const blankSet = new Set(blanks);
  const answers: TriviaTile[] = blanks.map((number) => {
    const line = lines.find((candidate) => candidate.number === number);
    return { id: `answer-${number}`, text: line?.content ?? "", correctFor: number };
  });

  // One decoy per blank keeps the tray proportional to the difficulty.
  const decoyPool = lines
    .filter((line) => line.blankable && !blankSet.has(line.number))
    .map((line) => line.content);
  const authored = meta?.distractors ?? [];
  /* Decoys must differ from the ANSWERS too, not just from each other: 13 of the
     40 solutions repeat a line verbatim (`return False`, `node = node.children[c]`),
     and grading compares text, so a spare line identical to a blanked one would be
     a tile that is simultaneously labelled a decoy and accepted as correct. */
  const answerTexts = new Set(answers.map((tile) => tile.text));
  const decoys = shuffle([...decoyPool, ...authored], rng)
    .filter((text, index, list) => list.indexOf(text) === index && !answerTexts.has(text))
    .slice(0, blanks.length)
    .map((text, index) => ({ id: `decoy-${index}`, text, correctFor: null }));

  return shuffle([...answers, ...decoys], rng);
};

export const describeMode = (mode: TriviaMode): string =>
  mode === "choice"
    ? "Drag the matching line into each blank"
    : "Type each missing line from memory";
