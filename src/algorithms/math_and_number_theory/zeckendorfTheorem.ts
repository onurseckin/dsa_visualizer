import type { AlgorithmDefinition, AlgorithmStep, ElementState, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ZeckendorfTheoremInput {
  k: number;
}

export const PYTHON_ZECKENDORFTHEOREM_CODE = `class Solution:
    def __init__(self):
        pass

    def findMinFibonacciNumbers(self, k: int) -> int:
        fibs = [1, 1]
        while fibs[-1] + fibs[-2] <= k:
            fibs.append(fibs[-1] + fibs[-2])
        count = 0
        for f in reversed(fibs):
            if f <= k:
                k -= f
                count += 1
        return count`;

export const DEFAULT_ZECKENDORFTHEOREM_INPUT: ZeckendorfTheoremInput = {
  k: 100,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Zeckendorf's Theorem states that every positive integer n can be uniquely represented as the sum of one or more non-consecutive Fibonacci numbers.",
      snapshot: {
        kind: "array" as const,
        name: "zeckendorf_theorem_statement",
        mode: "box" as const,
        elements: [
          { id: "n_val", value: "Integer n", label: "Target Input", state: "active" as const },
          { id: "sum_fib", value: "Sum of Fibs", label: "Representation", state: "pivot" as const },
          {
            id: "non_adj",
            value: "Non-consecutive",
            label: "F_i + F_j (j >= i+2)",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "We use the standard Fibonacci sequence starting at [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ...]. Notice we omit F_0=0 and duplicate F_1=1 to guarantee unique representations.",
      snapshot: {
        kind: "array" as const,
        name: "fibonacci_sequence_base",
        mode: "box" as const,
        elements: [
          {
            id: "seq",
            value: "[1, 2, 3, 5, 8, 13, ...]",
            label: "Fib Sequence",
            state: "sorted" as const,
          },
          {
            id: "no_dup",
            value: "Omit F_1=1 duplicate",
            label: "Uniqueness Guard",
            state: "pivot" as const,
          },
        ],
      },
    },
    {
      narrative:
        "The non-consecutive rule mandates that if Fibonacci term F_k is included in the sum, neither F_{k-1} nor F_{k+1} can be selected.",
      snapshot: {
        kind: "array" as const,
        name: "non_consecutive_rule",
        mode: "box" as const,
        elements: [
          { id: "curr", value: "Selected F_k", label: "Included Term", state: "sorted" as const },
          {
            id: "prev",
            value: "Forbidden F_{k-1}",
            label: "Adjacency Rule",
            state: "visited" as const,
          },
          {
            id: "next",
            value: "Forbidden F_{k+1}",
            label: "Adjacency Rule",
            state: "visited" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Zeckendorf representation is constructed greedily: repeatedly subtract the largest Fibonacci number less than or equal to the remaining n.",
      snapshot: {
        kind: "array" as const,
        name: "greedy_choice",
        mode: "box" as const,
        elements: [
          {
            id: "pick",
            value: "Max F <= n",
            label: "Greedy Term Selection",
            state: "pivot" as const,
          },
          { id: "sub", value: "n <- n - F", label: "Subtract Term", state: "compare" as const },
        ],
      },
    },
    {
      narrative:
        "Greedy choice is mathematically optimal because the sum of all smaller non-consecutive Fibonacci numbers up to F_{k-2} is strictly less than F_k.",
      snapshot: {
        kind: "array" as const,
        name: "greedy_proof",
        mode: "box" as const,
        elements: [
          {
            id: "ineq",
            value: "F_k > sum_{i=1}^{k-2} F_i",
            label: "Fib Identity Proof",
            state: "pivot" as const,
          },
          {
            id: "opt",
            value: "Greedy Pick Required",
            label: "Uniqueness Proof",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Fibonacci numbers grow exponentially at rate phi^k where phi = (1 + sqrt(5)) / 2 = 1.618 (the Golden Ratio), so at most O(log n) Fibonacci terms exist up to n.",
      snapshot: {
        kind: "array" as const,
        name: "exponential_growth",
        mode: "box" as const,
        elements: [
          {
            id: "phi",
            value: "Golden Ratio phi",
            label: "1.618 Expansion",
            state: "pivot" as const,
          },
          {
            id: "terms_cnt",
            value: "O(log n) Terms",
            label: "Sequence Length",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Generating Fibonacci terms up to n takes O(log n) time, and greedy selection takes O(log n) time using O(log n) space.",
      snapshot: {
        kind: "array" as const,
        name: "complexity_bounds",
        mode: "box" as const,
        elements: [
          { id: "time", value: "O(log n)", label: "Time Complexity", state: "sorted" as const },
          { id: "space", value: "O(log n)", label: "Auxiliary Space", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "Zeckendorf representation is used in Fibonacci coding (self-synchronizing data compression), Fibonacci Nim game strategies, and Golden Ratio numeral bases.",
      snapshot: {
        kind: "array" as const,
        name: "applications",
        mode: "box" as const,
        elements: [
          {
            id: "fib_code",
            value: "Fibonacci Coding",
            label: "Data Compression",
            state: "sorted" as const,
          },
          {
            id: "fib_nim",
            value: "Fibonacci Nim",
            label: "Combinatorial Games",
            state: "sorted" as const,
          },
        ],
      },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: data.snapshot,
    }),
  );
};

export const generateZeckendorfTheoremSteps = (input: ZeckendorfTheoremInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const k =
    typeof rawInput === "number" ? rawInput : (input?.k ?? DEFAULT_ZECKENDORFTHEOREM_INPUT.k);
  let nVal = Math.max(1, Math.floor(k));
  const origN = nVal;

  const fibs = [1, 2];
  while (fibs[fibs.length - 1] <= nVal) {
    fibs.push(fibs[fibs.length - 1] + fibs[fibs.length - 2]);
  }
  if (fibs[fibs.length - 1] > nVal) {
    fibs.pop();
  }

  const getCompositeSnapshot = (
    currentN: number,
    selectedFibs: number[],
    termStates: Record<number, ElementState>,
    actionLabel: string,
  ) => {
    const resSumState: ElementState = selectedFibs.length > 0 ? "sorted" : "default";

    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: `Zeckendorf Fibonacci Base Expansion for n = ${origN}`,
      items: [
        {
          id: "seq_panel",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "fibonacci_terms_vector",
            mode: "box" as const,
            elements: fibs.map((f) => ({
              id: `fib-${f}`,
              value: f,
              label: `F=${f}`,
              state: termStates[f] ?? "default",
            })),
          },
        },
        {
          id: "result_panel",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "expansion_result",
            mode: "box" as const,
            elements: [
              { id: "rem_n", value: currentN, label: "Remaining n", state: "active" as const },
              {
                id: "res_sum",
                value: selectedFibs.length > 0 ? selectedFibs.join(" + ") : "None",
                label: "Zeckendorf Terms",
                state: resSumState,
              },
              { id: "status", value: actionLabel, label: "Status", state: "compared" as const },
            ],
          },
        },
      ],
    };
  };

  const termStates: Record<number, ElementState> = {};
  fibs.forEach((f) => {
    termStates[f] = "default";
  });

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Generated Fibonacci sequence up to largest term <= ${origN}: [${fibs.join(", ")}]. Starting greedy backward pass.`,
      primarySnapshot: getCompositeSnapshot(nVal, [], termStates, "Sequence Generated"),
    }),
  );

  const res: number[] = [];
  for (let i = fibs.length - 1; i >= 0; i--) {
    const f = fibs[i];
    termStates[f] = "active";

    if (f > nVal) {
      termStates[f] = "visited";
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Inspecting Fibonacci term F = ${f}. Term F = ${f} is greater than remaining n = ${nVal}, so term ${f} is skipped.`,
          primarySnapshot: getCompositeSnapshot(nVal, [...res], termStates, `F=${f} > n (Skipped)`),
        }),
      );
    } else {
      res.push(f);
      nVal -= f;
      termStates[f] = "sorted";
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Greedily selected largest available Fibonacci number F = ${f} <= remaining n. Subtracted ${f}; remaining n is now ${nVal}.`,
          primarySnapshot: getCompositeSnapshot(nVal, [...res], termStates, `F=${f} Selected`),
        }),
      );
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Zeckendorf representation completed for ${origN}: ${origN} = ${res.join(" + ")}. All selected terms are non-consecutive Fibonacci numbers.`,
      primarySnapshot: getCompositeSnapshot(nVal, res, termStates, "Completed"),
    }),
  );

  return steps;
};

const ZECKENDORFTHEOREM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Zeckendorf's Theorem proves that every positive integer can be uniquely represented as a sum of non-consecutive Fibonacci numbers.</p>",
  sections: [
    {
      heading: "Uniqueness & Non-Consecutive Constraint",
      body: "<p>By omitting <code>F<sub>0</sub> = 0</code> and avoiding duplicate <code>F<sub>1</sub> = 1</code>, the standard Fibonacci base <code>[1, 2, 3, 5, 8, 13, ...]</code> guarantees unique representations. The requirement that no two chosen terms are consecutive (<code>F<sub>i</sub> + F<sub>j</sub></code> where <code>j &ge; i + 2</code>) prevents alternative expansions.</p>",
    },
    {
      heading: "Greedy Choice & Fibonacci Bounds",
      body: "<p>The greedy strategy repeatedly selects the largest Fibonacci number <code>F &le; n</code>. This choice is optimal because <code>F<sub>k</sub> > &sum;<sub>i=1</sub><sup>k-2</sup> F<sub>i</sub></code>, making it impossible to represent <code>n</code> without including <code>F<sub>k</sub></code>.</p>",
    },
    {
      heading: "Applications in Data Compression & Game Theory",
      body: "<p>Zeckendorf representation forms the basis of <strong>Fibonacci Coding</strong>, a variable-length universal code where consecutive 1s mark codeword boundaries. It also determines winning strategies in <strong>Fibonacci Nim</strong>.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Zeckendorf Representation",
      definition:
        "The unique representation of an integer as a sum of non-consecutive Fibonacci numbers.",
    },
    {
      term: "Non-Consecutive Property",
      definition:
        "The structural constraint that no two selected Fibonacci terms can be adjacent in the sequence.",
    },
    {
      term: "Fibonacci Coding",
      definition: "A compression encoding using Zeckendorf sums with a terminating double 1 bit.",
    },
  ],
};

const ZECKENDORFTHEOREM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    11: "Initialize Fibonacci sequence starting at [1, 2].",
    12: "Generate Fibonacci terms until exceeding target n.",
    15: "Iterate through Fibonacci terms in reverse (largest to smallest).",
    16: "Greedily select term f if f <= remaining n, and subtract f.",
  },
};

export const zeckendorfTheorem: AlgorithmDefinition<ZeckendorfTheoremInput> = {
  id: "zeckendorf-theorem",
  title: "Zeckendorf's Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an integer <code>k</code>, return the minimum number of Fibonacci numbers whose sum is <code>k</code>. The greedy choice from Zeckendorf's theorem always uses a largest available Fibonacci number.</p><h3>Input Parameters</h3><ul><li><code>k</code>: Positive target integer.</li></ul><h3>Output Format</h3><ul><li><code>int</code>: Minimum count of Fibonacci numbers that sum to <code>k</code>.</li></ul>",
  constraints: ["1 <= k <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Greedy Decomposition",
      inputDisplay: "k = 7",
      outputDisplay: "2",
      input: { k: 7 },
      output: "2",
      explanation: "7 = 5 + 2, so two Fibonacci numbers are sufficient.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Two Greedy Choices",
      inputDisplay: "k = 10",
      outputDisplay: "2",
      input: { k: 10 },
      output: "2",
      explanation: "10 = 8 + 2, which uses two Fibonacci numbers.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Multiple Greedy Choices",
      inputDisplay: "k = 19",
      outputDisplay: "3",
      input: { k: 19 },
      output: "3",
      explanation: "19 = 13 + 5 + 1, so the minimum count is three.",
    },
  ],
  code: PYTHON_ZECKENDORFTHEOREM_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(log n)",
  complexityAnalysis: {
    time: "Generating Fibonacci numbers up to n and performing the greedy selection pass both run in O(log n) time.",
    space: "Requires O(log n) auxiliary space to store the Fibonacci sequence terms.",
  },
  topicGuide: ZECKENDORFTHEOREM_TOPIC_GUIDE,
  trivia: ZECKENDORFTHEOREM_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1414,
      leetcodeId: 1414,
      url: "https://leetcode.com/problems/find-the-minimum-number-of-fibonacci-numbers-whose-sum-is-k/",
      label: "LeetCode #1414",
      title: "Find the Minimum Number of Fibonacci Numbers Whose Sum Is K",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.1 Primes and factors",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 1414,
    url: "https://leetcode.com/problems/find-the-minimum-number-of-fibonacci-numbers-whose-sum-is-k/",
  },
  defaultInput: DEFAULT_ZECKENDORFTHEOREM_INPUT,
  generateSteps: generateZeckendorfTheoremSteps,
};
