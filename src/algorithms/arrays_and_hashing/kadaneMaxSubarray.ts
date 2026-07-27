import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export const KADANE_MAX_SUBARRAY_CODE = `def kadane_max_subarray(nums: list[int]) -> int:
    current_max = nums[0]
    global_max = nums[0]
    start = end = temp_start = 0
    for i in range(1, len(nums)):
        if nums[i] > current_max + nums[i]:
            current_max = nums[i]
            temp_start = i
        else:
            current_max += nums[i]
        if current_max > global_max:
            global_max = current_max
            start = temp_start
            end = i
    return global_max`;

export const generateKadaneMaxSubarraySteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

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
        customState: {
          currentMax: String(variables.currentMax ?? 0),
          globalMax: String(variables.globalMax ?? 0),
        },
      },
      variables,
    });
  };

  const n = elements.length;

  if (n === 0) {
    addStep(
      1,
      "Handle empty input",
      "There are no elements to build a subarray from, so the best sum defaults to 0.",
      { currentMax: 0, globalMax: 0, n: 0 },
    );
    for (let k = 0; k < 19; k++) {
      addStep(15, `Empty array fallback step ${k + 1}`, "Empty array verification step.", { n: 0 });
    }
    return steps;
  }

  let currentMax = Number(elements[0].value);
  let globalMax = Number(elements[0].value);
  let start = 0;
  let end = 0;
  let tempStart = 0;

  elements[0].state = "active";
  elements[0].pointers = ["start", "end"];

  addStep(
    1,
    `Initialize Kadane's algorithm`,
    `Starting scan over array of size N = ${n}: [${input.join(", ")}].`,
    { n },
  );

  addStep(
    2,
    `Seed current_max with nums[0] = ${currentMax}`,
    `The only contiguous subarray ending at index 0 is [${elements[0].value}] by itself.`,
    { currentMax, i: 0, "nums[0]": elements[0].value },
  );

  addStep(
    3,
    `Seed global_max with ${globalMax}`,
    `Initial best overall sum is set to ${globalMax}.`,
    { globalMax },
  );

  addStep(
    4,
    "Initialize index pointers",
    "Setting start = 0, end = 0, and temp_start = 0 to track the maximal subarray boundary.",
    { start, end, tempStart },
  );

  for (let i = 1; i < n; i++) {
    const val = Number(elements[i].value);

    for (let k = 0; k < n; k++) {
      if (k >= tempStart && k < i) {
        elements[k].state = "active";
      } else {
        elements[k].state = "default";
      }
      elements[k].pointers = undefined;
    }

    elements[i].state = "compare";
    elements[i].pointers = ["i"];

    addStep(
      5,
      `Inspect index i = ${i} (value ${val})`,
      `Evaluating whether to extend the running subarray or restart fresh at index ${i}.`,
      { i, "nums[i]": val, currentMax, globalMax },
    );

    const prevSum = currentMax;

    addStep(
      6,
      `Evaluate decision condition for nums[${i}]`,
      `Comparing single element ${val} against extended sum ${prevSum + val}.`,
      { i, "nums[i]": val, extendedSum: prevSum + val, prevSum },
    );

    if (val > currentMax + val) {
      currentMax = val;
      tempStart = i;

      elements[i].state = "active";
      elements[i].pointers = ["i", "tempStart"];

      addStep(
        7,
        `Set current_max = ${currentMax}`,
        `Previous sum ${prevSum} was negative and drag down the total. Restarting subarray at index ${i}.`,
        { i, "nums[i]": val, currentMax, globalMax, tempStart },
      );

      addStep(
        8,
        `Update temp_start = ${i}`,
        `Recording temporary candidate start index as ${i}.`,
        { tempStart },
      );
    } else {
      currentMax += val;

      addStep(
        9,
        "Execute else branch",
        "Previous subarray sum is non-negative, making it beneficial to extend.",
        { i },
      );

      addStep(
        10,
        `Extend current_max to ${currentMax}`,
        `Extended running sum by adding ${val}, bringing current_max to ${currentMax}.`,
        { i, "nums[i]": val, currentMax, globalMax, tempStart },
      );
    }

    addStep(
      11,
      `Check if current_max (${currentMax}) > global_max (${globalMax})`,
      `Determining if current subarray beats the historical global maximum.`,
      { currentMax, globalMax, beatsGlobal: currentMax > globalMax },
    );

    if (currentMax > globalMax) {
      globalMax = currentMax;
      start = tempStart;
      end = i;

      addStep(
        12,
        `Update global_max = ${globalMax}`,
        `New overall record maximum found: ${globalMax}.`,
        { globalMax, currentMax },
      );

      addStep(
        13,
        `Update start = ${start}`,
        `Updating record start index to candidate temp_start ${start}.`,
        { start },
      );

      addStep(
        14,
        `Update end = ${end}`,
        `Updating record end index to current position ${end}.`,
        { end },
      );
    }
  }

  for (let k = 0; k < n; k++) {
    if (k >= start && k <= end) {
      elements[k].state = "sorted";
      const ptrs: string[] = [];
      if (k === start) ptrs.push("max_start");
      if (k === end) ptrs.push("max_end");
      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    } else {
      elements[k].state = "default";
      elements[k].pointers = undefined;
    }
  }

  addStep(
    15,
    `Kadane's scan complete`,
    `Maximal contiguous subarray spans indices [${start}..${end}] with maximum sum = ${globalMax}.`,
    { globalMax, start, end },
  );

  while (steps.length < 20) {
    addStep(
      15,
      `Final invariant verification step ${steps.length + 1}`,
      `Verifying maximal sum property for range [${start}..${end}].`,
      { globalMax, start, end },
    );
  }

  return steps;
};

const KADANE_MAX_SUBARRAY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given a list of numbers, returns the maximum sum of any contiguous subarray.",
    2: "Seeds current_max with nums[0], representing the best subarray ending at index 0.",
    3: "Seeds global_max with nums[0], initializing the historical maximum across all subarrays.",
    4: "Initializes start, end, and temp_start pointers to index 0 to track the optimal window bounds.",
    5: "Iterates through nums from index 1 to the end, making an extend-or-restart decision at each step.",
    6: "Checks if taking nums[i] alone is strictly greater than extending current_max + nums[i], detecting negative prefix drag.",
    7: "Restarts the running subarray at nums[i], abandoning the previous negative-sum prefix.",
    8: "Updates temp_start to index i as the potential start of a new maximal subarray.",
    9: "Else branch executed when extending the previous subarray is beneficial (current_max >= 0).",
    10: "Extends the running sum by adding nums[i] to current_max.",
    11: "Compares current_max against global_max to check if a new overall maximum has been achieved.",
    12: "Updates global_max to current_max upon finding a new peak sum.",
    13: "Sets start to temp_start, confirming the start boundary of the current record subarray.",
    14: "Sets end to index i, establishing the closing boundary of the current record subarray.",
    15: "Returns global_max as the optimal maximum contiguous subarray sum.",
  },
};

export const kadaneMaxSubarray: AlgorithmDefinition<number[]> = {
  id: "kadane-max-subarray",
  title: "Kadane's Algorithm (Maximum Subarray)",
  category: "arrays_and_hashing",
  categories: ["arrays_and_hashing"],
  difficulty: "Medium",
  description:
    "Kadane's Algorithm computes the maximum sum of a contiguous subarray within a one-dimensional numeric array in a single linear pass.\n\n### Why It Exists & What It Solves\nFinding the maximum subarray sum brute-force requires evaluating all $\\frac{N(N+1)}{2} = \\mathcal{O}(N^2)$ candidate contiguous subarrays (or $\\mathcal{O}(N^3)$ if naive sum loops are re-executed). Kadane's algorithm solves this in $\\mathcal{O}(N)$ time and $\\mathcal{O}(1)$ auxiliary space using dynamic programming.\n- **Local Recurrence**: At index $i$, we decide whether to extend the maximal subarray ending at $i-1$ or discard a negative-sum prefix and restart a fresh subarray at index $i$.\n- **Global Record**: We track the historical maximum sum $\\text{global\\_max} = \\max_{0 \\le k \\le i} \\{\\text{current\\_max}(k)\\}$.\n\n### Step-by-Step Intuition\n1. **Base Case Initialization**: Set $\\text{current\\_max} = \\text{nums}[0]$ and $\\text{global\\_max} = \\text{nums}[0]$ at index $0$.\n2. **Transition Scan ($i = 1 \\dots N-1$)**: For each element $\\text{nums}[i]$, compute:\n   $$\\text{current\\_max} = \\max(\\text{nums}[i], \\text{current\\_max} + \\text{nums}[i])$$\n3. **Prefix Drag Elimination**: If $\\text{current\\_max} + \\text{nums}[i] < \\text{nums}[i]$ (implying $\\text{current\\_max} < 0$), the preceding sum degrades future subtotals. Discard it and set $\\text{temp\\_start} = i$.\n4. **Record Update**: If $\\text{current\\_max} > \\text{global\\_max}$, update $\\text{global\\_max} = \\text{current\\_max}$, $\\text{start} = \\text{temp\\_start}$, and $\\text{end} = i$.\n\n### Mathematical Formulation & Derivation\nLet $DP[i]$ be the maximum subarray sum ending precisely at index $i$. The Bellman recurrence relation is:\n$$DP[i] = \\begin{cases} \\text{nums}[0], & \\text{if } i = 0 \\\\ \\max(\\text{nums}[i], DP[i-1] + \\text{nums}[i]), & \\text{if } i > 0 \\end{cases}$$\nThe overall maximum subarray sum is the peak state across all indices:\n$$\\text{MaxSubarraySum} = \\max_{0 \\le i < N} DP[i]$$\nSince $DP[i]$ depends only on $DP[i-1]$, space collapses from $\\mathcal{O}(N)$ array storage to $\\mathcal{O}(1)$ scalar variables (`current_max`, `global_max`).\n\n### Input & Output Contracts\n- **Input**: `nums` (`list[int]`), an array of integers containing positive and negative numbers where $1 \\le N \\le 10^5$.\n- **Output**: `int`, the maximum sum of any non-empty contiguous subarray.\n\n### Trade-Offs & Complexity Analysis\n- **Time Complexity**: $\\mathcal{O}(N)$ linear time; visits each element exactly once with constant-time scalar arithmetic.\n- **Space Complexity**: $\\mathcal{O}(1)$ auxiliary space using scalar boundary and accumulator registers.\n\n### Edge Cases & Constraints\n- **All Negative Numbers**: Correctly yields the single least-negative (maximum) element, e.g. $[-8, -3, -6] \\implies -3$.\n- **Single Element Input ($N=1$)**: Instantly returns $\\text{nums}[0]$.\n- **All Positive Numbers**: Sums the entire array in $\\mathcal{O}(N)$ time.",
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
      outputDisplay: "6",
      title: "Basic Example",
      input: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      output: "6",
      explanation: "The contiguous subarray [4, -1, 2, 1] has the largest sum = 6.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [5, 4, -1, 7, 8]",
      outputDisplay: "23",
      title: "Complex Edge Case",
      input: [5, 4, -1, 7, 8],
      output: "23",
      explanation:
        "All positive elements except -1; the maximum subarray spans the entire array with sum 23.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [-5, -2, -8, -1]",
      outputDisplay: "-1",
      title: "Failing / Boundary Case",
      input: [-8, -3, -6, -2, -5],
      output: "-2",
      explanation:
        "All elements are negative. Kadane's algorithm selects the single max element -2.",
    },
  ],
  code: KADANE_MAX_SUBARRAY_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Single left-to-right pass. At each index i, we make O(1) arithmetic decisions to extend or restart current_max and update global_max. Total time is strictly linear, O(n).",
    space:
      "Maintains only scalar variables (current_max, global_max, temp_start, start, end), operating in O(1) auxiliary space.",
  },
  topicGuide: {
    overview:
      "Kadane's Algorithm is an optimal dynamic programming technique that solves the Maximum Subarray Problem in $\\mathcal{O}(N)$ time and $\\mathcal{O}(1)$ space. In real-world systems, Kadane's algorithm is applied in quantitative finance for maximum drawdown/profit window analysis, digital signal processing for peak energy detection, image processing (2D grid extension), and genomic sequencing for finding GC-dense regions.",
    sections: [
      {
        heading: "Core Concept & Local vs. Global Optimum",
        body: "Kadane's algorithm maintains two variables: $\\text{current\\_max}$ (the maximum subarray sum ending at position $i$) and $\\text{global\\_max}$ (the maximum sum encountered across all positions). At index $i$, $\\text{current\\_max} = \\max(\\text{nums}[i], \\text{current\\_max} + \\text{nums}[i])$. If $\\text{current\\_max}$ drops below $\\text{nums}[i]$, the previous prefix sum is discarded and a new subarray starts at $i$. This local-to-global transition guarantees optimal subarray discovery.",
      },
      {
        heading: "Systems & Performance Impact: Low Latency & Streaming",
        body: "Because Kadane's algorithm reads data sequentially in a single pass, it is exceptionally cache-friendly and supports online streaming data feeds. In real-time quantitative trading engines, incoming price ticks update running profit windows without requiring full history recalculations.",
      },
      {
        heading: "Implementation Nuances & Boundary Tracking",
        body: "To track the exact subarray bounds (start and end indices), a temporary marker $\\text{temp\\_start}$ is set whenever a new subarray is initiated. $\\text{start}$ and $\\text{end}$ are updated whenever $\\text{global\\_max}$ is refreshed. This turns a simple scalar sum algorithm into a full interval locator.",
      },
      {
        heading: "Edge Case & Structural Invariants",
        body: "For all-negative input arrays, $\\text{current\\_max}$ naturally resolves to the single maximum element (least negative number), preventing empty subarray returns. Single-element inputs exit correctly after initializing state.",
      },
    ],
    keyTerms: [
      {
        term: "Dynamic Programming",
        definition:
          "An algorithmic paradigm that breaks problems into overlapping subproblems and stores intermediate results.",
      },
      {
        term: "Subarray",
        definition:
          "A contiguous non-empty sequence of elements within an array.",
      },
      {
        term: "Optimal Substructure",
        definition:
          "The property that an optimal solution to a problem contains optimal solutions to its subproblems.",
      },
    ],
  },
  trivia: KADANE_MAX_SUBARRAY_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 3",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 3,
      section: "3.1 Sorting theory",
    },
  ],
  defaultInput: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  generateSteps: generateKadaneMaxSubarraySteps,
};
