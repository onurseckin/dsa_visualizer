import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

export const DEFAULT_KADANE_INPUT: number[] = [-2, 1, -3, 4, -1, 2, 1, -5, 4];

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Given an array of numbers containing both positive and negative values, Kadane's Algorithm finds the contiguous subarray with the maximum possible sum in a single linear pass.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -2, label: "[0]", state: "default" },
        { id: "c2", value: 4, label: "[1]", state: "default" },
        { id: "c3", value: -1, label: "[2]", state: "default" },
        { id: "c4", value: 3, label: "[3]", state: "default" },
        { id: "c5", value: -5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "A naive brute-force solution checks all N × (N + 1) / 2 contiguous subarrays by computing the sum of every possible start and end index pair, requiring O(N²) or O(N³) time.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -2, label: "[0]", state: "default" },
        { id: "c2", value: 4, label: "[1]", state: "compare", pointers: ["start"] },
        { id: "c3", value: -1, label: "[2]", state: "compare" },
        { id: "c4", value: 3, label: "[3]", state: "compare", pointers: ["end"] },
        { id: "c5", value: -5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The key insight of Kadane's algorithm is dynamic programming: at each index i, we decide whether to extend the maximal subarray ending at index i-1 or start a fresh subarray at index i.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -2, label: "[0]", state: "visited" },
        { id: "c2", value: 4, label: "[1]", state: "active" },
        { id: "c3", value: -1, label: "[2]", state: "active" },
        { id: "c4", value: 3, label: "[3]", state: "active", pointers: ["i"] },
        { id: "c5", value: -5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We maintain a running total 'current_max' for the best subarray sum ending at position i. If current_max drops below nums[i], the previous prefix sum is negative and hurts future subtotals.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -2, label: "[0]", state: "compare", pointers: ["negative prefix"] },
        { id: "c2", value: 4, label: "[1]", state: "active", pointers: ["i"] },
        { id: "c3", value: -1, label: "[2]", state: "default" },
        { id: "c4", value: 3, label: "[3]", state: "default" },
        { id: "c5", value: -5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "When current_max + nums[i] < nums[i] (meaning current_max < 0), we discard the negative-sum prefix and set temp_start = i to begin a new candidate subarray at index i.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -2, label: "[0]", state: "visited" },
        { id: "c2", value: 4, label: "[1]", state: "active", pointers: ["temp_start", "i"] },
        { id: "c3", value: -1, label: "[2]", state: "default" },
        { id: "c4", value: 3, label: "[3]", state: "default" },
        { id: "c5", value: -5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Simultaneously, we maintain 'global_max' to record the highest subarray sum encountered anywhere so far, updating 'start' and 'end' boundary markers whenever global_max is surpassed.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -2, label: "[0]", state: "visited" },
        { id: "c2", value: 4, label: "[1]", state: "sorted", pointers: ["start"] },
        { id: "c3", value: -1, label: "[2]", state: "sorted" },
        { id: "c4", value: 3, label: "[3]", state: "sorted", pointers: ["end"] },
        { id: "c5", value: -5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "For arrays with all negative numbers, Kadane's algorithm correctly resolves to the single element with the maximum (least negative) value, preventing empty subarray returns.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -8, label: "[0]", state: "default" },
        { id: "c2", value: -3, label: "[1]", state: "sorted", pointers: ["max"] },
        { id: "c3", value: -6, label: "[2]", state: "default" },
        { id: "c4", value: -5, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Because each element is visited exactly once and intermediate state is tracked using scalar variables, Kadane's algorithm achieves optimal O(N) linear time and O(1) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: -2, label: "[0]", state: "visited" },
        { id: "c2", value: 4, label: "[1]", state: "sorted", pointers: ["start"] },
        { id: "c3", value: -1, label: "[2]", state: "sorted" },
        { id: "c4", value: 3, label: "[3]", state: "sorted", pointers: ["end"] },
        { id: "c5", value: -5, label: "[4]", state: "visited" },
      ],
    },
  },
];

export const generateKadaneMaxSubarraySteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawInput = Array.isArray(input) && input.length > 0 ? input : DEFAULT_KADANE_INPUT;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input) &&
      input.length === DEFAULT_KADANE_INPUT.length &&
      input.every((val, idx) => val === DEFAULT_KADANE_INPUT[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const n = rawInput.length;
  let currentMax = n > 0 ? rawInput[0] : 0;
  let globalMax = n > 0 ? rawInput[0] : 0;
  let start = 0;
  let end = 0;
  let tempStart = 0;

  const makeSnapshot = (
    currentI?: number,
    inTempStart?: number,
    inStart?: number,
    inEnd?: number,
    isRecordUpdate?: boolean,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = rawInput.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === currentI) ptrs.push("i");
      if (idx === inTempStart && isRecordUpdate !== true) ptrs.push("temp_start");
      if (isRecordUpdate === true && idx === inStart) ptrs.push("start");
      if (isRecordUpdate === true && idx === inEnd && inEnd !== inStart) ptrs.push("end");

      let state: ArrayElement["state"] = "default";
      if (
        isRecordUpdate === true &&
        inStart !== undefined &&
        inEnd !== undefined &&
        idx >= inStart &&
        idx <= inEnd
      ) {
        state = "sorted";
      } else if (idx === currentI) {
        state = "active";
      } else if (
        inTempStart !== undefined &&
        currentI !== undefined &&
        idx >= inTempStart &&
        idx <= currentI
      ) {
        state = "compare";
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? Array.from(new Set(ptrs)) : undefined,
      };
    });

    return {
      kind: "array",
      name: "nums",
      mode: "box",
      elements,
    };
  };

  if (n === 0) {
    addStep(
      "The input array is empty, so there are no elements to build a contiguous subarray from; the maximum subarray sum defaults to 0.",
      {
        kind: "array",
        name: "nums",
        mode: "box",
        elements: [],
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected input array of ${n} elements. We initialize current_max = nums[0] = ${rawInput[0]} and global_max = ${rawInput[0]}.`,
    makeSnapshot(0, 0, 0, 0),
  );

  for (let i = 1; i < n; i++) {
    const num = rawInput[i];
    const extendedSum = currentMax + num;

    if (num > extendedSum) {
      currentMax = num;
      tempStart = i;
      addStep(
        `At index ${i} (nums[${i}] = ${num}): extending the previous subarray yields ${extendedSum}, which is smaller than ${num} alone. We discard the negative prefix and set temp_start = ${i} to start a new subarray.`,
        makeSnapshot(i, tempStart, start, end, false),
      );
    } else {
      currentMax = extendedSum;
      addStep(
        `At index ${i} (nums[${i}] = ${num}): extending the previous subarray with ${num} yields a larger current_max = ${currentMax}.`,
        makeSnapshot(i, tempStart, start, end, false),
      );
    }

    if (currentMax > globalMax) {
      globalMax = currentMax;
      start = tempStart;
      end = i;
      addStep(
        `Current subarray sum ${currentMax} exceeds global_max (${globalMax})! Update global_max = ${globalMax} and set optimal boundaries to start = ${start}, end = ${end}.`,
        makeSnapshot(i, tempStart, start, end, true),
      );
    }
  }

  addStep(
    `Scan complete! The maximum contiguous subarray sum is ${globalMax}, spanning indices [${start}...${end}] with elements [${rawInput.slice(start, end + 1).join(", ")}].`,
    makeSnapshot(undefined, undefined, start, end),
  );

  return steps;
};

const KADANE_MAX_SUBARRAY_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "current_max = max(nums[i], global_max + nums[i])",
    "if current_max < 0:",
    "global_max = current_max + nums[i]",
    "for i in range(len(nums)):",
  ],
  hints: [
    {
      line: 9,
      hint: "Decide whether extending the previous subarray is better than starting a new subarray at current index.",
    },
    {
      line: 10,
      hint: "Reset current_max to current element when starting a new subarray.",
    },
    {
      line: 14,
      hint: "Compare local current_max against historical best global_max record.",
    },
  ],
  lineExplanations: {
    1: "Declares function kadane_max_subarray: computes maximum contiguous subarray sum.",
    2: "Initializes current_max with the first element value nums[0].",
    3: "Initializes global_max with the first element value nums[0].",
    4: "Initializes boundary index registers start, end, and temp_start to 0.",
    5: "Iterates through array from index 1 to N-1.",
    6: "Checks if starting a new subarray at nums[i] yields a larger sum than extending current_max.",
    7: "Resets current_max = nums[i] and temp_start = i when starting a new subarray.",
    8: "Extends running current_max by adding nums[i].",
    9: "Checks if current running sum exceeds historical best global_max record.",
    10: "Updates global_max, start, and end indices upon discovering a new record sum.",
    11: "Returns the global maximum contiguous subarray sum.",
  },
};

export const kadaneMaxSubarray: AlgorithmDefinition<number[]> = {
  id: "kadane-max-subarray",
  title: "Kadane's Algorithm (Maximum Subarray)",
  topicIds: ["arrays_and_hashing"],
  difficulty: "Medium",
  description: `<p>Given an integer array <code>nums</code>, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.</p>
<h3>Problem Statement</h3>
<p>Given an integer array <code>nums</code>, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum. A subarray is a contiguous part of an array.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: An array of integers containing positive and negative numbers.</li>
</ul>
<h3>Output</h3>
<p>Returns an integer representing the maximum sum of any non-empty contiguous subarray.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; nums.length &le; 10<sup>5</sup></code>.</li>
  <li><code>-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup></code>.</li>
  <li>All negative numbers: Returns the single least-negative (maximum) element.</li>
  <li>Single element input (N=1): Returns <code>nums[0]</code>.</li>
</ul>`,
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
      outputDisplay: "6",
      title: "Standard Array with Mixed Values",
      input: DEFAULT_KADANE_INPUT,
      output: "6",
      explanation: "The contiguous subarray [4, -1, 2, 1] has the largest sum = 6.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [5, 4, -1, 7, 8]",
      outputDisplay: "23",
      title: "Adversarial All-Positive Dip",
      input: [5, 4, -1, 7, 8],
      output: "23",
      explanation:
        "All positive elements except -1; the maximum subarray spans the entire array with sum 23.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [-8, -3, -6, -2, -5]",
      outputDisplay: "-2",
      title: "Boundary All-Negative Array",
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
  defaultInput: DEFAULT_KADANE_INPUT,
  generateSteps: generateKadaneMaxSubarraySteps,
};

export default kadaneMaxSubarray;
