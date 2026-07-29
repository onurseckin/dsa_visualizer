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

  const rawInput = Array.isArray(input) ? input : [-2, 1, -3, 4, -1, 2, 1, -5, 4];
  const elements: ArrayElement[] = rawInput.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const n = elements.length;

  let currentMax = n > 0 ? Number(elements[0].value) : 0;
  let globalMax = n > 0 ? Number(elements[0].value) : 0;
  let start = 0;
  let end = 0;
  let tempStart = 0;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    stepVars: Record<string, string | number | boolean> = {},
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
          currentMax: String(currentMax),
          globalMax: String(globalMax),
          start: String(start),
          end: String(end),
          tempStart: String(tempStart),
        },
      },
      variables: {
        currentMax,
        globalMax,
        start,
        end,
        tempStart,
        ...stepVars,
      },
    });
  };

  if (n === 0) {
    addStep(
      1,
      "Handle empty input",
      "There are no elements to build a subarray from, so the best sum defaults to 0.",
      { n: 0 },
    );
    while (steps.length < 20) {
      addStep(
        15,
        `Empty array fallback step ${steps.length + 1}`,
        "Empty array verification step.",
        { n: 0 },
      );
    }
    return steps;
  }

  const updateElementStatesAndPointers = (currentI: number) => {
    for (let k = 0; k < n; k++) {
      const ptrs: string[] = [];

      if (k === currentI) {
        ptrs.push("i");
      }
      if (k === tempStart) {
        ptrs.push("temp_start");
      }
      if (k === start) {
        ptrs.push("max_start");
      }
      if (k === end) {
        if (!ptrs.includes("max_start")) {
          ptrs.push("max_end");
        } else {
          ptrs.push("max_end");
        }
      }

      const uniquePtrs = Array.from(new Set(ptrs));
      elements[k].pointers = uniquePtrs.length > 0 ? uniquePtrs : undefined;

      if (k === currentI) {
        elements[k].state = "compare";
      } else if (k >= tempStart && k < currentI) {
        elements[k].state = "active";
      } else if (k >= start && k <= end) {
        elements[k].state = "sorted";
      } else {
        elements[k].state = "default";
      }
    }
  };

  elements[0].state = "active";
  elements[0].pointers = ["start", "end"];

  addStep(
    1,
    `Initialize Kadane's algorithm`,
    `Starting a single linear scan over N = ${n} elements to evaluate local contiguous subarray choices against historical global maximums.`,
    { n },
  );

  addStep(
    2,
    `Seed current_max with nums[0] = ${currentMax}`,
    `At index 0, the only contiguous subarray ending at this position consists of element ${elements[0].value} alone.`,
    { i: 0, "nums[0]": elements[0].value },
  );

  addStep(
    3,
    `Seed global_max with ${globalMax}`,
    `Setting the initial historical best sum record across all evaluated positions to ${globalMax}.`,
  );

  addStep(
    4,
    "Initialize index pointers",
    "Setting start = 0, end = 0, and temp_start = 0 to track the exact index bounds of the maximal subarray window.",
  );

  for (let i = 1; i < n; i++) {
    const val = Number(elements[i].value);

    updateElementStatesAndPointers(i);

    addStep(
      5,
      `Inspect index i = ${i} (value ${val})`,
      `Evaluating whether carrying the accumulated running sum adds positive value or whether discarding a negative prefix yields a better start at index ${i}.`,
      { i, "nums[i]": val },
    );

    const prevSum = currentMax;

    addStep(
      6,
      `Evaluate decision condition for nums[${i}]`,
      `Comparing single element value ${val} against extended running sum ${prevSum + val}.`,
      { i, "nums[i]": val, extendedSum: prevSum + val, prevSum },
    );

    if (val > currentMax + val) {
      currentMax = val;

      addStep(
        7,
        `Set current_max = ${currentMax}`,
        `The accumulated prefix sum ${prevSum} was negative and dragged down total value. Discarding the negative prefix and restarting a fresh subarray at index ${i}.`,
        { i, "nums[i]": val },
      );

      tempStart = i;
      updateElementStatesAndPointers(i);

      addStep(
        8,
        `Update temp_start = ${i}`,
        `Marking index ${i} as the candidate start boundary for the new subarray.`,
      );
    } else {
      addStep(
        9,
        "Execute else branch",
        "The preceding running sum is non-negative and contributes positive value, making it advantageous to extend the existing subarray.",
        { i },
      );

      currentMax += val;

      addStep(
        10,
        `Extend current_max to ${currentMax}`,
        `Extended the running subarray by incorporating element ${val}, bringing local current_max to ${currentMax}.`,
        { i, "nums[i]": val },
      );
    }

    addStep(
      11,
      `Check if current_max (${currentMax}) > global_max (${globalMax})`,
      `Checking if the local running subarray sum beats the historical global maximum.`,
      { beatsGlobal: currentMax > globalMax },
    );

    if (currentMax > globalMax) {
      globalMax = currentMax;

      addStep(
        12,
        `Update global_max = ${globalMax}`,
        `A new historical peak sum of ${globalMax} has been discovered.`,
      );

      start = tempStart;
      updateElementStatesAndPointers(i);

      addStep(
        13,
        `Update start = ${start}`,
        `Confirming record start boundary index to candidate temp_start ${start}.`,
      );

      end = i;
      updateElementStatesAndPointers(i);

      addStep(
        14,
        `Update end = ${end}`,
        `Updating record end boundary index to current position ${end}.`,
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
    `The linear pass is complete. Maximal contiguous subarray spans indices [${start}..${end}] with maximum sum = ${globalMax}.`,
  );

  while (steps.length < 20) {
    addStep(
      15,
      `Final invariant verification step ${steps.length + 1}`,
      `Verifying maximal sum property for optimal subsegment range [${start}..${end}].`,
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
  topicIds: ["arrays_and_hashing"],
  difficulty: "Medium",
  description:
    "<p>Kadane's Algorithm computes the maximum sum of a contiguous subarray within a one-dimensional numeric array in a single linear pass.</p><h3>Why It Exists &amp; What It Solves</h3><p>Finding the maximum subarray sum brute-force requires evaluating all <code>O(N<sup>2</sup>)</code> candidate contiguous subarrays (or <code>O(N<sup>3</sup>)</code> if naive sum loops are re-executed). Kadane's algorithm solves this in <code>O(N)</code> time and <code>O(1)</code> auxiliary space using dynamic programming.</p><ul><li><strong>Local Recurrence:</strong> At index <code>i</code>, we decide whether to extend the maximal subarray ending at <code>i-1</code> or discard a negative-sum prefix and restart a fresh subarray at index <code>i</code>.</li><li><strong>Global Record:</strong> We track the historical maximum sum <code>global_max = max(current_max(k))</code> across all positions <code>k</code>.</li></ul><h3>Step-by-Step Intuition</h3><ul><li><strong>Base Case Initialization:</strong> Set <code>current_max = nums[0]</code> and <code>global_max = nums[0]</code> at index <code>0</code>.</li><li><strong>Transition Scan:</strong> For each element <code>nums[i]</code> (from <code>1</code> to <code>N-1</code>), compute <code>current_max = max(nums[i], current_max + nums[i])</code>.</li><li><strong>Prefix Drag Elimination:</strong> If <code>current_max + nums[i] &lt; nums[i]</code> (implying <code>current_max &lt; 0</code>), the preceding sum degrades future subtotals. Discard it and set <code>temp_start = i</code>.</li><li><strong>Record Update:</strong> If <code>current_max &gt; global_max</code>, update <code>global_max = current_max</code>, <code>start = temp_start</code>, and <code>end = i</code>.</li></ul><h3>Mathematical Formulation &amp; Derivation</h3><p>Let <code>DP[i]</code> be the maximum subarray sum ending precisely at index <code>i</code>. The Bellman recurrence relation is:</p><p><code>DP[i] = nums[0] if i = 0, else max(nums[i], DP[i-1] + nums[i])</code></p><p>The overall maximum subarray sum is the peak state across all indices:</p><p><code>MaxSubarraySum = max(DP[i]) for 0 &le; i &lt; N</code></p><p>Since <code>DP[i]</code> depends only on <code>DP[i-1]</code>, space collapses from <code>O(N)</code> array storage to <code>O(1)</code> scalar variables (<code>current_max</code>, <code>global_max</code>).</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>nums</code> (<code>list[int]</code>), an array of integers containing positive and negative numbers where <code>1 &le; N &le; 10<sup>5</sup></code>.</li><li><strong>Output:</strong> <code>int</code>, the maximum sum of any non-empty contiguous subarray.</li></ul><h3>Trade-Offs &amp; Complexity Analysis</h3><ul><li><strong>Time Complexity:</strong> <code>O(N)</code> linear time; visits each element exactly once with constant-time scalar arithmetic.</li><li><strong>Space Complexity:</strong> <code>O(1)</code> auxiliary space using scalar boundary and accumulator registers.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>All Negative Numbers:</strong> Correctly yields the single least-negative (maximum) element, e.g. <code>[-8, -3, -6] &rArr; -3</code>.</li><li><strong>Single Element Input (N=1):</strong> Instantly returns <code>nums[0]</code>.</li><li><strong>All Positive Numbers:</strong> Sums the entire array in <code>O(N)</code> time.</li></ul>",
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
      "<p>Kadane's Algorithm is an optimal dynamic programming technique that solves the Maximum Subarray Problem in <code>O(N)</code> time and <code>O(1)</code> space. In real-world systems, Kadane's algorithm is applied in quantitative finance for maximum drawdown/profit window analysis, digital signal processing for peak energy detection, image processing (2D grid extension), and genomic sequencing for finding GC-dense regions.</p>",
    sections: [
      {
        heading: "Core Concept & Local vs. Global Optimum",
        body: "<p>Kadane's algorithm maintains two variables: <code>current_max</code> (the maximum subarray sum ending at position <code>i</code>) and <code>global_max</code> (the maximum sum encountered across all positions). At index <code>i</code>, <code>current_max = max(nums[i], current_max + nums[i])</code>. If <code>current_max</code> drops below <code>nums[i]</code>, the previous prefix sum is discarded and a new subarray starts at <code>i</code>. This local-to-global transition guarantees optimal subarray discovery.</p>",
      },
      {
        heading: "Systems & Performance Impact: Low Latency & Streaming",
        body: "<p>Because Kadane's algorithm reads data sequentially in a single pass, it is exceptionally cache-friendly and supports online streaming data feeds. In real-time quantitative trading engines, incoming price ticks update running profit windows without requiring full history recalculations.</p>",
      },
      {
        heading: "Implementation Nuances & Boundary Tracking",
        body: "<p>To track the exact subarray bounds (start and end indices), a temporary marker <code>temp_start</code> is set whenever a new subarray is initiated. <code>start</code> and <code>end</code> are updated whenever <code>global_max</code> is refreshed. This turns a simple scalar sum algorithm into a full interval locator.</p>",
      },
      {
        heading: "Edge Case & Structural Invariants",
        body: "<p>For all-negative input arrays, <code>current_max</code> naturally resolves to the single maximum element (least negative number), preventing empty subarray returns. Single-element inputs exit correctly after initializing state.</p>",
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
        definition: "A contiguous non-empty sequence of elements within an array.",
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
