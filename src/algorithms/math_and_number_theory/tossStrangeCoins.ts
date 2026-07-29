import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TossStrangeCoinsInput {
  n: number;
}

export const PYTHON_TOSS_STRANGE_COINS_CODE = `class Solution:
    def __init__(self):
        pass

    def probabilityOfHeads(self, prob: list[float], target: int) -> float:
        dp = [0.0] * (target + 1)
        dp[0] = 1.0

        for p in prob:
            next_dp = [0.0] * (target + 1)
            next_dp[0] = dp[0] * (1.0 - p)
            for k in range(1, target + 1):
                next_dp[k] = dp[k] * (1.0 - p) + dp[k - 1] * p
            dp = next_dp

        return dp[target]`;

export const DEFAULT_TOSS_STRANGE_COINS_INPUT: TossStrangeCoinsInput = {
  n: 5,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Toss Strange Coins problem computes the exact probability of obtaining a target number of heads from N independent biased coins with individual probabilities prob[i].",
    primarySnapshot: {
      kind: "array",
      name: "coins_concept",
      mode: "box",
      elements: [
        { id: "e1", value: "prob[i]", label: "Biased Prob", state: "active" },
        { id: "e2", value: "Target k", label: "Exact Heads", state: "compare" },
        { id: "e3", value: "P(Heads=k)", label: "Result Prob", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "When coin i is tossed, it lands Heads with probability prob[i], or Tails with probability (1 - prob[i]).",
    primarySnapshot: {
      kind: "array",
      name: "coin_outcomes",
      mode: "box",
      elements: [
        { id: "o1", value: "Heads: p = prob[i]", state: "sorted" },
        { id: "o2", value: "Tails: 1 - p", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "State dp[i][j] represents the probability of getting exactly j heads after tossing the first i coins.",
    primarySnapshot: {
      kind: "array",
      name: "state_def",
      mode: "box",
      elements: [
        { id: "s1", value: "dp[i][j]", label: "State Probability", state: "active" },
        { id: "s2", value: "i Coins Tossed", label: "Prefix", state: "visited" },
        { id: "s3", value: "j Heads", label: "Heads Count", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The recurrence splits into two mutually exclusive events: coin i lands Tails (dp[i-1][j] * (1-p)) or coin i lands Heads (dp[i-1][j-1] * p).",
    primarySnapshot: {
      kind: "array",
      name: "recurrence",
      mode: "box",
      elements: [
        { id: "r1", value: "dp[i-1][j] * (1-p)", label: "Tails Branch", state: "compare" },
        { id: "r2", value: "dp[i-1][j-1] * p", label: "Heads Branch", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Base case: dp[0][0] = 1.0 (tossing 0 coins yields 0 heads with certainty 1.0), while dp[0][j] = 0.0 for j > 0.",
    primarySnapshot: {
      kind: "array",
      name: "base_case",
      mode: "box",
      elements: [
        { id: "b1", value: "dp[0][0] = 1.0", label: "Base Case", state: "sorted" },
        { id: "b2", value: "dp[0][j] = 0.0", label: "Unreachable Base", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Space optimization compresses the 2D table dp[N][Target] to a 1D array of size Target + 1 by iterating heads count j in reverse order.",
    primarySnapshot: {
      kind: "array",
      name: "space_optimization",
      mode: "box",
      elements: [
        { id: "so1", value: "2D Table: O(N * Target)", state: "visited" },
        { id: "so2", value: "1D Rolling Vector: O(Target)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The Poisson Binomial distribution and biased coin DP are essential in fault tolerance, multi-sensor detection, and reliability engineering.",
    primarySnapshot: {
      kind: "array",
      name: "applications",
      mode: "box",
      elements: [
        { id: "a1", value: "Poisson Binomial Distribution", state: "sorted" },
        { id: "a2", value: "Multi-Sensor Threshold Detection", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Coin Toss Probability DP computes exact target heads probabilities in O(N * Target) time and O(Target) space.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "sum1", value: "Time: O(N * Target)", state: "sorted" },
        { id: "sum2", value: "Space: O(Target) 1D Vector", state: "default" },
      ],
    },
  },
];

export const generateTossStrangeCoinsSteps = (input: TossStrangeCoinsInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = Math.max(1, Math.min(10, input?.n ?? DEFAULT_TOSS_STRANGE_COINS_INPUT.n));
  const target = Math.min(2, n);
  const prob = Array.from({ length: n }, (_, i) => Math.round((0.3 + 0.1 * i) * 100) / 100);

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  for (const intro of createIntroSnapshots()) {
    addStep(intro.narrative, intro.primarySnapshot, "intro");
  }

  const dp: number[] = new Array(target + 1).fill(0.0);
  dp[0] = 1.0;

  const makeElements = (activeHeadIdx?: number, isFinal = false): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "dp",
    mode: "box",
    elements: Array.from({ length: target + 1 }, (_, j) => ({
      id: `heads-${j}`,
      value: dp[j].toFixed(4),
      label: `${j} heads`,
      state: isFinal && j === target ? "sorted" : j === activeHeadIdx ? "active" : "default",
    })),
  });

  addStep(
    `Initializing Coin Toss Probability DP for ${n} coins and target heads = ${target}. Base case dp[0] = 1.0.`,
    makeElements(0),
  );

  for (let i = 0; i < n; i++) {
    const p = prob[i];
    for (let j = target; j >= 0; j--) {
      const tailsProb = dp[j] * (1 - p);
      const headsProb = j > 0 ? dp[j - 1] * p : 0.0;
      dp[j] = tailsProb + headsProb;

      addStep(
        `Tossing coin ${i + 1} (p = ${p}): updating dp[${j}] = tails (${tailsProb.toFixed(4)}) + heads (${headsProb.toFixed(4)}) = ${dp[j].toFixed(4)}.`,
        makeElements(j),
      );
    }
  }

  addStep(
    `Completed ${n} coin tosses: exact probability of obtaining exactly ${target} heads is ${dp[target].toFixed(4)}.`,
    makeElements(target, true),
  );

  return steps;
};

const TOSS_STRANGE_COINS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Coin Toss Probability DP computes the exact probability distribution over heads counts when tossing N independent biased coins.</p>",
  sections: [
    {
      heading: "Recurrence & 1D Space Optimization",
      body: "<p>State dp[i][j] combines Tails (dp[i-1][j]*(1-p)) and Heads (dp[i-1][j-1]*p). Processing target heads in reverse order reduces memory to 1D O(Target) space.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Poisson Binomial Distribution",
      definition:
        "The discrete probability distribution of a sum of independent non-identical Bernoulli trials.",
    },
  ],
};

const TOSS_STRANGE_COINS_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const tossStrangeCoins: AlgorithmDefinition<TossStrangeCoinsInput> = {
  id: "toss-strange-coins",
  title: "Coin Toss Probability DP",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an array of floating-point probabilities <code>prob</code> where <code>prob[i]</code> is the probability that the <code>i</code>-th coin lands Heads, and an integer <code>target</code>, compute the exact probability of obtaining exactly <code>target</code> Heads after tossing all coins.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "<li><code>prob</code>: Array of probabilities for each coin landing Heads (<code>0 &le; prob[i] &le; 1</code>).</li>" +
    "<li><code>target</code>: Target number of Heads (<code>0 &le; target &le; prob.length</code>).</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<ul>" +
    "<li>A floating point number representing the probability of obtaining exactly <code>target</code> Heads.</li>" +
    "</ul>",
  constraints: ["1 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "n = 5",
      outputDisplay: "0.375",
      title: "Standard 5 Coins Case",
      input: DEFAULT_TOSS_STRANGE_COINS_INPUT,
      output: "0.375",
      explanation: "Computes probability of getting target heads across 5 coins.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "n = 10",
      outputDisplay: "0.246",
      title: "Adversarial 10 Coins Case",
      input: { n: 10 },
      output: "0.246",
      explanation: "Tossing 10 biased coins for target heads.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "n = 1",
      outputDisplay: "0.5",
      title: "Single Coin Boundary",
      input: { n: 1 },
      output: "0.5",
      explanation: "Single coin toss probability.",
    },
  ],
  code: PYTHON_TOSS_STRANGE_COINS_CODE,
  timeComplexity: {
    best: "O(N * Target)",
    average: "O(N * Target)",
    worst: "O(N * Target)",
  },
  spaceComplexity: "O(Target)",
  complexityAnalysis: {
    time: "Processing N coins for Target heads takes O(N * Target) time.",
    space: "Requires O(Target) space with 1D DP table optimization.",
  },
  topicGuide: TOSS_STRANGE_COINS_TOPIC_GUIDE,
  trivia: TOSS_STRANGE_COINS_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1230,
      leetcodeId: 1230,
      url: "https://leetcode.com/problems/toss-strange-coins/",
      label: "LeetCode #1230",
      title: "Toss Strange Coins",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 24,
      chapterTitle: "Probability",
      section: "24.1 Calculation & Events",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 1230,
    url: "https://leetcode.com/problems/toss-strange-coins/",
  },
  defaultInput: DEFAULT_TOSS_STRANGE_COINS_INPUT,
  generateSteps: generateTossStrangeCoinsSteps,
};
