import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TwoSumSortedInput {
  nums: number[];
  target: number;
}

export const TWO_SUM_SORTED_CODE = `def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    left = 0
    right = len(nums) - 1
    while left < right:
        current_sum = nums[left] + nums[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return []`;

export const DEFAULT_TWO_SUM_SORTED_INPUT: TwoSumSortedInput = {
  nums: [1, 3, 4, 6, 8, 10, 13],
  target: 11,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "When an array is pre-sorted in non-decreasing order, we can find two numbers that sum to a target T without using extra memory by leveraging converging pointers.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "default" },
        { id: "c2", value: 3, label: "[1]", state: "default" },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 6, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "default" },
        { id: "c6", value: 10, label: "[5]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Standard Two Sum uses an O(N) hash map to store visited elements; in a sorted array, the sorted order lets us eliminate candidate pairs in O(1) space.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "compare", pointers: ["L"] },
        { id: "c2", value: 3, label: "[1]", state: "default" },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 6, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "default" },
        { id: "c6", value: 10, label: "[5]", state: "compare", pointers: ["R"] },
      ],
    },
  },
  {
    narrative:
      "We place two pointers at opposite ends of the sorted array: pointer L at index 0 (smallest value) and pointer R at index N - 1 (largest value).",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "active", pointers: ["L"] },
        { id: "c2", value: 3, label: "[1]", state: "default" },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 6, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "default" },
        { id: "c6", value: 10, label: "[5]", state: "active", pointers: ["R"] },
      ],
    },
  },
  {
    narrative:
      "At each step, we calculate sum = nums[L] + nums[R]. If sum < T, the current total is too small, so we increment L += 1 to test a larger value.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "visited" },
        { id: "c2", value: 3, label: "[1]", state: "active", pointers: ["L"] },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 6, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "default" },
        { id: "c6", value: 10, label: "[5]", state: "active", pointers: ["R"] },
      ],
    },
  },
  {
    narrative:
      "Incrementing L is safe because nums is sorted: if nums[L] + nums[R] < T, then nums[L] paired with any element smaller than nums[R] would also be strictly less than T.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "visited", pointers: ["pruned"] },
        { id: "c2", value: 3, label: "[1]", state: "active", pointers: ["L"] },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 6, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "default" },
        { id: "c6", value: 10, label: "[5]", state: "active", pointers: ["R"] },
      ],
    },
  },
  {
    narrative:
      "Conversely, if sum > T, the current total is too large, so we decrement R -= 1 to test a smaller value from the right.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "visited" },
        { id: "c2", value: 3, label: "[1]", state: "active", pointers: ["L"] },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 6, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "active", pointers: ["R"] },
        { id: "c6", value: 10, label: "[5]", state: "visited", pointers: ["pruned"] },
      ],
    },
  },
  {
    narrative:
      "When sum == T, we have found the exact matching pair and immediately return their 0-based index positions [L, R].",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "sorted", pointers: ["match L"] },
        { id: "c2", value: 3, label: "[1]", state: "default" },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 6, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "default" },
        { id: "c6", value: 10, label: "[5]", state: "sorted", pointers: ["match R"] },
      ],
    },
  },
  {
    narrative:
      "Because each pointer step inward prunes one element from consideration, the algorithm terminates in at most N steps, achieving O(N) time and O(1) space complexity.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "sorted", pointers: ["match L"] },
        { id: "c2", value: 3, label: "[1]", state: "sorted" },
        { id: "c3", value: 4, label: "[2]", state: "sorted" },
        { id: "c4", value: 6, label: "[3]", state: "sorted" },
        { id: "c5", value: 8, label: "[4]", state: "sorted" },
        { id: "c6", value: 10, label: "[5]", state: "sorted", pointers: ["match R"] },
      ],
    },
  },
];

export const generateTwoSumSortedSteps = (input: TwoSumSortedInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums =
    Array.isArray(input?.nums) && input.nums.length > 0
      ? input.nums
      : DEFAULT_TWO_SUM_SORTED_INPUT.nums;
  const target =
    typeof input?.target === "number" ? input.target : DEFAULT_TWO_SUM_SORTED_INPUT.target;
  const n = nums.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input.nums) &&
      input.nums.length === DEFAULT_TWO_SUM_SORTED_INPUT.nums.length &&
      input.target === DEFAULT_TWO_SUM_SORTED_INPUT.target &&
      input.nums.every((val, idx) => val === DEFAULT_TWO_SUM_SORTED_INPUT.nums[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeSnapshot = (
    leftIdx?: number,
    rightIdx?: number,
    isMatch?: boolean,
    isEvaluating?: boolean,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = nums.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === leftIdx) ptrs.push("left");
      if (idx === rightIdx) ptrs.push("right");

      let state: ArrayElement["state"] = "default";
      if (isMatch && (idx === leftIdx || idx === rightIdx)) {
        state = "sorted";
      } else if (idx === leftIdx || idx === rightIdx) {
        state = isEvaluating ? "compare" : "active";
      } else if (
        leftIdx !== undefined &&
        rightIdx !== undefined &&
        (idx < leftIdx || idx > rightIdx)
      ) {
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
      name: "nums",
      mode: "box",
      elements,
    };
  };

  if (n < 2) {
    addStep(
      `The input array has ${n} element${n === 1 ? "" : "s"}, which is fewer than 2; cannot form a pair, returning [].`,
      makeSnapshot(),
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected sorted input array of ${n} elements with target sum T = ${target}.`,
    makeSnapshot(0, n - 1, false, false),
  );

  let left = 0;
  let right = n - 1;
  let found = false;

  while (left < right) {
    const sum = nums[left] + nums[right];

    if (sum === target) {
      found = true;
      addStep(
        `Evaluate current_sum = nums[${left}] (${nums[left]}) + nums[${right}] (${nums[right]}) = ${sum}: exact match with target ${target}! Returning index pair [${left}, ${right}].`,
        makeSnapshot(left, right, true, true),
      );
      break;
    } else if (sum < target) {
      addStep(
        `Evaluate current_sum = nums[${left}] (${nums[left]}) + nums[${right}] (${nums[right]}) = ${sum}: since ${sum} < target (${target}), increment left pointer (left = ${left + 1}) to test a larger element.`,
        makeSnapshot(left, right, false, true),
      );
      left += 1;
    } else {
      addStep(
        `Evaluate current_sum = nums[${left}] (${nums[left]}) + nums[${right}] (${nums[right]}) = ${sum}: since ${sum} > target (${target}), decrement right pointer (right = ${right - 1}) to test a smaller element.`,
        makeSnapshot(left, right, false, true),
      );
      right -= 1;
    }
  }

  if (!found) {
    addStep(
      `Pointers crossed (left = ${left}, right = ${right}) without finding any pair that sums to ${target}. Returning empty array [].`,
      makeSnapshot(undefined, undefined, false),
    );
  }

  return steps;
};

const TWO_SUM_SORTED_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Two Sum II leverages the pre-sorted structure of an array to search for pair target sums in <code>O(N)</code> time and <code>O(1)</code> space. By placing two pointers at opposite ends of the array and moving them inward monotonically, we prune entire sub-matrices of candidate pairs at each step.</p>",
  sections: [
    {
      heading: "Monotonic Pruning & Mathematical Proof",
      body: "<p>Let <code>nums</code> be sorted in non-decreasing order. If <code>nums[L] + nums[R] < target</code>, then for any index <code>k < R</code>, <code>nums[L] + nums[k] <= nums[L] + nums[R] < target</code>. Thus, no element at index <code>L</code> can ever pair with any index <code>k <= R</code> to reach target. Incrementing <code>L += 1</code> safely prunes all these pairs simultaneously.</p>",
    },
    {
      heading: "Systems & Memory Trade-offs",
      body: "<p>While standard Two Sum requires an <code>O(N)</code> auxiliary hash map, Two Sum II uses <code>O(1)</code> space. In systems handling massive sorted datasets (e.g. database index scans, column store ranges), avoiding memory allocation prevents garbage collection pauses and cache pollution.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Two Pointers Technique",
      definition:
        "An algorithmic pattern where two pointers iterate through a data structure simultaneously to solve search problems.",
    },
    {
      term: "Monotonicity",
      definition:
        "A mathematical property where a sequence or function strictly increases or decreases, allowing directional search decisions.",
    },
  ],
};

const TWO_SUM_SORTED_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "left = 1; right = len(nums)",
    "while left <= right:",
    "if current_sum < target: right -= 1",
    "else: left += 1",
  ],
  hints: [
    {
      line: 2,
      hint: "Place the left pointer at index 0 and right pointer at the last valid index (len(nums) - 1).",
    },
    {
      line: 5,
      hint: "Compare current_sum against target; if sum is too small, advance the left pointer to increase the sum.",
    },
  ],
  lineExplanations: {
    1: "Declares function two_sum_sorted accepting a sorted integer array nums and target integer sum.",
    2: "Initializes left pointer at 0 (smallest element index).",
    3: "Initializes right pointer at len(nums) - 1 (largest element index).",
    4: "Runs loop while left pointer is strictly less than right pointer.",
    5: "Computes current_sum = nums[left] + nums[right].",
    6: "Checks if current_sum equals target.",
    7: "Returns index pair [left, right] upon discovering exact target sum.",
    8: "Checks if current_sum is strictly less than target.",
    9: "Increments left pointer by 1 to increase candidate sum.",
    10: "Decrements right pointer by 1 to decrease candidate sum.",
    11: "Returns [] if pointers cross without finding a target pair.",
  },
};

export const twoSumSorted: AlgorithmDefinition<TwoSumSortedInput> = {
  id: "two-sum-sorted",
  title: "Two Sum II (Sorted)",
  topicIds: ["two_pointers"],
  difficulty: "Medium",
  description: `<p>Given a 1-indexed array of integers <code>nums</code> that is already <strong>sorted in non-decreasing order</strong>, find two numbers such that they add up to a specific <code>target</code> number.</p>
<h3>Problem Statement</h3>
<p>Given a 0-indexed array of integers <code>nums</code> that is already sorted in non-decreasing order, find two numbers such that they add up to a specific <code>target</code> number. Return the 0-based indices of the two numbers <code>[index1, index2]</code>.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: Array of integers sorted in non-decreasing order.</li>
  <li><code>target</code>: Target integer sum.</li>
</ul>
<h3>Output</h3>
<p>Returns a 2-element array containing indices <code>[left, right]</code> of the two matching numbers.</p>
`,
  constraints: [
    "2 <= nums.length <= 3 * 10^4",
    "-1000 <= nums[i] <= 1000",
    "nums is sorted in non-decreasing order.",
    "-1000 <= target <= 1000",
  ],
  examples: [
    {
      kind: "basic",
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [1, 3, 4, 6, 8, 10, 13], target = 11",
      outputDisplay: "[0, 5]",
      title: "Standard 7-Element Sorted Array",
      input: DEFAULT_TWO_SUM_SORTED_INPUT,
      output: "[0, 5]",
      explanation: "Two-pointer narrowing matches 1 + 10 = 11 at indices [0, 5].",
    },
    {
      kind: "complex",
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [2, 7, 11, 15], target = 9",
      outputDisplay: "[0, 1]",
      title: "Adversarial Immediate Match",
      input: { nums: [2, 7, 11, 15], target: 9 },
      output: "[0, 1]",
      explanation: "First pair 2 + 7 equals 9, returning [0, 1].",
    },
    {
      kind: "negative",
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [-8, -3, 0, 4, 7], target = -11",
      outputDisplay: "[0, 1]",
      title: "Boundary Negative Values",
      input: { nums: [-8, -3, 0, 4, 7], target: -11 },
      output: "[0, 1]",
      explanation: "Negative values -8 + -3 = -11 match target -11 at indices [0, 1].",
    },
  ],
  code: TWO_SUM_SORTED_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "The two pointers start at opposite ends of the array and move inward. Each step moves at least one pointer, so we make at most n comparisons — linear time, O(n).",
    space: "Only two index variables (left and right) are maintained — constant space, O(1).",
  },
  topicGuide: TWO_SUM_SORTED_TOPIC_GUIDE,
  trivia: TWO_SUM_SORTED_TRIVIA,
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
  defaultInput: DEFAULT_TWO_SUM_SORTED_INPUT,
  generateSteps: generateTwoSumSortedSteps,
};

export default twoSumSorted;
