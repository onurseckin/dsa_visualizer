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
  const weights = input?.weights && input.weights.length > 0 ? [...input.weights] : DEFAULT_KNAPSACK_01_INPUT.weights;
  const values = input?.values && input.values.length > 0 ? [...input.values] : DEFAULT_KNAPSACK_01_INPUT.values;
  const capacity = Math.max(0, input?.capacity ?? DEFAULT_KNAPSACK_01_INPUT.capacity);
  const n = weights.length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp = new Array<number>(capacity + 1).fill(0);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize 1D DP table of size capacity + 1 (${capacity + 1})`,
      why: `dp[c] stores the maximum value attainable for capacity c using considered items. Initially 0 for all capacity levels.`,
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
        codeLine: 7,
        explanation: {
          what: `Consider item ${i} (weight ${w}, value ${v}) for capacity ${c}`,
          why: `Comparing keeping current dp[${c}] = ${prevDpC} vs including item ${i} (dp[${c - w}] + ${v} = ${candidate}). New dp[${c}] becomes ${dp[c]}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((val, idx) => ({
            id: `dp-${idx}`,
            value: val,
            state: idx === c ? "active" : idx === c - w ? "compare" : "default",
            pointers:
              idx === c ? [`cap ${c}`] : idx === c - w ? [`cap ${c - w}`] : undefined,
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
    codeLine: 9,
    explanation: {
      what: `Result is dp[${capacity}] = ${result}`,
      why: `The maximum value that can be obtained within capacity ${capacity} is ${result}.`,
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
    1: "Defines knapsack_01(weights, values, capacity) -> int.",
    3: "Allocates 1D dp table of size capacity + 1 initialized to 0.",
    5: "Iterates through each item i from 0 to n - 1.",
    6: "Extracts weight w and value v for current item.",
    7: "Iterates capacity c backward from capacity down to w to ensure items are used at most once.",
    8: "Updates dp[c] to max of excluding item (dp[c]) or including item (dp[c - w] + v).",
    9: "Returns dp[capacity] which holds optimal value for full capacity.",
  },
};

export const knapsack01: AlgorithmDefinition<Knapsack01Input> = {
  id: "knapsack-01",
  title: "0/1 Knapsack Problem",
  category: "dp_1d",
  difficulty: "Medium",
  description:
    "Finds maximum value that can be packed into a knapsack of capacity W using 0/1 item selection and 1D space-optimized dynamic programming.",
  constraints: ["1 <= weights.length <= 10", "1 <= capacity <= 15"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "weights = [2, 1, 3, 2], values = [12, 10, 20, 15], capacity = 5",
      outputDisplay: "37",
      title: "Basic Case",
      input: { weights: [2, 1, 3, 2], values: [12, 10, 20, 15], capacity: 5 },
      output: "37",
      explanation: "Items with weight 1 (val 10), weight 2 (val 15), weight 2 (val 12) sum to weight 5 and total value 37.",
    },
    {
      kind: "complex",
      inputDisplay: "weights = [3, 4, 5], values = [30, 50, 60], capacity = 8",
      outputDisplay: "90",
      title: "Complex Case",
      input: { weights: [3, 4, 5], values: [30, 50, 60], capacity: 8 },
      output: "90",
      explanation: "Items with weight 3 (val 30) and weight 5 (val 60) give capacity 8 and total value 90.",
    },
    {
      kind: "negative",
      inputDisplay: "weights = [10, 20], values = [60, 100], capacity = 5",
      outputDisplay: "0",
      title: "No Items Fit",
      input: { weights: [10, 20], values: [60, 100], capacity: 5 },
      output: "0",
      explanation: "No items fit within capacity 5, returning 0.",
    },
  ],
  code: PYTHON_KNAPSACK_01_CODE,
  timeComplexity: { best: "O(N * W)", average: "O(N * W)", worst: "O(N * W)" },
  spaceComplexity: "O(W)",
  complexityAnalysis: {
    time: "Fills a 1D table of size capacity W for each of N items, performing N * W state updates.",
    space: "Optimized to 1D space requiring O(W) memory by iterating backward over capacities.",
  },
  topicGuide: {
    overview:
      "0/1 Knapsack selects items to maximize value under capacity constraint. Iterating backward over capacities allows using a 1D DP table.",
    sections: [
      {
        heading: "Backward Capacity Sweep",
        body: "Iterating capacity c from W down to w guarantees that dp[c - w] contains values from previous item iterations, preventing duplicate item selection.",
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
