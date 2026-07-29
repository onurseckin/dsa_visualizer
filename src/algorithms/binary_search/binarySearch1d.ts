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
    return left

def upper_bound(arr: list[int], target: int) -> int:
    left, right = 0, len(arr)
    while left < right:
        mid = (left + right) // 2
        if arr[mid] <= target:
            left = mid + 1
        else:
            right = mid
    return left`;

export const DEFAULT_BINARY_SEARCH_1D_INPUT: BinarySearch1dInput = {
  array: [2, 5, 8, 12, 16, 21, 25, 29, 34, 38, 42, 47, 56, 63, 72, 81, 91, 99],
  target: 72,
  mode: "exact",
};

export const generateBinarySearch1dSteps = (input: BinarySearch1dInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = {
    array: Array.isArray(input?.array) ? input.array : DEFAULT_BINARY_SEARCH_1D_INPUT.array,
    target:
      typeof input?.target === "number" ? input.target : DEFAULT_BINARY_SEARCH_1D_INPUT.target,
    mode: input?.mode ?? DEFAULT_BINARY_SEARCH_1D_INPUT.mode,
  };
  const arr = [...safeInput.array].sort((a, b) => a - b);
  const n = arr.length;
  const target = safeInput.target;
  const mode = safeInput.mode;

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

  if (mode === "lower_bound") {
    addStep(
      17,
      `Initialize Lower Bound Search`,
      `Finding first index where arr[i] >= ${target} in array of size N = ${n}.`,
      { n, target, mode },
      0,
      n - 1,
    );

    if (n === 0) {
      addStep(
        25,
        "Array is empty",
        "Lower bound on empty array returns index 0.",
        { n: 0, target, result: 0 },
        0,
        -1,
      );
      return steps;
    }

    addStep(
      18,
      `Initialize left = 0 and right = ${n}`,
      `Search range set to half-open interval [0..${n}).`,
      { left: 0, right: n, n },
      0,
      n - 1,
    );

    let left = 0;
    let right = n;

    while (left < right) {
      addStep(
        19,
        `Evaluate lower bound loop condition (left ${left} < right ${right})`,
        `Active search window spans half-open interval [${left}..${right}).`,
        { left, right, windowSize: right - left },
        left,
        right - 1,
      );

      const mid = Math.floor((left + right) / 2);
      addStep(
        20,
        `Compute mid = (${left} + ${right}) // 2 = ${mid}`,
        `Mid element arr[${mid}] has value ${arr[mid]}.`,
        { left, right, mid, midVal: arr[mid] },
        left,
        right - 1,
        mid,
      );

      addStep(
        21,
        `Compare arr[${mid}] (${arr[mid]}) < target (${target})`,
        `Checking if current mid element is strictly smaller than target.`,
        { midVal: arr[mid], target, isSmaller: arr[mid] < target },
        left,
        right - 1,
        mid,
      );

      if (arr[mid] < target) {
        left = mid + 1;
        addStep(
          22,
          `arr[${mid}] < target: Set left = mid + 1 = ${left}`,
          `Target ${target} is strictly greater than arr[${mid}] (${arr[mid]}). Search right sub-interval [${left}..${right}).`,
          { left, right, mid },
          left < n ? left : n - 1,
          right - 1,
        );
      } else {
        right = mid;
        addStep(
          24,
          `arr[${mid}] >= target: Set right = mid = ${right}`,
          `Found candidate element >= target. Preserve mid by narrowing right bound to ${right}.`,
          { left, right, mid },
          left,
          right > 0 ? right - 1 : 0,
        );
      }
    }

    addStep(
      25,
      `Lower bound for target ${target} found at index ${left}`,
      `First index where arr[i] >= ${target} is index ${left}${left < n ? ` (value ${arr[left]})` : " (out of bounds)"}.`,
      { lowerBoundIndex: left },
      left < n ? left : n - 1,
      left < n ? left : n - 1,
      undefined,
      left < n ? left : undefined,
    );
  } else if (mode === "upper_bound") {
    addStep(
      27,
      `Initialize Upper Bound Search`,
      `Finding first index where arr[i] > ${target} in array of size N = ${n}.`,
      { n, target, mode },
      0,
      n - 1,
    );

    if (n === 0) {
      addStep(
        35,
        "Array is empty",
        "Upper bound on empty array returns index 0.",
        { n: 0, target, result: 0 },
        0,
        -1,
      );
      return steps;
    }

    addStep(
      28,
      `Initialize left = 0 and right = ${n}`,
      `Search range set to half-open interval [0..${n}).`,
      { left: 0, right: n, n },
      0,
      n - 1,
    );

    let left = 0;
    let right = n;

    while (left < right) {
      addStep(
        29,
        `Evaluate upper bound loop condition (left ${left} < right ${right})`,
        `Active search window spans half-open interval [${left}..${right}).`,
        { left, right, windowSize: right - left },
        left,
        right - 1,
      );

      const mid = Math.floor((left + right) / 2);
      addStep(
        30,
        `Compute mid = (${left} + ${right}) // 2 = ${mid}`,
        `Mid element arr[${mid}] has value ${arr[mid]}.`,
        { left, right, mid, midVal: arr[mid] },
        left,
        right - 1,
        mid,
      );

      addStep(
        31,
        `Compare arr[${mid}] (${arr[mid]}) <= target (${target})`,
        `Checking if current mid element is less than or equal to target.`,
        { midVal: arr[mid], target, isLessOrEqual: arr[mid] <= target },
        left,
        right - 1,
        mid,
      );

      if (arr[mid] <= target) {
        left = mid + 1;
        addStep(
          32,
          `arr[${mid}] <= target: Set left = mid + 1 = ${left}`,
          `arr[${mid}] is <= target (${target}). Search right sub-interval [${left}..${right}).`,
          { left, right, mid },
          left < n ? left : n - 1,
          right - 1,
        );
      } else {
        right = mid;
        addStep(
          34,
          `arr[${mid}] > target: Set right = mid = ${right}`,
          `Found candidate element > target. Narrow right bound to mid = ${right}.`,
          { left, right, mid },
          left,
          right > 0 ? right - 1 : 0,
        );
      }
    }

    addStep(
      35,
      `Upper bound for target ${target} found at index ${left}`,
      `First index where arr[i] > ${target} is index ${left}${left < n ? ` (value ${arr[left]})` : " (out of bounds)"}.`,
      { upperBoundIndex: left },
      left < n ? left : n - 1,
      left < n ? left : n - 1,
      undefined,
      left < n ? left : undefined,
    );
  } else {
    // Exact mode
    addStep(
      1,
      `Initialize 1D Binary Search (exact mode)`,
      `Searching for target = ${target} in sorted array of length N = ${n}: [${arr.join(", ")}].`,
      { n, target, mode: mode ?? "exact" },
      0,
      n - 1,
    );

    if (n === 0) {
      addStep(15, "Array is empty", "Cannot search in an empty array.", { n: 0, target }, 0, -1);
      return steps;
    }

    addStep(
      2,
      `Initialize left = 0 and right = ${n - 1}`,
      `Search range covers indices [0..${n - 1}], total candidate size is ${n}.`,
      { left: 0, right: n - 1, n },
      0,
      n - 1,
    );

    addStep(
      3,
      `Initialize found_idx = -1`,
      `Default result is set to -1 until an exact match is confirmed.`,
      { found_idx: -1 },
      0,
      n - 1,
    );

    let left = 0;
    let right = n - 1;
    let foundIdx = -1;

    while (left <= right) {
      addStep(
        5,
        `Check while left (${left}) <= right (${right})`,
        `Search range contains ${right - left + 1} candidate indices [${left}..${right}].`,
        { left, right, remainingCandidates: right - left + 1 },
        left,
        right,
      );

      const mid = Math.floor((left + right) / 2);
      addStep(
        6,
        `Calculate mid index = (${left} + ${right}) // 2 = ${mid} (val = ${arr[mid]})`,
        `Probing middle element at index ${mid} with value ${arr[mid]}.`,
        { left, right, mid, midValue: arr[mid], target },
        left,
        right,
        mid,
      );

      addStep(
        7,
        `Compare arr[${mid}] (${arr[mid]}) with target (${target})`,
        `Testing for exact equality: arr[${mid}] == ${target}.`,
        { mid, midValue: arr[mid], target, match: arr[mid] === target },
        left,
        right,
        mid,
      );

      if (arr[mid] === target) {
        foundIdx = mid;
        addStep(
          8,
          `Match confirmed: found_idx = ${mid}`,
          `Target ${target} located at index ${mid}.`,
          { found_idx: mid },
          left,
          right,
          mid,
          mid,
        );
        addStep(
          9,
          `Break out of loop`,
          `Search completed successfully in logarithmic steps.`,
          { foundIdx: mid },
          left,
          right,
          mid,
          mid,
        );
        break;
      } else if (arr[mid] < target) {
        addStep(
          10,
          `arr[${mid}] (${arr[mid]}) < target (${target})`,
          `Target lies strictly to the right of index ${mid}.`,
          { midVal: arr[mid], target },
          left,
          right,
          mid,
        );
        left = mid + 1;
        addStep(
          11,
          `Shift left bound to mid + 1 = ${left}`,
          `Discarded lower half [${left - (mid + 1 - left)}..${mid}]. New search interval is [${left}..${right}].`,
          { left, right, mid },
          left,
          right,
        );
      } else {
        addStep(
          12,
          `arr[${mid}] (${arr[mid]}) > target (${target})`,
          `Target lies strictly to the left of index ${mid}.`,
          { midVal: arr[mid], target },
          left,
          right,
          mid,
        );
        right = mid - 1;
        addStep(
          13,
          `Shift right bound to mid - 1 = ${right}`,
          `Discarded upper half [${mid}..${right + 1}]. New search interval is [${left}..${right}].`,
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
    } else {
      addStep(
        15,
        `Return matching index ${foundIdx}`,
        `Binary search finished. Target ${target} was found at index ${foundIdx}.`,
        { target, result: foundIdx },
        foundIdx,
        foundIdx,
        foundIdx,
        foundIdx,
      );
    }
  }

  return steps;
};

export const BINARY_SEARCH_1D_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>1D Binary Search</strong> is the foundational logarithmic search paradigm operating on sorted domains. By evaluating the midpoint of an active search interval <code>[left, right]</code>, it discards half of the candidate space in a single comparison. Beyond value lookup in sorted vectors, binary search generalizes to continuous monotonic predicate functions (binary search on answer), powers B-Tree database indexing, and drives low-latency systems algorithms like <code>std::lower_bound</code> and <code>std::upper_bound</code>.</p>",
  sections: [
    {
      heading: "1. Why It Exists & Core Problem Solved",
      body: "<p>Linear scanning over <code>N</code> elements requires <code>O(N)</code> comparisons, which becomes prohibitively slow for millions or billions of records. When elements are stored in sorted order, binary search leverages monotonic order to cut the search space by half on every iteration, reaching any target in at most <code>log₂ N</code> probes.</p>",
    },
    {
      heading: "2. Step-by-Step Intuition & Invariant Maintenance",
      body: "<p>The central invariant maintains that if target exists, it must reside within the closed interval <code>[left, right]</code>. Midpoint <code>mid = left + &lfloor;(right - left) / 2&rfloor;</code> splits the interval. Comparing <code>arr[mid]</code> against target reveals which sub-interval retains the target, allowing the other half to be discarded unconditionally without missing valid solutions.</p>",
    },
    {
      heading: "3. Exact vs Lower Bound Formulations",
      body: "<p>Exact binary search halts as soon as <code>arr[mid] == target</code>. Lower bound searches for the boundary index <code>i</code> where <code>arr[i] &ge; target</code>, using a half-open interval <code>[0, N)</code>. Lower bound and upper bound together enable duplicate counting in <code>O(log N)</code> time as <code>upper_bound - lower_bound</code>.</p>",
    },
    {
      heading: "4. Trade-offs & Modern Systems Considerations",
      body: "<p>Binary search requires contiguous memory or random-access indexing alongside sorted data. Random memory jumps across huge arrays can trigger CPU L3 cache misses compared to sequential SIMD vector scans. In high-performance runtimes, midpoint calculations use bitwise unsigned shifts <code>mid = (left + right) &gt;&gt;&gt; 1</code> or <code>mid = left + ((right - left) &gt;&gt; 1)</code> to prevent integer overflow.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Search Interval",
      definition:
        "The active sub-range of array indices [left, right] currently guaranteed to contain the target element if present.",
    },
    {
      term: "Lower Bound",
      definition:
        "The smallest index i in a sorted domain such that arr[i] is greater than or equal to the target value.",
    },
    {
      term: "Parametric Search",
      definition:
        "Binary searching over a discrete or continuous range of answer candidates using a monotonic predicate decision function.",
    },
  ],
};

export const BINARY_SEARCH_1D_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines binary_search_1d: returns index of target in sorted arr, or -1 if absent.",
    2: "Initializes left and right pointers to span the full array range [0..len(arr)-1].",
    3: "Initializes found_idx to -1 as the default result for target not found.",
    4: "Blank line preceding main search loop.",
    5: "Loops while search range is valid (left <= right).",
    6: "Computes mid index as the floor of (left + right) / 2.",
    7: "Checks if middle element arr[mid] equals target.",
    8: "Stores matching index mid in found_idx.",
    9: "Breaks out of loop upon finding exact match.",
    10: "Checks if middle element arr[mid] is strictly less than target.",
    11: "Discards left half by setting left = mid + 1 when arr[mid] < target.",
    12: "Branch handling case when arr[mid] is strictly greater than target.",
    13: "Discards right half by setting right = mid - 1 when arr[mid] > target.",
    14: "Blank line ending main search loop.",
    15: "Returns found_idx (-1 if target was not present).",
    16: "Blank line separating functions.",
    17: "Defines lower_bound: finds first index where arr[i] >= target.",
    18: "Initializes left to 0 and right to len(arr) (half-open range [0..N]).",
    19: "Loops while left < right in half-open interval.",
    20: "Computes mid index using integer floor division.",
    21: "Checks if arr[mid] is strictly less than target.",
    22: "Sets left = mid + 1 if arr[mid] < target.",
    23: "Branch handling case when arr[mid] >= target.",
    24: "Sets right = mid if arr[mid] >= target to preserve first potential match.",
    25: "Returns left, the first index where arr[i] >= target.",
    26: "Blank line separating functions.",
    27: "Defines upper_bound: finds first index where arr[i] > target.",
    28: "Initializes left to 0 and right to len(arr) (half-open range [0..N]).",
    29: "Loops while left < right in half-open interval.",
    30: "Computes mid index using integer floor division.",
    31: "Checks if arr[mid] is less than or equal to target.",
    32: "Sets left = mid + 1 if arr[mid] <= target.",
    33: "Branch handling case when arr[mid] > target.",
    34: "Sets right = mid if arr[mid] > target to preserve first potential match.",
    35: "Returns left, the first index where arr[i] > target.",
  },
};

export const binarySearch1d: AlgorithmDefinition<BinarySearch1dInput> = {
  id: "binary-search-1d",
  title: "1D Binary Search & Lower/Upper Bound",
  topicIds: ["binary_search"],
  difficulty: "Easy",
  description:
    "<p>Master 1D Binary Search: locate target values or boundary thresholds (<code>lower_bound</code> / <code>upper_bound</code>) in sorted 1D arrays in <code>O(log N)</code> time.</p><h3>Why It Exists &amp; What It Solves</h3><p>When searching an unsorted list of <code>N</code> items, finding an element requires a linear scan inspecting up to <code>N</code> items in <code>O(N)</code> time. However, when data is ordered (sorted), binary search replaces brute-force scanning by repeatedly probing the midpoint and discarding half of the remaining items. This reduces the search time from linear to logarithmic <code>O(log N)</code>, enabling instant lookups even across billions of records.</p><h3>Step-by-Step Intuition</h3><ul><li><strong>Define the Bounds</strong>: Maintain two pointers <code>left</code> and <code>right</code> representing candidate range <code>[left, right]</code>.</li><li><strong>Compute Midpoint</strong>: Pick <code>mid = left + &lfloor;(right - left) / 2&rfloor;</code> to divide range into two sub-intervals.</li><li><strong>Probe &amp; Evaluate</strong>: Compare <code>arr[mid]</code> against <code>target</code>: if equal, target is found! If smaller, update <code>left = mid + 1</code>. If larger, update <code>right = mid - 1</code>.</li><li><strong>Repeat Until Convergence</strong>: Continue until <code>left &gt; right</code> or target is matched.</li></ul><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input</strong>: <code>array</code> (<code>number[]</code>) sorted in non-decreasing order, <code>target</code> (<code>number</code>), optional <code>mode</code> (<code>exact</code>, <code>lower_bound</code>, or <code>upper_bound</code>).</li><li><strong>Output</strong>: <code>number</code> index matching target/boundary or <code>-1</code> if absent in exact mode.</li></ul><h3>Trade-offs &amp; Complexity</h3><ul><li><strong>Time Complexity</strong>: <code>O(log N)</code> worst/average case, <code>O(1)</code> best case.</li><li><strong>Space Complexity</strong>: <code>O(1)</code> auxiliary space using iterative pointers.</li></ul>",
  constraints: ["1 <= N <= 10^5", "-10^9 <= array[i], target <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay:
        "arr = [2, 5, 8, 12, 16, 21, 25, 29, 34, 38, 42, 47, 56, 63, 72, 91], target = 63, mode = 'exact'",
      outputDisplay: "Target 63 found at index 13",
      input: {
        array: [2, 5, 8, 12, 16, 21, 25, 29, 34, 38, 42, 47, 56, 63, 72, 91],
        target: 63,
        mode: "exact",
      },
      output: "Target 63 found at index 13",
      explanation:
        "N=16 sorted elements; logarithmic halving probes mid indices to locate 63 at index 13.",
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
    time: "Each comparison cuts the search window [left..right] in half. An array of size N contracts to 1 element in at most log2(N) steps, guaranteeing O(log N) execution time.",
    space:
      "Uses strictly O(1) auxiliary space, keeping only scalar integer pointers (left, right, mid).",
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
