import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TwoPointersInput {
  array: number[];
  target: number;
}

export const TWO_POINTERS_CODE = `def two_pointers_subarray_sum(arr: list[int], target: int) -> list[int]:
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
  array: [1, 2, 3, 7, 5],
  target: 12,
};

export const generateTwoPointersSteps = (input: TwoPointersInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.array.map((val, idx) => ({
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
          currentSum: String(variables.currentSum),
          target: String(input.target),
        },
      },
      variables,
    });
  };

  const n = elements.length;
  const target = input.target;

  addStep(
    1,
    "Set up the window search",
    `We're looking for a run of consecutive elements in [${input.array.join(", ")}] that sums to ${target}. A window bounded by left and right pointers will grow and shrink as we scan.`,
    { left: 0, right: 0, currentSum: 0, target, n },
  );

  if (n === 0) {
    addStep(
      11,
      "Stop — the array is empty",
      "There are no elements at all, so no contiguous subarray can exist. We return [-1, -1] right away.",
      { left: -1, right: -1, currentSum: 0, target },
    );
    return steps;
  }

  let left = 0;
  let currentSum = 0;

  const syncElementStates = (currentLeft: number, currentRight: number, isMatch = false) => {
    for (let k = 0; k < n; k++) {
      const ptrs: string[] = [];
      if (k === currentLeft) ptrs.push("left");
      if (k === currentRight) ptrs.push("right");

      if (k >= currentLeft && k <= currentRight) {
        elements[k].state = isMatch ? "sorted" : "active";
      } else {
        elements[k].state = "default";
      }

      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    }
  };

  for (let right = 0; right < n; right++) {
    const rightVal = elements[right].value;
    currentSum += rightVal;

    syncElementStates(left, right);

    addStep(
      6,
      `Grow the window to index ${right}`,
      `We slide right to index ${right} and fold arr[${right}] = ${rightVal} into the running sum, which is now ${currentSum}. We're still chasing ${target}.`,
      { left, right, "arr[right]": rightVal, currentSum, target },
    );

    while (currentSum > target && left <= right) {
      const leftVal = elements[left].value;

      addStep(
        9,
        "Shrink the window from the left",
        `Our sum ${currentSum} has overshot ${target}, and because every element is non-negative, growing the window can never fix that. We drop arr[${left}] = ${leftVal} off the left edge to bring the sum back down.`,
        { left, right, "arr[left]": leftVal, currentSum, target },
      );

      currentSum -= leftVal;
      left++;

      if (left <= right) {
        syncElementStates(left, right);
      }
    }

    if (currentSum === target) {
      syncElementStates(left, right, true);

      addStep(
        13,
        `Return the window [${left}..${right}]`,
        `The window [${input.array.slice(left, right + 1).join(", ")}] sums to exactly ${target}, so indices [${left}, ${right}] are the answer. Because each pointer only ever moved forward, the whole search stayed linear.`,
        { left, right, currentSum, target },
      );
      return steps;
    }
  }

  addStep(
    15,
    "Return [-1, -1] — no window matched",
    `The right pointer reached the end and no window ever settled on ${target}. There is no contiguous subarray with that sum, so we return [-1, -1].`,
    { left: -1, right: -1, currentSum, target },
  );

  return steps;
};

const TWO_POINTERS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "This is the same-direction flavor of two pointers, better known as a variable-size sliding window. Both indices march forward through the array: the right one admits elements into a window while the left one evicts them, and a running sum is repaired incrementally instead of recomputed. It answers questions about contiguous runs, such as finding a subarray with a given sum, the shortest run reaching a threshold, or the longest run staying under one. The precondition that makes it valid here is that every element is non-negative, which is what gives the sum a predictable response to each move.",
  sections: [
    {
      heading: "The window as a repaired quantity",
      body: `A brute-force solution recomputes the sum of every candidate subarray from scratch, redoing the same additions over and over. The window keeps a single number instead and edits it: add arr[right] when the right edge advances, subtract arr[left] when the left edge moves forward. Because a contiguous range changes by exactly one element per move, that edit is one addition or one subtraction, and the running total is always precisely the sum of the elements between the two pointers. Maintaining a derived value through small edits rather than recomputing it is the habit that carries over to every other window problem you will meet.`,
    },
    {
      heading: "How the grow and shrink loops interact",
      body: `The outer loop advances right one index at a time and folds the new element into the sum, so the window always ends at right. The inner loop then repairs any overshoot: while the sum exceeds the target, drop arr[left] and advance left. Only after that repair do you test for equality, because a window that is still too large could never be the answer. If the sum lands on the target you have your indices, and if right reaches the end without a hit then no contiguous run has that sum. Although the loops are nested, the two pointers together take at most a couple of passes' worth of steps, because neither ever turns around.`,
    },
    {
      heading: "Why non-negative elements are not optional",
      body: `The shrink rule leans on a specific promise: removing an element can only lower the sum and adding one can only raise it. Non-negative values guarantee that, so a window over the target can only be fixed from the left and a window under it can only be helped by growing. Introduce one negative number and both assumptions collapse, because an over-target window might become correct by growing and shrinking might make it larger. For arrays with negatives you change tools entirely and use prefix sums stored in a hash map, which finds a range summing to the target without needing any monotone response at all. Recognizing which precondition a technique leans on is the difference between applying a pattern and guessing.`,
    },
    {
      heading: "The invariant and why nothing is missed",
      body: `At the top of each outer iteration the window holds a sum that is at most the target, and every window ending earlier that could have matched has already been examined. Advancing right implicitly considers all windows ending at the new right, because the shrink loop walks left forward to exactly the first position where the sum stops exceeding the target. The subtle part is that any left position before that is ruled out not just for this right but for every later one, since growing right only adds value, so a left that overshoots now overshoots forever. That is why the left pointer never needs to be reset, and why one candidate per right index is enough to be sure no valid window was skipped.`,
    },
    {
      heading: "Pitfalls and edge cases",
      body: `Test for equality after the shrink loop, never before, or a window that momentarily overshoots gets judged in the wrong state. Guard the inner loop with left not passing right, so a single element larger than the target cannot push left beyond the window and leave the bookkeeping incoherent. If the target can be zero and the array contains zeros, decide up front whether an empty window counts as an answer, because this formulation only ever reports a non-empty range. Be equally clear about what you are returning, since the first matching window, the shortest one, and a count of all of them are three different loops built on the same skeleton, and conflating them is a common source of wrong answers.`,
    },
    {
      heading: "The wider family of window problems",
      body: `Change the quantity being maintained and the same skeleton solves a surprising range of problems. Track a character-frequency map instead of a sum and you have Longest Substring Without Repeating Characters, where the shrink condition is that a duplicate is inside the window. Track a count of distinct keys and you get Fruit Into Baskets or Longest Substring with At Most K Distinct Characters. When a problem asks for the smallest window meeting a condition you keep shrinking while the condition still holds and record the best; when it asks for the largest you shrink only while the condition is violated. The question to answer each time is the same: what does the window guarantee right now, and which edge repairs a violation.`,
    },
  ],
  keyTerms: [
    {
      term: "Sliding window",
      definition:
        "A contiguous range whose two endpoints only move forward, so every element enters the window at most once and leaves it at most once.",
    },
    {
      term: "Running sum",
      definition:
        "The maintained total of the current window, updated by one addition or subtraction per pointer move instead of being recomputed from the elements.",
    },
    {
      term: "Shrink condition",
      definition:
        "The predicate that says the window is currently invalid and the left edge must advance. Here it is simply that the running sum has passed the target.",
    },
    {
      term: "Monotone response",
      definition:
        "The guarantee that growing the window can only increase the tracked quantity and shrinking can only decrease it. Non-negative elements are what supply it in this problem.",
    },
    {
      term: "Amortized traversal",
      definition:
        "The accounting insight that two forward-only pointers cover the array a bounded number of times in total, even though one loop sits inside the other.",
    },
    {
      term: "Prefix sum",
      definition:
        "The cumulative total of all elements up to an index. It is the alternative tool once negative values break the monotone response a window relies on.",
    },
  ],
};

const TWO_POINTERS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given a non-negative array and a target, return the bounds of a contiguous run summing to it.",
    2: "Starts the left edge of the window at index 0, before any elements have been considered for eviction.",
    3: "Starts the running sum at 0, since the window begins empty.",
    5: "Advances the right edge one index at a time across the whole array, growing the window by exactly one element per iteration.",
    6: "Folds arr[right] into the running sum, extending the window to include the newly admitted element.",
    8: "Shrinks the window while the sum has overshot the target and the window still holds at least one element — safe only because every element is non-negative, so growing the window can never fix an overshoot.",
    9: "Subtracts arr[left] from the running sum as that element leaves the window from the left.",
    10: "Advances left by one, formally evicting the element whose value was just subtracted.",
    12: "Checks whether the window's sum now matches the target exactly.",
    13: "Returns the current window bounds the moment the sum matches, since no larger or smaller window is needed once a hit is found.",
    15: "Returns [-1, -1] once right has scanned the whole array without any window ever landing on target, proving no such subarray exists.",
  },
};

export const twoPointers: AlgorithmDefinition<TwoPointersInput> = {
  id: "two-pointers",
  title: "Two Pointers (Subarray Sum)",
  category: "two_pointers",
  difficulty: "Easy",
  description:
    "Finds a contiguous subarray that sums to a target value by growing and shrinking a window between left and right pointers over non-negative integers.",
  constraints: ["1 <= arr.length <= 10^5", "0 <= arr[i] <= 10^4", "1 <= target <= 10^9"],
  examples: [
    {
      input: "arr = [1, 2, 3, 7, 5], target = 12",
      output: "[1, 3]",
      explanation: "Subarray from index 1 to 3: [2, 3, 7] sums to 2 + 3 + 7 = 12.",
    },
    {
      input: "arr = [1, 2, 3, 4, 5], target = 15",
      output: "[0, 4]",
      explanation: "The entire array sums to 15.",
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
    time: "The right pointer walks the array exactly once, and the left pointer chases it — it only ever moves forward, so across the whole run it also takes at most n steps. Even though the shrink loop looks nested, the total work is bounded by those two forward walks, which is why the time is O(n) rather than O(n²).",
    space:
      "The window is tracked with just two indices and one running sum, so extra memory stays constant at O(1) regardless of input size.",
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
      section: "8.1 Subarray sum",
    },
  ],
  defaultInput: DEFAULT_TWO_POINTERS_INPUT,
  generateSteps: generateTwoPointersSteps,
};
