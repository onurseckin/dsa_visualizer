import type { QuestionBankSuiteSection } from "./courseTypes";
import { ALL_COURSE_JOURNEYS, getCourseJourney } from "./catalog";

/**
 * Parameter payload for Socratic answer evaluation.
 */
export interface SocraticEvaluationParams {
  readonly topicId: string;
  readonly questionTitle?: string;
  readonly questionPrompt: string;
  readonly referenceSolution?: string;
  readonly referenceInvariant?: string;
  readonly studentAnswer: string;
  readonly expectedAsymptotics?: string;
  readonly expectedHardwareKey?: string;
}

/**
 * Result returned by the Socratic evaluator.
 */
export interface SocraticEvaluationResult {
  readonly score: number;
  readonly passed: boolean;
  readonly feedback: string;
  readonly rubricBreakdown: {
    readonly invariantAccuracy: number;
    readonly asymptoticPrecision: number;
    readonly hardwareAwareness: number;
  };
  readonly socraticHints: readonly string[];
  readonly counterExamples: readonly string[];
}

/**
 * Retrieves the 4-part Question Bank Suite for a specific topic ID.
 */
export function getQuestionBankSuite(topicId: string): QuestionBankSuiteSection | undefined {
  const journey = getCourseJourney(topicId);
  if (!journey) return undefined;

  for (const chapter of journey.chapters || []) {
    for (const section of chapter.sections || []) {
      if (section.type === "question_bank_suite") {
        return section as QuestionBankSuiteSection;
      }
    }
    for (const page of chapter.pages || []) {
      for (const section of page.sections || []) {
        if (section.type === "question_bank_suite") {
          return section as QuestionBankSuiteSection;
        }
      }
    }
  }

  return undefined;
}

/**
 * Retrieves all Question Bank Suites across all 64 course journeys.
 */
export function getAllQuestionBankSuites(): Record<string, QuestionBankSuiteSection> {
  const suites: Record<string, QuestionBankSuiteSection> = {};

  for (const journey of ALL_COURSE_JOURNEYS) {
    const suite = getQuestionBankSuite(journey.id);
    if (suite) {
      suites[journey.id] = suite;
    }
  }

  return suites;
}

/**
 * Evaluates student mathematical, algorithmic, and systems responses using multi-dimensional Socratic rubrics.
 */
export function evaluateSocraticAnswer(params: SocraticEvaluationParams): SocraticEvaluationResult {
  const {
    topicId,
    questionPrompt,
    referenceSolution = "",
    referenceInvariant = "",
    studentAnswer,
    expectedAsymptotics = "",
    expectedHardwareKey = "",
  } = params;

  const answer = studentAnswer.trim();
  if (!answer) {
    return {
      score: 0,
      passed: false,
      feedback:
        "No response provided. Please state your mathematical derivation or algorithmic approach.",
      rubricBreakdown: {
        invariantAccuracy: 0,
        asymptoticPrecision: 0,
        hardwareAwareness: 0,
      },
      socraticHints: [
        "Step 1: Identify the underlying geometric or algebraic invariant governing this problem.",
        "Step 2: Formulate the recurrence relation or optimization objective in formal notation.",
        "Step 3: Analyze how memory hierarchy (L1/SRAM vs DRAM) affects operational intensity.",
      ],
      counterExamples: ["Empty/trivial response fails on all non-empty input sets."],
    };
  }

  const answerLower = answer.toLowerCase();

  // 1. Invariant Accuracy Assessment (50% weight)
  let invariantScore = 0;
  const keyInvariantTokens = extractKeywords(
    referenceInvariant || referenceSolution || questionPrompt,
  );
  let matchedTokens = 0;

  for (const token of keyInvariantTokens) {
    if (answerLower.includes(token.toLowerCase())) {
      matchedTokens++;
    }
  }

  if (keyInvariantTokens.length > 0) {
    invariantScore = Math.min(
      100,
      Math.round((matchedTokens / Math.min(keyInvariantTokens.length, 6)) * 100),
    );
  } else {
    // General mathematical length / structure heuristics
    invariantScore = answer.length > 100 ? 80 : 50;
  }

  // Bonus for LaTeX mathematical notation
  if (
    answer.includes("$") ||
    answer.includes("\\") ||
    answer.includes("=") ||
    answer.includes("^")
  ) {
    invariantScore = Math.min(100, invariantScore + 15);
  }

  // 2. Asymptotic Precision Assessment (25% weight)
  let asymptoticScore = 0;
  const hasBigO = /O\([^)]+\)|Θ\([^)]+\)|Omega\([^)]+\)/i.test(answer);
  if (hasBigO) {
    asymptoticScore += 60;
    if (expectedAsymptotics && answerLower.includes(expectedAsymptotics.toLowerCase())) {
      asymptoticScore += 40;
    } else if (
      answer.includes("O(") &&
      (answer.includes("log") || answer.includes("N") || answer.includes("1"))
    ) {
      asymptoticScore += 30;
    }
  } else {
    // Deduce if asymptotic keywords are used
    if (/linear|quadratic|logarithmic|constant|exponential/i.test(answerLower)) {
      asymptoticScore += 40;
    }
  }
  asymptoticScore = Math.min(100, asymptoticScore);

  // 3. Hardware & Systems Awareness Assessment (25% weight)
  let hardwareScore = 0;
  const systemsTokens = [
    "cache",
    "sram",
    "dram",
    "bandwidth",
    "warp",
    "stride",
    "memory",
    "coherence",
    "atomic",
    "gemm",
    "blas",
    "simd",
    "cholesky",
    "quantiz",
    "latency",
    "register",
    "flop",
    "roofline",
    "io",
    "condition number",
    "overflow",
    "cancellation",
    "tiling",
  ];

  let matchedSystems = 0;
  for (const sys of systemsTokens) {
    if (answerLower.includes(sys)) {
      matchedSystems++;
    }
  }

  if (matchedSystems >= 3) {
    hardwareScore = 100;
  } else if (matchedSystems === 2) {
    hardwareScore = 80;
  } else if (matchedSystems === 1) {
    hardwareScore = 60;
  } else {
    if (expectedHardwareKey && answerLower.includes(expectedHardwareKey.toLowerCase())) {
      hardwareScore = 75;
    } else {
      hardwareScore = 30;
    }
  }

  // Compute Aggregate Score
  const aggregateScore = Math.round(
    invariantScore * 0.5 + asymptoticScore * 0.25 + hardwareScore * 0.25,
  );

  const passed = aggregateScore >= 70;

  // Generate Progressive Multi-Tier Hints
  const socraticHints = generateProgressiveHints(
    topicId,
    answerLower,
    invariantScore,
    asymptoticScore,
    hardwareScore,
  );

  // Generate Counter-Examples & Edge Cases
  const counterExamples = generateCounterExamples(topicId, answerLower);

  // Detailed Feedback Generation
  let feedback = "";
  if (passed) {
    feedback = `Excellent technical rigor (Score: ${aggregateScore}/100). Response correctly captures the foundational invariant, provides rigorous asymptotic bounds, and articulates key systems trade-offs.`;
  } else {
    const deficiencies: string[] = [];
    if (invariantScore < 60) deficiencies.push("missing core mathematical invariant derivation");
    if (asymptoticScore < 60)
      deficiencies.push("incomplete time/space complexity bounds in standard asymptotic notation");
    if (hardwareScore < 60)
      deficiencies.push("lack of memory hierarchy or microarchitectural hardware context");

    feedback = `Developing response (Score: ${aggregateScore}/100). Areas for elevation: ${deficiencies.join(", ")}. Review the Socratic guidance hints below to refine your solution.`;
  }

  return {
    score: aggregateScore,
    passed,
    feedback,
    rubricBreakdown: {
      invariantAccuracy: invariantScore,
      asymptoticPrecision: asymptoticScore,
      hardwareAwareness: hardwareScore,
    },
    socraticHints,
    counterExamples,
  };
}

/**
 * Helper to extract salient keywords from reference invariants.
 */
function extractKeywords(text?: string): string[] {
  if (!text || typeof text !== "string") return [];

  const stopWords = new Set([
    "the",
    "and",
    "that",
    "this",
    "with",
    "from",
    "for",
    "are",
    "which",
    "each",
    "every",
    "will",
    "have",
    "been",
    "where",
    "into",
    "then",
    "when",
    "both",
    "such",
    "than",
  ]);

  return text
    .replace(/[^\w\s$\\_]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()))
    .slice(0, 10);
}

/**
 * Generates progressive 3-tier Socratic hints guiding the student toward the full invariant.
 */
function generateProgressiveHints(
  _topicId: string,
  _answerLower: string,
  invScore: number,
  asympScore: number,
  hardScore: number,
): string[] {
  const hints: string[] = [];

  // Tier 1: Intuition
  if (invScore < 70) {
    hints.push(
      "Tier 1 (Geometric Intuition): Consider what property remains strictly invariant across state transitions. Does the objective function monotonically decrease, or is an orthogonal projection preserved?",
    );
  } else {
    hints.push(
      "Tier 1 (Verification): Your mathematical formulation is sound. Verify if all boundary constraints are satisfied under extreme values.",
    );
  }

  // Tier 2: Mathematical / Algorithmic
  if (asympScore < 70) {
    hints.push(
      "Tier 2 (Asymptotic Structure): Formulate your recurrence relation using explicit big-O bounds. Analyze both best-case pruning and worst-case recursion tree depth.",
    );
  } else {
    hints.push(
      "Tier 2 (Algebraic Mechanics): Ensure your linear system or matrix decomposition exploits symmetry (e.g. Cholesky factorization of positive definite Gram matrices).",
    );
  }

  // Tier 3: Microarchitectural
  if (hardScore < 70) {
    hints.push(
      "Tier 3 (Silicon Reality): How does spatial memory access affect cache line utilization (64B cache lines vs DRAM bank conflicts)? Could intermediate tensor allocations cause OOM or warp serialization?",
    );
  } else {
    hints.push(
      "Tier 3 (Hardware Roofline): Consider arithmetic intensity (FLOPs/Byte). Is your algorithm compute-bound (GEMM) or memory-bandwidth bound (elementwise kernels)?",
    );
  }

  return hints;
}

/**
 * Extracts or generates topic-specific counter-examples and stress scenarios.
 */
function generateCounterExamples(topicId: string, _answerLower: string): string[] {
  const suite = getQuestionBankSuite(topicId);
  const examples: string[] = [];

  if (suite && suite.partD_stressTests && suite.partD_stressTests.length > 0) {
    for (const test of suite.partD_stressTests) {
      if (test.scenario) {
        examples.push(`Stress Case: ${test.title} — ${test.scenario}`);
      }
    }
  }

  if (examples.length === 0) {
    examples.push(
      "Degenerate Topology: Skewed input data causing worst-case tree height or ill-conditioned covariance matrices (condition number kappa > 10^8).",
    );
    examples.push(
      "Memory Wall Failure: Large batch inputs where intermediate tensor buffers exceed available L1/SRAM cache capacity.",
    );
  }

  return examples.slice(0, 3);
}
