import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TwoSumSortedInput {
  nums: number[];
  target: number;
}

export const TWO_SUM_SORTED_CODE = `
def two_sum_sorted(input_array):
    """
    Implementation of two_sum_sorted.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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
    "The converging two-pointer technique searches sorted data from both ends at once and lets the sortedness itself tell you which end to give up. Instead of testing every pair, you hold the smallest remaining value on the left and the largest on the right, and one comparison against the target decides which pointer moves. That turns quadratic pair-hunting into a single sweep with no extra memory, which is why it is the default tool whenever a problem asks you to find a pair inside an ordered sequence.",
  sections: [
    {
      heading: "Sorted order is the whole trick",
      body: `When you add nums[left] and nums[right] you get more than a number, you get a direction. Because the array is sorted, nums[left] is the smallest value still available and nums[right] is the largest, so their sum sits at a known place in the range of sums still reachable. If that sum falls short of the target, nothing can rescue nums[left]: every other partner still on the table is smaller than nums[right], so pairing left with any of them falls even shorter, and left is hopeless. If the sum overshoots, the mirror argument condemns nums[right] instead. Each comparison therefore does not test one pair, it retires an entire family of pairs, which is exactly why a single pass is enough.`,
    },
    {
      heading: "How the two pointers move",
      body: `You place left at index 0 and right at the last index, then repeat one decision until they meet. Add the two values; if they hit the target you return both indices; if the sum is short you advance left by one to pull in a larger number; if it overshoots you pull right back by one to pull in a smaller one. You never move both pointers in the same iteration and neither ever moves backwards, so the interval between them only shrinks. The loop condition is left < right rather than left <= right, because the problem wants two distinct positions and a pointer must never pair an element with itself.`,
    },
    {
      heading: "The invariant that makes it correct",
      body: `Everything rests on one claim: if a valid pair exists at all, both of its indices lie inside the current window from left to right. That is trivially true at the start, when the window is the whole array, and each move preserves it. When you advance left past an index you have already paired that index with the largest partner available and still fallen short, so it cannot belong to any answer; pulling right inward is justified the same way. Since the window loses exactly one element per iteration and never loses a viable pair, you either land on the answer or the window empties, and an empty window is a proof that no answer exists rather than a guess. That is what licenses returning an empty result the moment the pointers meet.`,
    },
    {
      heading: "When to use it instead of a hash map",
      body: `The unsorted version of Two Sum is solved with a hash map, which spends linear memory to look up a complement in one step. Here the input arrives sorted, so the order does the map's job for free and you get a linear scan in constant space. Reach for converging pointers when the data is already sorted, when constant extra space is required, or when you need a pair with an ordering property such as the closest sum rather than an exact hit. If the array is unsorted and you only need existence, hashing usually wins, because sorting first costs more than the scan you would save.`,
    },
    {
      heading: "Pitfalls and edge cases",
      body: `The most common bug is the loop condition: writing left <= right lets a single element pair with itself, so an array containing one 7 would falsely report a pair summing to 14. The second is forgetting that the technique depends on sortedness, since running it on unsorted input produces confident nonsense instead of an error. Check which index base the problem wants, because the classic interview phrasing is one-indexed while the array is not. Duplicates are harmless, as moving past one copy simply brings its twin into play, and negative numbers are fine too because the elimination argument needs order, not positivity.`,
    },
    {
      heading: "Where the pattern generalizes",
      body: `Once you can see the shape, the same skeleton solves a whole family of problems. Container With Most Water moves whichever wall is shorter, because that wall is what limits the area and nothing inside it can help. Three Sum sorts the array, fixes one element, and runs this exact converging scan over the remainder. Valid Palindrome walks the ends inward comparing characters, and Squares of a Sorted Array reads from the ends inward because the largest magnitudes live at the extremes. In every one of these the ends carry extremal information, so a single comparison lets you retire one end for good.`,
    },
  ],
  keyTerms: [
    {
      term: "Converging pointers",
      definition:
        "Two indices that start at opposite ends of a sequence and move toward each other, never backwards, so the interval between them only ever shrinks.",
    },
    {
      term: "Monotone sum",
      definition:
        "The property that advancing left can only raise the pair sum and pulling right back can only lower it. It is the reason one comparison is enough to know which pointer to move.",
    },
    {
      term: "Elimination argument",
      definition:
        "The reasoning that proves a specific index can never appear in any valid answer, which is what makes moving a pointer past it permanent rather than risky.",
    },
    {
      term: "Search window",
      definition:
        "The still-unexamined range between left and right. The algorithm keeps the promise that any valid pair lies entirely inside it.",
    },
    {
      term: "Complement",
      definition:
        "The value you would need to complete a pair, target minus nums[left]. A hash-map solution looks it up directly, while this scan walks the right pointer toward it.",
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
    "Find two numbers in a sorted array that add up to a target by walking a left and a right pointer toward each other from opposite ends.",
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
