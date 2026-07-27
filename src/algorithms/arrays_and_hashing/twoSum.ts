import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TwoSumInput {
  nums: number[];
  target: number;
}

export const TWO_SUM_CODE = `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

export const DEFAULT_TWO_SUM_INPUT: TwoSumInput = {
  nums: [2, 7, 11, 15],
  target: 9,
};

export const generateTwoSumSteps = (input: TwoSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const hashMap: Record<string, number> = {};

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
        hashMap: { ...hashMap },
      },
      variables,
    });
  };

  const target = input.target;
  const n = elements.length;

  addStep(
    1,
    "Start the search",
    `We want two numbers in [${input.nums.join(", ")}] that add up to ${target}. Rather than testing every pair, we'll walk the array once and remember each value we pass.`,
    { target, length: n },
  );

  addStep(
    2,
    "Create an empty map",
    `This map will remember every value we see and where we saw it, so later elements can ask "has my partner already shown up?" with a single lookup.`,
    { target },
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = ["i"];

    const currentVal = Number(elements[i].value);

    addStep(
      3,
      `Visit nums[${i}] = ${currentVal}`,
      `We're standing at index ${i} looking at ${currentVal}, asking the same question we ask everywhere: which number would pair with this one to reach ${target}?`,
      { i, "nums[i]": currentVal, target },
    );

    const complement = target - currentVal;

    addStep(
      4,
      `Compute the complement ${complement}`,
      `${target} minus ${currentVal} leaves ${complement} — that's the exact partner ${currentVal} needs. If we've already walked past a ${complement}, this pair is our answer.`,
      { i, "nums[i]": currentVal, complement, target },
    );

    const hasComplement = String(complement) in hashMap;

    addStep(
      5,
      `Look up ${complement} in the map`,
      hasComplement
        ? `We have seen ${complement} before — it's sitting at index ${hashMap[String(complement)]}. Together with ${currentVal} it completes the target sum, so the search is over.`
        : `We haven't met ${complement} yet, so no partner for ${currentVal} exists behind us. We'll remember ${currentVal} and keep walking.`,
      { i, complement, hasComplement },
    );

    if (hasComplement) {
      const prevIdx = hashMap[String(complement)];
      elements[prevIdx].state = "sorted";
      elements[prevIdx].pointers = ["match"];
      elements[i].state = "sorted";
      elements[i].pointers = ["match"];

      addStep(
        6,
        `Return indices [${prevIdx}, ${i}]`,
        `nums[${prevIdx}] and nums[${i}] give us ${elements[prevIdx].value} + ${currentVal} = ${target}, exactly what we wanted. One pass and a map of what we'd seen was all it took — linear time overall.`,
        { resultIdx1: prevIdx, resultIdx2: i, target },
      );
      return steps;
    }

    // Store in map
    hashMap[String(currentVal)] = i;
    elements[i].state = "visited";
    elements[i].pointers = undefined;

    addStep(
      7,
      `Remember ${currentVal} at index ${i}`,
      `We store ${currentVal} → ${i} in the map, so if a later number needs ${currentVal} as its partner, it can find it instantly instead of rescanning the array.`,
      { i, "nums[i]": currentVal },
    );
  }

  addStep(
    8,
    "Return an empty array",
    `We walked the whole array and no value ever found its partner for ${target}, so we report that no valid pair exists.`,
    { target },
  );

  return steps;
};

/* Line 1 is the signature the problem statement hands you, so drilling it tests
   typing out type annotations rather than recalling the technique. */
const TWO_SUM_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "complement = num - target",
    "if num in seen:",
    "return [i, seen[num]]",
    "seen[i] = num",
    "for i in range(len(nums)):",
  ],
  hints: [
    {
      line: 4,
      hint: "Name the one value that would finish the pair with the current number — pure arithmetic, no lookup yet.",
    },
    {
      line: 5,
      hint: "Ask the map a membership question about that partner, and ask it before anything new is recorded.",
    },
    {
      line: 6,
      hint: "Answer with two positions: the one the map remembered for the partner, then where you are standing now.",
    },
    {
      line: 7,
      hint: "Make the current number findable by whoever comes later — the value is the key, the position is the payload.",
    },
  ],
  lineExplanations: {
    1: "States the contract: given nums and a target integer, return the indices of the two numbers that sum to it.",
    2: "Creates an empty hash map that will remember every value visited so far, mapped to the index where it appeared.",
    3: "Walks the array once, giving both the index i and the value num at each position via enumerate.",
    4: "Computes the one number, target minus num, that would complete the pair with the current value — pure arithmetic, no lookup yet.",
    5: "Asks the map whether that complement has already been seen, checking membership before anything new gets recorded so the current element can never pair with itself.",
    6: "Returns the earlier index stored for the complement together with the current index i, since together they are the answer.",
    7: "Records the current value and its index in the map so a later element can find it as a complement in O(1).",
    8: "Falls through here only if no pair was found by the time the loop ends, returning an empty list to signal failure.",
  },
};

export const twoSum: AlgorithmDefinition<TwoSumInput> = {
  id: "two-sum",
  title: "Two Sum",
  category: "arrays_and_hashing",
  categories: ["arrays_and_hashing"],
  difficulty: "Easy",
  description:
    "Given an array of integers nums and an integer target, return the 0-indexed indices [i, j] of the two distinct numbers such that nums[i] + nums[j] == target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n### Input Parameters\n- nums (list[int]): An array of integers.\n- target (int): The target integer sum.\n\n### Output\n- list[int]: Indices [i, j] such that nums[i] + nums[j] == target.\n\n### Edge Cases & Constraints\n- Negative integers and zeroes are supported.\n- Exactly one valid solution exists for the input.",
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [2, 7, 11, 15], target = 9",
      outputDisplay: "[0, 1]",
      title: "Basic Example",
      input: { nums: [2, 7, 11, 15], target: 9 },
      output: "[0, 1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [3, 2, 4], target = 6",
      outputDisplay: "[1, 2]",
      title: "Complex Edge Case",
      input: { nums: [3, 2, 4, 1, 9, 8], target: 12 },
      output: "[2, 5]",
      explanation:
        "Looking up complement 12 - 8 = 4 in the hash map finds index 2 (value 4), returning [2, 5].",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [1, 2, 3], target = 10",
      outputDisplay: "None",
      title: "Failing / Boundary Case",
      input: { nums: [1, 2, 3, 4], target: 10 },
      output: "[]",
      explanation:
        "No pair adds up to 10. All elements are processed into the hash map and [] is returned.",
    },
  ],
  code: TWO_SUM_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "We walk the array once, and each hash-map lookup and insert costs O(1) on average, so the total work grows linearly with the number of elements — O(n). Even in the worst case, where no pair exists, we still make just a single pass.",
    space:
      "The hash map stores up to one entry per element before a pair is found, so extra memory grows linearly with the input — O(n).",
  },
  topicGuide: {
    overview:
      "Two Sum is the fundamental paradigm shift from brute-force pair iteration O(N^2) to constant-time memory lookups O(N). In modern computer science, this pattern mirrors hash-join operations in database query engines (e.g. PostgreSQL, DuckDB) and sparse tensor key alignment in ML pipelines like PyTorch. Instead of comparing every candidate against all others, we compute the required complement target - num and query a hash table in O(1) average time.",
    sections: [
      {
        heading: "Core Concept & Algorithmic Formulation",
        body: "The brute-force approach tests all N*(N-1)/2 pairs. By rewriting the target equation nums[i] + nums[j] = target as nums[i] = target - nums[j], we transform a search problem over pairs into a lookup problem for a single complement value. As we iterate through the array, we check whether target - num already exists in our dictionary. If present, we have found the matching pair; if not, we record the current number and its index in the dictionary for subsequent elements to query.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "In production database systems, Two Sum's logic powers Hash Joins where a hash table is built for one relation and probed by another. In Machine Learning runtime engines (e.g., PyTorch autograd or graph compilers), dictionary-based index matching aligns corresponding node outputs and gradients efficiently without quadratic pairwise scanning.",
      },
      {
        heading: "Implementation Nuances & Single-Pass Safety",
        body: "Checking the hash map before inserting the current element is crucial. If we inserted the element prior to checking, a target equal to twice the current element (e.g., nums[i] = 3, target = 6) would match the element with itself, returning [i, i] as a false duplicate.",
      },
      {
        heading: "Edge Case Analysis & Memory Trade-offs",
        body: "Duplicate values in nums are handled seamlessly because the map stores the most recently encountered index. When duplicate values form the target (e.g., [3, 3], target 6), the second 3 finds the first 3 already in the map. The spatial complexity is O(N) auxiliary space, trading RAM for an order of magnitude runtime speedup.",
      },
    ],
    keyTerms: [
      {
        term: "Hash Map / Dictionary",
        definition:
          "A key-value data structure offering O(1) average-time insertion and lookup using a hash function.",
      },
      {
        term: "Complement",
        definition:
          "The required number (target - num) that when added to the current value equals target.",
      },
      {
        term: "Hash Join",
        definition:
          "A relational database join algorithm that builds an in-memory hash table on the smaller table and probes it with the larger table.",
      },
    ],
  },
  trivia: TWO_SUM_TRIVIA,
  leetcode: {
    id: 1,
    url: "https://leetcode.com/problems/two-sum/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #1",
      leetcodeId: 1,
      url: "https://leetcode.com/problems/two-sum/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 4",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 4,
      section: "4.3 Map structures",
    },
  ],
  defaultInput: DEFAULT_TWO_SUM_INPUT,
  generateSteps: generateTwoSumSteps,
};
