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
import { dueReviewLines } from "./triviaEngineMastery";
import { blankableLines, classifyPuzzleLine, semanticWeightForRole } from "./triviaEngineParser";
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
  now?: number;
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
  now = Date.now(),
}: PickRoundOptions): TriviaRound | null => {
  const normalized = normalizeConfig(config);
  if (sources.size === 0 || progress.completed) return null;

  const level = clampInt(progress.level, normalized.minBlanks, normalized.maxBlanks);

  /* Algorithms with at least one blankable line are eligible. If level exceeds
     the algorithm's blankable count, all lines will be hidden at that level. */
  const eligible = [...sources.entries()].filter(([, lines]) => blankableLines(lines).length > 0);
  if (eligible.length === 0) return null;

  const due = eligible.filter(([id, lines]) => {
    const blankable = new Set(blankableLines(lines));
    return dueReviewLines(progress, id, now).some((line) => blankable.has(line));
  });
  const uncovered = eligible.filter(
    ([id, lines]) => remainingAt(progress, id, lines, level).length > 0,
  );
  const pool = due.length > 0 ? due : uncovered.length > 0 ? uncovered : eligible;
  const [algorithmId, lines] = pool[Math.floor(rng() * pool.length) % pool.length];

  const all = blankableLines(lines);
  const blankable = new Set(all);
  const dueLines = dueReviewLines(progress, algorithmId, now).filter((line) => blankable.has(line));
  const remaining =
    dueLines.length > 0 ? dueLines : remainingAt(progress, algorithmId, lines, level);
  const targetCount = Math.min(level, all.length);
  const selectedMeta = meta?.get(algorithmId);
  const semanticLines = new Map(
    (selectedMeta?.semanticLines ?? []).map((line) => [line.line, line]),
  );
  const weightOf = (line: number) => {
    const puzzleLine = lines.find((candidate) => candidate.number === line);
    const authoredRole = semanticLines.get(line)?.role;
    const semanticWeight = authoredRole
      ? semanticWeightForRole(authoredRole)
      : classifyPuzzleLine(puzzleLine?.content ?? "").semanticWeight;
    return semanticWeight * (statFor(progress, algorithmId, line).misses + 1);
  };

  // Fill from undrilled lines first, then top up from the rest of the solution.
  const primary = pickWeighted(remaining, targetCount, weightOf, rng);
  const filler =
    primary.length < targetCount
      ? pickWeighted(
          all.filter((n) => !primary.includes(n)),
          targetCount - primary.length,
          weightOf,
          rng,
        )
      : [];
  const blanks = [...primary, ...filler].sort((a, b) => a - b);
  const semanticRound = buildSemanticRound(algorithmId, lines, blanks, selectedMeta);

  return {
    algorithmId,
    level,
    lines: [...lines],
    blanks,
    tiles:
      normalized.mode === "choice"
        ? buildTiles(lines, blanks, meta?.get(algorithmId), normalized.includeDistractors, rng)
        : [],
    ...semanticRound,
  };
};

function buildSemanticRound(
  algorithmId: string,
  lines: readonly PuzzleLine[],
  blanks: readonly number[],
  meta: TriviaMeta | undefined,
): Pick<TriviaRound, "variant" | "retrievalPrompt" | "acceptedAnswers" | "misconceptionCodes"> {
  const authored = new Map((meta?.semanticLines ?? []).map((line) => [line.line, line]));
  const focusLine = [...blanks].sort((left, right) => {
    const leftLine = lines.find((line) => line.number === left);
    const rightLine = lines.find((line) => line.number === right);
    const leftWeight = classifyPuzzleLine(leftLine?.content ?? "").semanticWeight;
    const rightWeight = classifyPuzzleLine(rightLine?.content ?? "").semanticWeight;
    return rightWeight - leftWeight || left - right;
  })[0];
  if (focusLine === undefined) return {};
  const focus = authored.get(focusLine);
  const derivedRole = classifyPuzzleLine(
    lines.find((line) => line.number === focusLine)?.content ?? "",
  ).role;
  const kind =
    focus?.predictionPrompt || derivedRole === "boundary" || derivedRole === "result"
      ? "prediction"
      : "invariant";
  const prompt =
    kind === "prediction"
      ? (focus?.predictionPrompt ??
        `Predict how the result changes when the boundary around line ${focusLine} changes.`)
      : (focus?.invariantPrompt ??
        `State the invariant that must still hold after line ${focusLine}.`);
  const acceptedAnswers = Object.fromEntries(
    blanks.flatMap((line) => {
      const answers = authored.get(line)?.acceptedAnswers;
      return answers && answers.length > 0 ? [[line, [...answers]]] : [];
    }),
  );
  const misconceptionCodes = Object.fromEntries(
    blanks.flatMap((line) => {
      const code = authored.get(line)?.misconceptionCode;
      return code ? [[line, code]] : [];
    }),
  );

  return {
    variant: `${algorithmId}-line-${focusLine}-${kind}`,
    retrievalPrompt: { kind, prompt },
    ...(Object.keys(acceptedAnswers).length > 0 ? { acceptedAnswers } : {}),
    ...(Object.keys(misconceptionCodes).length > 0 ? { misconceptionCodes } : {}),
  };
}

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
  meta?: TriviaMeta | undefined,
  includeDistractorsOrRng?: boolean | Rng,
  maybeRng?: Rng,
): TriviaTile[] => {
  const includeDistractors =
    typeof includeDistractorsOrRng === "boolean" ? includeDistractorsOrRng : true;
  const rng: Rng =
    typeof includeDistractorsOrRng === "function"
      ? includeDistractorsOrRng
      : (maybeRng ?? Math.random);

  const blankSet = new Set(blanks);
  const answers: TriviaTile[] = blanks.map((number) => {
    const line = lines.find((candidate) => candidate.number === number);
    return { id: `answer-${number}`, text: line?.content ?? "", correctFor: number };
  });

  if (!includeDistractors) {
    return shuffle(answers, rng);
  }

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
