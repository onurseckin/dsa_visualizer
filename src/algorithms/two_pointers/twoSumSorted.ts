import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
  target: 14,
};

export const generateTwoSumSortedSteps = (input: TwoSumSortedInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const target = input.target;
  const n = nums.length;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
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
          target: String(target),
          currentPointers: `left: ${variables.left ?? "-"}, right: ${variables.right ?? "-"}`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Set up the two-pointer search",
    `The array [${nums.join(", ")}] is already sorted, so instead of testing every pair we can squeeze two pointers toward each other until they land on a pair that sums to ${target}.`,
    { target, length: n },
  );

  let left = 0;
  let right = n - 1;

  addStep(
    2,
    "Place the left pointer at index 0",
    `We start left at the smallest value, ${nums[left] ?? "N/A"}. Moving this pointer right is our only way to make the sum bigger.`,
    { left, right, target },
  );

  addStep(
    3,
    `Place the right pointer at index ${right}`,
    `We start right at the largest value, ${nums[right] ?? "N/A"}. Moving this pointer left is our only way to make the sum smaller.`,
    { left, right, target },
  );

  while (left < right) {
    // update element states: preserve visited for eliminated indices outside [left, right]
    for (let k = 0; k < n; k++) {
      if (k < left || k > right) {
        elements[k].state = "visited";
        elements[k].pointers = undefined;
      } else if (k !== left && k !== right) {
        elements[k].state = "default";
        elements[k].pointers = undefined;
      }
    }

    elements[left].state = "compare";
    elements[left].pointers = ["L"];
    elements[right].state = "compare";
    elements[right].pointers = ["R"];

    const sum = nums[left] + nums[right];

    addStep(
      5,
      `Check pointers at ${left} and ${right}`,
      `The pointers haven't crossed yet, so there are still pairs left to try. Our current candidates are nums[${left}] = ${nums[left]} and nums[${right}] = ${nums[right]}.`,
      { left, right, "nums[left]": nums[left], "nums[right]": nums[right] },
    );

    addStep(
      6,
      `Add ${nums[left]} and ${nums[right]}`,
      `We add the two ends together: ${nums[left]} + ${nums[right]} = ${sum}. Comparing that against the target ${target} tells us which pointer to move next.`,
      { left, right, sum, target },
    );

    if (sum === target) {
      elements[left].state = "sorted";
      elements[left].pointers = ["L", "MATCH"];
      elements[right].state = "sorted";
      elements[right].pointers = ["R", "MATCH"];

      addStep(
        9,
        `Return the pair [${left}, ${right}]`,
        `${nums[left]} + ${nums[right]} lands exactly on ${target}, so indices [${left}, ${right}] are our answer. One pass with two pointers — that's the whole trick.`,
        { resultIdx1: left, resultIdx2: right, target, sum },
      );
      return steps;
    } else if (sum < target) {
      addStep(
        11,
        "Advance left to raise the sum",
        `${sum} falls short of ${target}, and pairing nums[${left}] = ${nums[left]} with anything smaller than nums[${right}] would fall even shorter. So we're done with it — we move left to index ${left + 1} to bring in a bigger number.`,
        { left, right, sum, target },
      );
      elements[left].state = "visited";
      elements[left].pointers = undefined;
      left++;
    } else {
      addStep(
        13,
        "Pull right back to lower the sum",
        `${sum} overshoots ${target}, and pairing nums[${right}] = ${nums[right]} with anything bigger than nums[${left}] would overshoot even more. So we're done with it — we move right to index ${right - 1} to bring in a smaller number.`,
        { left, right, sum, target },
      );
      elements[right].state = "visited";
      elements[right].pointers = undefined;
      right--;
    }
  }

  addStep(
    15,
    "Return empty array — no pair exists",
    `The pointers met without ever hitting ${target}, which means every possible pair has been ruled out. We return an empty array to signal there is no answer.`,
    { target },
  );

  return steps;
};

const TWO_SUM_SORTED_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The converging two-pointer technique searches sorted data from both ends at once and lets the sortedness itself tell you which end to give up. Two Sum II demonstrates the power of exploiting monotonicity in sorted arrays to achieve O(N) time complexity and O(1) auxiliary space without requiring a hash map. In database systems (e.g., MySQL InnoDB, PostgreSQL B-Tree indexes), sorted two-pointer scans mirror Sort-Merge Joins and index-range evaluations, eliminating random RAM lookups in favor of sequential pointer increments.",
  sections: [
    {
      heading: "Core Concept & Shrinking Search Space",
      body: "Starting with left at index 0 and right at index N - 1, we compute current_sum = nums[left] + nums[right]. If current_sum < target, any pair using nums[left] with a smaller right element is guaranteed to be < target, so left must be incremented. Conversely, if current_sum > target, right must be decremented. This eliminates an entire row or column of candidate pairs in O(1) time per comparison.",
    },
    {
      heading: "Systems & Performance Impact: Memory Locality vs. Hash Tables",
      body: "Unlike standard Two Sum (which relies on hash map lookups subject to hash collisions and cache misses), Two Sum II operates directly on contiguous memory arrays. B-Tree index scans in databases exploit this exact property to perform merge operations directly within L1/L2 cache lines.",
    },
    {
      heading: "Implementation Nuances & Loop Termination",
      body: "The loop condition left < right strictly prevents an element from pairing with itself. Because the array is sorted in non-decreasing order, negative values, zeroes, and duplicate numbers are naturally handled by the monotonic sum response.",
    },
    {
      heading: "Edge Case & Boundary Analysis",
      body: "For N=2, a single comparison determines the output. When no valid pair exists, left and right converge until left == right, returning an empty list [].",
    },
  ],
  keyTerms: [
    {
      term: "Monotonicity",
      definition:
        "The property that increasing an index strictly increases (or non-decreases) the value, allowing monotonic decisions.",
    },
    {
      term: "Sort-Merge Join",
      definition:
        "A relational database join technique that operates on two sorted datasets using pointer traversal.",
    },
    {
      term: "Search Space Pruning",
      definition:
        "Eliminating large sets of candidate solutions simultaneously based on mathematical invariants.",
    },
  ],
};

const TWO_SUM_SORTED_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given a sorted array and a target, return the indices of two numbers that sum to it.",
    2: "Places the left pointer at index 0, the smallest value in the sorted array — advancing it is the only way to increase the pair sum.",
    3: "Places the right pointer at the last index, the largest value — pulling it inward is the only way to decrease the pair sum.",
    5: "Loops while the pointers haven't crossed; once left meets or passes right, every possible pair has already been considered.",
    6: "Adds the values at both pointers together, producing the one number that decides which direction to move next.",
    8: "Checks whether the sum lands exactly on the target — if so, the search is over.",
    9: "Returns the two indices immediately, since their values are confirmed to sum to target.",
    10: "Checks whether the sum fell short of the target, meaning the pair needs a larger left value.",
    11: "Advances left by one to bring in a bigger number, since nums[left] paired with anything smaller than nums[right] would only fall shorter.",
    12: "Otherwise the sum overshot the target, meaning the pair needs a smaller right value.",
    13: "Pulls right back by one to bring in a smaller number, since nums[right] paired with anything bigger than nums[left] would only overshoot more.",
    15: "Returns an empty list once the pointers meet without ever hitting the target, proving no valid pair exists.",
  },
};

export const twoSumSorted: AlgorithmDefinition<TwoSumSortedInput> = {
  id: "two-sum-sorted",
  title: "Two Sum II (Sorted)",
  category: "two_pointers",
  categories: ["two_pointers"],
  difficulty: "Medium",
  description:
    "Find two numbers in a sorted array that add up to a target by walking a left and a right pointer toward each other from opposite ends.\n\nGiven a 1-indexed (or 0-indexed) array of integers nums that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return their 0-indexed indices [i, j].\n\n### Input Parameters\n- nums (list[int]): A non-decreasing sorted array of integers.\n- target (int): The target integer sum.\n\n### Output\n- list[int]: Indices [i, j] such that nums[i] + nums[j] == target.\n\n### Edge Cases & Constraints\n- Exactly one solution exists.\n- You may not use the same element twice (i != j).\n- Negative numbers and zero values are supported naturally.",
  constraints: [
    "2 <= nums.length <= 3 * 10^4",
    "-1000 <= nums[i] <= 1000",
    "nums is sorted in non-decreasing order.",
    "-1000 <= target <= 1000",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "numbers = [2, 7, 11, 15], target = 9",
      outputDisplay: "[1, 2]",
      title: "Basic Example",
      input: { nums: [1, 3, 4, 6, 8, 10, 13], target: 14 },
      output: "[0, 6]",
      explanation: "nums[0] (1) + nums[6] (13) = 14. Pointers land at 0-indexed indices [0, 6].",
    },
    {
      kind: "complex",
      inputDisplay: "numbers = [2, 3, 4], target = 6",
      outputDisplay: "[1, 3]",
      title: "Complex Edge Case",
      input: { nums: [-5, -2, 0, 3, 7, 11, 15], target: 9 },
      output: "[1, 5]",
      explanation: "Handles negative numbers in sorted order; -2 + 11 = 9 at indices 1 and 5.",
    },
    {
      kind: "negative",
      inputDisplay: "numbers = [-1, 0], target = -1",
      outputDisplay: "[1, 2]",
      title: "Failing / Boundary Case",
      input: { nums: [2, 4, 6, 8, 10], target: 15 },
      output: "[]",
      explanation: "No two elements sum to 15. The pointers meet and cross without finding a pair.",
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
    time: "Every iteration moves one of the two pointers a step inward and neither ever moves back, so after at most n - 1 moves they meet and the loop stops. That single squeeze across the array is why the time is O(n) in every case — the sorted order lets each comparison eliminate one element for good.",
    space:
      "We keep only two index variables and a running sum no matter how large the array gets, so extra memory is constant — O(1).",
  },
  topicGuide: TWO_SUM_SORTED_TOPIC_GUIDE,
  trivia: TWO_SUM_SORTED_TRIVIA,
  leetcode: {
    id: 167,
    url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #167",
      leetcodeId: 167,
      url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 8",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 8,
      section: "8.1 Two pointers method",
    },
  ],
  defaultInput: DEFAULT_TWO_SUM_SORTED_INPUT,
  generateSteps: generateTwoSumSortedSteps,
};
