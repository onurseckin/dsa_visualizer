import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphEdgeItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DivisorFunctionsInput {
  num: number;
}

export const PYTHON_DIVISORFUNCTIONS_CODE = `class Solution:
    def __init__(self):
        pass

    def checkPerfectNumber(self, num: int) -> bool:
        if num <= 1:
            return False
        total = 1
        d = 2
        while d * d <= num:
            if num % d == 0:
                total += d
                if d * d != num:
                    total += num // d
            d += 1
        return total == num`;

export const DEFAULT_DIVISORFUNCTIONS_INPUT: DivisorFunctionsInput = {
  num: 28,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Divisor functions sigma_k(n) sum the k-th powers of all positive divisors of n. When k = 1, sigma_1(n) represents the sum of all divisors of n.",
      nodes: [
        { id: "1", label: "1", state: "sorted" as const, x: 150, y: 300 },
        { id: "28", label: "28", state: "active" as const, x: 150, y: 50 },
      ],
      edges: [{ from: "1", to: "28", state: "default" as const }],
    },
    {
      narrative:
        "The proper divisor sum s(n) = sigma_1(n) - n excludes n itself. An integer n is Perfect if s(n) == n, such as 6 (1+2+3 = 6) and 28 (1+2+4+7+14 = 28).",
      nodes: [
        { id: "1", label: "1", state: "sorted" as const, x: 150, y: 300 },
        { id: "2", label: "2", state: "sorted" as const, x: 90, y: 220 },
        { id: "7", label: "7", state: "sorted" as const, x: 210, y: 220 },
        { id: "4", label: "4", state: "sorted" as const, x: 90, y: 140 },
        { id: "14", label: "14", state: "sorted" as const, x: 210, y: 140 },
        { id: "28", label: "28 (Perfect)", state: "active" as const, x: 150, y: 50 },
      ],
      edges: [
        { from: "1", to: "2", state: "selected" as const },
        { from: "1", to: "7", state: "selected" as const },
        { from: "2", to: "4", state: "selected" as const },
        { from: "2", to: "14", state: "selected" as const },
        { from: "7", to: "14", state: "selected" as const },
        { from: "4", to: "28", state: "selected" as const },
        { from: "14", to: "28", state: "selected" as const },
      ],
    },
    {
      narrative:
        "Testing candidate divisors sequentially from 1 to n requires O(n) steps, which is too slow for large integers.",
      nodes: [
        { id: "1", label: "1", state: "visited" as const, x: 100, y: 250 },
        { id: "2", label: "2", state: "visited" as const, x: 200, y: 250 },
        { id: "n", label: "Scan 1..n", state: "active" as const, x: 150, y: 100 },
      ],
      edges: [],
    },
    {
      narrative:
        "Divisors always occur in paired factor tuples (d, n / d). If d divides n, then partner quotient n / d also divides n.",
      nodes: [
        { id: "d", label: "d = 2", state: "active" as const, x: 100, y: 200 },
        { id: "partner", label: "n / d = 14", state: "compared" as const, x: 200, y: 200 },
      ],
      edges: [{ from: "d", to: "partner", state: "candidate" as const }],
    },
    {
      narrative:
        "Because factor pairs mirror at sqrt(n), candidate divisors d only need to be tested up to sqrt(n). If d divides n, we add both d and n / d.",
      nodes: [
        { id: "sqrt", label: "d <= sqrt(n)", state: "active" as const, x: 150, y: 150 },
        { id: "pair", label: "Add (d + n/d)", state: "sorted" as const, x: 150, y: 250 },
      ],
      edges: [{ from: "sqrt", to: "pair", state: "selected" as const }],
    },
    {
      narrative:
        "When d * d == n (a perfect square), factor d and partner n / d are identical, so d is added only once to prevent double counting.",
      nodes: [
        { id: "sq", label: "d^2 == n (Square)", state: "active" as const, x: 150, y: 150 },
        { id: "once", label: "Deduplicate (Add 1x)", state: "sorted" as const, x: 150, y: 250 },
      ],
      edges: [{ from: "sq", to: "once", state: "selected" as const }],
    },
    {
      narrative:
        "The divisibility relations form a Divisor Lattice graph (Hasse Diagram) where directed edges point from prime factors upward to their multiples.",
      nodes: [
        { id: "1", label: "1", state: "sorted" as const, x: 150, y: 300 },
        { id: "2", label: "2", state: "active" as const, x: 90, y: 200 },
        { id: "7", label: "7", state: "active" as const, x: 210, y: 200 },
        { id: "14", label: "14", state: "compared" as const, x: 150, y: 100 },
      ],
      edges: [
        { from: "1", to: "2", state: "selected" as const },
        { from: "1", to: "7", state: "selected" as const },
        { from: "2", to: "14", state: "selected" as const },
        { from: "7", to: "14", state: "selected" as const },
      ],
    },
    {
      narrative:
        "Proper divisor sum s(n) classifies n into three categories: Deficient if s(n) < n, Perfect if s(n) == n, and Abundant if s(n) > n.",
      nodes: [
        { id: "def", label: "s(n) < n (Deficient)", state: "visited" as const, x: 60, y: 150 },
        { id: "perf", label: "s(n) == n (Perfect)", state: "sorted" as const, x: 150, y: 150 },
        { id: "abund", label: "s(n) > n (Abundant)", state: "active" as const, x: 240, y: 150 },
      ],
      edges: [],
    },
    {
      narrative:
        "Euler proved that every even perfect number has the form 2^(p-1) * (2^p - 1) where 2^p - 1 is a Mersenne prime.",
      nodes: [
        { id: "euler", label: "2^(p-1)*(2^p - 1)", state: "sorted" as const, x: 150, y: 150 },
        { id: "mersenne", label: "Mersenne Prime", state: "active" as const, x: 150, y: 250 },
      ],
      edges: [{ from: "euler", to: "mersenne", state: "selected" as const }],
    },
    {
      narrative:
        "Trial division up to sqrt(n) evaluates proper divisor sum s(n) in O(sqrt(n)) time complexity and O(1) auxiliary space.",
      nodes: [
        { id: "time", label: "O(sqrt(N)) Time", state: "sorted" as const, x: 100, y: 200 },
        { id: "space", label: "O(1) Space", state: "sorted" as const, x: 200, y: 200 },
      ],
      edges: [],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "graph",
        name: "divisor_lattice_graph",
        directed: true,
        nodes: data.nodes,
        edges: data.edges,
      },
    }),
  );
};

export const generateDivisorFunctionsSteps = (input: DivisorFunctionsInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const rawN =
    typeof rawInput === "number"
      ? rawInput
      : typeof input?.num === "number" && !isNaN(input.num)
        ? input.num
        : DEFAULT_DIVISORFUNCTIONS_INPUT.num;
  const n = Math.max(1, Math.floor(rawN));

  if (n <= 1) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `For n = ${n}, there are no proper divisors (1 has no positive integer divisors smaller than itself), so proper divisor sum s(1) = 0.`,
        primarySnapshot: {
          kind: "graph",
          name: "divisor_lattice_graph",
          directed: true,
          nodes: [{ id: "1", label: "n = 1 (s(1) = 0)", state: "visited", x: 150, y: 150 }],
          edges: [],
        },
      }),
    );
    return steps;
  }

  let totalSum = 1;
  const properDivisors: number[] = [1];

  const buildGraphSnapshot = (
    activeDivs: number[],
    highlightVal?: number,
    isFinished: boolean = false,
  ) => {
    const nodes: GraphNodeItem[] = activeDivs.map((val, idx) => {
      const isTop = val === n;
      const x = 50 + (idx % 4) * 70;
      const y = isTop ? 40 : 260 - Math.floor(idx / 4) * 60;

      let state: GraphNodeItem["state"] = "default";
      if (isFinished) {
        state = totalSum === n ? "sorted" : "visited";
      } else if (val === highlightVal) {
        state = "active";
      } else {
        state = "sorted";
      }

      return {
        id: `${val}`,
        label: `${val}`,
        state,
        x,
        y,
      };
    });

    const edges: GraphEdgeItem[] = [];
    for (let i = 0; i < activeDivs.length; i++) {
      for (let j = i + 1; j < activeDivs.length; j++) {
        const u = activeDivs[i];
        const v = activeDivs[j];
        if (v % u === 0) {
          let isDirect = true;
          for (let k = 0; k < activeDivs.length; k++) {
            const w = activeDivs[k];
            if (w !== u && w !== v && w % u === 0 && v % w === 0) {
              isDirect = false;
              break;
            }
          }
          if (isDirect) {
            edges.push({
              from: `${u}`,
              to: `${v}`,
              state: isFinished ? "selected" : "default",
            });
          }
        }
      }
    }

    return {
      kind: "graph" as const,
      name: "divisor_lattice_graph",
      directed: true,
      nodes,
      edges,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize proper divisor calculation for n = ${n}. Proper divisor 1 is automatically added to our divisor set with running sum s(${n}) = 1.`,
      primarySnapshot: buildGraphSnapshot([1], 1),
    }),
  );

  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) {
      properDivisors.push(d);
      totalSum += d;
      const partner = Math.floor(n / d);

      if (partner !== d) {
        properDivisors.push(partner);
        totalSum += partner;
      }

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Found factor pair d = ${d}${partner !== d ? ` and partner ${partner}` : ""}. Adding into divisor lattice, updating running proper divisor sum s(${n}) to ${totalSum}.`,
          primarySnapshot: buildGraphSnapshot([...properDivisors], d),
        }),
      );
    }
  }

  const allDivisors = [...properDivisors, n].sort((a, b) => a - b);
  const isPerfect = totalSum === n;
  const classification = isPerfect ? "PERFECT" : totalSum > n ? "ABUNDANT" : "DEFICIENT";

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Proper divisor sum calculation for n = ${n} is complete: s(${n}) = ${totalSum}. Since s(${n}) ${isPerfect ? "==" : totalSum > n ? ">" : "<"} ${n}, integer n = ${n} is classified as ${classification}!`,
      primarySnapshot: buildGraphSnapshot(allDivisors, undefined, true),
    }),
  );

  return steps;
};

export const DIVISORFUNCTIONS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Divisor functions &sigma;<sub>k</sub>(n) calculate the sum of k-th powers of all positive divisors of n. The proper divisor sum s(n) = &sigma;<sub>1</sub>(n) - n determines whether n is Perfect, Deficient, or Abundant.</p>",
  sections: [
    {
      heading: "Divisor Function Definition",
      body: "<p>&sigma;<sub>k</sub>(n) = &sum;<sub>d | n</sub> d<sup>k</sup>. When k = 0, &sigma;<sub>0</sub>(n) counts the number of divisors. When k = 1, &sigma;<sub>1</sub>(n) sums all positive divisors of n.</p>",
    },
    {
      heading: "Proper Divisors & Classification",
      body: "<p>The proper divisors of n are all positive divisors strictly less than n. Integer n is Perfect if s(n) = n, Deficient if s(n) < n, and Abundant if s(n) > n.</p>",
    },
    {
      heading: "Square Root Factor Pairing",
      body: "<p>Divisors occur in paired tuples (d, n/d). Checking candidate divisors up to &radic;n guarantees finding all factor pairs in O(&radic;n) operations.</p>",
    },
    {
      heading: "Divisor Lattice Topology",
      body: "<p>The partial ordering of divisors under divisibility forms a distributive lattice (Hasse Diagram) where directed edges link prime powers to their multiples.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Divisor Function",
      definition: "Arithmetic function summing k-th powers of positive divisors of n.",
    },
    {
      term: "Proper Divisors",
      definition: "All positive divisors of n excluding n itself.",
    },
    {
      term: "Perfect Number",
      definition: "A positive integer equal to the sum of its proper divisors, s(n) = n.",
    },
    {
      term: "Factor Pair",
      definition: "A tuple (d, n/d) where both d and n/d divide n.",
    },
    {
      term: "Divisor Lattice",
      definition: "Graph representing the partial ordering of divisors linked by divisibility.",
    },
  ],
};

export const DIVISORFUNCTIONS_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const divisorFunctions: AlgorithmDefinition<DivisorFunctionsInput> = {
  id: "divisor-functions",
  title: "Divisor Functions & Perfect Numbers",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an integer <code>num</code>, determine whether it is a perfect number: a positive integer equal to the sum of its positive divisors excluding itself.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>num</code> (<code>num &ge; 1</code>): Integer to classify using its proper divisors.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>boolean</code>: <code>true</code> when <code>num</code> is perfect; otherwise <code>false</code>.</li></ul>",
  constraints: ["1 <= num <= 10^8"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Perfect Number (num = 28)",
      inputDisplay: "num = 28",
      outputDisplay: "true",
      input: { num: 28 },
      output: "true",
      explanation: "The proper divisors 1, 2, 4, 7, and 14 sum to 28, so 28 is perfect.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Non-perfect Number (num = 7)",
      inputDisplay: "num = 7",
      outputDisplay: "false",
      input: { num: 7 },
      output: "false",
      explanation: "The only proper divisor of 7 is 1, so its proper-divisor sum is not 7.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Second Perfect Number (num = 6)",
      inputDisplay: "num = 6",
      outputDisplay: "true",
      input: { num: 6 },
      output: "true",
      explanation: "The proper divisors 1, 2, and 3 sum to 6, so 6 is perfect.",
    },
  ],
  code: PYTHON_DIVISORFUNCTIONS_CODE,
  timeComplexity: {
    best: "O(sqrt(N))",
    average: "O(sqrt(N))",
    worst: "O(sqrt(N))",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Trial division scans candidate divisors up to sqrt(n), taking O(sqrt(n)) operations.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: DIVISORFUNCTIONS_TOPIC_GUIDE,
  trivia: DIVISORFUNCTIONS_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 507,
      leetcodeId: 507,
      url: "https://leetcode.com/problems/perfect-number/",
      label: "LeetCode #507",
      title: "Perfect Number",
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
    id: 507,
    url: "https://leetcode.com/problems/perfect-number/",
  },
  defaultInput: DEFAULT_DIVISORFUNCTIONS_INPUT,
  generateSteps: generateDivisorFunctionsSteps,
};

export default divisorFunctions;
