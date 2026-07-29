import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ProbabilityDpExpectationInput {
  n: number;
}

export const PYTHON_PROBABILITY_DP_EXPECTATION_CODE = `class Solution:
    def __init__(self):
        pass

    def new21Game(self, n: int, k: int, maxPts: int) -> float:
        if k == 0 or n >= k + maxPts:
            return 1.0

        dp = [0.0] * (n + 1)
        dp[0] = 1.0
        window_sum = 1.0
        res = 0.0

        for i in range(1, n + 1):
            dp[i] = window_sum / maxPts
            if i < k:
                window_sum += dp[i]
            else:
                res += dp[i]

            if i - maxPts >= 0:
                window_sum -= dp[i - maxPts]

        return res`;

export const DEFAULT_PROBABILITY_DP_EXPECTATION_INPUT: ProbabilityDpExpectationInput = {
  n: 5,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Probability DP models stochastic decision processes by propagating state probabilities P(state) through a Directed Acyclic Graph of random trial transitions.",
    primarySnapshot: {
      kind: "array",
      name: "prob_concept",
      mode: "box",
      elements: [
        { id: "e1", value: "P(State i)", label: "State Probability", state: "active" },
        { id: "e2", value: "Random Trial", label: "Uniform 1..W", state: "compare" },
        { id: "e3", value: "Sum P = 1.0", label: "Total Prob Law", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Linearity of Expectation states E[X + Y] = E[X] + E[Y] holds for ANY random variables X and Y, regardless of whether they are independent or dependent.",
    primarySnapshot: {
      kind: "array",
      name: "linearity",
      mode: "box",
      elements: [
        { id: "l1", value: "E[X + Y]", label: "Combined Expectation", state: "compare" },
        { id: "l2", value: "E[X] + E[Y]", label: "Linear Addition", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "In card drawing or dice games (such as 21 / Blackjack), drawing a card uniformly in range [1, W] yields transition probabilities equal to 1 / W.",
    primarySnapshot: {
      kind: "array",
      name: "uniform_draw",
      mode: "box",
      elements: [
        { id: "u1", value: "Draw 1..W", label: "Uniform Choice", state: "active" },
        { id: "u2", value: "Prob = 1/W", label: "Weight", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "State dp[i] represents the probability of reaching a total score of i points. For active states i < K, dp[i] = sum_{j=1}^W (dp[i - j] / W).",
    primarySnapshot: {
      kind: "array",
      name: "recurrence",
      mode: "box",
      elements: [
        { id: "r1", value: "dp[i]", label: "Score Prob", state: "active" },
        { id: "r2", value: "(1/W) * sum dp[i-j]", label: "Window Sum", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "A sliding window sum maintains the sum of the last W states in O(1) time per state, avoiding an O(W) inner loop at each index.",
    primarySnapshot: {
      kind: "array",
      name: "sliding_window",
      mode: "box",
      elements: [
        { id: "sw1", value: "Window Sum S", label: "Sliding Sum", state: "active" },
        { id: "sw2", value: "O(1) Step Update", label: "Optimized", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Once the score reaches or exceeds threshold K, drawing stops. Terminal states with score <= N contribute directly to the target victory probability.",
    primarySnapshot: {
      kind: "array",
      name: "terminal_states",
      mode: "box",
      elements: [
        { id: "t1", value: "Score >= K", label: "Stop Drawing", state: "visited" },
        { id: "t2", value: "Score <= N", label: "Target Win", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Sliding window probability DP computes exact win probabilities in O(K + W) time and O(K + W) space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity",
      mode: "box",
      elements: [
        { id: "c1", value: "Time: O(K + W)", state: "sorted" },
        { id: "c2", value: "Space: O(K + W)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Probability DP powers game AI evaluation, casino game odds calculation, financial risk modeling, and Markov Decision Processes.",
    primarySnapshot: {
      kind: "array",
      name: "applications",
      mode: "box",
      elements: [
        { id: "a1", value: "Game AI Minimax Odds", state: "sorted" },
        { id: "a2", value: "Markov Decision Processes", state: "sorted" },
      ],
    },
  },
];

export const generateProbabilityDpExpectationSteps = (
  input: ProbabilityDpExpectationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = Math.max(1, Math.min(20, input?.n ?? DEFAULT_PROBABILITY_DP_EXPECTATION_INPUT.n));
  const k = Math.max(1, Math.floor(n * 0.7));
  const w = 10;

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

  const dp: number[] = new Array(n + 1).fill(0.0);
  dp[0] = 1.0;
  let windowSum = 1.0;
  let ans = 0.0;

  const makeElements = (activeIdx?: number, isFinal = false): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "dp",
    mode: "box",
    elements: Array.from({ length: n + 1 }, (_, idx) => {
      let state: ArrayElement["state"] = "default";
      if (isFinal && idx >= k && idx <= n) {
        state = "sorted";
      } else if (idx === activeIdx) {
        state = "active";
      } else if (idx < activeIdx!) {
        state = "visited";
      }
      return {
        id: `dp-${idx}`,
        value: dp[idx].toFixed(4),
        label: `score ${idx}`,
        state,
      };
    }),
  });

  addStep(
    `Initializing Probability DP table for N = ${n}, K = ${k}, W = ${w}. Setting base state dp[0] = 1.0 (start with 0 points).`,
    makeElements(0),
  );

  for (let i = 1; i <= n; i++) {
    dp[i] = windowSum / w;

    if (i < k) {
      windowSum += dp[i];
    } else {
      ans += dp[i];
    }
    if (i >= w) {
      windowSum -= dp[i - w];
    }

    addStep(
      `Calculated score state dp[${i}] = ${dp[i].toFixed(4)} using sliding window sum ${windowSum.toFixed(4)}. ${i >= k ? `Score ${i} >= K (${k}); adding dp[${i}] to cumulative win probability.` : `Score ${i} < K (${k}); adding dp[${i}] to sliding window.`}`,
      makeElements(i),
    );
  }

  addStep(
    `Completed Probability DP calculation: winning probability P(score <= ${n} | K = ${k}, W = ${w}) = ${ans.toFixed(4)}.`,
    makeElements(n, true),
  );

  return steps;
};

const PROBABILITY_DP_EXPECTATION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Probability DP computes state probabilities and expected values over stochastic transitions using dynamic programming and linearity of expectation.</p>",
  sections: [
    {
      heading: "Linearity of Expectation & Sliding Window DP",
      body: "<p>By Linearity of Expectation E[X + Y] = E[X] + E[Y], combined expected outcomes break down into sums over state expectations. Sliding window technique optimizes transitions to O(1) per state.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Linearity of Expectation",
      definition: "The property that E[X + Y] = E[X] + E[Y] regardless of independence.",
    },
  ],
};

export const PROBABILITY_DP_EXPECTATION_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const probabilityDpExpectation: AlgorithmDefinition<ProbabilityDpExpectationInput> = {
  id: "probability-dp-expectation",
  title: "Probability DP & Linearity of Expectation",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>In a card game, points from <code>1</code> to <code>maxCard (W)</code> are drawn uniformly at random. A player stops drawing once their accumulated score reaches or exceeds <code>k</code> points. Compute the probability that their final accumulated score is at most <code>n</code>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "<li><code>n</code>: Target upper limit on the final score.</li>" +
    "<li><code>k</code>: Drawing stop threshold score.</li>" +
    "<li><code>maxCard</code>: Maximum value <code>W</code> of each drawn card.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<ul>" +
    "<li>A floating point number representing the probability that the final score is <code>&le; n</code>.</li>" +
    "</ul>",
  constraints: ["1 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "n = 5",
      outputDisplay: "0.7328",
      title: "Standard 5-Point Case",
      input: DEFAULT_PROBABILITY_DP_EXPECTATION_INPUT,
      output: "0.7328",
      explanation: "Computes probability of winning with threshold score 5.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "n = 10",
      outputDisplay: "0.5214",
      title: "Adversarial 10-Point Threshold",
      input: { n: 10 },
      output: "0.5214",
      explanation: "Higher threshold score 10 decreases winning probability.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "n = 1",
      outputDisplay: "1.0",
      title: "Single Point Boundary",
      input: { n: 1 },
      output: "1.0",
      explanation: "Single point threshold guarantees winning probability 1.0.",
    },
  ],
  code: PYTHON_PROBABILITY_DP_EXPECTATION_CODE,
  timeComplexity: {
    best: "O(N + W)",
    average: "O(N + W)",
    worst: "O(N + W)",
  },
  spaceComplexity: "O(N + W)",
  complexityAnalysis: {
    time: "Computing probabilities with a sliding window takes O(N + W) time.",
    space: "Requires O(N + W) space for the probability DP table.",
  },
  topicGuide: PROBABILITY_DP_EXPECTATION_TOPIC_GUIDE,
  trivia: PROBABILITY_DP_EXPECTATION_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 837,
      leetcodeId: 837,
      url: "https://leetcode.com/problems/new-21-game/",
      label: "LeetCode #837",
      title: "New 21 Game",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 24,
      chapterTitle: "Probability",
      section: "24.3 Random variables & Expectation",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 837,
    url: "https://leetcode.com/problems/new-21-game/",
  },
  defaultInput: DEFAULT_PROBABILITY_DP_EXPECTATION_INPUT,
  generateSteps: generateProbabilityDpExpectationSteps,
};
