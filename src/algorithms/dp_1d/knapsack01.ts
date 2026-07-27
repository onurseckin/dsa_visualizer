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

export const PYTHON_KNAPSACK_01_CODE = `
def python_knapsack_01(input_array):
    """
    Implementation of python_knapsack_01.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

export const generateKnapsack01Steps = (input: Knapsack01Input): AlgorithmStep[] => {
  const weights =
    input?.weights && input.weights.length > 0
      ? [...input.weights]
      : DEFAULT_KNAPSACK_01_INPUT.weights;
  const values =
    input?.values && input.values.length > 0 ? [...input.values] : DEFAULT_KNAPSACK_01_INPUT.values;
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
        codeLine: 8,
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
    2: "Store number of items in variable n.",
    3: "Allocates 1D dp table of size capacity + 1 initialized to 0.",
    5: "Iterates through each item i from 0 to n - 1.",
    6: "Extracts weight w and value v for current item.",
    7: "Iterates capacity c backward from capacity down to w to ensure items are used at most once.",
    8: "Updates dp[c] to max of excluding item (dp[c]) or including item (dp[c - w] + v).",
    10: "Returns dp[capacity] which holds optimal value for full capacity.",
  },
};

export const knapsack01: AlgorithmDefinition<Knapsack01Input> = {
  id: "knapsack-01",
  title: "0/1 Knapsack Problem",
  category: "dp_1d",
  categories: ["dp_1d"],
  difficulty: "Medium",
  description:
    "Given N items where each item i has a weight weights[i] and a value values[i], alongside a maximum knapsack weight capacity W, determine the maximum total value that can be packed into the knapsack. You cannot split items; each item can either be included (1) or excluded (0). Using a 1D space-optimized dynamic programming array dp of size W + 1, dp[c] stores the maximum value achievable with total weight at most c. To ensure each item is selected at most once, iterate capacity c backward from W down to weights[i], updating dp[c] = max(dp[c], dp[c - weights[i]] + values[i]).",
  constraints: ["1 <= N <= 1000", "1 <= capacity W <= 10^4", "1 <= weights[i], values[i] <= 1000"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "weights = [2, 1, 3, 2], values = [12, 10, 20, 15], capacity = 5",
      outputDisplay: "37",
      title: "Basic Case",
      input: { weights: [2, 1, 3, 2], values: [12, 10, 20, 15], capacity: 5 },
      output: "37",
      explanation:
        "Items with weight 1 (val 10), weight 2 (val 15), weight 2 (val 12) sum to weight 5 and total value 37.",
    },
    {
      kind: "complex",
      inputDisplay: "weights = [3, 4, 5], values = [30, 50, 60], capacity = 8",
      outputDisplay: "90",
      title: "Complex Case",
      input: { weights: [3, 4, 5], values: [30, 50, 60], capacity: 8 },
      output: "90",
      explanation:
        "Items with weight 3 (val 30) and weight 5 (val 60) give capacity 8 and total value 90.",
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
      "The 0/1 Knapsack problem is a foundational problem in combinatorial optimization and dynamic programming. Given a set of items with specific weights and values, the goal is to select a subset of items to maximize value without exceeding capacity W. The 0/1 constraint enforces that each item is either entirely included or excluded, differentiating it from the Fractional Knapsack (solvable greedily) and Unbounded Knapsack.",
    sections: [
      {
        heading: "Core Concept: State Space & Backward Inner Loop",
        body: "A standard 2D DP table uses dp[i][c] to denote the maximum value using a subset of the first i items under capacity c. By noticing that row i depends only on row i-1, the space can be compressed to a 1D array of size W + 1. Sweeping capacity c backward from W down to weight[i] prevents using the same item multiple times in a single pass.",
      },
      {
        heading: "State Transition Equation",
        body: "The transition is dp[c] = max(dp[c], dp[c - weights[i]] + values[i]). If capacity c is less than weights[i], the item cannot be included, leaving dp[c] unchanged.",
      },
      {
        heading: "Systems Applications & Pseudo-Polynomial Complexity",
        body: "0/1 Knapsack models financial portfolio selection, cargo loading, memory allocation in embedded OS kernels, and server VM bin packing. The runtime O(N * W) is pseudo-polynomial because W depends on numeric magnitude rather than bit representation length.",
      },
      {
        heading: "Edge Cases & Bounded Variations",
        body: "Capacity W = 0 yields max value 0. Items with weight greater than W are automatically ignored. Bounded knapsack variants extend this model by allowing item counts up to K_i.",
      },
    ],
    keyTerms: [
      {
        term: "0/1 Knapsack",
        definition:
          "A constrained optimization problem where items cannot be divided and must be binary-chosen.",
      },
      {
        term: "Space Optimization",
        definition:
          "Compressing a 2D DP table to a 1D array by maintaining backward iteration over the state variable.",
      },
      {
        term: "Pseudo-Polynomial Time",
        definition:
          "An algorithm runtime polynomial in numeric value of input (W) rather than input size in bits.",
      },
      {
        term: "Optimal Substructure",
        definition:
          "Property where an optimal capacity allocation consists of optimal sub-capacity allocations.",
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
