import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  DisplayValue,
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

  const nums = [...input.array];
  const n = nums.length;
  const target = input.target;

  const makeElements = (activeIndices?: number[], highlightIndices?: number[]): ArrayElement[] => {
    return nums.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (activeIndices && activeIndices.includes(idx)) {
        state = "active";
      } else if (highlightIndices && highlightIndices.includes(idx)) {
        state = "compare";
      }
      return {
        id: `el-${idx}`,
        value: val,
        state,
      };
    });
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIndices?: number[],
    highlightIndices?: number[],
    customState?: Record<string, DisplayValue>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(activeIndices, highlightIndices),
      },
      auxiliaryState: {
        customState: customState ?? {
          target: String(target),
          arrayLength: String(n),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Import bisect for binary search",
    "Python's bisect module provides O(log k) sorted-array search. We use bisect_left to check in O(log(2^(n/2))) = O(n/2) time whether a required sum exists in the right half.",
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
    `Storing array length n = ${n} to evaluate partitioning threshold.`,
    { n, target },
  );

  if (n === 0) {
    addStep(
      5,
      `Check if n == 0 (n = ${n})`,
      "The input array is empty. The only achievable sum is 0, so we return whether target itself equals 0.",
      { n, target },
    );

    const matched = target === 0;
    addStep(
      6,
      matched ? "Target 0 matched by empty set" : "Empty set cannot sum to non-zero target",
      matched ? "Empty set sum equals target 0." : "Empty set sum is 0, target is non-zero.",
      { n: 0, target, matched },
    );
    return steps;
  }

  addStep(
    5,
    `Check if n == 0 (n = ${n})`,
    `n = ${n} — the array is non-empty, so we proceed with the split-and-search strategy.`,
    { n, target },
  );

  const mid = Math.floor(n / 2);
  addStep(
    8,
    `Calculate midpoint index mid = n // 2 = ${mid}`,
    `Splitting ${n} elements into two halves of size ${mid} and ${n - mid}.`,
    { n, mid },
  );

  const leftPart = nums.slice(0, mid);
  addStep(
    9,
    `Slice left_part = nums[:${mid}]`,
    `Left subset contains elements: [${leftPart.join(", ")}].`,
    { leftLen: leftPart.length },
    Array.from({ length: mid }, (_, i) => i),
  );

  const rightPart = nums.slice(mid);
  addStep(
    10,
    `Slice right_part = nums[${mid}:]`,
    `Right subset contains elements: [${rightPart.join(", ")}].`,
    { rightLen: rightPart.length },
    undefined,
    Array.from({ length: n - mid }, (_, i) => i + mid),
  );

  const getSubsetSums = (arr: number[], label: "left" | "right"): number[] => {
    addStep(
      13,
      `Initialize ${label}_sums = [0]`,
      `Base case for ${label} subset sum generation starts with single element 0 (empty subset).`,
      { label, initialSum: 0 },
      label === "left" ? Array.from({ length: mid }, (_, i) => i) : undefined,
      label === "right" ? Array.from({ length: n - mid }, (_, i) => i + mid) : undefined,
    );

    let sums = [0];
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i];
      const nextSums = sums.map((s) => s + x);
      sums = sums.concat(nextSums);

      addStep(
        14,
        `for x = ${x}: build new subset sums`,
        `For each existing sum s in ${label}_sums, we create s + ${x} as a new candidate. This doubles the list (2^${i + 1} combinations now).`,
        { label, element: x, totalSums: sums.length },
        label === "left" ? [i] : undefined,
        label === "right" ? [i + mid] : undefined,
      );

      addStep(
        15,
        `Include element ${x} in ${label}_sums (2^${i + 1} = ${sums.length} total sums)`,
        `Adding element ${x} doubles candidate ${label} sums to [${sums.join(", ")}].`,
        { label, element: x, totalSums: sums.length },
        label === "left" ? [i] : undefined,
        label === "right" ? [i + mid] : undefined,
        { [`${label}Sums`]: JSON.stringify(sums) },
      );
    }

    addStep(
      16,
      `Return ${label}_sums vector (${sums.length} combinations)`,
      `Completed subset sum expansion for ${label} half.`,
      { label, finalCount: sums.length },
    );

    return sums;
  };

  addStep(
    12,
    "Define get_subset_sums helper",
    "Helper function generates 2^k subset sums for an array of size k.",
    { leftLen: leftPart.length, rightLen: rightPart.length },
  );

  addStep(
    18,
    `Begin left_sums = get_subset_sums(left_part)`,
    `Generating subset sums for left half elements [${leftPart.join(", ")}].`,
    { leftLen: leftPart.length },
  );
  const leftSums = getSubsetSums(leftPart, "left");

  addStep(
    19,
    `Begin right_sums = sorted(get_subset_sums(right_part))`,
    `Generating and sorting subset sums for right half elements [${rightPart.join(", ")}].`,
    { rightLen: rightPart.length },
  );
  const rightSums = getSubsetSums(rightPart, "right").sort((a, b) => a - b);

  addStep(
    19,
    `Sorted right_sums = [${rightSums.join(", ")}]`,
    `Right subset sums sorted in non-decreasing order to enable O(log(2^(N/2))) binary search lookups.`,
    { rightSumsCount: rightSums.length },
    undefined,
    Array.from({ length: n - mid }, (_, i) => i + mid),
    { rightSums: JSON.stringify(rightSums) },
  );

  let foundMatch = false;

  for (let idx = 0; idx < leftSums.length; idx++) {
    const s = leftSums[idx];
    addStep(
      21,
      `Loop iteration ${idx + 1}/${leftSums.length}: Test left sum s = ${s}`,
      `Inspecting candidate left subset sum s = ${s}.`,
      { leftIdx: idx, leftSum: s, target },
      undefined,
      undefined,
      { leftSum: s, rightSums: JSON.stringify(rightSums) },
    );

    const needed = target - s;
    addStep(
      22,
      `Calculate needed right sum: needed = target - s = ${target} - ${s} = ${needed}`,
      `Left sum ${s} requires complementary right sum ${needed} to reach target ${target}.`,
      { leftSum: s, needed, target },
      undefined,
      undefined,
      { leftSum: s, needed, rightSums: JSON.stringify(rightSums) },
    );

    let bLeft = 0;
    let bRight = rightSums.length - 1;
    let found = false;
    let foundIdx = -1;

    addStep(
      23,
      `Bisect left: bisect.bisect_left(right_sums, ${needed})`,
      `Searching sorted right_sums [${rightSums.join(", ")}] for target complement ${needed}.`,
      { needed, rightSumsLength: rightSums.length },
      undefined,
      undefined,
      { leftSum: s, needed, rightSums: JSON.stringify(rightSums) },
    );

    while (bLeft <= bRight) {
      const bMid = Math.floor((bLeft + bRight) / 2);
      const bVal = rightSums[bMid];

      addStep(
        23,
        `Probe right_sums[${bMid}] = ${bVal} against needed = ${needed}`,
        `Binary search probe at index ${bMid} in range [${bLeft}..${bRight}]. Value ${bVal} vs needed ${needed}.`,
        { bLeft, bRight, bMid, bVal, needed },
        undefined,
        undefined,
        {
          leftSum: s,
          needed,
          rightSums: JSON.stringify(rightSums),
          probeIdx: bMid,
          probeVal: bVal,
          probeRange: `[${bLeft}..${bRight}]`,
        },
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
        ? `Match found in right_sums at index ${foundIdx} (value ${needed}).`
        : `Value ${needed} not present in right_sums.`,
      { needed, found },
      undefined,
      undefined,
      { leftSum: s, needed, foundMatch: found },
    );

    if (found) {
      foundMatch = true;
      addStep(
        25,
        `Return True — Found subset pair summing to ${target}!`,
        `Left sum (${s}) + Right sum (${needed}) = ${target}. Target successfully formed!`,
        { leftSum: s, rightSum: needed, target, foundMatch: true },
        undefined,
        undefined,
        { matchResult: `True (${s} + ${needed} = ${target})` },
      );
      break;
    }
  }

  if (!foundMatch) {
    addStep(
      27,
      `Return False — No combination equals ${target}`,
      "All binary search lookups exhausted without finding a complementary subset pair.",
      { target, matched: false },
    );
  }

  return steps;
};

export const MEET_IN_THE_MIDDLE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Meet in the Middle is an algorithmic paradigm that reduces the exponential complexity of hard search problems (like Subset Sum, 4-Sum, or Discrete Logarithms) from O(2^N) to O(N * 2^(N/2)). For problem sizes around N = 30 to 40, brute-force exploration requiring 2^40 (~1 trillion) operations is intractable. By splitting the domain into two halves of size N/2, precomputing all 2^(N/2) state sums for each side, sorting one side, and querying complements via binary search or two pointers, the search completes in milliseconds.",
  sections: [
    {
      heading: "Why It Exists & The Halving Breakthrough",
      body: "Brute-force subset sum checks all 2^N combinations. For N = 40, 2^40 operations takes hours or days on modern CPUs. Splitting N into two halves of 20 yields 2^20 (~1 million) sums for each half. Generating, sorting, and binary searching 1 million integers takes only a few megabytes of memory and milliseconds of processing time.",
    },
    {
      heading: "Step-by-Step Intuition & Binary Search Join",
      body: "1. Partition the N-element set into left_part (size N/2) and right_part (size N - N/2).\n2. Compute all 2^(N/2) subset sums for left_part and sorted 2^(N/2) subset sums for right_part.\n3. For each sum s in left_sums, query required complement `needed = target - s` in right_sums using binary search (bisect_left).\n4. If `needed` exists in right_sums, a valid subset exists!",
    },
    {
      heading: "Trade-offs & Memory Considerations",
      body: "Meet in the Middle trades space for time: while time drops from O(2^N) to O(N * 2^(N/2)), auxiliary memory increases from O(N) to O(2^(N/2)) to store generated subset sums. For N = 40, storing 2^20 64-bit integers requires ~8 MB of RAM, which fits comfortably in CPU cache.",
    },
    {
      heading: "Cryptographic & Systems Applications",
      body: "Meet in the Middle is famous in cryptanalysis for demonstrating the insecurity of Double DES: encrypting plaintext with key K1 and decrypting ciphertext with key K2 allows an attacker to meet in the middle on 2^56 intermediate states instead of 2^112 key pairs. It also powers Baby-Step Giant-Step algorithms for discrete logarithms and 4-Sum solvers.",
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
        "Looking up the exact complementary value `target - s` in a sorted pre-computed array of state values using binary search.",
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
  description: `Master Meet in the Middle: solve exponential search problems like Subset Sum for $N \\approx 40$ in $O(N \\cdot 2^{N/2})$ time instead of $O(2^N)$.

### Why It Exists & What It Solves
Brute-force subset sum exploration tests all $2^N$ subsets. When $N = 40$, $2^{40} \\approx 1.1 \\times 10^{12}$ combinations requires hours of computation. Meet in the Middle solves this by partitioning the input into two halves of size $N/2 = 20$. Each half generates $2^{20} \\approx 10^6$ subset sums. Sorting one side and probing complementary values via binary search reduces total operations to $O(N \\cdot 2^{N/2})$, executing in under 50 milliseconds.

### Step-by-Step Intuition
1. **Partition the Array**: Split $N$ elements into \`left_part\` ($N/2$ elements) and \`right_part\` ($N - N/2$ elements).
2. **Precompute Subset Sums**: Generate all $2^{N/2}$ subset sums for \`left_part\` and sort the $2^{N/2}$ subset sums of \`right_part\`.
3. **Complement Search**: For each sum $s \\in \\text{left\\_sums}$, calculate \`needed = target - s\`.
4. **Binary Search Join**: Binary search for \`needed\` in sorted \`right_sums\`. If found, a valid subset exists!

### Input Parameters
- \`array\`: An array of $N$ integers ($1 \\le N \\le 40$).
- \`target\`: The integer target sum to search for.

### Output
- Returns boolean \`true\` if a subset exists whose sum equals target, otherwise \`false\`.

### Trade-offs & Complexity
- **Time Complexity**: $O(N \\cdot 2^{N/2})$ worst/average case.
- **Space Complexity**: $O(2^{N/2})$ auxiliary memory to store precomputed subset sums.
- **Limitation**: Effective when $N \\le 40$; larger $N$ exceeds RAM limits for $2^{N/2}$ elements.

### Edge Cases & Constraints
- \`1 <= N <= 40\`
- \`-10^9 <= array[i], target <= 10^9\`
- Target 0 (always satisfied by empty subset).
- Single-element arrays ($N = 1$).`,
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
