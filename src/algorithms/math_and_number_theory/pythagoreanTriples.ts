import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface PythagoreanTriplesInput {
  n: number;
}

export const PYTHON_PYTHAGOREANTRIPLES_CODE = `class Solution:
    def __init__(self):
        pass

    def countTriples(self, n: int) -> int:
        count = 0
        for a in range(1, n + 1):
            for b in range(1, n + 1):
                c2 = a * a + b * b
                c = int(c2**0.5)
                if c <= n and c * c == c2:
                    count += 1
        return count`;

export const DEFAULT_PYTHAGOREANTRIPLES_INPUT: PythagoreanTriplesInput = {
  n: 50,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "A Pythagorean Triple consists of three positive integers (a, b, c) satisfying a^2 + b^2 = c^2, representing the side lengths of a right-angled triangle.",
      snapshot: {
        kind: "array" as const,
        name: "pythagorean_definition",
        mode: "box" as const,
        elements: [
          {
            id: "eq",
            value: "a^2 + b^2 = c^2",
            label: "Pythagorean Equation",
            state: "active" as const,
          },
          { id: "ex", value: "(3, 4, 5)", label: "Famous Example", state: "sorted" as const },
          {
            id: "geom",
            value: "Right Triangle",
            label: "Geometric Meaning",
            state: "pivot" as const,
          },
        ],
      },
    },
    {
      narrative:
        "A triple is Primitive if gcd(a, b, c) = 1. Non-primitive triples are scalar multiples k*(a, b, c) such as (6, 8, 10) = 2*(3, 4, 5).",
      snapshot: {
        kind: "array" as const,
        name: "primitive_vs_composite",
        mode: "box" as const,
        elements: [
          {
            id: "prim",
            value: "gcd(a, b, c) = 1",
            label: "Primitive Triple",
            state: "sorted" as const,
          },
          {
            id: "mult",
            value: "(6, 8, 10) = 2*(3, 4, 5)",
            label: "Non-primitive Multiple",
            state: "visited" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Euclid's Formula generates ALL primitive triples using two parameters m > n > 0: a = m^2 - n^2, b = 2mn, and c = m^2 + n^2.",
      snapshot: {
        kind: "array" as const,
        name: "euclid_formula",
        mode: "box" as const,
        elements: [
          { id: "leg_a", value: "a = m^2 - n^2", label: "Leg a", state: "pivot" as const },
          { id: "leg_b", value: "b = 2mn", label: "Leg b", state: "pivot" as const },
          { id: "hyp_c", value: "c = m^2 + n^2", label: "Hypotenuse c", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "To guarantee that Euclid's formula produces a Primitive triple, parameters m and n must satisfy two conditions: gcd(m, n) = 1 (coprime) and m - n is odd (opposite parity).",
      snapshot: {
        kind: "array" as const,
        name: "primitive_conditions",
        mode: "box" as const,
        elements: [
          {
            id: "coprime",
            value: "gcd(m, n) == 1",
            label: "Coprime Condition",
            state: "compare" as const,
          },
          {
            id: "parity",
            value: "(m - n) % 2 == 1",
            label: "Opposite Parity",
            state: "compare" as const,
          },
        ],
      },
    },
    {
      narrative:
        "With hypotenuse bound c = m^2 + n^2 <= Limit, parameter m is bounded by m*m < Limit (i.e. m <= sqrt(Limit)).",
      snapshot: {
        kind: "array" as const,
        name: "parameter_bounds",
        mode: "box" as const,
        elements: [
          {
            id: "c_bound",
            value: "c <= Limit",
            label: "Hypotenuse Bound",
            state: "pivot" as const,
          },
          {
            id: "m_bound",
            value: "m^2 < Limit",
            label: "Outer Loop Bound",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Algebraic proof: (m^2 - n^2)^2 + (2mn)^2 = m^4 - 2m^2n^2 + n^4 + 4m^2n^2 = m^4 + 2m^2n^2 + n^4 = (m^2 + n^2)^2. Euclid's identity holds universally!",
      snapshot: {
        kind: "array" as const,
        name: "algebraic_identity",
        mode: "box" as const,
        elements: [
          {
            id: "proof",
            value: "Universal Algebraic Identity",
            label: "Identity Proof",
            state: "sorted" as const,
          },
          {
            id: "exact",
            value: "Exact Integer Arithmetic",
            label: "No Floats Needed",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Generating primitive triples up to hypotenuse limit C takes O(sqrt(C)) iterations, vastly superior to O(C^2) brute-force nested search.",
      snapshot: {
        kind: "array" as const,
        name: "time_complexity",
        mode: "box" as const,
        elements: [
          { id: "time", value: "O(sqrt(C))", label: "Time Complexity", state: "sorted" as const },
          {
            id: "space",
            value: "O(Triples Count)",
            label: "Output Space",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Pythagorean triples are widely used in integer trigonometry, Diophantine geometry, graphics rasterization, and Berggren tree generation.",
      snapshot: {
        kind: "array" as const,
        name: "applications",
        mode: "box" as const,
        elements: [
          {
            id: "berggren",
            value: "Berggren Ternary Tree",
            label: "Tree Structure",
            state: "sorted" as const,
          },
          {
            id: "graphics",
            value: "Exact Rotations",
            label: "Computer Graphics",
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

export const generatePythagoreanTriplesSteps = (
  input: PythagoreanTriplesInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const limit = Math.max(
    1,
    Math.floor(
      typeof rawInput === "number" ? rawInput : (input?.n ?? DEFAULT_PYTHAGOREANTRIPLES_INPUT.n),
    ),
  );

  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));

  const getCompositeSnapshot = (
    currentM: number,
    currentN: number,
    statusLabel: string,
    collectedTriples: [number, number, number][],
    currentTriple?: [number, number, number],
  ) => {
    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: `Primitive Pythagorean Triples for limit C <= ${limit}`,
      items: [
        {
          id: "params_panel",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "euclid_parameters",
            mode: "box" as const,
            elements: [
              { id: "lim", value: limit, label: "Hypotenuse Limit", state: "active" as const },
              {
                id: "m_val",
                value: currentM > 0 ? currentM : "-",
                label: "Param m",
                state: "pivot" as const,
              },
              {
                id: "n_val",
                value: currentN > 0 ? currentN : "-",
                label: "Param n",
                state: "pivot" as const,
              },
              {
                id: "status",
                value: statusLabel,
                label: "Euclid Check",
                state: "compare" as const,
              },
            ],
          },
        },
        {
          id: "triples_panel",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "primitive_triples_list",
            mode: "box" as const,
            elements:
              collectedTriples.length > 0
                ? collectedTriples.map((t, idx) => ({
                    id: `t-${idx}`,
                    value: `(${t[0]}, ${t[1]}, ${t[2]})`,
                    label: `Triple ${idx + 1}`,
                    state:
                      currentTriple && t[0] === currentTriple[0] && t[2] === currentTriple[2]
                        ? ("sorted" as const)
                        : ("default" as const),
                  }))
                : [
                    {
                      id: "empty",
                      value: "None",
                      label: "Triples List",
                      state: "default" as const,
                    },
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
      narrative: `Initializing Euclid's formula generator for hypotenuse limit C <= ${limit}. Parameter m loop bound: m*m < ${limit} (m <= ${Math.floor(Math.sqrt(limit))}).`,
      primarySnapshot: getCompositeSnapshot(0, 0, "Initializing", []),
    }),
  );

  const triples: [number, number, number][] = [];

  for (let m = 2; m * m < limit; m++) {
    for (let n = 1; n < m; n++) {
      const isOddParity = (m - n) % 2 === 1;
      const g = gcd(m, n);
      const isCoprime = g === 1;

      if (!isOddParity) {
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Testing parameters m = ${m}, n = ${n}. Parity check failed: m - n = ${m - n} is even (not odd). Pair rejected to avoid non-primitive multiple.`,
            primarySnapshot: getCompositeSnapshot(m, n, "Parity Check Failed", triples),
          }),
        );
      } else if (!isCoprime) {
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Testing parameters m = ${m}, n = ${n}. Coprime check failed: gcd(${m}, ${n}) = ${g} != 1. Pair rejected to avoid non-primitive multiple.`,
            primarySnapshot: getCompositeSnapshot(m, n, `gcd(${m},${n})=${g} Failed`, triples),
          }),
        );
      } else {
        const rawA = m * m - n * n;
        const rawB = 2 * m * n;
        const c = m * m + n * n;

        if (c > limit) {
          steps.push(
            createTutorialStep({
              stepIndex: stepIndex++,
              phase: "walkthrough",
              narrative: `Parameters m = ${m}, n = ${n} satisfy Euclid conditions, but hypotenuse c = ${c} exceeds limit ${limit}. Rejecting candidate.`,
              primarySnapshot: getCompositeSnapshot(m, n, `c=${c} > Limit`, triples),
            }),
          );
        } else {
          const sortedTriple: [number, number, number] = [
            Math.min(rawA, rawB),
            Math.max(rawA, rawB),
            c,
          ];
          triples.push(sortedTriple);
          steps.push(
            createTutorialStep({
              stepIndex: stepIndex++,
              phase: "walkthrough",
              narrative: `Parameters m = ${m}, n = ${n} pass all Euclid conditions! Generated primitive triple: a = ${sortedTriple[0]}, b = ${sortedTriple[1]}, c = ${sortedTriple[2]}.`,
              primarySnapshot: getCompositeSnapshot(m, n, "VALID TRIPLE!", triples, sortedTriple),
            }),
          );
        }
      }
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Primitive Pythagorean triple generation completed for limit C <= ${limit}. Total primitive triples generated: ${triples.length}.`,
      primarySnapshot: getCompositeSnapshot(0, 0, "Completed", triples),
    }),
  );

  return steps;
};

const PYTHAGOREANTRIPLES_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Primitive Pythagorean Triples are integer solutions to a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup> with &gcd;(a, b, c) = 1, generated efficiently via Euclid's formula.</p>",
  sections: [
    {
      heading: "Euclid's Formula & Primitive Conditions",
      body: "<p>For any two integers <code>m > n > 0</code>, Euclid's formula generates <code>a = m<sup>2</sup> - n<sup>2</sup></code>, <code>b = 2mn</code>, and <code>c = m<sup>2</sup> + n<sup>2</sup></code>. The generated triple is Primitive if and only if <code>&gcd;(m, n) = 1</code> and <code>m - n</code> is odd.</p>",
    },
    {
      heading: "Algebraic Proof of Identity",
      body: "<p>Expanding the squares gives <code>(m<sup>2</sup> - n<sup>2</sup>)<sup>2</sup> + (2mn)<sup>2</sup> = m<sup>4</sup> - 2m<sup>2</sup>n<sup>2</sup> + n<sup>4</sup> + 4m<sup>2</sup>n<sup>2</sup> = (m<sup>2</sup> + n<sup>2</sup>)<sup>2</sup></code>. This algebraic identity proves exact integer solutions without floating-point errors.</p>",
    },
    {
      heading: "Complexity & Tree Representations",
      body: "<p>Iterating parameters up to <code>m<sup>2</sup> &le; C</code> runs in <strong>O(&radic;C)</strong> time. Alternatively, Berggren's ternary tree can generate all primitive triples from root <code>(3, 4, 5)</code> using linear matrix transformations.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Primitive Pythagorean Triple",
      definition: "A set of coprime positive integers (a, b, c) satisfying a^2 + b^2 = c^2.",
    },
    {
      term: "Euclid's Formula",
      definition:
        "Parametric equations a = m^2 - n^2, b = 2mn, c = m^2 + n^2 generating all primitive triples.",
    },
    {
      term: "Opposite Parity Condition",
      definition:
        "The constraint that (m - n) must be odd to prevent even common factors in the triple.",
    },
  ],
};

const PYTHAGOREANTRIPLES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    13: "Loop outer parameter m while m^2 + 1 <= limit.",
    14: "Loop inner parameter n from 1 up to m - 1.",
    15: "Verify m - n is odd and gcd(m, n) == 1 to guarantee primitive triple.",
    16: "Compute side lengths a, b, and hypotenuse c using Euclid's formula.",
  },
};

export const pythagoreanTriples: AlgorithmDefinition<PythagoreanTriplesInput> = {
  id: "pythagorean-triples",
  title: "Primitive Pythagorean Triples",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an integer <code>n</code>, count ordered triples <code>(a, b, c)</code> where <code>1 &le; a, b, c &le; n</code> and <code>a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup></code>.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Inclusive side-length bound.</li></ul><h3>Output Format</h3><ul><li><code>int</code>: Number of ordered square-sum triples.</li></ul>",
  constraints: ["1 <= n <= 250"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Smallest Triple",
      inputDisplay: "n = 5",
      outputDisplay: "2",
      input: { n: 5 },
      output: "2",
      explanation: "(3, 4, 5) and (4, 3, 5) are the two ordered triples within the bound.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Two Primitive Families",
      inputDisplay: "n = 10",
      outputDisplay: "4",
      input: { n: 10 },
      output: "4",
      explanation: "The triples from 3-4-5 contribute both orders, and no larger hypotenuse fits.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Larger Bound",
      inputDisplay: "n = 15",
      outputDisplay: "8",
      input: { n: 15 },
      output: "8",
      explanation: "The valid triples include both orders for each eligible Pythagorean triple.",
    },
  ],
  code: PYTHON_PYTHAGOREANTRIPLES_CODE,
  timeComplexity: {
    best: "O(n^2)",
    average: "O(n^2)",
    worst: "O(n^2)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "The reference checks every ordered pair (a, b) and tests whether a matching c is an integer within the bound.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: PYTHAGOREANTRIPLES_TOPIC_GUIDE,
  trivia: PYTHAGOREANTRIPLES_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1925,
      leetcodeId: 1925,
      url: "https://leetcode.com/problems/count-square-sum-triples/",
      label: "LeetCode #1925",
      title: "Count Square Sum Triples",
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
    id: 1925,
    url: "https://leetcode.com/problems/count-square-sum-triples/",
  },
  defaultInput: DEFAULT_PYTHAGOREANTRIPLES_INPUT,
  generateSteps: generatePythagoreanTriplesSteps,
};
