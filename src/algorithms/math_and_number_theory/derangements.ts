import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DerangementsInput {
  n: number;
}

export const PYTHON_DERANGEMENTS_CODE = `class Solution:
    def __init__(self):
        pass

    def findDerangement(self, n: int) -> int:
        if n <= 1:
            return 0
        MOD = 10**9 + 7
        prev2, prev1 = 0, 1
        for i in range(3, n + 1):
            curr = ((i - 1) * (prev1 + prev2)) % MOD
            prev2, prev1 = prev1, curr
        return prev1`;

export const DEFAULT_DERANGEMENTS_INPUT: DerangementsInput = { n: 4 };

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      title: "Derangement Definition",
      narrative:
        "A derangement is a permutation of n items in which no element appears in its original position, denoted as !n or D(n).",
      elements: [
        { id: "d-0", value: 1, label: "D[0]", state: "sorted" as const },
        { id: "d-1", value: 0, label: "D[1]", state: "sorted" as const },
        { id: "d-2", value: 1, label: "D[2]", state: "sorted" as const },
        { id: "d-3", value: 2, label: "D[3]", state: "sorted" as const },
        { id: "d-4", value: 9, label: "D[4]", state: "sorted" as const },
      ],
    },
    {
      title: "Fixed Point Exclusion Rule",
      narrative:
        "For n = 3, permutation (2, 3, 1) is a valid derangement because every element moved, whereas (2, 1, 3) fails because item 3 remains fixed at position 3.",
      elements: [
        { id: "p-1", value: 2, label: "Pos 1", state: "sorted" as const },
        { id: "p-2", value: 3, label: "Pos 2", state: "sorted" as const },
        { id: "p-3", value: 1, label: "Pos 3", state: "sorted" as const },
      ],
    },
    {
      title: "First Element Position Choice",
      narrative:
        "To derive D(n), consider placing item 1. It cannot stay at position 1, leaving n - 1 candidate positions k from 2 to n.",
      elements: [
        { id: "choice-1", value: 1, label: "Item 1", state: "active" as const },
        { id: "choice-k", value: 3, label: "Choices (n-1)", state: "compare" as const },
      ],
    },
    {
      title: "Case 1: Pair Swap Subproblem",
      narrative:
        "If item k is placed in position 1, items 1 and k form a mutual pair swap. The remaining n - 2 items must be deranged in D(n - 2) ways.",
      elements: [
        { id: "c1-swap", value: 2, label: "Swapped Pair", state: "sorted" as const },
        { id: "c1-rem", value: 1, label: "D(n-2) Ways", state: "active" as const },
      ],
    },
    {
      title: "Case 2: Single Redirection Subproblem",
      narrative:
        "If item k does NOT go to position 1, position 1 becomes item k's single forbidden spot, leaving n - 1 items to be deranged in D(n - 1) ways.",
      elements: [
        { id: "c2-redir", value: 1, label: "Forbidden Spot", state: "compare" as const },
        { id: "c2-rem", value: 2, label: "D(n-1) Ways", state: "active" as const },
      ],
    },
    {
      title: "Unified Recurrence Relation",
      narrative:
        "Combining both mutually exclusive cases yields the recurrence identity D(n) = (n - 1) * (D(n - 1) + D(n - 2)) for all n >= 2.",
      elements: [
        { id: "r-n1", value: 3, label: "Choices (n-1)", state: "compare" as const },
        { id: "r-sum", value: 3, label: "D(n-1)+D(n-2)", state: "compare" as const },
        { id: "r-ans", value: 9, label: "Result D(n)", state: "active" as const },
      ],
    },
    {
      title: "Base Case Initialization",
      narrative:
        "Base cases are D(0) = 1 (the empty set has 1 trivial valid configuration) and D(1) = 0 (a single item cannot avoid its original position).",
      elements: [
        { id: "b-0", value: 1, label: "Base D[0]", state: "sorted" as const },
        { id: "b-1", value: 0, label: "Base D[1]", state: "sorted" as const },
      ],
    },
    {
      title: "Dynamic Programming Table Fill",
      narrative:
        "Iteratively evaluating terms from i = 2 up to n populates a 1D DP table bottom-up in O(n) operations.",
      elements: [
        { id: "d-0", value: 1, label: "D[0]", state: "sorted" as const },
        { id: "d-1", value: 0, label: "D[1]", state: "sorted" as const },
        { id: "d-2", value: 1, label: "D[2]", state: "active" as const },
      ],
    },
    {
      title: "Linear Time & Space Bounds",
      narrative:
        "Computing D(n) requires O(n) time and O(n) space, which can be further optimized to O(1) auxiliary space using two scalar state variables.",
      elements: [
        { id: "d-0", value: 1, label: "D[0]", state: "sorted" as const },
        { id: "d-1", value: 0, label: "D[1]", state: "sorted" as const },
        { id: "d-2", value: 1, label: "D[2]", state: "sorted" as const },
        { id: "d-3", value: 2, label: "D[3]", state: "sorted" as const },
        { id: "d-4", value: 9, label: "D[4]", state: "sorted" as const },
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
        name: "derangements_dp",
        mode: "box",
        elements: data.elements,
      },
    }),
  );
};

export const generateDerangementsSteps = (input?: DerangementsInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const safeInput = input ?? DEFAULT_DERANGEMENTS_INPUT;
  const safeN = Number.isFinite(safeInput?.n)
    ? Math.floor(safeInput.n)
    : DEFAULT_DERANGEMENTS_INPUT.n;

  const nVal = Math.min(10, Math.max(0, safeN));

  const D: number[] = new Array(nVal + 1).fill(0);
  D[0] = 1;
  if (nVal >= 1) D[1] = 0;

  const createArraySnapshot = (
    activeIdx: number,
    parent1: number | null = null,
    parent2: number | null = null,
    isDone: boolean = false,
  ) => {
    const elements: ArrayElement[] = [];
    for (let i = 0; i <= nVal; i++) {
      let state: ArrayElement["state"] = "default";
      if (isDone && i === nVal) {
        state = "sorted";
      } else if (i === activeIdx) {
        state = "active";
      } else if (i === parent1 || i === parent2) {
        state = "compare";
      } else if (i < activeIdx) {
        state = "sorted";
      }
      elements.push({
        id: `d-${i}`,
        value: D[i],
        label: `D[${i}]`,
        state,
      });
    }

    return {
      kind: "array" as const,
      name: "derangements_dp",
      mode: "box" as const,
      elements,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize derangements DP array of size ${nVal + 1} with base case D[0] = 1.`,
      primarySnapshot: createArraySnapshot(0),
    }),
  );

  if (nVal >= 1) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Setting base case D[1] = 0 (a single item cannot avoid its original position).`,
        primarySnapshot: createArraySnapshot(1),
      }),
    );
  }

  for (let i = 2; i <= nVal; i++) {
    const choices = i - 1;
    const prevSum = D[i - 1] + D[i - 2];
    D[i] = choices * prevSum;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Computing D[${i}] = (${i} - 1) * (D[${i - 1}] + D[${i - 2}]) = ${choices} * (${D[i - 1]} + ${D[i - 2]}) = ${D[i]}.`,
        primarySnapshot: createArraySnapshot(i, i - 1, i - 2),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Derangements evaluation complete: the total number of derangements !${nVal} for n = ${nVal} is ${D[nVal]}.`,
      primarySnapshot: createArraySnapshot(nVal, null, null, true),
    }),
  );

  return steps;
};

export const DERANGEMENTS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Derangements count permutations of n items where no element appears in its original position. The sequence !n plays a central role in algebraic combinatorics and probability theory.</p>",
  sections: [
    {
      heading: "Recurrence Relation Derivation",
      body: "<p>Consider element 1 in a derangement. It can be placed in any of (n - 1) positions k. If element k moves to position 1, elements 1 and k form a pair swap, leaving D(n - 2) sub-problems. If element k does not move to position 1, position 1 becomes k's forbidden spot, leaving D(n - 1) sub-problems. Thus D(n) = (n - 1) * (D(n - 1) + D(n - 2)).</p>",
    },
    {
      heading: "Asymptotic Ratio to Factorial",
      body: "<p>As n approaches infinity, the ratio of derangements to total permutations !n / n! converges to 1 / e (approximately 0.367879), meaning about 36.8% of random permutations are derangements.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Derangement",
      definition: "A permutation of elements where no element remains in its original position.",
    },
    {
      term: "Fixed Point",
      definition: "An element i in a permutation P such that P(i) = i.",
    },
    {
      term: "Subproblem Redirection",
      definition:
        "The combinatorial technique of treating a designated position as a forbidden target for a displaced item.",
    },
  ],
};

export const DERANGEMENTS_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const derangements: AlgorithmDefinition<DerangementsInput> = {
  id: "derangements",
  title: "Derangements (!n)",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the number of derangements <code>!n</code> for <code>n</code> items, representing the number of permutations where no element appears in its original position.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 0</code>): Number of items.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Number of derangements <code>!n</code>.</li></ul>",
  constraints: ["0 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Derangement !4",
      inputDisplay: "n = 4",
      outputDisplay: "9",
      input: { n: 4 },
      output: "9",
      explanation: "There are 9 valid derangements for 4 items.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Boundary Derangement !0",
      inputDisplay: "n = 0",
      outputDisplay: "1",
      input: { n: 0 },
      output: "1",
      explanation: "Empty set has 1 trivial valid permutation with 0 fixed points.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Larger Derangement !5",
      inputDisplay: "n = 5",
      outputDisplay: "44",
      input: { n: 5 },
      output: "44",
      explanation: "There are 44 valid derangements for 5 items.",
    },
  ],
  code: PYTHON_DERANGEMENTS_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "The time complexity is O(n) because we iterate from 2 to n in a single loop.",
    space: "Requires O(n) space for the DP array.",
  },
  topicGuide: DERANGEMENTS_TOPIC_GUIDE,
  trivia: DERANGEMENTS_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      chapterTitle: "Combinatorics",
      section: "22.3 Inclusion-exclusion principle",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_DERANGEMENTS_INPUT,
  generateSteps: generateDerangementsSteps,
};

export default derangements;
