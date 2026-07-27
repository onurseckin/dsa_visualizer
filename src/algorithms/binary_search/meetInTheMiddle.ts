import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MeetInTheMiddleInput {
  array: number[];
  target: number;
}

export const MEET_IN_THE_MIDDLE_CODE = `import bisect

def meet_in_the_middle_subset_sum(nums: list[int], target: int) -> bool:
    n = len(nums)
    if n == 0:
        return target == 0
    mid = n // 2
    left_part = nums[:mid]
    right_part = nums[mid:]

    def get_subset_sums(arr: list[int]) -> list[int]:
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

  const makeElements = (
    activeIndices?: number[],
    highlightIndices?: number[],
  ): ArrayElement[] => {
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
    "Meet in the Middle is a technique that reduces search complexity from O(2^N) to O(N 2^(N/2)) by splitting the problem into two halves of size N/2, computing all solutions for each half independently, and using binary search or hash sets to join them.",
  sections: [
    {
      heading: "Exponential Search Reduction",
      body: "Brute-force subset sum over N elements considers 2^N subsets. For N=40, 2^40 ~ 10^12 operations is infeasible. Splitting into two halves of 20 elements generates 2^20 ~ 10^6 subsets each, which easily fits in memory and runtime limits.",
    },
    {
      heading: "Binary Search Coupling",
      body: "After generating all 2^(N/2) subset sums for both halves, the right half subset sums are sorted. For each left subset sum s, we binary search for needed = target - s in the right subset sums in O(N/2) time per query.",
    },
    {
      heading: "Applications",
      body: "Meet in the middle is widely applicable to Subset Sum, Knapsack problems with small N (N <= 40), Discrete Logarithm (Baby-Step Giant-Step), and 4-Sum or graph path search problems.",
    },
  ],
  keyTerms: [
    {
      term: "Subset Sum",
      definition: "Determining whether a non-empty subset of numbers sums to a target integer.",
    },
    {
      term: "Meet in the Middle",
      definition: "Splitting an exponential state space N into two halves of N/2 to reduce time complexity from 2^N to N 2^(N/2).",
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
  difficulty: "Hard",
  description:
    "Meet in the Middle splits exponential state search problems (N <= 40) into two halves of size N/2. By precomputing half subset sums and binary searching complementary pairs, runtime drops from O(2^N) to O(N 2^(N/2)).",
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
      explanation: "N=5 split into left [2,4] and right [5,9,12]. Left sum 0 combines with right sum 15 (or 9+4+2=15).",
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
      explanation: "Powers of 3 set; left half [1,3] generates sum 4, right half [9,27,81] contains 27.",
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
