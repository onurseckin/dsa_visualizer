import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface Knapsack01Input {
  weights: number[];
  values: number[];
  capacity: number;
}

export const DEFAULT_KNAPSACK_01_INPUT: Knapsack01Input = {
  weights: [2, 1, 3, 2],
  values: [12, 10, 20, 15],
  capacity: 5,
};

export const PYTHON_KNAPSACK_01_CODE = `def knapsack_01(weights: list[int], values: list[int], capacity: int) -> int:
    n = len(weights)
    dp = [0] * (capacity + 1)

    for i in range(n):
        w, v = weights[i], values[i]
        for c in range(capacity, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + v)

    return dp[capacity]`;

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The 0/1 Knapsack Problem asks us to choose a subset of N items—each with a weight and a value—to maximize total value without exceeding a given knapsack capacity W.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "0/1 Knapsack Problem Overview",
      items: [
        {
          id: "items-array",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "items",
            mode: "box",
            elements: [
              { id: "i0", value: "w:2 v:12", label: "[0]", state: "default" },
              { id: "i1", value: "w:1 v:10", label: "[1]", state: "default" },
              { id: "i2", value: "w:3 v:20", label: "[2]", state: "default" },
              { id: "i3", value: "w:2 v:15", label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "capacity-display",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "dp",
            mode: "box",
            elements: [{ id: "cap-5", value: "Capacity W = 5", state: "active" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "The binary 0/1 constraint mandates that each item must either be included completely (1) or excluded completely (0); items cannot be divided into fractional amounts.",
    primarySnapshot: {
      kind: "array",
      name: "decisions",
      mode: "box",
      elements: [
        { id: "d0", value: "Exclude (0)", state: "default" },
        { id: "d1", value: "Include (1)", state: "sorted" },
        { id: "df", value: "Fractional (x)", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Greedy selection based on value-to-weight ratio can fail because selecting high-ratio items may leave empty knapsack capacity that cannot be filled by remaining large items.",
    primarySnapshot: {
      kind: "array",
      name: "ratios",
      mode: "box",
      elements: [
        { id: "r1", value: "Item A: v/w=10", state: "compare" },
        { id: "r2", value: "Item B: v/w=8", state: "compare" },
        { id: "r3", value: "Greedy fails on discrete capacity", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We define 1D state dp[c] as the maximum value achievable using a subset of processed items within exact capacity limit c.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 6 }, (_, idx) => ({
        id: `dp-def-${idx}`,
        value: 0,
        label: `c=${idx}`,
        state: "default",
      })),
    },
  },
  {
    narrative:
      "Initially, the DP table of size W + 1 is filled with zeros, representing 0 value achievable before considering any items.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 6 }, (_, idx) => ({
        id: `dp-init-${idx}`,
        value: 0,
        label: `c=${idx}`,
        state: "active",
      })),
    },
  },
  {
    narrative:
      "When processing an item with weight w and value v, the recurrence updates dp[c] = max(dp[c], dp[c - w] + v) for capacities c >= w.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Recurrence Relation",
      items: [
        {
          id: "item-spec",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "item",
            mode: "box",
            elements: [{ id: "spec", value: "weight = w, value = v", state: "active" }],
          },
        },
        {
          id: "dp-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "dp",
            mode: "box",
            elements: [
              { id: "prev", value: "dp[c - w]", label: "c - w", state: "compare" },
              { id: "curr", value: "max(dp[c], dp[c-w] + v)", label: "c", state: "active" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Crucially, we iterate capacity c backward from W down to w; descending order ensures that subproblem dp[c - w] contains values from the previous item, preventing multiple uses of the same item.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 6 }, (_, idx) => ({
        id: `dp-back-${idx}`,
        value: 0,
        label: `c=${idx}`,
        state: idx === 5 ? "active" : idx === 3 ? "compare" : "default",
        pointers: idx === 5 ? ["sweep <-"] : undefined,
      })),
    },
  },
  {
    narrative:
      "If we iterated capacity forward, an item could be added multiple times (unbounded knapsack); backward iteration strictly enforces the 0/1 item limit.",
    primarySnapshot: {
      kind: "array",
      name: "sweep_order",
      mode: "box",
      elements: [
        { id: "sw1", value: "Backward W -> w (0/1 Knapsack)", state: "sorted" },
        { id: "sw2", value: "Forward w -> W (Unbounded)", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "After evaluating all N items across all capacities up to W, dp[W] contains the optimal total value achievable in O(N * W) time and O(W) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 6 }, (_, idx) => ({
        id: `dp-fin-${idx}`,
        value: [0, 10, 15, 25, 27, 37][idx],
        label: `c=${idx}`,
        state: idx === 5 ? "sorted" : "default",
        pointers: idx === 5 ? ["max value: 37"] : undefined,
      })),
    },
  },
];

export const generateKnapsack01Steps = (input: Knapsack01Input): AlgorithmStep[] => {
  const weights =
    input?.weights && input.weights.length > 0
      ? [...input.weights]
      : DEFAULT_KNAPSACK_01_INPUT.weights;
  const values =
    input?.values && input.values.length > 0 ? [...input.values] : DEFAULT_KNAPSACK_01_INPUT.values;
  const capacity = Math.max(0, input?.capacity ?? DEFAULT_KNAPSACK_01_INPUT.capacity);
  const n = Math.min(weights.length, values.length);
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp = new Array<number>(capacity + 1).fill(0);

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.weights) &&
      input.weights.length === DEFAULT_KNAPSACK_01_INPUT.weights.length &&
      input.weights.every((val, idx) => val === DEFAULT_KNAPSACK_01_INPUT.weights[idx]) &&
      Array.isArray(input?.values) &&
      input.values.every((val, idx) => val === DEFAULT_KNAPSACK_01_INPUT.values[idx]) &&
      input.capacity === DEFAULT_KNAPSACK_01_INPUT.capacity);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeSnapshot = (
    currentItem: number,
    currentC?: number,
    subC?: number,
    highlightResult = false,
  ): PrimaryVisualSnapshot => ({
    kind: "composite",
    layout: "vertical",
    heading: `Item ${currentItem} (w:${weights[currentItem] ?? "-"}, v:${values[currentItem] ?? "-"})`,
    items: [
      {
        id: "items-array",
        role: "auxiliary",
        snapshot: {
          kind: "array",
          name: "items",
          mode: "box",
          elements: Array.from({ length: n }, (_, idx) => ({
            id: `item-${idx}`,
            value: `w:${weights[idx]} v:${values[idx]}`,
            label: `[${idx}]`,
            state: idx === currentItem ? "active" : idx < currentItem ? "visited" : "default",
          })),
        },
      },
      {
        id: "dp-array",
        role: "primary",
        snapshot: {
          kind: "array",
          name: "dp",
          mode: "box",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v,
            label: `c=${idx}`,
            state:
              highlightResult && idx === capacity
                ? "sorted"
                : currentC !== undefined && idx === currentC
                  ? "active"
                  : subC !== undefined && idx === subC
                    ? "compare"
                    : "default",
            pointers:
              highlightResult && idx === capacity
                ? [`max = ${v}`]
                : currentC !== undefined && idx === currentC
                  ? [`c = ${currentC}`]
                  : subC !== undefined && idx === subC
                    ? [`c - w = ${subC}`]
                    : undefined,
          })),
        },
      },
    ],
  });

  addStep(
    `We initialize a 1D DP array of size ${capacity + 1} with 0 for all capacity slots from c = 0 to ${capacity}.`,
    makeSnapshot(0),
  );

  for (let i = 0; i < n; i++) {
    const w = weights[i];
    const v = values[i];

    addStep(
      `Evaluating item ${i} with weight w = ${w} and value v = ${v}; we sweep capacity c backward from ${capacity} down to ${w}.`,
      makeSnapshot(i),
    );

    for (let c = capacity; c >= w; c--) {
      const prevVal = dp[c];
      const candidate = dp[c - w] + v;
      dp[c] = Math.max(dp[c], candidate);

      addStep(
        `Evaluating capacity c = ${c} for item ${i} (w:${w}, v:${v}): excluding item yields dp[${c}] = ${prevVal}, while including item yields dp[${c - w}] + ${v} = ${candidate}. Updating dp[${c}] = max(${prevVal}, ${candidate}) = ${dp[c]}.`,
        makeSnapshot(i, c, c - w),
      );
    }
  }

  const finalResult = dp[capacity];
  addStep(
    `Completed 0/1 Knapsack tabulation: dp[${capacity}] = ${finalResult}. The maximum value achievable within capacity ${capacity} is ${finalResult}.`,
    makeSnapshot(n - 1, undefined, undefined, true),
  );

  return steps;
};

const KNAPSACK_01_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines knapsack_01(weights, values, capacity) -> int: computes maximum total value within weight capacity constraint W.",
    2: "Calculates total number of items n from length of weights array.",
    3: "Allocates 1D DP table dp of size capacity + 1 initialized to 0.",
    4: "Blank line separating DP initialization from outer loop over items.",
    5: "Outer loop sweeps item index i from 0 to n - 1.",
    6: "Extracts weight w and value v for current item i.",
    7: "Inner loop sweeps capacity c backward from capacity down to w to ensure item i is used at most once.",
    8: "Updates dp[c] = max(dp[c], dp[c - w] + v), selecting maximum between excluding or including item i.",
    9: "Blank line separating DP state transitions from returning final result.",
    10: "Returns dp[capacity], containing the maximum value achievable within capacity W.",
  },
};

export const knapsack01: AlgorithmDefinition<Knapsack01Input> = {
  id: "knapsack-01",
  title: "0/1 Knapsack Problem",
  topicIds: ["dp_1d"],
  difficulty: "Medium",
  description:
    "<p>Given <code>N</code> items, each with a specific weight and value, and a knapsack with maximum weight capacity <code>W</code>, select a subset of items to maximize the total value in the knapsack without exceeding capacity <code>W</code>. Each item can either be taken in full (1) or left behind (0).</p><p><strong>Input:</strong> An array of integers <code>weights</code>, an array of integers <code>values</code>, and an integer <code>capacity</code>.</p><p><strong>Output:</strong> The maximum total value achievable within the given weight capacity.</p>",
  constraints: [
    "1 <= N <= 1000",
    "1 <= W <= 10^4",
    "1 <= weights[i], values[i] <= 1000",
    "All weights and values are positive integers",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "weights = [2, 1, 3, 2], values = [12, 10, 20, 15], capacity = 5",
      outputDisplay: "37",
      title: "Standard Case",
      input: { weights: [2, 1, 3, 2], values: [12, 10, 20, 15], capacity: 5 },
      output: "37",
      explanation:
        "Selecting item 1 (wt 1, val 10), item 2 (wt 3, val 20), or optimal subset gives max value 37 within capacity 5.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "weights = [3, 4, 5], values = [30, 50, 60], capacity = 8",
      outputDisplay: "90",
      title: "Adversarial Ratio Choice",
      input: { weights: [3, 4, 5], values: [30, 50, 60], capacity: 8 },
      output: "90",
      explanation: "Selecting items 0 and 2 gives weight 3 + 5 = 8 and total value 30 + 60 = 90.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "weights = [10, 20], values = [60, 100], capacity = 5",
      outputDisplay: "0",
      title: "No Items Fit Boundary",
      input: { weights: [10, 20], values: [60, 100], capacity: 5 },
      output: "0",
      explanation: "No items fit within capacity 5, returning max value 0.",
    },
  ],
  code: PYTHON_KNAPSACK_01_CODE,
  timeComplexity: { best: "O(N * W)", average: "O(N * W)", worst: "O(N * W)" },
  spaceComplexity: "O(W)",
  complexityAnalysis: {
    time: "Fills a 1D DP array of size W + 1 for each of N items. The nested loops perform N * W constant-time state transitions, giving O(N * W) time overall.",
    space:
      "Optimized to 1D space requiring O(W) memory by maintaining backward capacity iteration.",
  },
  topicGuide: {
    overview:
      "<p>The 0/1 Knapsack problem is the quintessential benchmark for 1D dynamic programming with state compression. Given <code>N</code> items characterized by weights <code>w<sub>i</sub></code> and values <code>v<sub>i</sub></code>, and a maximum weight capacity <code>W</code>, we seek a subset of items maximizing total value <code>&sum; v<sub>i</sub></code> subject to <code>&sum; w<sub>i</sub> &le; W</code>. The binary '0/1' constraint prohibits partial items, requiring dynamic programming to evaluate discrete selection states in <code>O(N &times; W)</code> time and <code>O(W)</code> space.</p>",
    sections: [
      {
        heading: "1. 2D Recurrence to 1D Backward Space Optimization",
        body: "<p>A classic 2D formulation defines <code>dp[i][c]</code> as the maximum value using a subset of the first <code>i</code> items within capacity <code>c</code>: <code>dp[i][c] = max(dp[i-1][c], dp[i-1][c - w<sub>i</sub>] + v<sub>i</sub>)</code>.</p><p>Since row <code>i</code> depends strictly on row <code>i-1</code>, we compress the state to a single 1D array <code>dp[c]</code> of size <code>W + 1</code>. Sweeping capacity <code>c</code> backward from <code>W</code> down to <code>w<sub>i</sub></code> ensures that <code>dp[c - w<sub>i</sub>]</code> holds the value from item <code>i-1</code>, preventing item reuse.</p>",
      },
      {
        heading: "2. Real-World Systems Applications",
        body: "<p>0/1 Knapsack models resource allocation across computer systems:</p><ul><li><strong>Cloud Virtual Machine Placement:</strong> Packing guest workloads with memory (weight) and revenue/priority (value) into host node capacities.</li><li><strong>OS Cache Eviction & MTU Assembly:</strong> Assembling network packet payloads under maximum transmission unit (MTU) limits.</li><li><strong>Capital Budgeting:</strong> Allocating a fixed financial budget across discrete R&amp;D projects.</li></ul>",
      },
      {
        heading: "3. Pseudo-Polynomial Time Complexity",
        body: "<p>The runtime <code>O(N &times; W)</code> is <em>pseudo-polynomial</em>. While polynomial with respect to the numeric value of <code>W</code>, it is exponential relative to the number of bits needed to represent <code>W</code>. For practical limits, dynamic programming executes in milliseconds.</p>",
      },
      {
        heading: "4. Step-by-Step Algorithmic Mechanics",
        body: "<ol><li>Initialize a 1D array <code>dp</code> of size <code>W + 1</code> with zeros.</li><li>For each item <code>i</code> with weight <code>w<sub>i</sub></code> and value <code>v<sub>i</sub></code>:</li><li>Loop capacity <code>c</code> backwards from <code>W</code> down to <code>w<sub>i</sub></code>: <code>dp[c] = max(dp[c], dp[c - w<sub>i</sub>] + v<sub>i</sub>)</code></li><li>Return <code>dp[W]</code> as the global maximum value.</li></ol>",
      },
    ],
    keyTerms: [
      {
        term: "0/1 Knapsack",
        definition:
          "A binary selection optimization problem where items cannot be subdivided and each item is taken at most once.",
      },
      {
        term: "Backward Capacity Sweep",
        definition:
          "Iterating 1D capacity loops in descending order so subproblem references draw from the prior item's iteration.",
      },
    ],
  },
  trivia: KNAPSACK_01_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 7,
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_KNAPSACK_01_INPUT,
  generateSteps: generateKnapsack01Steps,
};
