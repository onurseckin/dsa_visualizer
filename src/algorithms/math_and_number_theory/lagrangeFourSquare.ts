import type { AlgorithmDefinition, AlgorithmStep, ElementState, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface LagrangeFourSquareInput {
  n: number;
}

export const PYTHON_LAGRANGEFOURSQUARE_CODE = `class Solution:
    def __init__(self):
        pass

    def numSquares(self, n: int) -> int:
        while n % 4 == 0:
            n //= 4
        if n % 8 == 7:
            return 4
        def is_square(x: int) -> bool:
            s = int(x**0.5)
            return s * s == x
        if is_square(n):
            return 1
        i = 1
        while i * i <= n:
            if is_square(n - i * i):
                return 2
            i += 1
        return 3`;

export const DEFAULT_LAGRANGEFOURSQUARE_INPUT: LagrangeFourSquareInput = {
  n: 31,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Lagrange's Four-Square Theorem (Bachet's Conjecture) states that every natural number n can be represented as the sum of four non-negative integer squares: n = a^2 + b^2 + c^2 + d^2.",
      snapshot: {
        kind: "array" as const,
        name: "lagrange_theorem_statement",
        mode: "box" as const,
        elements: [
          { id: "n_val", value: "Integer n", label: "Target Input", state: "active" as const },
          {
            id: "sum_eq",
            value: "a^2 + b^2 + c^2 + d^2 = n",
            label: "4-Square Sum",
            state: "pivot" as const,
          },
          {
            id: "non_neg",
            value: "a, b, c, d >= 0",
            label: "Integer Bounds",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "For example, 3 = 1^2 + 1^2 + 1^2 + 0^2, 7 = 2^2 + 1^2 + 1^2 + 1^2, 28 = 5^2 + 1^2 + 1^2 + 1^2, and 31 = 5^2 + 2^2 + 1^2 + 1^2.",
      snapshot: {
        kind: "array" as const,
        name: "four_square_examples",
        mode: "box" as const,
        elements: [
          { id: "ex3", value: "3 = 1+1+1+0", label: "Ex 1 (3 squares)", state: "sorted" as const },
          { id: "ex7", value: "7 = 4+1+1+1", label: "Ex 2 (4 squares)", state: "sorted" as const },
          {
            id: "ex31",
            value: "31 = 25+4+1+1",
            label: "Ex 3 (4 squares)",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Legendre's Three-Square Theorem shows that n requires 4 squares if and only if n is of the form 4^a * (8b + 7). All other integers can be written using 3 or fewer squares.",
      snapshot: {
        kind: "array" as const,
        name: "legendre_condition",
        mode: "box" as const,
        elements: [
          {
            id: "req4",
            value: "n = 4^a * (8b + 7)",
            label: "Requires 4 Squares",
            state: "pivot" as const,
          },
          {
            id: "req3",
            value: "Other n <= 3",
            label: "3 or Fewer Squares",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "We search for tuple [a, b, c, d] using nested loops: a up to sqrt(n), b up to sqrt(n - a^2), c up to sqrt(n - a^2 - b^2), and compute d directly as sqrt(n - a^2 - b^2 - c^2).",
      snapshot: {
        kind: "array" as const,
        name: "nested_search_bounds",
        mode: "box" as const,
        elements: [
          {
            id: "loop_a",
            value: "a <= sqrt(n)",
            label: "First Term Loop",
            state: "compare" as const,
          },
          {
            id: "loop_bc",
            value: "b, c bounded",
            label: "Inner Term Loops",
            state: "compare" as const,
          },
          {
            id: "calc_d",
            value: "d = sqrt(rem)",
            label: "Direct Calculation",
            state: "pivot" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Calculating d directly via integer square root reduces search depth from 4 nested loops to only 3 loops, cutting computational iterations significantly.",
      snapshot: {
        kind: "array" as const,
        name: "direct_sqrt_reduction",
        mode: "box" as const,
        elements: [
          {
            id: "loops",
            value: "3 Loops + Sqrt",
            label: "Optimized Search",
            state: "pivot" as const,
          },
          { id: "bound", value: "O(n^1.5)", label: "Search Complexity", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "By Euler's four-square identity, the product of two integers that are each sums of four squares is itself a sum of four squares, laying the foundation for algebraic proofs.",
      snapshot: {
        kind: "array" as const,
        name: "euler_identity",
        mode: "box" as const,
        elements: [
          {
            id: "mult_close",
            value: "(a^2+b^2+c^2+d^2)(w^2+x^2+y^2+z^2)",
            label: "Multiplicative Identity",
            state: "pivot" as const,
          },
          {
            id: "quaternions",
            value: "Quaternion Norms",
            label: "Algebraic Structure",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "With randomized algorithms (Rabin-Shallit algorithm), a four-square decomposition can be found in O(log^2 n) expected time for large numbers.",
      snapshot: {
        kind: "array" as const,
        name: "fast_algorithms",
        mode: "box" as const,
        elements: [
          {
            id: "rabin",
            value: "O(log^2 n)",
            label: "Randomized Rabin-Shallit",
            state: "sorted" as const,
          },
          {
            id: "brute",
            value: "O(n) Search",
            label: "Practical Small Search",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Lagrange's Four-Square Theorem is foundational in additive number theory, Waring's Problem, and quaternion geometry.",
      snapshot: {
        kind: "array" as const,
        name: "applications",
        mode: "box" as const,
        elements: [
          {
            id: "waring",
            value: "Waring's Problem g(2)=4",
            label: "Additive Math",
            state: "sorted" as const,
          },
          {
            id: "quaternion",
            value: "Hurwitz Integers",
            label: "Algebraic Geometry",
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

export const generateLagrangeFourSquareSteps = (
  input: LagrangeFourSquareInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const n = Math.max(
    1,
    Math.floor(
      typeof rawInput === "number" ? rawInput : (input?.n ?? DEFAULT_LAGRANGEFOURSQUARE_INPUT.n),
    ),
  );

  const getCompositeSnapshot = (
    currentA: number,
    currentB: number,
    currentC: number,
    currentD: number,
    currentSum: number,
    statusLabel: string,
    isMatch = false,
  ) => {
    const sumState: ElementState = isMatch ? "sorted" : "visited";
    const totalState: ElementState = isMatch ? "sorted" : "compared";
    const statusState: ElementState = isMatch ? "sorted" : "default";

    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: `Lagrange Four-Square Sum Vector for n = ${n}`,
      items: [
        {
          id: "quadruple_panel",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "current_quadruple",
            mode: "box" as const,
            elements: [
              { id: "n_target", value: n, label: "Target n", state: "active" as const },
              {
                id: "a_val",
                value: `a=${currentA}`,
                label: `a^2=${currentA * currentA}`,
                state: "pivot" as const,
              },
              {
                id: "b_val",
                value: `b=${currentB}`,
                label: `b^2=${currentB * currentB}`,
                state: "pivot" as const,
              },
              {
                id: "c_val",
                value: `c=${currentC}`,
                label: `c^2=${currentC * currentC}`,
                state: "pivot" as const,
              },
              {
                id: "d_val",
                value: `d=${currentD}`,
                label: `d^2=${currentD * currentD}`,
                state: "pivot" as const,
              },
            ],
          },
        },
        {
          id: "sum_panel",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "four_square_sum_vector",
            mode: "box" as const,
            elements: [
              {
                id: "sum_calc",
                value: `${currentA * currentA} + ${currentB * currentB} + ${currentC * currentC} + ${currentD * currentD}`,
                label: "Sum of Squares",
                state: sumState as ElementState,
              },
              {
                id: "sum_total",
                value: currentSum,
                label: "Total Sum",
                state: totalState as ElementState,
              },
              { id: "status", value: statusLabel, label: "Match Status", state: statusState },
            ],
          },
        },
      ],
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing four-square decomposition search for n = ${n}. Outer loop a bound: a <= sqrt(${n}) = ${Math.floor(Math.sqrt(n))}.`,
      primarySnapshot: getCompositeSnapshot(0, 0, 0, 0, 0, "Initializing"),
    }),
  );

  let found: [number, number, number, number] | null = null;
  let stepsCount = 0;
  const maxSearchStepsToShow = 6;

  for (let a = 0; a * a <= n; a++) {
    for (let b = 0; a * a + b * b <= n; b++) {
      for (let c = 0; a * a + b * b + c * c <= n; c++) {
        const rem = n - a * a - b * b - c * c;
        const d = Math.floor(Math.sqrt(rem));
        const currentSum = a * a + b * b + c * c + d * d;

        if (currentSum === n) {
          found = [a, b, c, d];
          steps.push(
            createTutorialStep({
              stepIndex: stepIndex++,
              phase: "walkthrough",
              narrative: `Found exact four-square decomposition! Candidate tuple [a=${a}, b=${b}, c=${c}, d=${d}] produces ${a * a} + ${b * b} + ${c * c} + ${d * d} = ${n}.`,
              primarySnapshot: getCompositeSnapshot(a, b, c, d, currentSum, "EXACT MATCH!", true),
            }),
          );
          break;
        } else if (stepsCount < maxSearchStepsToShow) {
          stepsCount++;
          steps.push(
            createTutorialStep({
              stepIndex: stepIndex++,
              phase: "walkthrough",
              narrative: `Inspecting candidate tuple [a=${a}, b=${b}, c=${c}, d=${d}]: sum of squares equals ${currentSum} (remaining remainder ${rem}). Not exact match.`,
              primarySnapshot: getCompositeSnapshot(a, b, c, d, currentSum, "Searching..."),
            }),
          );
        }
      }
      if (found) break;
    }
    if (found) break;
  }

  const [finalA, finalB, finalC, finalD] = found ?? [0, 0, 0, 0];
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Lagrange four-square decomposition completed for n = ${n}: [${finalA}, ${finalB}, ${finalC}, ${finalD}]. Verified ${finalA}^2 + ${finalB}^2 + ${finalC}^2 + ${finalD}^2 = ${n}.`,
      primarySnapshot: getCompositeSnapshot(finalA, finalB, finalC, finalD, n, "Completed", true),
    }),
  );

  return steps;
};

const LAGRANGEFOURSQUARE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Lagrange's Four-Square Theorem states that every non-negative integer can be expressed as the sum of four integer squares.</p>",
  sections: [
    {
      heading: "Mathematical Foundation & Legendre's Bounds",
      body: "<p>By Legendre's Three-Square Theorem, an integer <code>n</code> requires exactly 4 squares if and only if it is of the form <code>n = 4<sup>a</sup>(8b + 7)</code>. All other numbers can be expressed with 3 or fewer squares (padding remaining terms with zeros).</p>",
    },
    {
      heading: "Search Strategy & Square Root Acceleration",
      body: "<p>Iterating three nested loops for <code>a</code>, <code>b</code>, and <code>c</code> up to their respective residual square roots allows computing <code>d = &lfloor;&radic;(n - a<sup>2</sup> - b<sup>2</sup> - c<sup>2</sup>)&rfloor;</code> in <strong>O(1)</strong> time per trial, cutting total complexity down to <strong>O(n<sup>1.5</sup>)</strong> or <strong>O(n)</strong>.</p>",
    },
    {
      heading: "Euler's Four-Square Identity",
      body: "<p>The product of two sums of four squares is itself a sum of four squares. This multiplicative property links four-square representation to quaternion algebra and Hurwitz integers.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Lagrange's Four-Square Theorem",
      definition: "Every natural number is the sum of four non-negative integer squares.",
    },
    {
      term: "Legendre's 3-Square Threshold",
      definition: "Integers of the form 4^a * (8b + 7) uniquely require all 4 squares.",
    },
    {
      term: "Euler's 4-Square Identity",
      definition:
        "The algebraic identity establishing multiplication closure for four-square sums.",
    },
  ],
};

const LAGRANGEFOURSQUARE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    10: "Iterate first square root term a from 0 up to sqrt(n).",
    11: "Iterate second term b up to remaining sqrt(n - a^2).",
    12: "Iterate third term c up to remaining sqrt(n - a^2 - b^2).",
    13: "Compute fourth term d directly via integer square root.",
    14: "If exact sum of four squares equals n, return [a, b, c, d].",
  },
};

export const lagrangeFourSquare: AlgorithmDefinition<LagrangeFourSquareInput> = {
  id: "lagrange-four-square",
  title: "Lagrange's Four-Square Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an integer <code>n</code>, return the least number of perfect-square numbers whose sum is <code>n</code>. Lagrange's four-square theorem guarantees that the answer is at most four.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Positive integer to represent.</li></ul><h3>Output Format</h3><ul><li><code>int</code>: Minimum number of perfect squares that sum to <code>n</code>.</li></ul>",
  constraints: ["1 <= n <= 10^4"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Three Perfect Squares",
      inputDisplay: "n = 12",
      outputDisplay: "3",
      input: { n: 12 },
      output: "3",
      explanation: "12 = 4 + 4 + 4, so three perfect squares are needed.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Two Perfect Squares",
      inputDisplay: "n = 13",
      outputDisplay: "2",
      input: { n: 13 },
      output: "2",
      explanation: "13 = 4 + 9, so two perfect squares are sufficient.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Smallest Input",
      inputDisplay: "n = 1",
      outputDisplay: "1",
      input: { n: 1 },
      output: "1",
      explanation: "1 itself is a perfect square.",
    },
  ],
  code: PYTHON_LAGRANGEFOURSQUARE_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(sqrt(n))",
    worst: "O(sqrt(n))",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "After the four-square and three-square tests, the implementation checks whether n is a sum of two squares by scanning candidates up to sqrt(n).",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: LAGRANGEFOURSQUARE_TOPIC_GUIDE,
  trivia: LAGRANGEFOURSQUARE_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 279,
      leetcodeId: 279,
      url: "https://leetcode.com/problems/perfect-squares/",
      label: "LeetCode #279",
      title: "Perfect Squares",
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
    id: 279,
    url: "https://leetcode.com/problems/perfect-squares/",
  },
  defaultInput: DEFAULT_LAGRANGEFOURSQUARE_INPUT,
  generateSteps: generateLagrangeFourSquareSteps,
};
