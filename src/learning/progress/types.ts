export const ATTEMPT_RECORD_VERSION = 2;
export const MAX_ATTEMPT_RESPONSE_BYTES = 64 * 1024;
export const MAX_ATTEMPT_STRING_LENGTH = 8 * 1024;
export const MAX_RUBRIC_DIMENSIONS = 16;
export const MAX_MISCONCEPTION_CODES = 16;
export const MAX_JSON_DEPTH = 32;

const ITEM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type AssessmentAttemptMode =
  | "algorithm"
  | "trace"
  | "calculator"
  | "debugging"
  | "code-completion"
  | "scenario"
  | "capstone";

export type AssessmentGradingStatus = "graded" | "pending";

export interface RubricDimensionResult {
  readonly id: string;
  readonly score: number;
  readonly maxScore: number;
  readonly feedback?: string;
}

export interface AssessmentAttemptRecord {
  readonly version: typeof ATTEMPT_RECORD_VERSION;
  readonly itemId: string;
  readonly mode: AssessmentAttemptMode;
  readonly variant: string;
  readonly response: JsonValue;
  readonly gradingStatus: AssessmentGradingStatus;
  readonly score: number;
  readonly rubric: readonly [RubricDimensionResult, ...RubricDimensionResult[]];
  readonly criticalFailures: readonly string[];
  readonly confidence: 1 | 2 | 3 | 4 | 5;
  readonly misconceptionCodes: readonly string[];
  /** Codes explicitly repaired by a successful isomorphic retest. */
  readonly repairedMisconceptionCodes: readonly string[];
  readonly isomorphicRetest: boolean;
  readonly changedContext: boolean;
  readonly invariantEvidence: string;
  readonly tradeoffEvidence: string;
  readonly delayedRetrievalDueAt?: number;
  readonly delayedRetrievalCompletedAt?: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type AssessmentAttemptInput = Omit<AssessmentAttemptRecord, "version">;

export interface AssessmentSubmissionContext {
  readonly confidence: AssessmentAttemptRecord["confidence"];
  readonly invariantEvidence: string;
  readonly tradeoffEvidence: string;
}

export type AssessmentSubmission = Omit<
  AssessmentAttemptInput,
  "itemId" | "createdAt" | "updatedAt"
>;

export type AssessmentSubmissionHandler = (submission: AssessmentSubmission) => boolean;

export function createAttemptRecord(input: AssessmentAttemptInput): AssessmentAttemptRecord {
  const record = { version: ATTEMPT_RECORD_VERSION, ...input } as AssessmentAttemptRecord;
  if (!isAssessmentAttemptRecord(record)) {
    throw new Error("Assessment attempt does not meet the versioned progress contract.");
  }
  return deepFreeze(cloneRecord(record));
}

export function isAssessmentAttemptRecord(value: unknown): value is AssessmentAttemptRecord {
  if (!isPlainRecord(value)) return false;
  const allowed = new Set([
    "version",
    "itemId",
    "mode",
    "variant",
    "response",
    "gradingStatus",
    "score",
    "rubric",
    "criticalFailures",
    "confidence",
    "misconceptionCodes",
    "repairedMisconceptionCodes",
    "isomorphicRetest",
    "changedContext",
    "invariantEvidence",
    "tradeoffEvidence",
    "delayedRetrievalDueAt",
    "delayedRetrievalCompletedAt",
    "createdAt",
    "updatedAt",
  ]);
  if (!Object.keys(value).every((key) => allowed.has(key))) return false;
  const record = value as Record<string, unknown>;
  if (
    record.version !== ATTEMPT_RECORD_VERSION ||
    !isCanonicalItemId(record.itemId) ||
    !isAttemptMode(record.mode) ||
    !isBoundedCode(record.variant) ||
    !isJsonValue(record.response) ||
    serializedByteLength(record.response) > MAX_ATTEMPT_RESPONSE_BYTES ||
    !isGradingStatus(record.gradingStatus) ||
    !isUnitInterval(record.score) ||
    !isRubric(record.rubric) ||
    !isCodeList(record.criticalFailures) ||
    !isConfidence(record.confidence) ||
    !isCodeList(record.misconceptionCodes) ||
    !isCodeList(record.repairedMisconceptionCodes) ||
    typeof record.isomorphicRetest !== "boolean" ||
    typeof record.changedContext !== "boolean" ||
    !isBoundedString(record.invariantEvidence) ||
    !isBoundedString(record.tradeoffEvidence) ||
    !isTimestamp(record.createdAt) ||
    !isTimestamp(record.updatedAt) ||
    record.updatedAt < record.createdAt
  ) {
    return false;
  }
  if (!isOptionalTimestamp(record.delayedRetrievalDueAt)) return false;
  if (!isOptionalTimestamp(record.delayedRetrievalCompletedAt)) return false;
  if (
    record.delayedRetrievalDueAt !== undefined &&
    record.delayedRetrievalCompletedAt !== undefined &&
    record.delayedRetrievalCompletedAt < record.delayedRetrievalDueAt
  ) {
    return false;
  }
  return true;
}

export function isJsonValue(value: unknown): value is JsonValue {
  return isJsonValueAtDepth(value, 0, new Set<object>());
}

function isJsonValueAtDepth(
  value: unknown,
  depth: number,
  ancestors: Set<object>,
): value is JsonValue {
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return utf8ByteLength(value) <= MAX_ATTEMPT_STRING_LENGTH;
  if (depth >= MAX_JSON_DEPTH || typeof value !== "object" || value === null) return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  let valid: boolean;
  if (Array.isArray(value)) {
    valid =
      value.length <= 128 &&
      value.every((nested) => isJsonValueAtDepth(nested, depth + 1, ancestors));
  } else if (isPlainRecord(value) && Object.keys(value).length <= 128) {
    valid = Object.entries(value).every(
      ([key, nested]) =>
        utf8ByteLength(key) <= 128 && isJsonValueAtDepth(nested, depth + 1, ancestors),
    );
  } else {
    valid = false;
  }
  ancestors.delete(value);
  return valid;
}

function cloneRecord(record: AssessmentAttemptRecord): AssessmentAttemptRecord {
  return {
    ...record,
    response: cloneJson(record.response),
    rubric: record.rubric.map((dimension) => ({
      ...dimension,
    })) as unknown as AssessmentAttemptRecord["rubric"],
    criticalFailures: [...record.criticalFailures],
    misconceptionCodes: [...record.misconceptionCodes],
    repairedMisconceptionCodes: [...record.repairedMisconceptionCodes],
  };
}

function cloneJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(cloneJson);
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, cloneJson(nested)]),
    );
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function isRubric(value: unknown): value is AssessmentAttemptRecord["rubric"] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_RUBRIC_DIMENSIONS)
    return false;
  const ids = new Set<string>();
  return value.every((dimension) => {
    if (!isPlainRecord(dimension)) return false;
    if (
      !Object.keys(dimension).every((key) => ["id", "score", "maxScore", "feedback"].includes(key))
    )
      return false;
    if (
      !isBoundedCode(dimension.id) ||
      !isNonNegativeFinite(dimension.score) ||
      !isPositiveFinite(dimension.maxScore) ||
      dimension.score > dimension.maxScore ||
      (dimension.feedback !== undefined && !isBoundedString(dimension.feedback)) ||
      ids.has(dimension.id)
    ) {
      return false;
    }
    ids.add(dimension.id);
    return true;
  });
}

function isCodeList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_MISCONCEPTION_CODES &&
    value.every(isBoundedCode) &&
    new Set(value).size === value.length
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isCanonicalItemId(value: unknown): value is string {
  return typeof value === "string" && ITEM_ID_PATTERN.test(value);
}

function isBoundedCode(value: unknown): value is string {
  return typeof value === "string" && value.length <= 96 && CODE_PATTERN.test(value);
}

function isBoundedString(value: unknown): value is string {
  return typeof value === "string" && utf8ByteLength(value) <= MAX_ATTEMPT_STRING_LENGTH;
}

function isAttemptMode(value: unknown): value is AssessmentAttemptMode {
  return (
    typeof value === "string" &&
    [
      "algorithm",
      "trace",
      "calculator",
      "debugging",
      "code-completion",
      "scenario",
      "capstone",
    ].includes(value)
  );
}

function isGradingStatus(value: unknown): value is AssessmentGradingStatus {
  return value === "graded" || value === "pending";
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isConfidence(value: unknown): value is AssessmentAttemptRecord["confidence"] {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isOptionalTimestamp(value: unknown): value is number | undefined {
  return value === undefined || isTimestamp(value);
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function serializedByteLength(value: JsonValue): number {
  try {
    return utf8ByteLength(JSON.stringify(value));
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
