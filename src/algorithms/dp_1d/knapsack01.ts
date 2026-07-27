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
    codeLine: 1,
    explanation: {
      what: `Start 0/1 Knapsack algorithm with N=${n} items and capacity W=${capacity}`,
      why: "The goal is to select a subset of items to maximize total value while ensuring total weight <= capacity.",
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: "default",
        pointers: idx === 0 ? ["cap 0"] : undefined,
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Determine total number of items n = ${n}`,
      why: "Calculated from the length of the input weights array to bound the outer loop iterations.",
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: "default",
      })),
    },
    auxiliaryState: {
      customState: {
        capacity,
        n,
      },
    },
    variables: { n, capacity },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Initialize 1D DP table of size capacity + 1 (${capacity + 1}) with zeros`,
      why: "dp[c] represents the maximum value achievable for exact capacity limit c. Initially 0 for all capacities.",
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
        dpSize: capacity + 1,
      },
    },
    variables: { capacity, dpSize: capacity + 1 },
  });

  for (let i = 0; i < n; i++) {
    const w = weights[i];
    const v = values[i];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Begin outer loop for item ${i} (weight=${w}, value=${v})`,
        why: `We evaluate how including item ${i} improves existing capacity states in the DP table.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: dp.map((val, idx) => ({
          id: `dp-${idx}`,
          value: val,
          state: "default",
        })),
      },
      auxiliaryState: {
        customState: {
          itemIndex: i,
          itemWeight: w,
          itemValue: v,
        },
      },
      variables: { i, w, v },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Unpack weight w=${w} and value v=${v} for item ${i}`,
        why: "Storing item attributes locally for fast state transition calculations.",
      },
      primarySnapshot: {
        kind: "array",
        elements: dp.map((val, idx) => ({
          id: `dp-${idx}`,
          value: val,
          state: "default",
        })),
      },
      auxiliaryState: {
        customState: {
          itemIndex: i,
          w,
          v,
        },
      },
      variables: { i, w, v },
    });

    for (let c = capacity; c >= w; c--) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Inner loop checking capacity c = ${c} (c >= w: ${c} >= ${w})`,
          why: `Evaluating backward capacity iteration from ${capacity} down to ${w} to ensure item ${i} is used at most once.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((val, idx) => ({
            id: `dp-${idx}`,
            value: val,
            state: idx === c ? "active" : idx === c - w ? "compare" : "default",
            pointers: idx === c ? [`cap ${c}`] : idx === c - w ? [`sub ${c - w}`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: {
            itemIndex: i,
            w,
            v,
            currentCapacity: c,
          },
        },
        variables: { i, w, v, c },
      });

      const prevDpC = dp[c];
      const candidate = dp[c - w] + v;
      dp[c] = Math.max(dp[c], candidate);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Update dp[${c}] = max(dp[${c}], dp[${c} - ${w}] + ${v}) -> max(${prevDpC}, ${candidate}) = ${dp[c]}`,
          why: `Comparing excluding item ${i} (value ${prevDpC}) vs including item ${i} (value ${candidate}). Updated dp[${c}] = ${dp[c]}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((val, idx) => ({
            id: `dp-${idx}`,
            value: val,
            state: idx === c ? "active" : idx === c - w ? "compare" : "default",
            pointers: idx === c ? [`cap ${c}`] : idx === c - w ? [`sub ${c - w}`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: {
            itemIndex: i,
            weight: w,
            value: v,
            currentCapacity: c,
            prevValue: prevDpC,
            candidateValue: candidate,
            newValue: dp[c],
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
        pointers: idx === capacity ? [`max value: ${v}`] : undefined,
      })),
    },
    auxiliaryState: {
      customState: { maxVal: result, capacity },
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
  category: "dp_1d",
  categories: ["dp_1d"],
  difficulty: "Medium",
  description: `The **0/1 Knapsack Problem** is a foundational decision problem in combinatorial optimization and dynamic programming. Given $N$ items, each with weight $w_i$ and value $v_i$, alongside a total knapsack capacity $W$, select a subset of items to maximize total value without exceeding capacity $W$. Each item must either be included ($1$) or excluded ($0$) in full—fractional items are strictly forbidden.

### Optimal Substructure & 1D Backward Space Optimization
Let $dp[c]$ store the maximum achievable value for weight capacity limit $c$. By iterating through items $i \\in [0, N-1]$ and sweeping capacity $c$ **backward** from $W$ down to $w_i$, we get the recurrence:
$$dp[c] = \\max(dp[c], dp[c - w_i] + v_i)$$

#### Why Backward Iteration is Essential
Iterating capacity $c$ in descending order ($W \\to w_i$) guarantees that $dp[c - w_i]$ references the state from the *previous* item pass ($i-1$) rather than the current item pass ($i$). Forward iteration would allow an item to be selected multiple times, turning 0/1 Knapsack into Unbounded Knapsack.

### Key Interview Insights
1. **Binary Choice**: Item $i$ is either taken ($dp[c - w_i] + v_i$) or left ($dp[c]$).
2. **Pseudo-Polynomial Complexity**: Time complexity is $\\mathcal{O}(N \\times W)$, which is polynomial in the magnitude of $W$ but exponential in its bit length.
3. **Space Optimization**: Reduces 2D DP space from $\\mathcal{O}(N \\times W)$ to $\\mathcal{O}(W)$ via a single 1D array.`,
  constraints: [
    "1 <= N <= 1000",
    "1 <= W <= 10^4",
    "1 <= weights[i], values[i] <= 1000",
    "All weights and values are positive integers",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "weights = [2, 1, 3, 2, 4], values = [12, 10, 20, 15, 25], capacity = 6",
      outputDisplay: "47",
      title: "Basic Case",
      input: { weights: [2, 1, 3, 2, 4], values: [12, 10, 20, 15, 25], capacity: 6 },
      output: "47",
      explanation:
        "Selecting items at index 1 (wt 1, val 10), index 3 (wt 2, val 15), and index 4 (wt 4, val 25) or optimal subset gives max value 47 within capacity 6.",
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
      "The 0/1 Knapsack problem is the quintessential benchmark for 1D dynamic programming with state compression. Given $N$ items characterized by weights $w_i$ and values $v_i$, and a maximum weight capacity $W$, we seek a subset of items maximizing total value $\\sum v_i$ subject to $\\sum w_i \\le W$. The binary '0/1' constraint prohibits partial items, requiring dynamic programming to evaluate discrete selection states in $\\mathcal{O}(N \\times W)$ time and $\\mathcal{O}(W)$ space.",
    sections: [
      {
        heading: "1. 2D Recurrence to 1D Backward Space Optimization",
        body: "A classic 2D formulation defines $dp[i][c]$ as the maximum value using a subset of the first $i$ items within capacity $c$:\n$$dp[i][c] = \\max(dp[i-1][c], dp[i-1][c - w_i] + v_i)$$\n\nSince row $i$ depends strictly on row $i-1$, we compress the state to a single 1D array $dp[c]$ of size $W + 1$. Sweeping capacity $c$ backward from $W$ down to $w_i$ ensures that $dp[c - w_i]$ holds the value from item $i-1$, preventing item reuse.",
      },
      {
        heading: "2. Real-World Systems Applications",
        body: "0/1 Knapsack models resource allocation across computer systems:\n- **Cloud Virtual Machine Placement**: Packing guest workloads with memory ($w_i$) and revenue/priority ($v_i$) into host node capacities ($W$).\n- **OS Cache Eviction & MTU Assembly**: Assembling network packet payloads under maximum transmission unit (MTU) limits.\n- **Capital Budgeting**: Allocating a fixed financial budget across discrete R&D projects.",
      },
      {
        heading: "3. Pseudo-Polynomial Time Complexity",
        body: "The runtime $\\mathcal{O}(N \\times W)$ is *pseudo-polynomial*. While polynomial with respect to the numeric value of $W$, it is exponential relative to the number of bits $\\log_2 W$ needed to represent $W$. For practical limits ($W \\le 10^4$), dynamic programming executes in milliseconds.",
      },
      {
        heading: "4. Step-by-Step Algorithmic Mechanics",
        body: "1. Initialize a 1D array $dp$ of size $W + 1$ with zeros ($dp[c] = 0$).\n2. For each item $i$ with weight $w_i$ and value $v_i$:\n3. Loop capacity $c$ backwards from $W$ down to $w_i$:\n   $$dp[c] = \\max(dp[c], dp[c - w_i] + v_i)$\n4. Return $dp[W]$ as the global maximum value.",
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
      chapter: "Ch 7",
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_KNAPSACK_01_INPUT,
  generateSteps: generateKnapsack01Steps,
};
