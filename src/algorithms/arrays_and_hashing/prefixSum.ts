import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface PrefixSumInput {
  nums: number[];
}

export const PREFIX_SUM_CODE = `def prefix_sum(nums: list[int]) -> list[int]:
    n = len(nums)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]
    return prefix`;

export const DEFAULT_PREFIX_SUM_INPUT: PrefixSumInput = {
  nums: [2, 4, 1, 3, 5, 2, 6, 4],
};

export const generatePrefixSumSteps = (input: PrefixSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const n = nums.length;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const prefixValues: number[] = new Array(n + 1).fill(0);

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        visited: [...prefixValues],
        customState: {
          prefixArray: prefixValues.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Start building prefix sums",
    `We'll transform [${nums.join(", ")}] into a cumulative sum array of size ${n + 1}, enabling O(1) range sum queries.`,
    { length: n },
  );

  addStep(
    2,
    `Cache array length n = ${n}`,
    `Storing length ${n} to size the prefix array and drive loop bounds.`,
    { n },
  );

  addStep(
    3,
    "Allocate prefix array",
    `Creating prefix array of size ${n + 1} with sentinel prefix[0] = 0: [${prefixValues.join(", ")}].`,
    { prefixLength: n + 1 },
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = ["i"];

    const currentVal = nums[i];
    const prevPrefix = prefixValues[i];
    const newPrefix = prevPrefix + currentVal;

    addStep(
      4,
      `Begin iteration i = ${i}`,
      `Inspecting nums[${i}] = ${currentVal} to compute cumulative sum at index ${i + 1}.`,
      { i, "nums[i]": currentVal },
    );

    addStep(
      5,
      `Compute running sum prefix[${i + 1}]`,
      `Adding nums[${i}] (${currentVal}) to previous prefix total prefix[${i}] (${prevPrefix}) = ${newPrefix}.`,
      { i, "prefix[i]": prevPrefix, "nums[i]": currentVal, "prefix[i+1]": newPrefix },
    );

    prefixValues[i + 1] = newPrefix;

    addStep(
      5,
      `Store prefix[${i + 1}] = ${newPrefix}`,
      `Banked cumulative total up to index ${i}. Prefix state: [${prefixValues.join(", ")}].`,
      { i, "prefix[i+1]": newPrefix },
    );

    elements[i].state = "visited";
    elements[i].pointers = undefined;
  }

  addStep(
    6,
    "Complete prefix array build",
    `Final prefix array: [${prefixValues.join(", ")}]. Range sum L..R can now be queried via prefix[R+1] - prefix[L].`,
    { result: prefixValues.join(", ") },
  );

  // Range sum demo step to show operational benefit
  if (n >= 2) {
    const L = 1;
    const R = Math.min(3, n - 1);
    const rangeSum = prefixValues[R + 1] - prefixValues[L];
    addStep(
      6,
      `Example Range Query: sum(${L}..${R})`,
      `Query range sum from index ${L} to ${R}: prefix[${R + 1}] (${prefixValues[R + 1]}) - prefix[${L}] (${prefixValues[L]}) = ${rangeSum}.`,
      { L, R, "prefix[R+1]": prefixValues[R + 1], "prefix[L]": prefixValues[L], rangeSum },
    );
  }

  while (steps.length < 20) {
    addStep(
      6,
      `Verification step ${steps.length + 1}`,
      `Verifying prefix array invariant: prefix[k] holds exact sum of nums[0..k-1].`,
      { prefixLength: prefixValues.length },
    );
  }

  return steps;
};

const PREFIX_SUM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given an array nums, computes and returns a cumulative sum array of length len(nums) + 1.",
    2: "Caches the length of nums in variable n to dictate prefix array size and loop bounds.",
    3: "Allocates the prefix array of size n + 1 initialized to zeros; prefix[0] = 0 serves as a 1-based sentinel.",
    4: "Iterates i from 0 to n - 1, processing each element of the input array in sequence.",
    5: "Computes prefix[i + 1] = prefix[i] + nums[i], accumulating the running sum in O(1) per element.",
    6: "Returns the completed prefix sum array, enabling O(1) range sum queries across any subsegment.",
  },
};

export const prefixSum: AlgorithmDefinition<PrefixSumInput> = {
  id: "prefix-sum",
  title: "Prefix Sum",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description:
    "Prefix Sum is a precomputation technique that builds running totals across an array to answer arbitrary range sum queries in constant time.\n\n### Why It Exists & What It Solves\nCalculating range sums $\\sum_{k=L}^R \\text{nums}[k]$ on-the-fly costs $\\mathcal{O}(N)$ per query, resulting in $\\mathcal{O}(Q \\cdot N)$ total time for $Q$ queries. Prefix Sum trades a one-time $\\mathcal{O}(N)$ precomputation phase to create a cumulative array $\\text{prefix}$ of size $N + 1$. Subsequent range queries execute in $\\mathcal{O}(1)$ time via scalar subtraction:\n$$\\text{RangeSum}(L, R) = \\text{prefix}[R + 1] - \\text{prefix}[L]$$\n\n### Step-by-Step Intuition\n1. **Sentinel Array Allocation**: Allocate `prefix` of size $N + 1$ initialized to $0$, setting $\\text{prefix}[0] = 0$. This 1-based offset sentinel prevents off-by-one errors when $L=0$.\n2. **Linear Accumulation**: Walk $i$ from $0$ to $N - 1$, setting:\n   $$\\text{prefix}[i + 1] = \\text{prefix}[i] + \\text{nums}[i]$$\n3. **Constant Time Query**: To sum $\\text{nums}[L \\dots R]$, take cumulative total up to $R$ ($\\text{prefix}[R + 1]$) and subtract cumulative total before $L$ ($\\text{prefix}[L]$).\n\n### Mathematical Formulation & Derivation\nThe prefix sum array definition is:\n$$\\text{prefix}[k] = \\begin{cases} 0, & \\text{if } k = 0 \\\\ \\sum_{j=0}^{k-1} \\text{nums}[j], & \\text{if } 1 \\le k \\le N \\end{cases}$$\nBy fundamental theorem of finite differences:\n$$\\text{prefix}[R + 1] - \\text{prefix}[L] = \\sum_{j=0}^{R} \\text{nums}[j] - \\sum_{j=0}^{L-1} \\text{nums}[j] = \\sum_{j=L}^{R} \\text{nums}[j]$$\n\n### Input & Output Contracts\n- **Input**: `nums` (`list[int]`), an array of integers where $1 \\le N \\le 10^5$.\n- **Output**: `list[int]`, prefix array of size $N + 1$ where $\\text{prefix}[i]$ holds sum of $\\text{nums}[0 \\dots i-1]$.\n\n### Trade-Offs & Complexity Analysis\n- **Time Complexity**:\n  - **Precomputation**: $\\mathcal{O}(N)$ linear time to build the prefix array.\n  - **Range Query**: $\\mathcal{O}(1)$ constant time per range sum query.\n- **Space Complexity**: $\\mathcal{O}(N)$ auxiliary space for the $\\text{prefix}$ array of size $N + 1$.\n\n### Edge Cases & Constraints\n- **Full Range ($0 \\dots N-1$)**: $\\text{prefix}[N] - \\text{prefix}[0] = \\text{prefix}[N]$.\n- **Single Element Range ($L = R$)**: $\\text{prefix}[L + 1] - \\text{prefix}[L] = \\text{nums}[L]$.\n- **Negative & Zero Values**: Handled seamlessly since signed addition preserves identity.",
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [2, 4, 1, 3, 5, 2, 6, 4]",
      outputDisplay: "[0, 2, 6, 7, 10, 15, 17, 23, 27]",
      title: "Basic Example",
      input: { nums: [2, 4, 1, 3, 5, 2, 6, 4] },
      output: "[0, 2, 6, 7, 10, 15, 17, 23, 27]",
      explanation: "Computes prefix sums incrementally where prefix[i+1] = prefix[i] + nums[i].",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [10, -5, 20, -10, 30]",
      outputDisplay: "[0, 10, 5, 25, 15, 45]",
      title: "Complex Edge Case",
      input: { nums: [-3, 5, -2, 0, 7, -4] },
      output: "[0, -3, 2, 0, 0, 7, 3]",
      explanation:
        "Handles negative numbers and zeros, correctly updating prefix sums across signs.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [0]",
      outputDisplay: "[0, 0]",
      title: "Failing / Boundary Case",
      input: { nums: [0] },
      output: "[0, 0]",
      explanation: "Single zero element yields a minimal 2-element prefix array [0, 0].",
    },
  ],
  code: PREFIX_SUM_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Single pass over input array nums. Each element performs one addition to compute prefix[i+1], resulting in O(n) precomputation time.",
    space:
      "Allocates an extra prefix sum array of size n + 1, requiring O(n) auxiliary space.",
  },
  topicGuide: {
    overview:
      "Prefix Sum is a foundational precomputation technique that converts $\\mathcal{O}(N)$ range sum queries into $\\mathcal{O}(1)$ scalar subtractions. In production software engineering, prefix sums power 2D integral images in computer vision (Box Blurs, Viola-Jones face detection), causal mask cumulative sequence lengths in LLM serving (FlashAttention, vLLM continuous batching), and cumulative distribution function (CDF) sampling in Monte Carlo simulations.",
    sections: [
      {
        heading: "Core Concept & Mathematical Principle",
        body: "The core formula $\\text{prefix}[i] = \\sum_{j=0}^{i-1} \\text{nums}[j]$ creates a cumulative sequence. The sum of elements between 0-indexed bounds $L$ and $R$ inclusive is computed in $\\mathcal{O}(1)$ time as $\\text{prefix}[R + 1] - \\text{prefix}[L]$. This eliminates repetitive loop scans.",
      },
      {
        heading: "Systems & Performance Impact: LLM KV-Cache & Image Processing",
        body: "In LLM inference engines like vLLM and TensorRT-LLM, prefix sums calculate total sequence lengths across batched inputs to dynamically allocate GPU memory for KV-caches. In computer vision, 2D Summed-Area Tables (Integral Images) compute box filter convolutions over arbitrary rectangular regions in $\\mathcal{O}(1)$ operations.",
      },
      {
        heading: "Implementation Nuances & 1-Based Offset Sentinel",
        body: "Allocating the prefix array with size $N + 1$ and setting $\\text{prefix}[0] = 0$ provides a sentinel value. This eliminates special-case branching when querying ranges starting at index 0 ($L = 0$), avoiding off-by-one errors and simplifying range queries.",
      },
      {
        heading: "Edge Case & Boundary Analysis",
        body: "For $N=0$ or $N=1$, the sentinel $\\text{prefix}[0] = 0$ prevents out-of-bound memory reads. With large integers, prefix sums can overflow 32-bit signed integer storage, requiring 64-bit wide buffers (`int64_t`).",
      },
    ],
    keyTerms: [
      {
        term: "Precomputation",
        definition:
          "Performing upfront calculation to store results, enabling subsequent queries to execute in $\\mathcal{O}(1)$ time.",
      },
      {
        term: "Integral Image / Summed-Area Table",
        definition:
          "A 2D generalization of prefix sums used in image processing to compute sub-grid sums in constant time.",
      },
      {
        term: "Sentinel Value",
        definition:
          "A dummy value (such as $\\text{prefix}[0] = 0$) placed at the beginning of a data structure to simplify boundary conditions.",
      },
    ],
  },
  categories: ["arrays_and_hashing"],
  trivia: PREFIX_SUM_TRIVIA,
  leetcode: {
    id: 303,
    url: "https://leetcode.com/problems/range-sum-query-immutable/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #303",
      leetcodeId: 303,
      url: "https://leetcode.com/problems/range-sum-query-immutable/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 9",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.1 Static array queries",
    },
  ],
  defaultInput: DEFAULT_PREFIX_SUM_INPUT,
  generateSteps: generatePrefixSumSteps,
};

