import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TwoPointersInput {
  array: number[];
  target: number;
}

export const TWO_POINTERS_CODE = `def subarray_sum(arr: list[int], target: int) -> list[int]:
    left = 0
    current_sum = 0
    for right in range(len(arr)):
        current_sum += arr[right]
        while current_sum > target and left <= right:
            current_sum -= arr[left]
            left += 1
        if current_sum == target:
            return [left, right]
    return [-1, -1]`;

export const DEFAULT_TWO_POINTERS_INPUT: TwoPointersInput = {
  array: [1, 2, 3, 7, 5, 4, 1, 6],
  target: 12,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Subarray Sum problem asks us to find a contiguous window of elements in a non-negative integer array whose elements add up exactly to target sum T.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "default" },
        { id: "c2", value: 2, label: "[1]", state: "default" },
        { id: "c3", value: 3, label: "[2]", state: "default" },
        { id: "c4", value: 7, label: "[3]", state: "default" },
        { id: "c5", value: 5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "A brute-force solution checks all N × (N + 1) / 2 candidate contiguous sub-windows by re-summing every possible start and end index pair, requiring O(N²) or O(N³) time.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "compare", pointers: ["start"] },
        { id: "c2", value: 2, label: "[1]", state: "compare" },
        { id: "c3", value: 3, label: "[2]", state: "compare", pointers: ["end"] },
        { id: "c4", value: 7, label: "[3]", state: "default" },
        { id: "c5", value: 5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Because all array elements are non-negative, the window sum exhibits monotonicity: expanding the right edge increases the sum, while shrinking the left edge decreases it.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "active", pointers: ["left"] },
        { id: "c2", value: 2, label: "[1]", state: "active" },
        { id: "c3", value: 3, label: "[2]", state: "active", pointers: ["right"] },
        { id: "c4", value: 7, label: "[3]", state: "default" },
        { id: "c5", value: 5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We maintain a variable-size sliding window defined by two pointers, 'left' and 'right', initializing both at index 0 and advancing 'right' to accumulate sum.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "active", pointers: ["left", "right"] },
        { id: "c2", value: 2, label: "[1]", state: "default" },
        { id: "c3", value: 3, label: "[2]", state: "default" },
        { id: "c4", value: 7, label: "[3]", state: "default" },
        { id: "c5", value: 5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Whenever current_sum exceeds target T, we shrink the window from the left by subtracting arr[left] from current_sum and incrementing left += 1 until sum ≤ T.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "visited", pointers: ["shrunk"] },
        { id: "c2", value: 2, label: "[1]", state: "active", pointers: ["left"] },
        { id: "c3", value: 3, label: "[2]", state: "active" },
        { id: "c4", value: 7, label: "[3]", state: "active", pointers: ["right"] },
        { id: "c5", value: 5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "When current_sum == T, we have discovered an exact matching contiguous subarray and immediately return the 0-based index bounds [left, right].",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "visited" },
        { id: "c2", value: 2, label: "[1]", state: "sorted", pointers: ["match L"] },
        { id: "c3", value: 3, label: "[2]", state: "sorted" },
        { id: "c4", value: 7, label: "[3]", state: "sorted", pointers: ["match R"] },
        { id: "c5", value: 5, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Amortized linear complexity is guaranteed because pointer 'right' moves rightward at most N times and pointer 'left' moves rightward at most N times, bounding total steps to 2N.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "visited" },
        { id: "c2", value: 2, label: "[1]", state: "visited" },
        { id: "c3", value: 3, label: "[2]", state: "visited" },
        { id: "c4", value: 7, label: "[3]", state: "visited" },
        { id: "c5", value: 5, label: "[4]", state: "active", pointers: ["N steps"] },
      ],
    },
  },
  {
    narrative:
      "Note that non-negativity is mandatory: if negative numbers were present, window sum monotonicity would break, requiring Prefix Sum + Hash Table instead.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "sorted" },
        { id: "c2", value: 2, label: "[1]", state: "sorted" },
        { id: "c3", value: 3, label: "[2]", state: "sorted" },
        { id: "c4", value: 7, label: "[3]", state: "sorted" },
        { id: "c5", value: 5, label: "[4]", state: "sorted" },
      ],
    },
  },
];

export const generateTwoPointersSteps = (input: TwoPointersInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const array =
    Array.isArray(input?.array) && input.array.length > 0
      ? input.array
      : DEFAULT_TWO_POINTERS_INPUT.array;
  const target =
    typeof input?.target === "number" ? input.target : DEFAULT_TWO_POINTERS_INPUT.target;
  const n = array.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input.array) &&
      input.array.length === DEFAULT_TWO_POINTERS_INPUT.array.length &&
      input.target === DEFAULT_TWO_POINTERS_INPUT.target &&
      input.array.every((val, idx) => val === DEFAULT_TWO_POINTERS_INPUT.array[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeSnapshot = (
    leftIdx: number,
    rightIdx: number,
    isMatch: boolean = false,
    isShrinking: boolean = false,
    isEvaluating: boolean = false,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = array.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === leftIdx) ptrs.push(isShrinking ? "shrink L" : "left");
      if (idx === rightIdx) ptrs.push("right");

      let state: ArrayElement["state"] = "default";
      if (isMatch && idx >= leftIdx && idx <= rightIdx) {
        state = "sorted";
      } else if (idx === leftIdx && isShrinking) {
        state = "swap";
      } else if (idx >= leftIdx && idx <= rightIdx) {
        state = isEvaluating ? "compare" : "active";
      } else if (idx < leftIdx) {
        state = "visited";
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    return {
      kind: "array",
      name: "arr",
      mode: "box",
      elements,
    };
  };

  if (n === 0) {
    addStep(
      "The input array is empty, so no contiguous window can be formed; returning [-1, -1].",
      {
        kind: "array",
        name: "arr",
        mode: "box",
        elements: [],
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected input array of ${n} elements with target sum T = ${target}.`,
    makeSnapshot(0, 0, false, false, false),
  );

  let left = 0;
  let currentSum = 0;
  let found = false;

  for (let right = 0; right < n; right++) {
    const rightVal = array[right];
    currentSum += rightVal;

    addStep(
      `Expand window right edge to index ${right} (arr[${right}] = ${rightVal}): running current_sum becomes ${currentSum} (target = ${target}).`,
      makeSnapshot(left, right, false, false, true),
    );

    while (currentSum > target && left <= right) {
      addStep(
        `current_sum (${currentSum}) exceeds target (${target})! Shrink window from left by subtracting arr[${left}] (${array[left]}) and advancing left pointer to ${left + 1}.`,
        makeSnapshot(left, right, false, true),
      );
      currentSum -= array[left];
      left += 1;
    }

    if (currentSum === target) {
      found = true;
      addStep(
        `current_sum (${currentSum}) matches target ${target}! Found contiguous matching subarray spanning indices [${left}, ${right}] with elements [${array.slice(left, right + 1).join(", ")}].`,
        makeSnapshot(left, right, true, false),
      );
      break;
    }
  }

  if (!found) {
    addStep(
      `Scanned entire array of ${n} elements without finding any contiguous window summing to ${target}; returning [-1, -1].`,
      {
        kind: "array",
        name: "arr",
        mode: "box",
        elements: array.map((val, idx) => ({
          id: `el-${idx}`,
          value: val,
          label: `[${idx}]`,
          state: "visited",
        })),
      },
    );
  }

  return steps;
};

const TWO_POINTERS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The variable-size two-pointer sliding window searches for contiguous subarray properties in amortized <code>O(N)</code> time and <code>O(1)</code> space. In non-negative arrays, window expansion strictly increases the running sum while window shrinking strictly decreases it.</p>",
  sections: [
    {
      heading: "Monotonic Window Invariants",
      body: "<p>The algorithm relies on the non-negativity of array elements. When <code>current_sum < target</code>, expanding <code>right</code> is the only way to increase the sum. When <code>current_sum > target</code>, advancing <code>left</code> is the only way to decrease the sum. This bidirectional monotonic behavior eliminates the need to restart window scans.</p>",
    },
    {
      heading: "Amortized Complexity Analysis",
      body: "<p>Although an inner <code>while</code> loop sits inside the outer <code>for</code> loop, each index <code>0 ... N-1</code> is visited at most once by <code>right</code> and at most once by <code>left</code>. Thus, total operations are strictly bounded by <code>2N</code>, yielding amortized <code>O(N)</code> linear runtime.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Sliding Window",
      definition:
        "A dynamic range defined by left and right boundary pointers that adjusts size to inspect sub-ranges.",
    },
    {
      term: "Amortized Analysis",
      definition:
        "A method for analyzing algorithm time complexity where occasional high-cost operations are averaged over all operations.",
    },
  ],
};

const TWO_POINTERS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares function subarray_sum accepting non-negative integer array arr and target sum.",
    2: "Initializes left pointer to index 0 (start of sliding window).",
    3: "Initializes current_sum accumulator to 0.",
    4: "Iterates right pointer from 0 to len(arr) - 1 to expand window rightward.",
    5: "Adds arr[right] to current_sum as right window boundary advances.",
    6: "Executes while loop to shrink left boundary while current_sum exceeds target.",
    7: "Subtracts arr[left] from current_sum as left element leaves window.",
    8: "Increments left pointer by 1 (left += 1).",
    9: "Checks if current_sum equals target after window adjustments.",
    10: "Returns list [left, right] containing 0-indexed bounds of matching subarray.",
    11: "Returns list [-1, -1] if no contiguous subarray sums to target.",
  },
};

export const twoPointers: AlgorithmDefinition<TwoPointersInput> = {
  id: "two-pointers",
  title: "Two Pointers (Subarray Sum)",
  topicIds: ["two_pointers"],
  difficulty: "Easy",
  description: `<p>Given an array of non-negative integers <code>arr</code> and a target integer <code>target</code>, find a contiguous subarray that sums to <code>target</code>.</p>
<h3>Problem Statement</h3>
<p>Given an array of non-negative integers <code>arr</code> and an integer <code>target</code>, locate the starting and ending 0-based indices <code>[left, right]</code> of any contiguous subarray whose elements sum to <code>target</code>. If no such contiguous subarray exists, return <code>[-1, -1]</code>.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>arr</code>: Array of non-negative integers.</li>
  <li><code>target</code>: Target integer sum.</li>
</ul>
<h3>Output</h3>
<p>Returns a 2-element array containing 0-based indices <code>[left, right]</code> of a matching subarray, or <code>[-1, -1]</code> if absent.</p>
`,
  constraints: ["1 <= arr.length <= 10^5", "0 <= arr[i] <= 10^4", "1 <= target <= 10^9"],
  examples: [
    {
      kind: "basic",
      kind: "basic",
      scenario: "standard",
      inputDisplay: "arr = [1, 2, 3, 7, 5, 4, 1, 6], target = 12",
      outputDisplay: "[1, 3]",
      title: "Standard 8-Element Array",
      input: DEFAULT_TWO_POINTERS_INPUT,
      output: "[1, 3]",
      explanation: "Subarray [2, 3, 7] from index 1 to 3 sums to 12.",
    },
    {
      kind: "complex",
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target = 15",
      outputDisplay: "[0, 4]",
      title: "Adversarial Sequential Array",
      input: { array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target: 15 },
      output: "[0, 4]",
      explanation: "Window [1, 2, 3, 4, 5] from index 0 to 4 sums to 15.",
    },
    {
      kind: "negative",
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "arr = [1, 2, 3], target = 100",
      outputDisplay: "[-1, -1]",
      title: "Boundary Exceeding Target",
      input: { array: [1, 2, 3], target: 100 },
      output: "[-1, -1]",
      explanation: "Target 100 exceeds sum of array; returns [-1, -1].",
    },
  ],
  code: TWO_POINTERS_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Although the inner loop sits inside the outer loop, left and right only ever move forward. In the absolute worst case right advances n times and left advances n times, for at most 2n steps overall — amortized linear time, O(n).",
    space:
      "The algorithm holds only two pointer indices and a running sum — constant memory, O(1).",
  },
  topicGuide: TWO_POINTERS_TOPIC_GUIDE,
  trivia: TWO_POINTERS_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 8",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 8,
      section: "8.1 Two pointers method",
    },
  ],
  defaultInput: DEFAULT_TWO_POINTERS_INPUT,
  generateSteps: generateTwoPointersSteps,
};

export default twoPointers;
