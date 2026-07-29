import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  MatrixCellItem,
  MatrixVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MeetInTheMiddleInput {
  array: number[];
  target: number;
}

export const MEET_IN_THE_MIDDLE_CODE = `import bisect

def meet_in_the_middle(nums: list[int], target: int) -> bool:
    n = len(nums)
    if n == 0:
        return target == 0

    mid = n // 2
    left_part = nums[:mid]
    right_part = nums[mid:]

    def get_subset_sums(arr):
        sums = [0]
        for x in arr:
            sums += [s + x for s in sums]
        return sums

    left_sums = get_subset_sums(left_part)
    right_sums = sorted(get_subset_sums(right_part))

    for s in left_sums:
        needed = target - s
        idx = bisect.bisect_left(right_sums, needed)
        if idx < len(right_sums) and right_sums[idx] == needed:
            return True

    return False`;

export const DEFAULT_MEET_IN_THE_MIDDLE_INPUT: MeetInTheMiddleInput = {
  array: [2, 4, 5, 9, 12, 16],
  target: 37,
};

export const generateMeetInTheMiddleSteps = (input: MeetInTheMiddleInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawArray =
    input?.array ??
    (input as unknown as { nums?: number[] })?.nums ??
    DEFAULT_MEET_IN_THE_MIDDLE_INPUT.array;
  const nums = Array.isArray(rawArray)
    ? [...rawArray]
    : [...DEFAULT_MEET_IN_THE_MIDDLE_INPUT.array];
  const target =
    typeof input?.target === "number" ? input.target : DEFAULT_MEET_IN_THE_MIDDLE_INPUT.target;
  const n = nums.length;
  const mid = Math.floor(n / 2);

  const makeMatrixSnapshot = (
    currentLeftSums: number[],
    currentRightSums: number[],
    activeLeftElementIdx?: number[],
    activeRightElementIdx?: number[],
    activeLeftSumIdx?: number,
    activeRightSumIdx?: number,
    compareRightSumRange?: [number, number],
    foundMatch?: { leftSumIdx: number; rightSumIdx: number },
  ): MatrixVisualSnapshot => {
    const maxCols = Math.max(n, currentLeftSums.length, currentRightSums.length, 1);
    const cells: MatrixCellItem[] = [];

    // Row 0: Original input array nums partitioned into Left and Right halves
    for (let i = 0; i < n; i++) {
      const isLeft = i < mid;
      let state: ElementState = "default";

      if (foundMatch) {
        state = "sorted";
      } else if (activeLeftElementIdx && activeLeftElementIdx.includes(i)) {
        state = "active";
      } else if (activeRightElementIdx && activeRightElementIdx.includes(i)) {
        state = "pivot";
      } else if (isLeft) {
        state = "compare";
      }

      cells.push({
        row: 0,
        col: i,
        value: nums[i],
        label: isLeft ? `L[${i}]` : `R[${i - mid}]`,
        state,
      });
    }

    // Row 1: Left Subset Sums (2^(N/2) elements)
    for (let k = 0; k < currentLeftSums.length; k++) {
      let state: ElementState = "default";

      if (foundMatch && foundMatch.leftSumIdx === k) {
        state = "sorted";
      } else if (activeLeftSumIdx === k) {
        state = "active";
      }

      cells.push({
        row: 1,
        col: k,
        value: currentLeftSums[k],
        label: `L_sum[${k}]`,
        state,
      });
    }

    // Row 2: Right Subset Sums Sorted (2^(N/2) elements)
    for (let j = 0; j < currentRightSums.length; j++) {
      let state: ElementState = "default";

      if (foundMatch && foundMatch.rightSumIdx === j) {
        state = "sorted";
      } else if (activeRightSumIdx === j) {
        state = "pivot";
      } else if (
        compareRightSumRange &&
        j >= compareRightSumRange[0] &&
        j <= compareRightSumRange[1]
      ) {
        state = "compare";
      }

      cells.push({
        row: 2,
        col: j,
        value: currentRightSums[j],
        label: `R_sum[${j}]`,
        state,
      });
    }

    // Edge case handling for empty input
    if (n === 0) {
      cells.push({ row: 0, col: 0, value: "-", label: "Empty", state: "default" });
      cells.push({ row: 1, col: 0, value: 0, label: "L_sum[0]", state: "default" });
      cells.push({ row: 2, col: 0, value: 0, label: "R_sum[0]", state: "default" });
    }

    return {
      kind: "matrix",
      rows: 3,
      cols: maxCols,
      cells,
      rowHeaders: ["Input Set", "Left Sums", "Right Sums"],
      colHeaders: Array.from({ length: maxCols }, (_, i) => `[${i}]`),
      title: `Meet in the Middle (Target=${target}, Left sums: ${currentLeftSums.length}, Right sums: ${currentRightSums.length})`,
    };
  };

  let leftSumsState: number[] = [];
  let rightSumsState: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeLeftElementIdx?: number[],
    activeRightElementIdx?: number[],
    activeLeftSumIdx?: number,
    activeRightSumIdx?: number,
    compareRightSumRange?: [number, number],
    foundMatch?: { leftSumIdx: number; rightSumIdx: number },
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        leftSumsState,
        rightSumsState,
        activeLeftElementIdx,
        activeRightElementIdx,
        activeLeftSumIdx,
        activeRightSumIdx,
        compareRightSumRange,
        foundMatch,
      ),
      auxiliaryState: {
        customState: {
          target: String(target),
          arrayLength: String(n),
          leftSumsCount: String(leftSumsState.length),
          rightSumsCount: String(rightSumsState.length),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Import bisect for binary search",
    "Python's bisect module provides O(log k) sorted-array search. We use bisect_left to probe target complements in sorted right subset sums.",
    { n, target },
  );

  addStep(
    3,
    "Initialize Meet in the Middle Subset Sum",
    `Input set of N = ${n} numbers: [${nums.join(", ")}]. Target sum = ${target}.`,
    { n, target },
  );

  addStep(
    4,
    `Cache element count n = ${n}`,
    `Storing array length n = ${n} to evaluate halving threshold mid = n // 2.`,
    { n, target },
  );

  if (n === 0) {
    leftSumsState = [0];
    rightSumsState = [0];
    addStep(
      5,
      `Check if n == 0 (n = ${n})`,
      "The input array is empty. The only achievable sum is 0, so we test if target equals 0.",
      { n: 0, target },
    );

    const matched = target === 0;
    addStep(
      6,
      matched ? "Target 0 matched by empty set" : "Empty set cannot sum to non-zero target",
      matched ? "Empty set sum equals target 0." : "Empty set sum is 0, target is non-zero.",
      { n: 0, target, matched },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      matched ? { leftSumIdx: 0, rightSumIdx: 0 } : undefined,
    );
    return steps;
  }

  addStep(
    5,
    `Check if n == 0 (n = ${n})`,
    `n = ${n} — the array is non-empty, so we proceed with splitting into two halves of size ${mid} and ${n - mid}.`,
    { n, target },
  );

  addStep(
    8,
    `Calculate midpoint index mid = n // 2 = ${mid}`,
    `Splitting ${n} elements into left half (indices 0..${mid - 1}) and right half (indices ${mid}..${n - 1}).`,
    { n, mid },
  );

  const leftPart = nums.slice(0, mid);
  addStep(
    9,
    `Slice left_part = nums[:${mid}]`,
    `Left half set: [${leftPart.join(", ")}].`,
    { leftLen: leftPart.length },
    Array.from({ length: mid }, (_, i) => i),
  );

  const rightPart = nums.slice(mid);
  addStep(
    10,
    `Slice right_part = nums[${mid}:]`,
    `Right half set: [${rightPart.join(", ")}].`,
    { rightLen: rightPart.length },
    undefined,
    Array.from({ length: n - mid }, (_, i) => i + mid),
  );

  addStep(
    12,
    "Define get_subset_sums helper",
    "Helper function generates 2^k subset sums for an input subset of size k.",
    { leftLen: leftPart.length, rightLen: rightPart.length },
  );

  addStep(
    18,
    `Begin left_sums = get_subset_sums(left_part)`,
    `Generating all 2^${leftPart.length} = ${1 << leftPart.length} subset sums for left half elements [${leftPart.join(", ")}].`,
    { leftLen: leftPart.length },
    Array.from({ length: mid }, (_, i) => i),
  );

  // Generate left subset sums step by step
  leftSumsState = [0];
  addStep(
    13,
    "Initialize left_sums = [0]",
    "Base case: empty left subset has sum 0 (row 1 index 0).",
    { initialSum: 0 },
    Array.from({ length: mid }, (_, i) => i),
  );

  for (let i = 0; i < leftPart.length; i++) {
    const x = leftPart[i];
    const newSums = leftSumsState.map((s) => s + x);
    leftSumsState = leftSumsState.concat(newSums);

    addStep(
      15,
      `Include element x = ${x} in left_sums`,
      `For element ${x}, adding ${x} to all previous sums doubles left_sums to ${leftSumsState.length} total subset sums: [${leftSumsState.join(", ")}].`,
      { element: x, totalSums: leftSumsState.length },
      [i],
    );
  }

  addStep(
    16,
    `Completed left_sums (${leftSumsState.length} combinations)`,
    `Left subset sums row fully populated: [${leftSumsState.join(", ")}].`,
    { count: leftSumsState.length },
    Array.from({ length: mid }, (_, i) => i),
  );

  addStep(
    19,
    `Begin right_sums = sorted(get_subset_sums(right_part))`,
    `Generating and sorting all 2^${rightPart.length} = ${1 << rightPart.length} subset sums for right half elements [${rightPart.join(", ")}].`,
    { rightLen: rightPart.length },
    undefined,
    Array.from({ length: n - mid }, (_, i) => i + mid),
  );

  rightSumsState = [0];
  addStep(
    13,
    "Initialize right_sums = [0]",
    "Base case: empty right subset has sum 0.",
    { initialSum: 0 },
    undefined,
    Array.from({ length: n - mid }, (_, i) => i + mid),
  );

  for (let i = 0; i < rightPart.length; i++) {
    const x = rightPart[i];
    const newSums = rightSumsState.map((s) => s + x);
    rightSumsState = rightSumsState.concat(newSums);

    addStep(
      15,
      `Include element x = ${x} in right_sums`,
      `Adding ${x} expands right_sums to ${rightSumsState.length} total subset sums.`,
      { element: x, totalSums: rightSumsState.length },
      undefined,
      [i + mid],
    );
  }

  rightSumsState.sort((a, b) => a - b);
  addStep(
    19,
    `Sorted right_sums = [${rightSumsState.join(", ")}]`,
    `Right subset sums sorted in non-decreasing order: [${rightSumsState.join(", ")}]. Enables O(log(2^(N/2))) binary search complement lookups.`,
    { count: rightSumsState.length },
    undefined,
    Array.from({ length: n - mid }, (_, i) => i + mid),
  );

  let foundMatch = false;

  for (let idx = 0; idx < leftSumsState.length; idx++) {
    const s = leftSumsState[idx];
    const needed = target - s;

    addStep(
      21,
      `Loop iteration ${idx + 1}/${leftSumsState.length}: Test left sum s = ${s}`,
      `Selecting left subset sum s = ${s} at row 1 index ${idx}.`,
      { leftIdx: idx, leftSum: s, target },
      undefined,
      undefined,
      idx,
    );

    addStep(
      22,
      `Calculate needed right sum: needed = target - s = ${target} - ${s} = ${needed}`,
      `To achieve target ${target}, we require a right subset sum equal to needed = ${needed}.`,
      { leftSum: s, needed, target },
      undefined,
      undefined,
      idx,
    );

    addStep(
      23,
      `Bisect left: bisect.bisect_left(right_sums, ${needed})`,
      `Binary searching row 2 sorted right_sums [${rightSumsState.join(", ")}] for complement ${needed}.`,
      { needed, rightSumsLength: rightSumsState.length },
      undefined,
      undefined,
      idx,
      undefined,
      [0, rightSumsState.length - 1],
    );

    let bLeft = 0;
    let bRight = rightSumsState.length - 1;
    let found = false;
    let foundIdx = -1;

    while (bLeft <= bRight) {
      const bMid = Math.floor((bLeft + bRight) / 2);
      const bVal = rightSumsState[bMid];

      addStep(
        23,
        `Probe right_sums[${bMid}] = ${bVal} against needed = ${needed}`,
        `Binary search probe at row 2 index ${bMid} (value ${bVal}) in search window [${bLeft}..${bRight}]. ${bVal === needed ? "Match!" : bVal < needed ? `${bVal} < ${needed}, searching right half.` : `${bVal} > ${needed}, searching left half.`}`,
        { bLeft, bRight, bMid, bVal, needed },
        undefined,
        undefined,
        idx,
        bMid,
        [bLeft, bRight],
      );

      if (bVal === needed) {
        found = true;
        foundIdx = bMid;
        break;
      } else if (bVal < needed) {
        bLeft = bMid + 1;
      } else {
        bRight = bMid - 1;
      }
    }

    addStep(
      24,
      `Evaluate match check for needed = ${needed}`,
      found
        ? `Match found! right_sums[${foundIdx}] = ${needed}.`
        : `Value ${needed} not present in right_sums.`,
      { needed, found, foundIdx },
      undefined,
      undefined,
      idx,
      found ? foundIdx : undefined,
    );

    if (found) {
      foundMatch = true;
      addStep(
        25,
        `Return True — Found subset pair summing to ${target}!`,
        `Left sum (${s}) at row 1 index ${idx} + Right sum (${needed}) at row 2 index ${foundIdx} = ${target}! Highlighted green cells confirm the solution pair.`,
        { leftSum: s, rightSum: needed, target, foundMatch: true },
        undefined,
        undefined,
        idx,
        foundIdx,
        undefined,
        { leftSumIdx: idx, rightSumIdx: foundIdx },
      );
      break;
    }
  }

  if (!foundMatch) {
    addStep(
      27,
      `Return False — No combination equals ${target}`,
      `Exhausted all ${leftSumsState.length} left subset sums without finding a complementary right subset sum. No subset sums to ${target}.`,
      { target, matched: false },
    );
  }

  return steps;
};

export const MEET_IN_THE_MIDDLE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Meet in the Middle</strong> is an algorithmic paradigm that reduces the exponential complexity of hard search problems (like Subset Sum, 4-Sum, or Discrete Logarithms) from <code>O(2ⁿ)</code> to <code>O(N &middot; 2ⁿ/²)</code>. For problem sizes around <code>N = 30</code> to <code>40</code>, brute-force exploration requiring <code>2⁴⁰</code> (&approx;1 trillion) operations is intractable. By splitting the domain into two halves of size <code>N/2</code>, precomputing all <code>2ⁿ/²</code> state sums for each side, sorting one side, and querying complements via binary search or two pointers, the search completes in milliseconds.</p>",
  sections: [
    {
      heading: "1. Why It Exists & The Halving Breakthrough",
      body: "<p>Brute-force subset sum checks all <code>2ⁿ</code> combinations. For <code>N = 40</code>, <code>2⁴⁰</code> operations takes hours or days on modern CPUs. Splitting <code>N</code> into two halves of 20 yields <code>2²⁰</code> (&approx;1 million) sums for each half. Generating, sorting, and binary searching 1 million integers takes only a few megabytes of memory and milliseconds of processing time.</p>",
    },
    {
      heading: "2. Step-by-Step Intuition & Binary Search Join",
      body: "<p>Processing pipeline:</p><ul><li>Partition the <code>N</code>-element set into <code>left_part</code> (size <code>N/2</code>) and <code>right_part</code> (size <code>N - N/2</code>).</li><li>Compute all <code>2ⁿ/²</code> subset sums for <code>left_part</code> and sorted <code>2ⁿ/²</code> subset sums for <code>right_part</code>.</li><li>For each sum <code>s</code> in <code>left_sums</code>, query required complement <code>needed = target - s</code> in <code>right_sums</code> using binary search (<code>bisect_left</code>).</li><li>If <code>needed</code> exists in <code>right_sums</code>, a valid subset exists!</li></ul>",
    },
    {
      heading: "3. Trade-offs & Memory Considerations",
      body: "<p>Meet in the Middle trades space for time: while time drops from <code>O(2ⁿ)</code> to <code>O(N &middot; 2ⁿ/²)</code>, auxiliary memory increases from <code>O(N)</code> to <code>O(2ⁿ/²)</code> to store generated subset sums. For <code>N = 40</code>, storing <code>2²⁰</code> 64-bit integers requires &approx;8 MB of RAM, which fits comfortably in CPU cache.</p>",
    },
    {
      heading: "4. Cryptographic & Systems Applications",
      body: "<p>Meet in the Middle is famous in cryptanalysis for demonstrating the insecurity of Double DES: encrypting plaintext with key <code>K1</code> and decrypting ciphertext with key <code>K2</code> allows an attacker to meet in the middle on <code>2⁵⁶</code> intermediate states instead of <code>2¹¹²</code> key pairs. It also powers Baby-Step Giant-Step algorithms for discrete logarithms and 4-Sum solvers.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Meet in the Middle",
      definition:
        "A search strategy that splits an exponential problem of size N into two halves of size N/2, precomputes solutions for each half, and joins them to cut time from 2^N to N 2^(N/2).",
    },
    {
      term: "Subset Sum Problem",
      definition:
        "The decision problem of finding whether any subset of numbers sums to a target value. NP-complete in general, but solvable in O(N 2^(N/2)) for small N.",
    },
    {
      term: "Complement Search",
      definition:
        "Looking up the exact complementary value target - s in a sorted pre-computed array of state values using binary search.",
    },
  ],
};

export const MEET_IN_THE_MIDDLE_TRIVIA: TriviaMeta = {
  skipLines: [2, 7, 11, 17, 20, 26],
  distractors: [
    "mid = n // 3",
    "left_sums = get_subset_sums(nums)",
    "needed = target + s",
    "idx = right_sums.index(needed)",
  ],
  hints: [
    {
      line: 8,
      hint: "Split the array at its midpoint so each half generates roughly 2^(N/2) subset sums.",
    },
    {
      line: 19,
      hint: "Sort the right subset sums so binary search can locate complements in logarithmic time.",
    },
    {
      line: 22,
      hint: "Calculate the exact value the right half must contribute to reach target.",
    },
    {
      line: 23,
      hint: "Binary search the sorted right subset sums for the needed complement.",
    },
  ],
  lineExplanations: {
    1: "Imports bisect for fast binary search on sorted right subset sums.",
    2: "Blank line preceding main function.",
    3: "Defines meet_in_the_middle(nums, target) -> bool to test if any subset sums to target.",
    4: "Stores total element count n of input array nums.",
    5: "Checks base case when input array is empty (n == 0).",
    6: "Returns True if target is 0 for empty array, False otherwise.",
    7: "Blank line preceding array partition.",
    8: "Calculates midpoint index mid = n // 2 to split array into equal halves.",
    9: "Extracts left half slice left_part = nums[:mid].",
    10: "Extracts right half slice right_part = nums[mid:].",
    11: "Blank line preceding helper definition.",
    12: "Defines helper function get_subset_sums(arr) to compute all 2^k subset sums.",
    13: "Initializes sums list with 0 representing the empty subset sum.",
    14: "Loops through each element x in input array arr.",
    15: "Appends s + x for every existing sum s to double available subset sums.",
    16: "Returns accumulated list of all subset sums.",
    17: "Blank line preceding left and right subset sum computations.",
    18: "Computes all subset sums for left_part array.",
    19: "Computes and sorts all subset sums for right_part array in non-decreasing order.",
    20: "Blank line preceding search loop.",
    21: "Loops through each subset sum s in left_sums.",
    22: "Calculates complementary value needed = target - s required from right half.",
    23: "Performs binary search bisect_left to locate needed in sorted right_sums.",
    24: "Checks if bisect index is within bounds and right_sums[idx] equals needed.",
    25: "Returns True immediately upon finding a valid left and right sum combination.",
    26: "Blank line ending main search loop.",
    27: "Returns False when no subset sum pair combines to equal target.",
  },
};

export const meetInTheMiddle: AlgorithmDefinition<MeetInTheMiddleInput> = {
  id: "meet-in-the-middle",
  title: "Meet in the Middle (Subset Sum Technique)",
  topicIds: ["binary_search"],
  difficulty: "Hard",
  description:
    "<p>Master Meet in the Middle: solve exponential search problems like Subset Sum for <code>N &approx; 40</code> in <code>O(N &middot; 2ⁿ/²)</code> time instead of <code>O(2ⁿ)</code>.</p><h3>Why It Exists &amp; What It Solves</h3><p>Brute-force subset sum exploration tests all <code>2ⁿ</code> subsets. When <code>N = 40</code>, <code>2⁴⁰ &approx; 1.1 &times; 10¹²</code> combinations requires hours of computation. Meet in the Middle solves this by partitioning the input into two halves of size <code>N/2 = 20</code>. Each half generates <code>2²⁰ &approx; 10⁶</code> subset sums. Sorting one side and probing complementary values via binary search reduces total operations to <code>O(N &middot; 2ⁿ/²)</code>, executing in under 50 milliseconds.</p><h3>Step-by-Step Intuition</h3><ul><li><strong>Partition the Array</strong>: Split <code>N</code> elements into <code>left_part</code> (<code>N/2</code> elements) and <code>right_part</code> (<code>N - N/2</code> elements).</li><li><strong>Precompute Subset Sums</strong>: Generate all <code>2ⁿ/²</code> subset sums for <code>left_part</code> and sort the <code>2ⁿ/²</code> subset sums of <code>right_part</code>.</li><li><strong>Complement Search</strong>: For each sum <code>s &in; left_sums</code>, calculate <code>needed = target - s</code>.</li><li><strong>Binary Search Join</strong>: Binary search for <code>needed</code> in sorted <code>right_sums</code>. If found, a valid subset exists!</li></ul><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input</strong>: <code>array</code> (<code>number[]</code>) of <code>N</code> integers (<code>1 &le; N &le; 40</code>), <code>target</code> (<code>number</code>).</li><li><strong>Output</strong>: boolean <code>true</code> if a subset exists whose sum equals target, otherwise <code>false</code>.</li></ul><h3>Trade-offs &amp; Complexity</h3><ul><li><strong>Time Complexity</strong>: <code>O(N &middot; 2ⁿ/²)</code> worst/average case.</li><li><strong>Space Complexity</strong>: <code>O(2ⁿ/²)</code> auxiliary memory to store precomputed subset sums.</li></ul>",
  constraints: ["1 <= N <= 40", "-10^9 <= array[i], target <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay: "arr = [2, 4, 5, 9, 12, 16], target = 25",
      outputDisplay: "Match Found: True (4 + 5 + 16 = 25)",
      input: {
        array: [2, 4, 5, 9, 12, 16],
        target: 25,
      },
      output: "Match Found: True",
      explanation:
        "N=6 split into left [2,4,5] and right [9,12,16]. Left sum 9 (4+5) combines with right sum 16.",
    },
    {
      kind: "complex",
      title: "Complex Edge Case",
      inputDisplay: "arr = [1, 3, 9, 27, 81], target = 31",
      outputDisplay: "Match Found: True (1 + 3 + 27 = 31)",
      input: {
        array: [1, 3, 9, 27, 81],
        target: 31,
      },
      output: "Match Found: True",
      explanation:
        "Powers of 3 set; left half [1,3] generates sum 4, right half [9,27,81] contains 27.",
    },
    {
      kind: "negative",
      title: "Failing / Boundary Case",
      inputDisplay: "arr = [10, 20, 30], target = 25",
      outputDisplay: "Match Found: False",
      input: {
        array: [10, 20, 30],
        target: 25,
      },
      output: "Match Found: False",
      explanation: "No subset of [10, 20, 30] sums to 25.",
    },
  ],
  code: MEET_IN_THE_MIDDLE_CODE,
  timeComplexity: {
    best: "O(n 2^(n/2))",
    average: "O(n 2^(n/2))",
    worst: "O(n 2^(n/2))",
  },
  spaceComplexity: "O(2^(n/2))",
  complexityAnalysis: {
    time: "Generating 2^(n/2) subset sums for both halves takes O(2^(n/2)). Sorting right sums takes O(n 2^(n/2)). Doing 2^(n/2) binary searches takes O(n 2^(n/2)) total time.",
    space:
      "Requires O(2^(n/2)) auxiliary memory to store precomputed left and right subset sum vectors.",
  },
  topicGuide: MEET_IN_THE_MIDDLE_TOPIC_GUIDE,
  trivia: MEET_IN_THE_MIDDLE_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 5,
      section: "5.4 Meet in the middle",
      label: "Competitive Programmer's Handbook, Ch 5",
    },
  ],
  defaultInput: DEFAULT_MEET_IN_THE_MIDDLE_INPUT,
  generateSteps: generateMeetInTheMiddleSteps,
};
