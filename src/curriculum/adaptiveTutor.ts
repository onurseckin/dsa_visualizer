/**
 * Automated Socratic Dialogue Engine & Adaptive Tutor
 *
 * Implements a multi-turn Socratic tutoring state machine that evaluates student responses,
 * detects algorithmic and hardware misconceptions, generates concrete counter-examples,
 * provides scaffolded invariant hints, and produces comprehensive mastery analytics.
 */

import type { QuestionBankSuiteSection } from "./courseTypes";
import { getCourseJourney } from "./catalog";
import {
  evaluateSocraticAnswer,
  getQuestionBankSuite,
  SocraticEvaluationResult,
} from "./socraticEvaluator";

export interface SocraticDiagnosticQuestion {
  readonly title: string;
  readonly prompt: string;
  readonly referenceSolution?: string;
  readonly referenceInvariant?: string;
  readonly expectedAsymptotics?: string;
  readonly expectedHardwareKey?: string;
}

export interface SocraticDialogueTurn {
  readonly turnIndex: number;
  readonly timestamp: number;
  readonly role: "tutor" | "student";
  readonly content: string;
  readonly evaluation?: SocraticEvaluationResult;
  readonly interventionType?:
    | "initial_prompt"
    | "affirmation_and_probing"
    | "counter_example"
    | "scaffolded_hint"
    | "completion_summary";
}

export interface StudentUnderstandingProfile {
  invariantComprehension: number; // 0.0 to 1.0
  asymptoticRigor: number; // 0.0 to 1.0
  hardwareAwareness: number; // 0.0 to 1.0
  overallMastery: number; // 0.0 to 1.0
}

export interface MisconceptionRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly detectedTurn: number;
  readonly concreteCounterExample: string;
  remediated: boolean;
}

export interface SocraticSessionState {
  readonly sessionId: string;
  readonly topicId: string;
  readonly courseTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  turnCount: number;
  isComplete: boolean;
  conversationHistory: SocraticDialogueTurn[];
  studentProfile: StudentUnderstandingProfile;
  identifiedMisconceptions: MisconceptionRecord[];
  masteredConcepts: string[];
  weakAreas: string[];
}

export interface SessionSummaryReport {
  readonly sessionId: string;
  readonly topicId: string;
  readonly courseTitle: string;
  readonly turnsTotal: number;
  readonly overallMasteryScore: number;
  readonly letterGrade: "A+" | "A" | "B" | "C" | "F";
  readonly profile: StudentUnderstandingProfile;
  readonly masteredConcepts: readonly string[];
  readonly identifiedMisconceptions: readonly MisconceptionRecord[];
  readonly remainingWeakAreas: readonly string[];
  readonly recommendedFollowUps: readonly {
    readonly topicId: string;
    readonly title: string;
    readonly rationale: string;
  }[];
}

/**
 * Projects the 4-part question bank suite onto the flat Socratic diagnostic question list.
 * Each part contributes at most its first entry: the dialogue walks one question per part.
 */
export function extractQuestionsFromSuite(
  suite?: QuestionBankSuiteSection,
): readonly SocraticDiagnosticQuestion[] {
  if (!suite) return [];

  const questions: SocraticDiagnosticQuestion[] = [];

  // Part A: DSA Coding
  const qA = suite.partA_dsaCoding?.[0];
  if (qA) {
    questions.push({
      title: `Part A (Algorithmic Invariant): ${qA.title}`,
      prompt: `${qA.description ?? qA.problemStatement ?? qA.title}\n\n**Task:** Formalize the exact inductive invariant and state the optimal asymptotic time and space complexity.`,
      referenceSolution: qA.rationale,
    });
  }

  // Part B: Mathematical Proofs
  const qB = suite.partB_mathProofs?.[0];
  if (qB) {
    questions.push({
      title: `Part B (Mathematical Proof): ${qB.title}`,
      prompt: `${qB.prompt ?? qB.statement ?? qB.title}\n\n**Theorem:** ${qB.proofOutline ?? ""}\n\n**Task:** Provide the first-principles mathematical derivation or induction steps.`,
      referenceInvariant: qB.proofOutline,
    });
  }

  // Part C: Systems Failure Scenarios / Questions
  const qC = suite.partC_systemsQuestions?.[0];
  if (qC) {
    questions.push({
      title: `Part C (Systems & Silicon Realities): ${qC.title}`,
      prompt: `${qC.scenario ?? qC.prompt ?? qC.title}\n\n**Hardware Reality:** ${qC.engineeringContext ?? ""}\n\n**Task:** Explain the microarchitectural bottlenecks (L1/L2 cache line alignment, SRAM limits, branch mispredictions).`,
      expectedHardwareKey: qC.engineeringContext,
    });
  }

  // Part D: Edge-Case Stress Tests
  const qD = suite.partD_stressTests?.[0];
  if (qD) {
    questions.push({
      title: `Part D (Edge-Case Stress Testing): ${qD.title}`,
      prompt: `${qD.scenario ?? qD.title}\n\n**Stress Case:** ${qD.failureMode ?? ""}\n\n**Task:** Identify the failure mode and provide the corrected invariant.`,
      expectedAsymptotics: qD.failureMode,
    });
  }

  return questions;
}

/**
 * Common algorithmic and systems misconceptions with tailored counter-examples.
 */
const KNOWN_MISCONCEPTIONS: readonly {
  id: string;
  name: string;
  pattern: RegExp;
  description: string;
  counterExample: string;
}[] = [
  {
    id: "amortized_vs_worst_case",
    name: "Amortized vs Worst-Case Confusion",
    pattern: /\b(always|guaranteed|every single operation takes)\s+O\(1\)/i,
    description:
      "Asserts that every individual operation takes O(1) time without acknowledging worst-case spikes.",
    counterExample:
      "Consider dynamic array resize or hash table rehashing: operation N+1 takes O(N) time copying elements to new backing store, even though the amortized potential Phi bounds the sequence to O(1) on average.",
  },
  {
    id: "uniform_hash_assumption",
    name: "Uniform Hash Assumption Flaw",
    pattern: /\b(hash table is never|no collisions|perfect distribution)\b/i,
    description:
      "Assumes hash keys distribute uniformly without considering adversarial collision attacks.",
    counterExample:
      "If an adversary generates keys k_1, k_2, ..., k_m where h(k_i) mod M == c, lookup degrades from O(1) to O(M) linear scan unless randomized 2-independent universal hashing is employed.",
  },
  {
    id: "unbounded_sram_tiling",
    name: "Unbounded SRAM Capacity Assumption",
    pattern: /\b(load all tokens|store full matrix in sram|no memory constraint)\b/i,
    description:
      "Overlooks physical SRAM capacity limits (e.g., 228 KB per Streaming Multiprocessor on NVIDIA H100).",
    counterExample:
      "For batch size B=32, heads H=32, context length N=8192, head_dim D=128 in FP16, storing the full attention matrix requires 32 * 32 * 8192 * 8192 * 2 bytes = 137.4 GB — orders of magnitude larger than the 228 KB on-chip SRAM, necessitating FlashAttention block tiling.",
  },
  {
    id: "greedy_exchange_omission",
    name: "Greedy Optimality Assumption Without Proof",
    pattern: /\b(greedy works because we pick the best|always optimal to take min)\b/i,
    description:
      "Assumes greedy heuristics are optimal without establishing the Greedy Choice Property via an exchange argument or Matroid theory.",
    counterExample:
      "In the 0/1 Knapsack problem (Capacity W=50, Items: (wt=10, val=60), (wt=20, val=100), (wt=30, val=120)), picking highest value/weight ratio item yields sub-optimal total value compared to the optimal DP solution.",
  },
  {
    id: "naive_summation_cancellation",
    name: "Catastrophic Cancellation Ignorance",
    pattern: /\b(simple sum is exact|order of addition doesn't matter|associative sum)\b/i,
    description:
      "Assumes standard IEEE 754 floating-point addition is associative and immune to numerical cancellation.",
    counterExample:
      "In IEEE 754 single precision (FP32), computing 10^8 + 1 - 10^8 evaluates to 0.0 due to 24-bit mantissa alignment underflow, whereas Kahan compensated summation preserves the lower-order lost bits.",
  },
];

/**
 * Detects algorithmic and hardware misconceptions in student responses.
 */
export function detectMisconceptions(
  studentAnswer: string,
  turnIndex: number,
): MisconceptionRecord[] {
  const detected: MisconceptionRecord[] = [];

  for (const mis of KNOWN_MISCONCEPTIONS) {
    if (mis.pattern.test(studentAnswer)) {
      detected.push({
        id: mis.id,
        name: mis.name,
        description: mis.description,
        detectedTurn: turnIndex,
        concreteCounterExample: mis.counterExample,
        remediated: false,
      });
    }
  }

  return detected;
}

/**
 * Initializes a new Socratic tutoring session for a given topic ID.
 */
export function createSocraticSession(
  topicId: string,
  customSessionId?: string,
): SocraticSessionState {
  const journey = getCourseJourney(topicId);
  const suite = getQuestionBankSuite(topicId);
  const questions = extractQuestionsFromSuite(suite);

  const sessionId = customSessionId ?? `socratic_${topicId}_${Date.now()}`;
  const courseTitle = journey?.title ?? topicId;
  const totalQuestions = questions.length > 0 ? questions.length : 4;

  const firstQuestion = questions[0];
  const openingPrompt = firstQuestion
    ? `Welcome to the Socratic Diagnostic Laboratory for **${courseTitle}**.\n\n### Part 1: ${firstQuestion.title}\n\n${firstQuestion.prompt}\n\nPlease explain your mental model, the core inductive invariant, and relevant hardware implications.`
    : `Welcome to the Socratic Laboratory for **${courseTitle}**. Please state the primary invariant and asymptotic bounds for this topic.`;

  const initialTurn: SocraticDialogueTurn = {
    turnIndex: 0,
    timestamp: Date.now(),
    role: "tutor",
    content: openingPrompt,
    interventionType: "initial_prompt",
  };

  return {
    sessionId,
    topicId,
    courseTitle,
    currentQuestionIndex: 0,
    totalQuestions,
    turnCount: 1,
    isComplete: false,
    conversationHistory: [initialTurn],
    studentProfile: {
      invariantComprehension: 0.5,
      asymptoticRigor: 0.5,
      hardwareAwareness: 0.5,
      overallMastery: 0.5,
    },
    identifiedMisconceptions: [],
    masteredConcepts: [],
    weakAreas: [],
  };
}

/**
 * Processes a student turn, evaluates their response, detects misconceptions,
 * updates the understanding profile, and generates the tutor's pedagogical response.
 */
export function processStudentTurn(
  session: SocraticSessionState,
  studentAnswer: string,
): { session: SocraticSessionState; tutorResponse: SocraticDialogueTurn } {
  const suite = getQuestionBankSuite(session.topicId);
  const questions = extractQuestionsFromSuite(suite);
  const currentQ = questions[session.currentQuestionIndex];

  // 1. Evaluate student answer against rubric
  const evalResult = evaluateSocraticAnswer({
    topicId: session.topicId,
    questionTitle: currentQ?.title,
    questionPrompt: currentQ?.prompt ?? "",
    referenceSolution: currentQ?.referenceSolution,
    referenceInvariant: currentQ?.referenceInvariant,
    studentAnswer,
    expectedAsymptotics: currentQ?.expectedAsymptotics,
    expectedHardwareKey: currentQ?.expectedHardwareKey,
  });

  const studentTurnIndex = session.turnCount;
  const studentTurn: SocraticDialogueTurn = {
    turnIndex: studentTurnIndex,
    timestamp: Date.now(),
    role: "student",
    content: studentAnswer,
    evaluation: evalResult,
  };

  session.conversationHistory.push(studentTurn);
  session.turnCount++;

  // 2. Detect misconceptions
  const newMisconceptions = detectMisconceptions(studentAnswer, studentTurnIndex);
  for (const m of newMisconceptions) {
    if (!session.identifiedMisconceptions.some((existing) => existing.id === m.id)) {
      session.identifiedMisconceptions.push(m);
    }
  }

  // 3. Update student profile (evalResult.score is 0..100)
  const normScore = evalResult.score / 100;
  const normInv = evalResult.rubricBreakdown.invariantAccuracy / 100;
  const normAsymp = evalResult.rubricBreakdown.asymptoticPrecision / 100;
  const normHw = evalResult.rubricBreakdown.hardwareAwareness / 100;

  const alpha = 0.4;
  session.studentProfile.invariantComprehension =
    session.studentProfile.invariantComprehension * (1 - alpha) + normInv * alpha;
  session.studentProfile.asymptoticRigor =
    session.studentProfile.asymptoticRigor * (1 - alpha) + normAsymp * alpha;
  session.studentProfile.hardwareAwareness =
    session.studentProfile.hardwareAwareness * (1 - alpha) + normHw * alpha;

  session.studentProfile.overallMastery =
    session.studentProfile.invariantComprehension * 0.4 +
    session.studentProfile.asymptoticRigor * 0.3 +
    session.studentProfile.hardwareAwareness * 0.3;

  // 4. Determine next pedagogical intervention
  let tutorContent = "";
  let interventionType: SocraticDialogueTurn["interventionType"] = "scaffolded_hint";

  const isPassing = evalResult.passed || normScore >= 0.6;

  if (newMisconceptions.length > 0 && normScore < 0.8) {
    interventionType = "counter_example";
    const mis = newMisconceptions[0];
    tutorContent = `Careful consideration needed here: your response reflects a principle related to **${mis.name}**.\n\n> **Counter-Example Challenge:**\n> ${mis.concreteCounterExample}\n\nHow would you reformulate your invariant or complexity bound to resolve this counter-example?`;
  } else if (isPassing) {
    const conceptName = currentQ?.title ?? `Checkpoint ${session.currentQuestionIndex + 1}`;
    session.masteredConcepts.push(conceptName);

    // Advance question or complete
    if (session.currentQuestionIndex + 1 < session.totalQuestions) {
      session.currentQuestionIndex++;
      const nextQ = questions[session.currentQuestionIndex];
      interventionType = "affirmation_and_probing";
      tutorContent = `Excellent rigor! You scored **${Math.round(evalResult.score)}%** on this checkpoint.\n\n${evalResult.feedback}\n\n---\n\n### Part ${session.currentQuestionIndex + 1}: ${nextQ?.title}\n\n${nextQ?.prompt}\n\nHow does this build upon our earlier invariant?`;
    } else {
      session.isComplete = true;
      interventionType = "completion_summary";
      tutorContent = `Outstanding achievement! You have completed all **${session.totalQuestions}** Socratic diagnostic parts for **${session.courseTitle}** with an overall mastery score of **${Math.round(session.studentProfile.overallMastery * 100)}%**.\n\n${evalResult.feedback}`;
    }
  } else {
    interventionType = "scaffolded_hint";
    const hint =
      evalResult.socraticHints[0] ??
      "Consider the exact inductive invariant and memory hierarchy behavior.";
    tutorContent = `Good start, but let's sharpen the rigor (Current Score: **${Math.round(evalResult.score)}%**).\n\n${evalResult.feedback}\n\n💡 **Socratic Guidance:** ${hint}\n\nHow does this change your analysis?`;
  }

  const tutorTurn: SocraticDialogueTurn = {
    turnIndex: session.turnCount,
    timestamp: Date.now(),
    role: "tutor",
    content: tutorContent,
    interventionType,
  };

  session.conversationHistory.push(tutorTurn);
  session.turnCount++;

  return {
    session,
    tutorResponse: tutorTurn,
  };
}

/**
 * Produces a comprehensive session summary report and recommended follow-up topics.
 */
export function summarizeSession(session: SocraticSessionState): SessionSummaryReport {
  const score = session.studentProfile.overallMastery;
  let letterGrade: SessionSummaryReport["letterGrade"] = "F";

  if (score >= 0.9) letterGrade = "A+";
  else if (score >= 0.8) letterGrade = "A";
  else if (score >= 0.7) letterGrade = "B";
  else if (score >= 0.6) letterGrade = "C";

  const remainingWeakAreas: string[] = [];
  if (session.studentProfile.invariantComprehension < 0.7) {
    remainingWeakAreas.push("Inductive & Loop Invariant Formalization");
  }
  if (session.studentProfile.asymptoticRigor < 0.7) {
    remainingWeakAreas.push("Asymptotic Bounds & Potential Function Analysis");
  }
  if (session.studentProfile.hardwareAwareness < 0.7) {
    remainingWeakAreas.push("Microarchitectural & Cache-Aware Execution");
  }

  // Recommended follow-ups based on topic track
  const isDsa = session.topicId.startsWith("dsa_");
  const recommendedFollowUps = isDsa
    ? [
        {
          topicId: "dsa_advanced_range_queries",
          title: "Advanced Range Queries & Fenwick Trees",
          rationale: "Solidify dynamic interval maintenance and binary lifting techniques.",
        },
        {
          topicId: "dsa_graph_flows_and_cuts",
          title: "Network Flows & Min-Cut Energy Minimization",
          rationale: "Elevate matroid and residual graph duality comprehension.",
        },
      ]
    : [
        {
          topicId: "ml_flashattention_sram_tiling",
          title: "FlashAttention & SRAM Tiling Mechanics",
          rationale: "Deepen understanding of on-chip memory limits and IO-complexity optimality.",
        },
        {
          topicId: "ml_pagedattention_cow_vllm",
          title: "PagedAttention & KV Cache Memory Virtualization",
          rationale: "Master memory fragmentation eradication and virtual page mapping.",
        },
      ];

  return {
    sessionId: session.sessionId,
    topicId: session.topicId,
    courseTitle: session.courseTitle,
    turnsTotal: session.turnCount,
    overallMasteryScore: Math.round(score * 100) / 100,
    letterGrade,
    profile: { ...session.studentProfile },
    masteredConcepts: [...new Set(session.masteredConcepts)],
    identifiedMisconceptions: [...session.identifiedMisconceptions],
    remainingWeakAreas,
    recommendedFollowUps,
  };
}
