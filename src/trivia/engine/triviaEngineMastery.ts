import type {
  TriviaConfidence,
  TriviaGrade,
  TriviaLineReview,
  TriviaProgress,
  TriviaReviewSubmission,
  TriviaRound,
} from "../../types/trivia";

const DAY_MS = 86_400_000;
export const TRIVIA_RETRIEVAL_INTERVAL_DAYS = Object.freeze([1, 7, 24] as const);
export const DEFAULT_TRIVIA_MASTERY_THRESHOLD = 0.8;

export interface TriviaMasteryPolicy {
  masteryThreshold?: number;
}

export function recordRetrievalReview(
  progress: TriviaProgress,
  round: TriviaRound,
  grade: TriviaGrade,
  submission: TriviaReviewSubmission,
  now: number,
  policy: TriviaMasteryPolicy = {},
): TriviaProgress {
  assertReviewSubmission(submission, now);
  const masteryThreshold = normalizeMasteryThreshold(policy.masteryThreshold);
  const algorithmReviews = { ...(progress.reviews?.[round.algorithmId] ?? {}) };

  for (const line of round.blanks) {
    const key = String(line);
    const current = algorithmReviews[key];
    const correct = grade.perBlank[line] === true;
    const stat = progress.stats[round.algorithmId]?.[key];
    const attempts = Math.max(stat?.attempts ?? 1, 1);
    const misses = Math.min(Math.max(stat?.misses ?? (correct ? 0 : 1), 0), attempts);
    const masteryScore = (attempts - misses) / attempts;
    const qualifies = correct && submission.confidence >= 4 && masteryScore >= masteryThreshold;
    const lineMisconception = round.misconceptionCodes?.[line];
    const misconceptionCodes = correct
      ? []
      : uniqueCodes([
          ...(grade.misconceptionCodes ?? []),
          ...(lineMisconception ? [lineMisconception] : []),
        ]);

    algorithmReviews[key] = nextLineReview({
      current,
      qualifies,
      correct,
      confidence: submission.confidence,
      response: submission.response.trim(),
      masteryScore,
      misconceptionCodes,
      variant: round.variant ?? `${round.algorithmId}-line-${line}`,
      now,
    });
  }

  return {
    ...progress,
    reviews: {
      ...(progress.reviews ?? {}),
      [round.algorithmId]: algorithmReviews,
    },
  };
}

export function dueReviewLines(
  progress: TriviaProgress,
  algorithmId: string,
  now: number,
): number[] {
  if (!Number.isFinite(now) || now < 0) return [];
  return Object.entries(progress.reviews?.[algorithmId] ?? {})
    .filter(([, review]) => !review.mastered && review.dueAt !== undefined && review.dueAt <= now)
    .map(([line]) => Number(line))
    .filter(Number.isInteger)
    .sort((left, right) => left - right);
}

export function masteryRatio(progress: TriviaProgress): number {
  const reviews = Object.values(progress.reviews ?? {}).flatMap((lines) => Object.values(lines));
  if (reviews.length === 0) return 0;
  return reviews.filter((review) => review.mastered).length / reviews.length;
}

interface NextLineReviewOptions {
  current: TriviaLineReview | undefined;
  qualifies: boolean;
  correct: boolean;
  confidence: TriviaConfidence;
  response: string;
  masteryScore: number;
  misconceptionCodes: string[];
  variant: string;
  now: number;
}

function nextLineReview(options: NextLineReviewOptions): TriviaLineReview {
  const {
    current,
    qualifies,
    correct,
    confidence,
    response,
    masteryScore,
    misconceptionCodes,
    variant,
    now,
  } = options;

  if (!qualifies) {
    return {
      intervalIndex: 0,
      dueAt: now + TRIVIA_RETRIEVAL_INTERVAL_DAYS[0] * DAY_MS,
      lastReviewedAt: now,
      variant,
      confidence,
      correct,
      masteryScore,
      mastered: false,
      misconceptionCodes,
      response,
    };
  }

  if (current?.mastered) {
    return {
      ...current,
      lastReviewedAt: now,
      variant,
      confidence,
      correct,
      masteryScore,
      misconceptionCodes: [],
      response,
    };
  }

  if (current?.dueAt !== undefined && now < current.dueAt) {
    return {
      ...current,
      lastReviewedAt: now,
      variant,
      confidence,
      correct,
      masteryScore,
      misconceptionCodes: [],
      response,
    };
  }

  if (current?.dueAt !== undefined && current.intervalIndex === 2) {
    return {
      intervalIndex: 2,
      lastReviewedAt: now,
      variant,
      confidence,
      correct,
      masteryScore,
      mastered: true,
      misconceptionCodes: [],
      response,
    };
  }

  const intervalIndex =
    current?.dueAt === undefined ? 0 : (Math.min(current.intervalIndex + 1, 2) as 0 | 1 | 2);
  return {
    intervalIndex,
    dueAt: now + TRIVIA_RETRIEVAL_INTERVAL_DAYS[intervalIndex] * DAY_MS,
    lastReviewedAt: now,
    variant,
    confidence,
    correct,
    masteryScore,
    mastered: false,
    misconceptionCodes: [],
    response,
  };
}

function assertReviewSubmission(submission: TriviaReviewSubmission, now: number): void {
  if (
    !Number.isInteger(submission.confidence) ||
    submission.confidence < 1 ||
    submission.confidence > 5 ||
    submission.response.trim().length === 0 ||
    submission.response.length > 8_192 ||
    !Number.isFinite(now) ||
    now < 0
  ) {
    throw new Error("Trivia review requires confidence 1–5, a bounded response, and a timestamp.");
  }
}

function normalizeMasteryThreshold(value: number | undefined): number {
  const threshold = value ?? DEFAULT_TRIVIA_MASTERY_THRESHOLD;
  if (!Number.isFinite(threshold) || threshold < 0.8 || threshold > 0.85) {
    throw new Error("Trivia mastery threshold must be between 0.8 and 0.85.");
  }
  return threshold;
}

function uniqueCodes(codes: readonly string[]): string[] {
  return [...new Set(codes.filter((code) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)))];
}
