import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
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
  array: [2, 4, 5, 9, 12],
  target: 15,
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
    customState?: Record<string, string | number>,
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
    3,
    "Initialize Meet in the Middle Subset Sum",
    `Input set of N = ${n} numbers: [${nums.join(", ")}]. Target sum = ${target}. Split size N // 2 = ${Math.floor(n / 2)}.`,
    { n, target },
  );

  if (n === 0) {
    const matched = target === 0;
    addStep(
      6,
      matched ? "Target 0 matched by empty set" : "Empty set cannot sum to non-zero target",
      matched ? "Empty set sum equals target 0." : "Empty set sum is 0, target is non-zero.",
      { n: 0, target, matched },
    );
    return steps;
  }

  const mid = Math.floor(n / 2);
  const leftPart = nums.slice(0, mid);
  const rightPart = nums.slice(mid);

  addStep(
    7,
    `Split array into Left [0..${mid - 1}] and Right [${mid}..${n - 1}]`,
    `Left subset [${leftPart.join(", ")}] (size ${leftPart.length}), Right subset [${rightPart.join(", ")}] (size ${rightPart.length}).`,
    { leftLen: leftPart.length, rightLen: rightPart.length },
    Array.from({ length: mid }, (_, i) => i),
    Array.from({ length: n - mid }, (_, i) => i + mid),
  );

  const getSubsetSums = (arr: number[]): number[] => {
    let sums = [0];
    for (const x of arr) {
      const nextSums = sums.map((s) => s + x);
      sums = sums.concat(nextSums);
    }
    return sums;
  };

  const leftSums = getSubsetSums(leftPart);
  const rightSums = getSubsetSums(rightPart).sort((a, b) => a - b);

  addStep(
    18,
    `Generated ${leftSums.length} left subset sums and ${rightSums.length} sorted right subset sums`,
    `Left sums: [${leftSums.join(", ")}]. Sorted Right sums: [${rightSums.join(", ")}].`,
    { leftSumsCount: leftSums.length, rightSumsCount: rightSums.length },
    undefined,
    undefined,
    {
      leftSums: JSON.stringify(leftSums),
      rightSums: JSON.stringify(rightSums),
    },
  );

  let foundMatch = false;

  for (let idx = 0; idx < leftSums.length; idx++) {
    const s = leftSums[idx];
    const needed = target - s;

    addStep(
      21,
      `Testing left sum s = ${s} (needed right sum = ${needed})`,
      `Left sum ${s} requires complementary right sum target - s = ${target} - ${s} = ${needed}.`,
      { leftSum: s, needed, target },
    );

    // Binary search for needed in rightSums
    let bLeft = 0;
    let bRight = rightSums.length - 1;
    let found = false;

    while (bLeft <= bRight) {
      const bMid = Math.floor((bLeft + bRight) / 2);
      if (rightSums[bMid] === needed) {
        found = true;
        break;
      } else if (rightSums[bMid] < needed) {
        bLeft = bMid + 1;
      } else {
        bRight = bMid - 1;
      }
    }

    if (found) {
      foundMatch = true;
      addStep(
        24,
        `Found matching pair! Left sum (${s}) + Right sum (${needed}) = ${target}`,
        `Binary search located right sum ${needed} in rightSums array. Target ${target} successfully formed!`,
        { leftSum: s, rightSum: needed, target },
        undefined,
        undefined,
        { matchResult: `True (${s} + ${needed} = ${target})` },
      );
      break;
    }
  }

  if (!foundMatch) {
    addStep(
      26,
      `No combination of left sum and right sum equals ${target}`,
      "All binary search lookups exhausted without finding a complementary pair.",
      { target, matched: false },
    );
  }

  return steps;
};

export const MEET_IN_THE_MIDDLE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Meet in the Middle is a powerful algorithmic paradigm designed to solve hard exponential search problems (such as Subset Sum, 4-Sum, or Discrete Logarithms) when problem sizes N are around 30–40. Brute-force state space exploration scales as O(2^N), which quickly becomes impossible (2^40 ~ 10^12). By splitting the input into two equal halves of size N/2, computing all 2^(N/2) state sums for each side, and joining them using binary search or hash tables, the overall computational complexity drops to O(N 2^(N/2)). This technique is foundational in cryptanalysis (e.g., Meet-in-the-Middle attacks on Double DES) and competitive programming.",
  sections: [
    {
      heading: "Exponential Reduction via Halving",
      body: "For N = 40, searching 2^40 combinations requires over 1 trillion operations. Partitioning the array into two sub-arrays of size 20 generates 2^20 (~1,048,576) subset sums for each half. Storing and sorting 1 million integers takes a few megabytes of memory and milliseconds of CPU time.",
    },
    {
      heading: "Binary Search Coupling",
      body: "Once all subset sums of the left half (L) and right half (R) are generated, we sort R in O(N 2^(N/2)) time. For every sum s in L, the required complement is target - s. Performing a binary search for target - s in R takes O(N/2) time, giving a total query time of O(N 2^(N/2)).",
    },
    {
      heading: "Two-Pointer Join Variant",
      body: "Alternatively, after sorting both L and R, a converging two-pointer scan can find all matching pairs (s_L + s_R == target) or the closest sum to target in linear O(|L| + |R|) = O(2^(N/2)) time, avoiding individual binary searches.",
    },
    {
      heading: "Applications & Cryptographic Impact",
      body: "Meet-in-the-middle is famous for proving Double DES insecure: encrypting plaintext with key K1 and decrypting ciphertext with key K2 allows an attacker to meet in the middle on 2^56 intermediate states instead of 2^112 key pairs. In DSA, it solves 4-Sum, 0-1 Knapsack with N <= 40, and Baby-Step Giant-Step for discrete logarithms.",
    },
  ],
  keyTerms: [
    {
      term: "Meet in the Middle",
      definition:
        "A search strategy that splits an exponential problem of size N into two halves of size N/2, precomputes solutions for each half, and joins them to reduce runtime from 2^N to N 2^(N/2).",
    },
    {
      term: "Subset Sum Problem",
      definition:
        "The decision problem of finding whether any non-empty subset of numbers sums to a given target. It is NP-complete in general, but solvable in O(N 2^(N/2)) for small N via Meet in the Middle.",
    },
    {
      term: "Baby-Step Giant-Step",
      definition:
        "A meet-in-the-middle algorithm for computing discrete logarithms in finite abelian groups in O(sqrt(N)) time and space.",
    },
  ],
};

export const MEET_IN_THE_MIDDLE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports bisect for binary search on sorted right subset sums.",
    3: "Declares meet_in_the_middle_subset_sum: returns whether any subset of nums sums to target.",
    4: "Caches length of nums.",
    5: "Handles empty array base case.",
    6: "Returns whether target equals 0 for empty array.",
    7: "Calculates midpoint index n // 2 to split array into two equal halves.",
    8: "Splits left half of array up to mid.",
    9: "Splits right half of array from mid to end.",
    11: "Defines helper get_subset_sums to generate all 2^k subset sums for an array.",
    12: "Initializes subset sums list with 0 (empty subset sum).",
    14: "Appends s + x for each existing sum to double the combinations for each element.",
    17: "Generates all subset sums for left half of the array.",
    18: "Generates and sorts all subset sums for right half of the array.",
    20: "Iterates through each subset sum s generated from left half.",
    21: "Calculates required complement needed = target - s from right half.",
    22: "Binary searches sorted right_sums for needed complement.",
    23: "Checks if binary search found matching complement element.",
    24: "Returns True if valid subset pair sums to target.",
    26: "Returns False if no complementary subset pair reaches target.",
  },
};

export const meetInTheMiddle: AlgorithmDefinition<MeetInTheMiddleInput> = {
  id: "meet-in-the-middle",
  title: "Meet in the Middle (Subset Sum Technique)",
  category: "binary_search",
  categories: ["binary_search"],
  difficulty: "Hard",
  description:
    "Determine if there exists a non-empty subset of numbers in an array array that sums to target using the Meet in the Middle technique in O(N * 2^(N/2)) time.\n\n### Problem Statement\nGiven an array of N integers array and an integer target, determine whether any subset of elements from array sums to target.\n\nWhen N is around 30 to 40, a standard brute-force subset sum check of O(2^N) requires up to 2^40 operations, which is intractable. The Meet in the Middle technique divides the array into two equal halves of size N/2, computes all 2^(N/2) subset sums for each half, sorts the right subset sums, and uses binary search to find complementary sum pairs in O(N * 2^(N/2)) total time and O(2^(N/2)) space.\n\n### Input Parameters\n- array: An array of N integers.\n- target: The integer target sum to search for.\n\n### Output\n- Returns true if a subset exists whose sum equals target, otherwise false.\n\n### Edge Cases & Constraints\n- 1 <= N <= 40\n- -10^9 <= array[i], target <= 10^9\n- target = 0: The empty subset always sums to 0.\n- All positive vs mixed positive/negative array elements.\n- Array with a single element.",
  constraints: ["1 <= N <= 40", "-10^9 <= array[i], target <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay: "arr = [2, 4, 5, 9, 12], target = 15",
      outputDisplay: "Match Found: True (5 + 10 or 15)",
      input: {
        array: [2, 4, 5, 9, 12],
        target: 15,
      },
      output: "Match Found: True",
      explanation:
        "N=5 split into left [2,4] and right [5,9,12]. Left sum 0 combines with right sum 15 (or 9+4+2=15).",
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
    time: "Generating 2^(n/2) subset sums for both halves takes O(2^(n/2)). Sorting right sums takes O(n 2^(n/2)). Doing 2^(n/2) binary searches of size 2^(n/2) takes O(n 2^(n/2)) total time.",
    space: "Requires O(2^(n/2)) memory to store subset sums for left and right halves.",
  },
  topicGuide: {
    overview:
      "Meet in the Middle is a powerful algorithmic paradigm designed to solve hard exponential search problems (such as Subset Sum, 4-Sum, 0-1 Knapsack, or Discrete Logarithms) when problem sizes N are around 30–40. Brute-force state space exploration scales as O(2^N), which quickly becomes impossible (2^40 ~ 10^12). By splitting the input into two equal halves of size N/2, computing all 2^(N/2) state sums for each side, and joining them using binary search or hash tables, the overall computational complexity drops to O(N 2^(N/2)). This technique is foundational in cryptanalysis (e.g., Meet-in-the-Middle attacks on Double DES) and competitive programming.",
    sections: [
      {
        heading: "Exponential Reduction via Halving",
        body: "For N = 40, searching 2^40 combinations requires over 1 trillion operations. Partitioning the array into two sub-arrays of size 20 generates 2^20 (~1,048,576) subset sums for each half. Storing and sorting 1 million integers takes a few megabytes of memory and milliseconds of CPU time.",
      },
      {
        heading: "Binary Search Coupling",
        body: "Once all subset sums of the left half (L) and right half (R) are generated, we sort R in O(N 2^(N/2)) time. For every sum s in L, the required complement is target - s. Performing a binary search for target - s in R takes O(N/2) time, giving a total query time of O(N 2^(N/2)).",
      },
      {
        heading: "Two-Pointer Join Variant",
        body: "Alternatively, after sorting both L and R, a converging two-pointer scan can find all matching pairs (s_L + s_R == target) or the closest sum to target in linear O(|L| + |R|) = O(2^(N/2)) time, avoiding individual binary searches.",
      },
      {
        heading: "Applications & Cryptographic Impact",
        body: "Meet-in-the-middle is famous for proving Double DES insecure: encrypting plaintext with key K1 and decrypting ciphertext with key K2 allows an attacker to meet in the middle on 2^56 intermediate states instead of 2^112 key pairs. In DSA, it solves 4-Sum, 0-1 Knapsack with N <= 40, and Baby-Step Giant-Step for discrete logarithms.",
      },
    ],
    keyTerms: [
      {
        term: "Meet in the Middle",
        definition:
          "A search strategy that splits an exponential problem of size N into two halves of size N/2, precomputes solutions for each half, and joins them to reduce runtime from 2^N to N 2^(N/2).",
      },
      {
        term: "Subset Sum Problem",
        definition:
          "The decision problem of finding whether any non-empty subset of numbers sums to a given target. It is NP-complete in general, but solvable in O(N 2^(N/2)) for small N via Meet in the Middle.",
      },
      {
        term: "Baby-Step Giant-Step",
        definition:
          "A meet-in-the-middle algorithm for computing discrete logarithms in finite abelian groups in O(sqrt(N)) time and space.",
      },
    ],
  },
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
