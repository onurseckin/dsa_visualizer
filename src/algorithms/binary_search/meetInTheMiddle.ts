import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Meet in the Middle is an algorithmic paradigm that reduces the exponential complexity of Subset Sum from O(2^N) down to O(N * 2^(N/2)).",
    primarySnapshot: {
      kind: "array",
      name: "array",
      mode: "box",
      elements: [
        { id: "e1", value: 2, label: "[0]", state: "default" },
        { id: "e2", value: 4, label: "[1]", state: "default" },
        { id: "e3", value: 5, label: "[2]", state: "default" },
        { id: "e4", value: 9, label: "[3]", state: "default" },
        { id: "e5", value: 12, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Brute-force subset sum checks all 2^N combinations; for N = 40, testing 2^40 (~1 trillion) states is computationally intractable.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_contrast",
      mode: "box",
      elements: [
        { id: "c1", value: "Brute-Force: O(2^N)", state: "compare" },
        { id: "c2", value: "Meet in the Middle: O(N * 2^(N/2))", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The key insight is to partition N elements into two equal halves of size N / 2: a left half and a right half.",
    primarySnapshot: {
      kind: "array",
      name: "partition",
      mode: "box",
      elements: [
        { id: "p1", value: 2, label: "Left", state: "active" },
        { id: "p2", value: 4, label: "Left", state: "active" },
        { id: "p3", value: 5, label: "Left", state: "active" },
        { id: "p4", value: 9, label: "Right", state: "visited" },
        { id: "p5", value: 12, label: "Right", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "We generate all 2^(N/2) subset sums for the left half and all 2^(N/2) subset sums for the right half independently.",
    primarySnapshot: {
      kind: "matrix",
      name: "sums_matrices",
      rows: 2,
      cols: 4,
      rowHeaders: ["Left Sums", "Right Sums"],
      colHeaders: ["[0]", "[1]", "[2]", "[3]"],
      cells: [
        { row: 0, col: 0, value: 0, state: "default" },
        { row: 0, col: 1, value: 2, state: "default" },
        { row: 0, col: 2, value: 4, state: "default" },
        { row: 0, col: 3, value: 6, state: "default" },
        { row: 1, col: 0, value: 0, state: "default" },
        { row: 1, col: 1, value: 9, state: "default" },
        { row: 1, col: 2, value: 12, state: "default" },
        { row: 1, col: 3, value: 21, state: "default" },
      ],
    },
  },
  {
    narrative:
      "We sort the right subset sums in non-decreasing order to enable logarithmic binary search complement lookups.",
    primarySnapshot: {
      kind: "array",
      name: "sorted_right",
      mode: "box",
      elements: [
        { id: "sr1", value: 0, state: "sorted" },
        { id: "sr2", value: 9, state: "sorted" },
        { id: "sr3", value: 12, state: "sorted" },
        { id: "sr4", value: 21, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "For each sum s in left_sums, the required complement sum from the right half is needed = target - s.",
    primarySnapshot: {
      kind: "array",
      name: "equation",
      mode: "box",
      elements: [
        { id: "eq1", value: "left_sum (s)", state: "active" },
        { id: "eq2", value: "+ needed", state: "compare" },
        { id: "eq3", value: "= Target", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "We perform binary search for needed in right_sums. If needed is found, a valid subset exists!",
    primarySnapshot: {
      kind: "matrix",
      name: "match_found",
      rows: 2,
      cols: 4,
      rowHeaders: ["Left Sums", "Right Sums"],
      colHeaders: ["[0]", "[1]", "[2]", "[3]"],
      cells: [
        { row: 0, col: 2, value: 4, state: "active" },
        { row: 1, col: 3, value: 21, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Meet in the Middle trades space for time: it requires O(2^(N/2)) memory to store precomputed sums, running in under 50ms for N = 40.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "sm1", value: "Time: O(N * 2^(N/2))", state: "sorted" },
        { id: "sm2", value: "Space: O(2^(N/2)) Memory", state: "default" },
      ],
    },
  },
];

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

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.array) &&
      input.array.length === DEFAULT_MEET_IN_THE_MIDDLE_INPUT.array.length &&
      input.array.every((val, idx) => val === DEFAULT_MEET_IN_THE_MIDDLE_INPUT.array[idx]) &&
      input.target === DEFAULT_MEET_IN_THE_MIDDLE_INPUT.target);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const getSubsetSums = (arr: number[]): number[] => {
    let sums = [0];
    for (const x of arr) {
      sums = sums.concat(sums.map((s) => s + x));
    }
    return sums;
  };

  const leftPart = nums.slice(0, mid);
  const rightPart = nums.slice(mid);
  const leftSums = getSubsetSums(leftPart);
  const rightSums = getSubsetSums(rightPart).sort((a, b) => a - b);

  const makeMatrixSnapshot = (
    activeLeftIdx?: number,
    activeRightIdx?: number,
    match = false,
  ): MatrixVisualSnapshot => {
    const maxCols = Math.max(leftSums.length, rightSums.length, 1);
    const cells: MatrixCellItem[] = [];

    for (let k = 0; k < leftSums.length; k++) {
      cells.push({
        row: 0,
        col: k,
        value: leftSums[k],
        label: `L[${k}]`,
        state: match && activeLeftIdx === k ? "sorted" : activeLeftIdx === k ? "active" : "default",
      });
    }

    for (let j = 0; j < rightSums.length; j++) {
      cells.push({
        row: 1,
        col: j,
        value: rightSums[j],
        label: `R[${j}]`,
        state:
          match && activeRightIdx === j ? "sorted" : activeRightIdx === j ? "compare" : "default",
      });
    }

    return {
      kind: "matrix",
      rows: 2,
      cols: maxCols,
      rowHeaders: ["Left Sums", "Right Sums"],
      colHeaders: Array.from({ length: maxCols }, (_, i) => `[${i}]`),
      cells,
    };
  };

  addStep(
    `Initializing Meet in the Middle for N = ${n} elements with target = ${target}. Partitioning into left half [${leftPart.join(", ")}] and right half [${rightPart.join(", ")}].`,
    makeMatrixSnapshot(),
  );

  let found = false;
  let matchedLeft = -1;
  let matchedRight = -1;

  for (let i = 0; i < leftSums.length; i++) {
    const s = leftSums[i];
    const needed = target - s;

    let bLeft = 0;
    let bRight = rightSums.length - 1;
    let rIdx = -1;

    while (bLeft <= bRight) {
      const bMid = Math.floor((bLeft + bRight) / 2);
      if (rightSums[bMid] === needed) {
        rIdx = bMid;
        break;
      } else if (rightSums[bMid] < needed) {
        bLeft = bMid + 1;
      } else {
        bRight = bMid - 1;
      }
    }

    if (rIdx !== -1) {
      found = true;
      matchedLeft = i;
      matchedRight = rIdx;
      addStep(
        `Testing left sum s = ${s}: needed complement is ${needed} (${target} - ${s}). Binary search in right_sums found match at right index ${rIdx} (${rightSums[rIdx]})!`,
        makeMatrixSnapshot(i, rIdx, true),
      );
      break;
    } else {
      addStep(
        `Testing left sum s = ${s}: needed complement ${needed} not found in right_sums.`,
        makeMatrixSnapshot(i),
      );
    }
  }

  addStep(
    found
      ? `Completed Meet in the Middle: found subset pair summing to target ${target} (left sum ${leftSums[matchedLeft]} + right sum ${rightSums[matchedRight]}).`
      : `Completed Meet in the Middle: no combination of subset sums equals target ${target}.`,
    makeMatrixSnapshot(
      matchedLeft !== -1 ? matchedLeft : 0,
      matchedRight !== -1 ? matchedRight : 0,
      found,
    ),
  );

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
    "<p>Given an array of <code>N</code> integers <code>array</code> and a target integer <code>target</code>, determine whether there exists a non-empty or empty subset of elements whose sum equals <code>target</code> using the Meet in the Middle technique.</p><p><strong>Input:</strong> An array of integers <code>array</code> and a target integer <code>target</code>.</p><p><strong>Output:</strong> A boolean flag returning <code>true</code> if a subset summing to <code>target</code> exists, and <code>false</code> otherwise.</p>",
  constraints: ["1 <= N <= 40", "-10^9 <= array[i], target <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Case",
      inputDisplay: "arr = [2, 4, 5, 9, 12, 16], target = 37",
      outputDisplay: "Match Found: True",
      input: DEFAULT_MEET_IN_THE_MIDDLE_INPUT,
      output: "Match Found: True",
      explanation:
        "N=6 split into left [2,4,5] and right [9,12,16]. Left sum 9 (4+5) combines with right sum 28.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Adversarial Powers of 3 Case",
      inputDisplay: "arr = [1, 3, 9, 27, 81], target = 31",
      outputDisplay: "Match Found: True",
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
      scenario: "boundary",
      title: "Unmatchable Target Boundary Case",
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
