import type { PythonComparison, PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { getPythonExecutionSpec } from "./executionSpecs";
import { DSA_EXECUTION_SPECS } from "./specs-data/dsa";
import { ML_SPECS_MAP } from "./specs-data/ml";

/**
 * Detailed evaluation outcome for a single test case.
 */
export interface CaseEvaluationResult {
  readonly caseId: string;
  readonly label: string;
  readonly passed: boolean;
  readonly input: unknown;
  readonly expected: unknown;
  readonly actual?: unknown;
  readonly error?: string;
  readonly executionTimeMs: number;
  readonly comparisonMode: PythonComparison;
}

/**
 * Aggregate summary report for an entire test suite execution.
 */
export interface TestSuiteEvaluationResult {
  readonly totalCases: number;
  readonly passedCases: number;
  readonly failedCases: number;
  readonly allPassed: boolean;
  readonly results: readonly CaseEvaluationResult[];
  readonly totalExecutionTimeMs: number;
}

/**
 * Master catalog lookup map combining all DSA and ML execution specs.
 */
const ALL_SPECS_MAP: ReadonlyMap<string, PythonExecutionSpec> = new Map([
  ...DSA_EXECUTION_SPECS.entries(),
  ...ML_SPECS_MAP.entries(),
]);

/**
 * Resolves a PythonExecutionSpec for any given algorithm or topic identifier,
 * supporting kebab-case, snake_case, raw IDs, track-prefixed aliases, and partial fallbacks.
 */
export function resolveExecutionSpec(algorithmOrTopicId: string): PythonExecutionSpec | undefined {
  const direct =
    getPythonExecutionSpec(algorithmOrTopicId) || ALL_SPECS_MAP.get(algorithmOrTopicId);
  if (direct) return direct;

  const sanitized = algorithmOrTopicId.trim();
  const snake = sanitized.replace(/-/g, "_");
  const kebab = sanitized.replace(/_/g, "-");

  const candidates = [snake, kebab, `dsa_${snake}`, `dsa-${kebab}`, `ml_${snake}`, `ml-${kebab}`];

  for (const key of candidates) {
    const spec = ALL_SPECS_MAP.get(key) || getPythonExecutionSpec(key);
    if (spec) return spec;
  }

  // Shorthand prefix stripping (e.g. 'dsa_binary_search' -> 'binary_search' or 'binary-search')
  if (
    sanitized.startsWith("dsa_") ||
    sanitized.startsWith("dsa-") ||
    sanitized.startsWith("ml_") ||
    sanitized.startsWith("ml-")
  ) {
    const stripped = sanitized.slice(4);
    const strippedSnake = stripped.replace(/-/g, "_");
    const strippedKebab = stripped.replace(/_/g, "-");
    const spec =
      ALL_SPECS_MAP.get(stripped) ||
      ALL_SPECS_MAP.get(strippedSnake) ||
      ALL_SPECS_MAP.get(strippedKebab) ||
      getPythonExecutionSpec(stripped) ||
      getPythonExecutionSpec(strippedSnake) ||
      getPythonExecutionSpec(strippedKebab);
    if (spec) return spec;
  }

  // Suffix/prefix fallback (e.g. 'binary-search' or 'dsa_binary_search' matching 'binary-search-1d')
  const searchTerms = [
    kebab.toLowerCase(),
    snake.toLowerCase(),
    sanitized.startsWith("dsa_") ||
    sanitized.startsWith("ml_") ||
    sanitized.startsWith("dsa-") ||
    sanitized.startsWith("ml-")
      ? sanitized.slice(4).replace(/_/g, "-").toLowerCase()
      : "",
    sanitized.startsWith("dsa_") ||
    sanitized.startsWith("ml_") ||
    sanitized.startsWith("dsa-") ||
    sanitized.startsWith("ml-")
      ? sanitized.slice(4).replace(/-/g, "_").toLowerCase()
      : "",
  ].filter((t) => t.length > 2);

  for (const [key, spec] of ALL_SPECS_MAP.entries()) {
    const keyLower = key.toLowerCase();
    for (const term of searchTerms) {
      if (keyLower === term || keyLower.startsWith(term) || term.startsWith(keyLower)) {
        return spec;
      }
    }
  }

  return undefined;
}

/**
 * Returns the entire catalog of registered execution specs.
 */
export function getAllExecutionSpecs(): ReadonlyMap<string, PythonExecutionSpec> {
  return ALL_SPECS_MAP;
}

/**
 * Compares two floating point numbers or nested structures with tolerance.
 */
function compareFloatsWithTolerance(
  expected: unknown,
  actual: unknown,
  tolerance: number = 1e-5,
): boolean {
  if (typeof expected === "number" && typeof actual === "number") {
    if (Number.isNaN(expected) && Number.isNaN(actual)) return true;
    if (!Number.isFinite(expected) && !Number.isFinite(actual)) return expected === actual;
    return Math.abs(expected - actual) <= tolerance;
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    for (let i = 0; i < expected.length; i++) {
      if (!compareFloatsWithTolerance(expected[i], actual[i], tolerance)) {
        return false;
      }
    }
    return true;
  }

  if (
    typeof expected === "object" &&
    expected !== null &&
    typeof actual === "object" &&
    actual !== null
  ) {
    const expObj = expected as Record<string, unknown>;
    const actObj = actual as Record<string, unknown>;
    const expKeys = Object.keys(expObj);
    const actKeys = Object.keys(actObj);

    if (expKeys.length !== actKeys.length) return false;
    for (const k of expKeys) {
      if (!(k in actObj)) return false;
      if (!compareFloatsWithTolerance(expObj[k], actObj[k], tolerance)) {
        return false;
      }
    }
    return true;
  }

  return expected === actual;
}

/**
 * Deep equality comparator handling primitives, arrays, and plain objects.
 */
function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two 1D arrays ignoring element ordering (multiset equality).
 */
function isUnorderedEqual(expected: unknown, actual: unknown): boolean {
  if (!Array.isArray(expected) || !Array.isArray(actual)) {
    return isDeepEqual(expected, actual);
  }

  if (expected.length !== actual.length) return false;

  const matched = new Array<boolean>(actual.length).fill(false);

  for (const expItem of expected) {
    let found = false;
    for (let j = 0; j < actual.length; j++) {
      if (!matched[j] && isDeepEqual(expItem, actual[j])) {
        matched[j] = true;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  return true;
}

/**
 * Evaluates whether an actual output matches expected based on the spec's comparison mode.
 */
export function compareOutputs(
  expected: unknown,
  actual: unknown,
  mode: PythonComparison = "deep-equal",
  tolerance?: number,
): boolean {
  switch (mode) {
    case "float":
      return compareFloatsWithTolerance(expected, actual, tolerance ?? 1e-5);

    case "unordered":
      return isUnorderedEqual(expected, actual);

    case "unordered-outer": {
      if (!Array.isArray(expected) || !Array.isArray(actual)) {
        return isDeepEqual(expected, actual);
      }
      return isUnorderedEqual(expected, actual);
    }

    case "stdout": {
      const expStr = String(expected ?? "")
        .trim()
        .replace(/\r\n/g, "\n");
      const actStr = String(actual ?? "")
        .trim()
        .replace(/\r\n/g, "\n");
      return expStr === actStr;
    }

    case "deep-equal":
    default:
      return isDeepEqual(expected, actual);
  }
}

/**
 * Test case runner that evaluates student code against a spec using a provided execution callback.
 */
export async function evaluateTestCases(
  spec: PythonExecutionSpec,
  executeFn: (code: string, input: unknown) => Promise<unknown>,
  code: string = "",
): Promise<TestSuiteEvaluationResult> {
  const caseResults: CaseEvaluationResult[] = [];
  let passedCount = 0;
  const startTime = Date.now();

  for (const tc of spec.cases) {
    const caseStartTime = performance.now();
    let actual: unknown;
    let error: string | undefined;
    let passed = false;

    try {
      actual = await executeFn(code, tc.input);
      passed = compareOutputs(tc.expected, actual, tc.comparison, tc.tolerance);
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : String(err);
      passed = false;
    }

    const executionTimeMs = Math.round((performance.now() - caseStartTime) * 100) / 100;

    if (passed) {
      passedCount++;
    }

    caseResults.push({
      caseId: tc.id,
      label: tc.label,
      passed,
      input: tc.input,
      expected: tc.expected,
      actual,
      error,
      executionTimeMs,
      comparisonMode: tc.comparison,
    });
  }

  const totalExecutionTimeMs = Date.now() - startTime;

  return {
    totalCases: spec.cases.length,
    passedCases: passedCount,
    failedCases: spec.cases.length - passedCount,
    allPassed: passedCount === spec.cases.length,
    results: caseResults,
    totalExecutionTimeMs,
  };
}

/**
 * Convenient alias for evaluateTestCases matching spec execution naming conventions.
 */
export const executeSpecTestCases = evaluateTestCases;
