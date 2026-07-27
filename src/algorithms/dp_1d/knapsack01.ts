import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize 1D DP table of size capacity + 1 (${capacity + 1})`,
      why: `dp[c] stores the maximum value attainable for capacity c using a subset of items. Initially 0 for all capacities.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: "default",
        pointers: idx === 0 ? ["base: 0"] : undefined,
      })),
    },
    auxiliaryState: {
      customState: {
        capacity,
        weights: weights.join(", "),
        values: values.join(", "),
      },
    },
    variables: { capacity, n },
  });

  for (let i = 0; i < n; i++) {
    const w = weights[i];
    const v = values[i];

    for (let c = capacity; c >= w; c--) {
      const prevDpC = dp[c];
      const candidate = dp[c - w] + v;
      dp[c] = Math.max(dp[c], candidate);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Consider item ${i} (weight ${w}, value ${v}) for capacity ${c}`,
          why: `Comparing excluding item (dp[${c}] = ${prevDpC}) vs including item (dp[${c - w}] + ${v} = ${candidate}). Updated dp[${c}] = ${dp[c]}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((val, idx) => ({
            id: `dp-${idx}`,
            value: val,
            state: idx === c ? "active" : idx === c - w ? "compare" : "default",
            pointers: idx === c ? [`cap ${c}`] : idx === c - w ? [`cap ${c - w}`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: {
            itemIndex: i,
            weight: w,
            value: v,
            currentCapacity: c,
          },
        },
        variables: { i, w, v, c, "dp[c]": dp[c] },
      });
    }
  }

  const result = dp[capacity];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Final result dp[${capacity}] = ${result}`,
      why: `The maximum total value attainable within knapsack capacity ${capacity} is ${result}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: idx === capacity ? "sorted" : "default",
        pointers: idx === capacity ? [`result: ${v}`] : undefined,
      })),
    },
    auxiliaryState: {
      customState: { maxVal: result },
    },
    variables: { result },
  });

  return steps;
};

const KNAPSACK_01_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines knapsack_01(weights, values, capacity) -> int: computes maximum total value within weight capacity constraint W.",
    2: "Calculates total number of items n from length of weights array.",
    3: "Allocates 1D DP table dp of size capacity + 1 initialized to 0.",
    5: "Outer loop sweeps item index i from 0 to n - 1.",
    6: "Extracts weight w and value v for current item i.",
    7: "Inner loop sweeps capacity c backward from capacity down to w to ensure item i is used at most once.",
    8: "Updates dp[c] = max(dp[c], dp[c - w] + v), selecting maximum between excluding or including item i.",
    10: "Returns dp[capacity], containing the maximum value achievable within capacity W.",
  },
};

export const knapsack01: AlgorithmDefinition<Knapsack01Input> = {
  id: "knapsack-01",
  title: "0/1 Knapsack Problem",
  category: "dp_1d",
  categories: ["dp_1d"],
  difficulty: "Medium",
  description:
    "Given N items where each item i has weight weights[i] and value values[i], alongside a maximum knapsack weight capacity W, determine the maximum total value achievable without exceeding capacity W. You cannot split items; each item must either be included (1) or excluded (0). Using space-optimized 1D dynamic programming, dp[c] stores the maximum value for total weight at most c. Iterating capacity c backward from W down to weights[i] guarantees each item is chosen at most once, yielding recurrence dp[c] = max(dp[c], dp[c - weights[i]] + values[i]).",
  constraints: [
    "1 <= N <= 1000",
    "1 <= W <= 10^4",
    "1 <= weights[i], values[i] <= 1000",
    "All weights and values are positive integers",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "weights = [2, 1, 3, 2], values = [12, 10, 20, 15], capacity = 5",
      outputDisplay: "37",
      title: "Basic Case",
      input: { weights: [2, 1, 3, 2], values: [12, 10, 20, 15], capacity: 5 },
      output: "37",
      explanation:
        "Selecting items at indices 0, 1, and 3 gives weight 2 + 1 + 2 = 5 and total value 12 + 10 + 15 = 37.",
    },
    {
      kind: "complex",
      inputDisplay: "weights = [3, 4, 5], values = [30, 50, 60], capacity = 8",
      outputDisplay: "90",
      title: "Complex Case",
      input: { weights: [3, 4, 5], values: [30, 50, 60], capacity: 8 },
      output: "90",
      explanation: "Selecting items 0 and 2 gives weight 3 + 5 = 8 and total value 30 + 60 = 90.",
    },
    {
      kind: "negative",
      inputDisplay: "weights = [10, 20], values = [60, 100], capacity = 5",
      outputDisplay: "0",
      title: "No Items Fit",
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
      "The 0/1 Knapsack problem is a foundational problem in combinatorial optimization and algorithm design. Given a set of N items with associated weights and values, the goal is to select a subset of items that maximizes total value subject to a weight capacity budget W. The '0/1' constraint dictates that each item must either be taken in full (1) or left behind (0)—fractional items are strictly forbidden. This distinguishes 0/1 Knapsack (which is NP-complete and solved in pseudo-polynomial time via dynamic programming) from Fractional Knapsack (solvable in O(N log N) using a greedy value-density heuristic) and Unbounded Knapsack (where item quantities are unlimited).",
    sections: [
      {
        heading: "Core Concept: 2D Recurrence to 1D Backward Space Optimization",
        body: "A standard 2D DP table uses dp[i][c] to denote the maximum value achievable considering a subset of the first i items under capacity limit c. The 2D state transition is dp[i][c] = max(dp[i-1][c], dp[i-1][c - w] + v). Observing that row i depends solely on row i-1, space can be compressed to a 1D array of size W + 1. Crucially, sweeping capacity c backward from W down to w ensures that dp[c - w] reflects the value from the previous item pass (i-1) rather than the current item pass (i), preventing double-counting.",
      },
      {
        heading: "Systems Applications & Resource Allocation",
        body: "0/1 Knapsack formulations drive core infrastructure systems: cloud virtual machine bin packing (allocating CPU/RAM resources to guest instances), operating system page frame caching under memory limits, financial portfolio asset selection under risk capital limits, and network packet payload bundling under maximum transmission unit (MTU) constraints.",
      },
      {
        heading: "Pseudo-Polynomial Complexity & Weak NP-Hardness",
        body: "The time complexity O(N * W) is pseudo-polynomial because W represents a numeric scalar value rather than input size in bits. If W is encoded in binary using log2(W) bits, the runtime is exponential in the input size. However, for moderate practical capacities (W <= 10^4), dynamic programming runs in milliseconds.",
      },
      {
        heading: "Edge Cases & Bounded Variants",
        body: "Edge cases include capacity W = 0 (returns 0 immediately), item weights exceeding W (automatically skipped), and identical item weights/values. Related extensions include the Bounded Knapsack Problem (each item available up to K_i copies) and Multi-Dimensional Knapsack (multiple capacity constraints such as weight and volume simultaneously).",
      },
    ],
    keyTerms: [
      {
        term: "0/1 Knapsack",
        definition:
          "A constrained binary optimization problem where items cannot be subdivided and must be chosen binary (0 or 1).",
      },
      {
        term: "Backward Space Optimization",
        definition:
          "Iterating 1D DP capacity loops in descending order so that item selections reference states from the previous item iteration.",
      },
      {
        term: "Pseudo-Polynomial Time",
        definition:
          "An algorithm complexity polynomial in the numerical value of input parameters (W) rather than bit representation length.",
      },
      {
        term: "Optimal Substructure",
        definition:
          "The property that an optimal capacity allocation consists of optimal sub-capacity allocations.",
      },
    ],
  },
  trivia: KNAPSACK_01_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 7",
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_KNAPSACK_01_INPUT,
  generateSteps: generateKnapsack01Steps,
};
