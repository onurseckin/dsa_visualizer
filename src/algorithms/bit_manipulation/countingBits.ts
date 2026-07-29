import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface CountingBitsInput {
  n: number;
}

export const DEFAULT_COUNTING_BITS_INPUT: CountingBitsInput = {
  n: 15,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The population count (Hamming weight) of an integer is the number of set 1-bits in its binary representation.",
    primarySnapshot: {
      kind: "array",
      name: "binaryConcept",
      elements: [
        { id: "b0", value: 0, label: "0b0 -> 0 bits", state: "default" },
        { id: "b1", value: 1, label: "0b1 -> 1 bit", state: "active" },
        { id: "b2", value: 1, label: "0b10 -> 1 bit", state: "active" },
        { id: "b3", value: 2, label: "0b11 -> 2 bits", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Naively counting bits for each number from 0 to N by scanning individual bits requires O(N log N) total operations.",
    primarySnapshot: {
      kind: "array",
      name: "naiveScan",
      elements: [
        { id: "n1", value: 1, label: "0b001", state: "compare" },
        { id: "n2", value: 1, label: "0b010", state: "compare" },
        { id: "n3", value: 2, label: "0b011", state: "compare" },
        { id: "n4", value: 1, label: "0b100", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Dynamic programming enables computing bit counts for all numbers 0 through N in optimal linear O(N) time without redundant bit shifts.",
    primarySnapshot: {
      kind: "array",
      name: "dpTable",
      elements: [
        { id: "d0", value: 0, label: "ans[0]", state: "visited" },
        { id: "d1", value: 1, label: "ans[1]", state: "active" },
        { id: "d2", value: 1, label: "ans[2]", state: "active" },
        { id: "d3", value: 2, label: "ans[3]", state: "active" },
      ],
    },
  },
  {
    narrative: "Base Case: For n = 0, binary 0 has zero 1-bits, so ans[0] = 0.",
    primarySnapshot: {
      kind: "array",
      name: "dpTable",
      elements: [
        { id: "d0", value: 0, label: "ans[0] = 0", state: "sorted" },
        { id: "d1", value: 0, label: "ans[1]", state: "default" },
        { id: "d2", value: 0, label: "ans[2]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Any positive integer i can be split into its right-shifted prefix i >> 1 and its least significant bit i & 1.",
    primarySnapshot: {
      kind: "array",
      name: "bitDecomposition",
      elements: [
        { id: "p1", value: 5, label: "i = 5 (0b101)", state: "active" },
        { id: "p2", value: 2, label: "i>>1 = 2 (0b10)", state: "compare" },
        { id: "p3", value: 1, label: "i&1 = 1 (odd)", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Right-shifting by 1 bit (i >> 1) drops the last binary digit, yielding a smaller integer strictly less than i.",
    primarySnapshot: {
      kind: "array",
      name: "bitShift",
      elements: [
        { id: "s1", value: 6, label: "6 = 0b110", state: "default" },
        { id: "s2", value: 3, label: "6>>1 = 3 (0b11)", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "The bitwise AND operation (i & 1) extracts the least significant bit, which is 1 if i is odd and 0 if i is even.",
    primarySnapshot: {
      kind: "array",
      name: "lsbCheck",
      elements: [
        { id: "l1", value: 6, label: "6 & 1 = 0 (even)", state: "default" },
        { id: "l2", value: 7, label: "7 & 1 = 1 (odd)", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Combining these subproblem components yields the DP recurrence: ans[i] = ans[i >> 1] + (i & 1).",
    primarySnapshot: {
      kind: "array",
      name: "dpFormula",
      elements: [
        { id: "f1", value: 2, label: "ans[7]", state: "active" },
        { id: "f2", value: 2, label: "ans[3] = 2", state: "visited" },
        { id: "f3", value: 1, label: "+ (7 & 1 = 1)", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "By iterating i from 1 up to N, ans[i >> 1] is guaranteed to be already calculated, enabling O(1) state transitions.",
    primarySnapshot: {
      kind: "array",
      name: "dpTable",
      elements: [
        { id: "t0", value: 0, label: "[0]", state: "visited" },
        { id: "t1", value: 1, label: "[1]", state: "visited" },
        { id: "t2", value: 1, label: "[2]", state: "visited" },
        { id: "t3", value: 2, label: "[3]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "The complete algorithm populates all N + 1 bit counts in a single pass of O(N) time and O(N) memory.",
    primarySnapshot: {
      kind: "array",
      name: "dpTable",
      elements: [
        { id: "t0", value: 0, label: "ans[0]", state: "sorted" },
        { id: "t1", value: 1, label: "ans[1]", state: "sorted" },
        { id: "t2", value: 1, label: "ans[2]", state: "sorted" },
        { id: "t3", value: 2, label: "ans[3]", state: "sorted" },
      ],
    },
  },
];

function createBitArrayElements(
  ans: number[],
  currentIdx: number,
  halfIdx: number,
): ArrayElement[] {
  return ans.map((val, idx) => {
    let state: ElementState = "default";
    const pointers: string[] = [];

    if (idx === currentIdx) {
      state = "active";
      pointers.push(`i=${idx}`);
    } else if (idx === halfIdx && currentIdx > 0) {
      state = "compare";
      pointers.push(`i>>1=${halfIdx}`);
    } else if (idx < currentIdx) {
      state = "sorted";
    }

    return {
      id: `bit-ans-${idx}`,
      value: val,
      label: `0b${idx.toString(2)}`,
      state,
      pointers: pointers.length > 0 ? pointers : undefined,
    };
  });
}

export function generateCountingBitsSteps(input: CountingBitsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const rawN = typeof input?.n === "number" ? input.n : DEFAULT_COUNTING_BITS_INPUT.n;
  const n = Math.max(0, Math.min(rawN, 32));
  const ans: number[] = new Array(n + 1).fill(0);

  let stepIdx = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Initializing bit count array of size ${n + 1} with base case ans[0] = 0.`,
      primarySnapshot: {
        kind: "array",
        name: "ans",
        elements: createBitArrayElements(ans, 0, -1),
      },
    }),
  );

  for (let i = 1; i <= n; i++) {
    const half = i >> 1;
    const lsb = i & 1;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Inspecting i = ${i} (0b${i.toString(2)}): half = ${half} (ans[${half}] = ${ans[half]}), LSB = ${lsb}.`,
        primarySnapshot: {
          kind: "array",
          name: "ans",
          elements: createBitArrayElements(ans, i, half),
        },
      }),
    );

    ans[i] = ans[half] + lsb;

    steps.push(
      createTutorialStep({
        stepIndex: stepIdx++,
        phase: "walkthrough",
        narrative: `Calculated ans[${i}] = ans[${half}] (${ans[half]}) + ${lsb} = ${ans[i]}.`,
        primarySnapshot: {
          kind: "array",
          name: "ans",
          elements: ans.map((val, idx) => ({
            id: `bit-ans-${idx}`,
            value: val,
            label: `0b${idx.toString(2)}`,
            state: idx === i ? "swap" : idx < i ? "sorted" : "default",
            pointers: idx === i ? [`ans[${i}]=${val}`] : undefined,
          })),
        },
      }),
    );
  }

  const finalElements = ans.map((val, idx) => ({
    id: `bit-ans-${idx}`,
    value: val,
    label: `0b${idx.toString(2)}`,
    state: "sorted" as const,
  }));

  steps.push(
    createTutorialStep({
      stepIndex: stepIdx++,
      phase: "walkthrough",
      narrative: `Completed counting bits for 0 through ${n}. Population counts: [${ans.join(", ")}].`,
      primarySnapshot: {
        kind: "array",
        name: "ans",
        elements: finalElements,
      },
    }),
  );

  return steps;
}

const COUNTING_BITS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Compute the population count (number of set 1-bits) for all integers from <code>0</code> to <code>n</code> in linear <code>O(n)</code> time using bottom-up dynamic programming.</p>",
  sections: [
    {
      heading: "Bit Shift DP Recurrence",
      body: "<p>Using <code>ans[i] = ans[i >> 1] + (i & 1)</code> computes population counts sequentially in linear time.</p>",
    },
  ],
};

const COUNTING_BITS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines function countBits(n).",
    3: "Loops sequentially from 1 to n.",
  },
};

export const countingBits: AlgorithmDefinition<CountingBitsInput> = {
  id: "counting-bits",
  title: "Counting Bits",
  topicIds: ["bit_manipulation"],
  difficulty: "Easy",
  description:
    "<p>Compute the population count (number of set 1-bits) for all integers from <code>0</code> to <code>n</code> in linear <code>O(n)</code> time using bottom-up dynamic programming.</p><h3>Input Parameters</h3><ul><li><code>n</code>: An integer constraint (<code>0 &le; n &le; 10⁵</code>).</li></ul><h3>Output</h3><p>An integer array <code>ans</code> of size <code>n + 1</code> containing population counts for <code>0 &hellip; n</code>.</p>",
  constraints: ["0 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "n = 5",
      outputDisplay: "[0, 1, 1, 2, 1, 2]",
      title: "Basic Example",
      input: { n: 5 },
      output: "[0, 1, 1, 2, 1, 2]",
      explanation:
        "Counts set bits for 0 through 5: 0=0b0(0), 1=0b1(1), 2=0b10(1), 3=0b11(2), 4=0b100(1), 5=0b101(2).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "n = 15",
      outputDisplay: "[0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4]",
      title: "Complex Edge Case",
      input: { n: 15 },
      output: "[0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4]",
      explanation:
        "Sweeps through numbers up to 15 across multiple powers of 2, reusing dp[i] = dp[i >> 1] + (i & 1).",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "n = 0",
      outputDisplay: "[0]",
      title: "Failing / Boundary Case",
      input: { n: 0 },
      output: "[0]",
      explanation:
        "Boundary input n=0 produces a single-element array [0] since 0 has zero set bits in binary.",
    },
  ],
  code: `def countBits(n):
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans`,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Fills the answer array in a single pass from 1 to n. Each entry requires constant-time operations: 1 bitwise right shift, 1 bitwise AND, and 1 addition. Total time complexity is O(N).",
    space:
      "Allocates an answer array of size n + 1, requiring O(N) auxiliary space. Auxiliary working memory is O(1).",
  },
  topicGuide: COUNTING_BITS_TOPIC_GUIDE,
  trivia: COUNTING_BITS_TRIVIA,
  generateSteps: generateCountingBitsSteps,
  defaultInput: DEFAULT_COUNTING_BITS_INPUT,
};

export default countingBits;
