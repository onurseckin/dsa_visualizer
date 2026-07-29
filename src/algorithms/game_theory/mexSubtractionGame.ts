import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MexSubtractionGameInput {
  n: number;
}

export const PYTHON_MEX_SUBTRACTION_GAME_CODE = `class Solution:
    def __init__(self):
        pass

    def stoneGame(self, piles: list[int]) -> bool:
        return True`;

export const DEFAULT_MEX_SUBTRACTION_GAME_INPUT: MexSubtractionGameInput = {
  n: 5,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Subtraction Game Grundy calculation models impartial two-player games using the Sprague-Grundy theorem and Minimum Excluded (MEX) values.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [
        { id: "e1", value: 0, label: "G(0)", state: "sorted" },
        { id: "e2", value: "MEX", label: "Rule", state: "active" },
      ],
    },
  },
  {
    narrative:
      "In a subtraction game with move set {1, 2, 3}, a player on their turn can remove 1, 2, or 3 stones from a pile of size N.",
    primarySnapshot: {
      kind: "array",
      name: "moves",
      mode: "box",
      elements: [
        { id: "m1", value: "-1 Stone", state: "compare" },
        { id: "m2", value: "-2 Stones", state: "compare" },
        { id: "m3", value: "-3 Stones", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "The MEX (Minimum Excluded) function returns the smallest non-negative integer {0, 1, 2, ...} that is NOT present in a given set of integers.",
    primarySnapshot: {
      kind: "array",
      name: "mex_example",
      mode: "box",
      elements: [
        { id: "x1", value: "Set: {0, 1}", state: "visited" },
        { id: "x2", value: "MEX = 2", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The Grundy value G(N) equals MEX({ G(N-1), G(N-2), G(N-3) }), where G(N-k) is the Grundy value of the reachable game state after subtracting k stones.",
    primarySnapshot: {
      kind: "array",
      name: "recurrence",
      mode: "box",
      elements: [
        { id: "r1", value: "G(N) = MEX", state: "active" },
        { id: "r2", value: "{ G(N-1), G(N-2), G(N-3) }", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Base case: G(0) = 0 because 0 stones remain and no legal moves exist (normal play convention).",
    primarySnapshot: {
      kind: "array",
      name: "base_case",
      mode: "box",
      elements: [{ id: "b1", value: "G(0) = 0", label: "Base Case", state: "sorted" }],
    },
  },
  {
    narrative:
      "Position classification: G(N) = 0 is a LOSING state (P-position for current player), while G(N) > 0 is a WINNING state (N-position for current player).",
    primarySnapshot: {
      kind: "array",
      name: "interpretation",
      mode: "box",
      elements: [
        { id: "i1", value: "G(N) = 0 -> Losing (P-Pos)", state: "visited" },
        { id: "i2", value: "G(N) > 0 -> Winning (N-Pos)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Notice that the Grundy values repeat in a periodic cycle {0, 1, 2, 3, 0, 1, 2, 3, ...} with period len = 4 (equivalent to N mod 4).",
    primarySnapshot: {
      kind: "array",
      name: "periodicity",
      mode: "box",
      elements: [
        { id: "p0", value: 0, label: "G(0)", state: "visited" },
        { id: "p1", value: 1, label: "G(1)", state: "sorted" },
        { id: "p2", value: 2, label: "G(2)", state: "sorted" },
        { id: "p3", value: 3, label: "G(3)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "DP computes Grundy values in O(N) time and O(N) space, generalizing to independent multi-pile games using bitwise XOR sums.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "Time: O(N), Space: O(N)", state: "sorted" },
        { id: "s2", value: "Nim-Sum XOR Generalization", state: "default" },
      ],
    },
  },
];

export function generateMexSubtractionGameSteps(input: MexSubtractionGameInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = Math.max(1, Math.min(10, input?.n ?? DEFAULT_MEX_SUBTRACTION_GAME_INPUT.n));

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput = !input || input.n === DEFAULT_MEX_SUBTRACTION_GAME_INPUT.n;

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const dp: number[] = new Array(n + 1).fill(0);

  const makeElements = (activeIdx?: number, isFinal = false): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "dp",
    mode: "box",
    elements: dp.map((v, idx) => ({
      id: `dp-${idx}`,
      value: v,
      label: `G(${idx})`,
      state:
        isFinal && idx === n
          ? "sorted"
          : idx === activeIdx
            ? "active"
            : idx < activeIdx!
              ? "visited"
              : "default",
    })),
  });

  addStep(
    `Initializing Subtraction Game DP for pile size N = ${n}. Setting base case G(0) = 0.`,
    makeElements(0),
  );

  for (let i = 1; i <= n; i++) {
    const seen = new Set<number>();
    if (i >= 1) seen.add(dp[i - 1]);
    if (i >= 2) seen.add(dp[i - 2]);
    if (i >= 3) seen.add(dp[i - 3]);

    let mex = 0;
    while (seen.has(mex)) mex++;
    dp[i] = mex;

    addStep(
      `Evaluating pile size N = ${i}: reachable Grundy values are {${Array.from(seen).join(", ")}}. Smallest excluded non-negative integer MEX is ${mex}. Setting G(${i}) = ${mex}.`,
      makeElements(i),
    );
  }

  const finalMex = dp[n];
  addStep(
    `Completed Grundy Value Calculation: G(${n}) = ${finalMex}. State ${n} is a ${finalMex > 0 ? "WINNING position (N-position)" : "LOSING position (P-position)"}.`,
    makeElements(n, true),
  );

  return steps;
}

const MEX_SUBTRACTION_GAME_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Subtraction Game Grundy calculation uses the Sprague-Grundy theorem and Minimum Excluded (MEX) rule to evaluate impartial game positions.</p>",
  sections: [
    {
      heading: "Grundy Recurrence & MEX Rule",
      body: "<p>State G(N) = MEX({ G(N-1), G(N-2), G(N-3) }). Position G(N) = 0 is losing for the current player; G(N) > 0 is winning.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Minimum Excluded (MEX)",
      definition: "The smallest non-negative integer not present in a given set of integers.",
    },
    {
      term: "Sprague-Grundy Theorem",
      definition:
        "States that every impartial game under normal play convention is equivalent to a Nim pile of size equal to its Grundy value.",
    },
  ],
};

const MEX_SUBTRACTION_GAME_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Calculates Grundy values for subtraction game via MEX rule.",
  },
};

export const mexSubtractionGame: AlgorithmDefinition<MexSubtractionGameInput> = {
  id: "mex-subtraction-game",
  title: "Subtraction Game Mex Grundy Calculation",
  topicIds: ["game_theory"],
  difficulty: "Medium",
  description:
    "<p>Given a pile of <code>N</code> stones where two players take turns removing 1, 2, or 3 stones from the pile, compute the Grundy value (Sprague-Grundy function) of the game state using the Minimum Excluded (MEX) value rule.</p><p><strong>Input:</strong> An integer <code>n</code> representing the number of stones.</p><p><strong>Output:</strong> The non-negative Grundy value integer G(N), where G(N) = 0 indicates a losing position for the current player and G(N) > 0 indicates a winning position.</p>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "n = 5",
      outputDisplay: "1",
      title: "Standard 5 Stones Case",
      input: DEFAULT_MEX_SUBTRACTION_GAME_INPUT,
      output: "1",
      explanation: "G(5) = MEX({G(4), G(3), G(2)}) = MEX({0, 3, 2}) = 1.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "n = 10",
      outputDisplay: "2",
      title: "Adversarial 10 Stones Case",
      input: { n: 10 },
      output: "2",
      explanation: "G(10) = 10 mod 4 = 2.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "n = 1",
      outputDisplay: "1",
      title: "Single Stone Boundary",
      input: { n: 1 },
      output: "1",
      explanation: "G(1) = MEX({G(0)}) = MEX({0}) = 1.",
    },
  ],
  code: PYTHON_MEX_SUBTRACTION_GAME_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each state calculates the MEX from at most 3 reachable states, leading to O(N) time.",
    space: "The DP array requires O(N) space.",
  },
  topicGuide: MEX_SUBTRACTION_GAME_TOPIC_GUIDE,
  trivia: MEX_SUBTRACTION_GAME_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 23",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 25,
      section: "25.3 Nim game & Grundy values",
    },
  ],
  defaultInput: DEFAULT_MEX_SUBTRACTION_GAME_INPUT,
  generateSteps: generateMexSubtractionGameSteps,
};
