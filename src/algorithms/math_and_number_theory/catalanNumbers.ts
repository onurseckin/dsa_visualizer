import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface CatalanNumbersInput {
  n: number;
}

export const PYTHON_CATALAN_NUMBERS_CODE = `class Solution:
    def __init__(self):
        pass

    def numTrees(self, n: int) -> int:
        dp = [0] * (n + 1)
        dp[0] = dp[1] = 1
        for i in range(2, n + 1):
            for j in range(1, i + 1):
                dp[i] += dp[j - 1] * dp[i - j]
        return dp[n]`;

export const DEFAULT_CATALAN_NUMBERS_INPUT: CatalanNumbersInput = {
  n: 4,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      title: "Catalan Numbers Definition",
      narrative:
        "Catalan numbers C_n form a sequence enumerating balanced parentheses sequences, Dyck grid paths, binary search trees, and convex polygon triangulations.",
      elements: [
        { id: "c-0", value: 1, label: "C[0]", state: "sorted" as const },
        { id: "c-1", value: 1, label: "C[1]", state: "sorted" as const },
        { id: "c-2", value: 2, label: "C[2]", state: "sorted" as const },
        { id: "c-3", value: 5, label: "C[3]", state: "sorted" as const },
        { id: "c-4", value: 14, label: "C[4]", state: "sorted" as const },
      ],
    },
    {
      title: "Balanced Parentheses Topologies",
      narrative:
        "For example, C_3 = 5 counts the 5 distinct valid pairings of 3 pairs of parentheses: ((())), (()()), (())(), ()(()), and ()()().",
      elements: [
        { id: "c-0", value: 1, label: "Empty", state: "sorted" as const },
        { id: "c-1", value: 1, label: "1 Pair", state: "sorted" as const },
        { id: "c-2", value: 2, label: "2 Pairs", state: "sorted" as const },
        { id: "c-3", value: 5, label: "3 Pairs", state: "active" as const },
        { id: "c-4", value: 14, label: "4 Pairs", state: "default" as const },
      ],
    },
    {
      title: "Binary Tree Topologies",
      narrative:
        "The sequence also counts structural binary tree shapes: C_3 = 5 distinct binary search tree topologies can be constructed with 3 nodes.",
      elements: [
        { id: "c-0", value: 1, label: "0 Nodes", state: "sorted" as const },
        { id: "c-1", value: 1, label: "1 Node", state: "sorted" as const },
        { id: "c-2", value: 2, label: "2 Nodes", state: "sorted" as const },
        { id: "c-3", value: 5, label: "3 Nodes", state: "active" as const },
        { id: "c-4", value: 14, label: "4 Nodes", state: "default" as const },
      ],
    },
    {
      title: "Factorial Formula Overflow Risk",
      narrative:
        "The closed-form formula C_n = (1 / (n + 1)) * C(2n, n) requires computing 2n factorials, which suffer from early 64-bit integer overflow.",
      elements: [
        { id: "c-0", value: 1, label: "C[0]", state: "sorted" as const },
        { id: "c-1", value: 1, label: "C[1]", state: "sorted" as const },
        { id: "c-2", value: 2, label: "C[2]", state: "sorted" as const },
        { id: "c-3", value: 5, label: "C[3]", state: "compare" as const },
        { id: "c-4", value: 14, label: "C[4]", state: "compare" as const },
      ],
    },
    {
      title: "Root Partitioning Principle",
      narrative:
        "To build a structure of size i, we fix a root element and partition the remaining i-1 units into a left sub-structure of size j and a right sub-structure of size i-1-j.",
      elements: [
        { id: "c-0", value: 1, label: "Left C[0]", state: "compare" as const },
        { id: "c-1", value: 1, label: "Left C[1]", state: "compare" as const },
        { id: "c-2", value: 2, label: "Right C[2]", state: "compare" as const },
        { id: "c-3", value: 5, label: "Target C[3]", state: "active" as const },
      ],
    },
    {
      title: "Convolution Recurrence Relation",
      narrative:
        "The Catalan sequence satisfies the DP convolution recurrence C_i = sum(C_j * C_{i-1-j}) for j running from 0 to i-1.",
      elements: [
        { id: "c-0", value: 1, label: "C[0]", state: "sorted" as const },
        { id: "c-1", value: 1, label: "C[1]", state: "sorted" as const },
        { id: "c-2", value: 2, label: "C[2]", state: "sorted" as const },
        { id: "c-3", value: 5, label: "C[3]", state: "active" as const },
      ],
    },
    {
      title: "Base Case Initialization",
      narrative:
        "Setting base case C[0] = 1 represents the single empty valid structure, anchoring all future product sums.",
      elements: [
        { id: "c-0", value: 1, label: "Base C[0]", state: "sorted" as const },
        { id: "c-1", value: 0, label: "C[1]", state: "default" as const },
        { id: "c-2", value: 0, label: "C[2]", state: "default" as const },
        { id: "c-3", value: 0, label: "C[3]", state: "default" as const },
      ],
    },
    {
      title: "Dynamic Programming Table Fill",
      narrative:
        "We populate the DP array iteratively from i = 1 up to n, caching sub-problem results to evaluate each C[i] in O(i) additions.",
      elements: [
        { id: "c-0", value: 1, label: "C[0]", state: "sorted" as const },
        { id: "c-1", value: 1, label: "C[1]", state: "sorted" as const },
        { id: "c-2", value: 2, label: "C[2]", state: "active" as const },
        { id: "c-3", value: 0, label: "C[3]", state: "default" as const },
      ],
    },
    {
      title: "Quadratic Time & Linear Space",
      narrative:
        "Evaluating all n entries takes O(n^2) total operations and O(n) space, avoiding factorial overflow while computing exact counts.",
      elements: [
        { id: "c-0", value: 1, label: "C[0]", state: "sorted" as const },
        { id: "c-1", value: 1, label: "C[1]", state: "sorted" as const },
        { id: "c-2", value: 2, label: "C[2]", state: "sorted" as const },
        { id: "c-3", value: 5, label: "C[3]", state: "sorted" as const },
        { id: "c-4", value: 14, label: "C[4]", state: "sorted" as const },
      ],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "array",
        name: "catalan_dp",
        mode: "box",
        elements: data.elements,
      },
    }),
  );
};

export const generateCatalanNumbersSteps = (input?: CatalanNumbersInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const safeInput = input ?? DEFAULT_CATALAN_NUMBERS_INPUT;
  const safeN = Number.isFinite(safeInput?.n)
    ? Math.floor(safeInput.n)
    : DEFAULT_CATALAN_NUMBERS_INPUT.n;

  const nVal = Math.min(8, Math.max(0, safeN));

  const C: number[] = new Array(nVal + 1).fill(0);
  C[0] = 1;

  const createArraySnapshot = (
    activeIdx: number | null,
    j1: number | null = null,
    j2: number | null = null,
    isDone: boolean = false,
  ) => {
    const elements: ArrayElement[] = C.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (isDone && idx === nVal) {
        state = "sorted";
      } else if (idx === activeIdx) {
        state = "active";
      } else if (idx === j1 || idx === j2) {
        state = "compare";
      } else if (idx < (activeIdx ?? (isDone ? nVal + 1 : 0)) && val > 0) {
        state = "sorted";
      }
      return {
        id: `c-${idx}`,
        value: val,
        label: `C[${idx}]`,
        state,
      };
    });

    return {
      kind: "array" as const,
      name: "catalan_dp",
      mode: "box" as const,
      elements,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize Catalan DP array of size ${nVal + 1} with base case C[0] = 1.`,
      primarySnapshot: createArraySnapshot(0),
    }),
  );

  for (let i = 1; i <= nVal; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Computing C[${i}] using convolution sum over previous Catalan values.`,
        primarySnapshot: createArraySnapshot(i),
      }),
    );

    for (let j = 0; j < i; j++) {
      const leftPart = C[j];
      const rightPart = C[i - 1 - j];
      const prod = leftPart * rightPart;
      C[i] += prod;

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Adding product term C[${j}] * C[${i - 1 - j}] = ${leftPart} * ${rightPart} = ${prod} to C[${i}], updating total to ${C[i]}.`,
          primarySnapshot: createArraySnapshot(i, j, i - 1 - j),
        }),
      );
    }

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Completed calculation for C[${i}] = ${C[i]}.`,
        primarySnapshot: createArraySnapshot(i),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Catalan evaluation complete: the ${nVal}-th Catalan number C_${nVal} is ${C[nVal]}.`,
      primarySnapshot: createArraySnapshot(nVal, null, null, true),
    }),
  );

  return steps;
};

export const CATALAN_NUMBERS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Catalan numbers form a sequence of natural numbers that appear in many counting problems in combinatorics, such as counting balanced parentheses strings, Dyck grid paths, binary search trees with n nodes, and polygon triangulations.</p>",
  sections: [
    {
      heading: "Convolution Recurrence Relation",
      body: "<p>The n-th Catalan number obeys the recurrence C_n = sum(C_j * C_{n-1-j}) for j from 0 to n-1, anchored by base case C_0 = 1. Subproblem sizes j and n-1-j correspond to partitioning elements around a root or split point.</p>",
    },
    {
      heading: "Dynamic Programming Execution",
      body: "<p>Instead of direct factorial evaluation C_n = (1 / (n + 1)) * C(2n, n) which risks rapid integer overflow, dynamic programming computes terms iteratively in O(n^2) time and O(n) space.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Catalan Number",
      definition:
        "A combinatorial sequence entry C_n counting valid structural topologies of size n.",
    },
    {
      term: "Dyck Path",
      definition:
        "A grid path from (0,0) to (2n, 0) using up and down steps that never falls below the x-axis.",
    },
    {
      term: "Convolution Recurrence",
      definition:
        "The quadratic recurrence sum_{j=0}^{n-1} C_j * C_{n-1-j} that builds larger structures from pairs of sub-structures.",
    },
  ],
};

export const CATALAN_NUMBERS_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const catalanNumbers: AlgorithmDefinition<CatalanNumbersInput> = {
  id: "catalan-numbers",
  title: "Catalan Numbers",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the <code>n</code>-th Catalan number <code>C_n</code>, which counts the number of distinct balanced parentheses strings of length <code>2n</code> or binary search trees with <code>n</code> nodes.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 0</code>): Index of the Catalan number to compute.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Value of the <code>n</code>-th Catalan number <code>C_n</code>.</li></ul>",
  constraints: ["0 <= n <= 19"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Catalan C_4",
      inputDisplay: "n = 4",
      outputDisplay: "14",
      input: { n: 4 },
      output: "14",
      explanation: "C_4 = 14 counts binary search trees with 4 nodes.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Boundary Catalan C_0",
      inputDisplay: "n = 0",
      outputDisplay: "1",
      input: { n: 0 },
      output: "1",
      explanation: "C_0 = 1 represents the single empty structure.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Larger Catalan C_5",
      inputDisplay: "n = 5",
      outputDisplay: "42",
      input: { n: 5 },
      output: "42",
      explanation: "C_5 = 42 valid balanced parentheses expressions.",
    },
  ],
  code: PYTHON_CATALAN_NUMBERS_CODE,
  timeComplexity: {
    best: "O(n^2)",
    average: "O(n^2)",
    worst: "O(n^2)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Fills a 1D DP table of size n+1 where element i takes i operations, giving O(n^2) time.",
    space: "Requires O(n) space for DP storage.",
  },
  topicGuide: CATALAN_NUMBERS_TOPIC_GUIDE,
  trivia: CATALAN_NUMBERS_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 96,
      leetcodeId: 96,
      url: "https://leetcode.com/problems/unique-binary-search-trees/",
      label: "LeetCode #96",
      title: "Unique Binary Search Trees",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      chapterTitle: "Combinatorics",
      section: "22.2 Catalan numbers",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 96,
    url: "https://leetcode.com/problems/unique-binary-search-trees/",
  },
  defaultInput: DEFAULT_CATALAN_NUMBERS_INPUT,
  generateSteps: generateCatalanNumbersSteps,
};

export default catalanNumbers;
