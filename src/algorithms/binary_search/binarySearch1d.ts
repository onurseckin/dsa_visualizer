import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BinarySearch1dInput {
  array: number[];
  target: number;
  mode?: "exact" | "lower_bound" | "upper_bound";
}

export const BINARY_SEARCH_1D_CODE = `def binary_search_1d(arr: list[int], target: int) -> int:
    left, right = 0, len(arr) - 1
    found_idx = -1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            found_idx = mid
            break
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return found_idx

def lower_bound(arr: list[int], target: int) -> int:
    left, right = 0, len(arr)
    while left < right:
        mid = (left + right) // 2
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left`;

export const DEFAULT_BINARY_SEARCH_1D_INPUT: BinarySearch1dInput = {
  array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
  target: 23,
  mode: "exact",
};

export const generateBinarySearch1dSteps = (input: BinarySearch1dInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arr = [...input.array].sort((a, b) => a - b);
  const n = arr.length;
  const target = input.target;
  const mode = input.mode ?? "exact";

  const makeElements = (
    left: number,
    right: number,
    mid?: number,
    foundIndex?: number,
  ): ArrayElement[] => {
    return arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      const ptrs: string[] = [];

      if (idx === left) ptrs.push("left");
      if (idx === right) ptrs.push("right");
      if (mid !== undefined && idx === mid) {
        ptrs.push("mid");
        state = "compare";
      }

      if (idx >= left && idx <= right) {
        if (state === "default") state = "active";
      }

      if (foundIndex !== undefined && idx === foundIndex) {
        state = "sorted";
      }

      return {
        id: `el-${idx}`,
        value: val,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    left: number,
    right: number,
    mid?: number,
    foundIndex?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(left, right, mid, foundIndex),
      },
      auxiliaryState: {
        customState: customState ?? {
          mode,
          target: String(target),
          arrayLength: String(n),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    `Initialize 1D Binary Search (${mode} mode)`,
    `Searching for target = ${target} in sorted array of length N = ${n}: [${arr.join(", ")}].`,
    { n, target, mode },
    0,
    n - 1,
  );

  if (n === 0) {
    addStep(14, "Array is empty", "Cannot search in an empty array.", { n: 0, target }, 0, -1);
    return steps;
  }

  if (mode === "lower_bound") {
    let left = 0;
    let right = n;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      addStep(
        20,
        `Lower Bound: Mid index ${mid} (val = ${arr[mid]})`,
        `Comparing arr[mid] (${arr[mid]}) against target ${target}.`,
        { left, right, mid, val: arr[mid], target },
        left,
        right - 1,
        mid,
      );

      if (arr[mid] < target) {
        left = mid + 1;
        addStep(
          22,
          `arr[mid] < target: Shift left to mid + 1 = ${left}`,
          `Target ${target} is strictly greater than arr[${mid}] (${arr[mid]}). Search right half.`,
          { left, right, mid },
          left,
          right - 1,
        );
      } else {
        right = mid;
        addStep(
          24,
          `arr[mid] >= target: Shift right to mid = ${right}`,
          `Found element >= target. Keep mid in search range by setting right = ${right}.`,
          { left, right, mid },
          left,
          right - 1,
        );
      }
    }

    addStep(
      25,
      `Lower bound for target ${target} found at index ${left}`,
      `First index where arr[i] >= ${target} is index ${left}${left < n ? ` (value ${arr[left]})` : " (out of bounds)"}.`,
      { lowerBoundIndex: left },
      left,
      left,
      undefined,
      left < n ? left : undefined,
    );
  } else {
    // Exact mode
    let left = 0;
    let right = n - 1;
    let foundIdx = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      addStep(
        6,
        `Calculate mid index ${mid} (value = ${arr[mid]})`,
        `Searching range [${left}..${right}]. Checking middle element arr[${mid}] = ${arr[mid]}.`,
        { left, right, mid, midValue: arr[mid], target },
        left,
        right,
        mid,
      );

      if (arr[mid] === target) {
        foundIdx = mid;
        addStep(
          7,
          `Target ${target} found at index ${mid}!`,
          `arr[${mid}] == ${target}. Exact match located in O(log N) steps.`,
          { foundIdx: mid, target },
          left,
          right,
          mid,
          mid,
        );
        break;
      } else if (arr[mid] < target) {
        left = mid + 1;
        addStep(
          11,
          `arr[${mid}] (${arr[mid]}) < ${target}: Shift left to ${left}`,
          `Target lies in upper half. Setting left = mid + 1 = ${left}.`,
          { left, right, mid },
          left,
          right,
        );
      } else {
        right = mid - 1;
        addStep(
          13,
          `arr[${mid}] (${arr[mid]}) > ${target}: Shift right to ${right}`,
          `Target lies in lower half. Setting right = mid - 1 = ${right}.`,
          { left, right, mid },
          left,
          right,
        );
      }
    }

    if (foundIdx === -1) {
      addStep(
        15,
        `Target ${target} not found in array`,
        `Search range exhausted (left > right). Target ${target} does not exist in array.`,
        { target, result: -1 },
        left,
        right,
      );
    }
  }

  return steps;
};

export const BINARY_SEARCH_1D_TOPIC_GUIDE: TopicGuide = {
  overview:
    "1D Binary Search is the fundamental logarithmic search algorithm operating on sorted domains. By repeatedly evaluating the midpoint of an active search interval [left, right], it discards half of the candidate space in a single comparison. Beyond simple value lookup in sorted arrays, binary search generalizes to monotonic predicate functions (binary search on answer), forms the core scan loop of database B-Tree index lookups, and underpins system primitives like C++ std::lower_bound and std::upper_bound.",
  sections: [
    {
      heading: "Search Space Invariant & Bisecting",
      body: "The core invariant is that if the target exists in the array, its index must lie within the inclusive range [left, right]. Midpoint calculation mid = left + (right - left) // 2 divides the search space into two equal halves. Comparing arr[mid] with target determines which half retains the target and which half can be discarded permanently.",
    },
    {
      heading: "Lower Bound vs Upper Bound Formulations",
      body: "Exact match binary search stops as soon as arr[mid] == target. Lower bound finds the first index i where arr[i] >= target, maintaining a half-open search space [0, N). Upper bound finds the first index i where arr[i] > target. Lower/upper bounds are critical for counting duplicates in O(log N) time as upper_bound - lower_bound.",
    },
    {
      heading: "Overflow Prevention & Integer Arithmetic",
      body: "Computing mid = (left + right) // 2 can overflow 32-bit signed integers when left + right > 2^31 - 1. Safe implementation uses mid = left + (right - left) // 2. In bitwise manipulation languages, mid = (left + right) >>> 1 is used for unsigned shift.",
    },
    {
      heading: "Binary Search on Answer (Parametric Search)",
      body: "When an optimization problem possesses a monotonic decision function f(x) (i.e. f(x) is False for all x < X and True for all x >= X), binary search can find the minimum valid parameter X in O(log(MAX - MIN) * cost(f)) time without explicitly generating an array.",
    },
  ],
  keyTerms: [
    {
      term: "Search Space",
      definition:
        "The current range of candidate indices [left, right] that could contain the desired element or boundary point.",
    },
    {
      term: "Lower Bound",
      definition:
        "The smallest index i in a sorted array such that arr[i] is greater than or equal to the target value.",
    },
    {
      term: "Parametric Search",
      definition:
        "Binary searching over a continuous or discrete range of candidate answer values using a monotonic predicate function.",
    },
  ],
};

export const BINARY_SEARCH_1D_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares binary_search_1d: returns index of target in sorted arr, or -1 if absent.",
    2: "Initializes left and right pointers to span the full array range [0..N-1].",
    3: "Initializes found_idx to -1 as the default result for target not found.",
    5: "Loops while search range is valid (left <= right).",
    6: "Computes mid index as the floor of (left + right) / 2.",
    7: "Checks if middle element arr[mid] equals target.",
    8: "Stores matching index mid in found_idx.",
    9: "Breaks out of loop upon finding exact match.",
    11: "Discards left half by setting left = mid + 1 when arr[mid] < target.",
    13: "Discards right half by setting right = mid - 1 when arr[mid] > target.",
    15: "Returns found_idx (-1 if not present).",
    17: "Declares lower_bound: finds first index where arr[i] >= target.",
    18: "Initializes left to 0 and right to len(arr) (half-open range [0..N]).",
    19: "Loops while left < right.",
    20: "Computes mid index.",
    22: "Sets left = mid + 1 if arr[mid] < target.",
    24: "Sets right = mid if arr[mid] >= target.",
    25: "Returns left, the first index where arr[i] >= target.",
  },
};

export const binarySearch1d: AlgorithmDefinition<BinarySearch1dInput> = {
  id: "binary-search-1d",
  title: "1D Binary Search & Lower/Upper Bound",
  category: "binary_search",
  categories: ["binary_search"],
  difficulty: "Easy",
  description:
    "1D Binary Search locates targets or boundary thresholds (lower/upper bounds) in a sorted array by halving the search space at each comparison in O(log N) time.",
  constraints: ["1 <= N <= 10^5", "-10^9 <= array[i], target <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay: "arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target = 23, mode = 'exact'",
      outputDisplay: "Target 23 found at index 5",
      input: {
        array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
        target: 23,
        mode: "exact",
      },
      output: "Target 23 found at index 5",
      explanation: "N=10 sorted elements; mid index comparisons locate 23 at index 5 in 3 steps.",
    },
    {
      kind: "complex",
      title: "Complex Edge Case",
      inputDisplay: "arr = [1, 3, 3, 3, 5, 7], target = 3, mode = 'lower_bound'",
      outputDisplay: "Lower bound index: 1",
      input: {
        array: [1, 3, 3, 3, 5, 7],
        target: 3,
        mode: "lower_bound",
      },
      output: "Lower bound index: 1",
      explanation: "Lower bound mode finds first occurrence of duplicate element 3 at index 1.",
    },
    {
      kind: "negative",
      title: "Failing / Boundary Case",
      inputDisplay: "arr = [1, 4, 9], target = 5, mode = 'exact'",
      outputDisplay: "Target 5 not found (result -1)",
      input: {
        array: [1, 4, 9],
        target: 5,
        mode: "exact",
      },
      output: "Target 5 not found (result -1)",
      explanation: "Target 5 lies between 4 and 9; pointers cross without match, returning -1.",
    },
  ],
  code: BINARY_SEARCH_1D_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Each step cuts the remaining search space [left..right] in half. An array of size n is reduced to 1 element in log2(n) steps, running in O(log n) time.",
    space:
      "Uses O(1) auxiliary space as search maintains only left, right, and mid integer pointers.",
  },
  topicGuide: BINARY_SEARCH_1D_TOPIC_GUIDE,
  trivia: BINARY_SEARCH_1D_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 3,
      section: "3.2 Binary search",
      label: "Competitive Programmer's Handbook, Ch 3",
    },
  ],
  defaultInput: DEFAULT_BINARY_SEARCH_1D_INPUT,
  generateSteps: generateBinarySearch1dSteps,
};
