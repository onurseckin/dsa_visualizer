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

    const currentVal = elements[i].value;

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
  difficulty: "Easy",
  description:
    "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. A hash map of values we've already seen lets each element check for its partner in constant time.",
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
      explanation: "Looking up complement 12 - 8 = 4 in the hash map finds index 2 (value 4), returning [2, 5].",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [1, 2, 3], target = 10",
      outputDisplay: "None",
      title: "Failing / Boundary Case",
      input: { nums: [1, 2, 3, 4], target: 10 },
      output: "[]",
      explanation: "No pair adds up to 10. All elements are processed into the hash map and [] is returned.",
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
      "Two Sum is the canonical introduction to hashing as a search accelerator: instead of comparing every pair of numbers, you remember what you have already seen so that each new number can ask one direct question about its missing partner. The technique matters far beyond this one problem, because it is the template for turning a nested-loop search into a single pass backed by a dictionary. Learning it means learning to spot when a two-element relationship can be rewritten as a one-element lookup. The data structure doing the heavy lifting is the hash map, which trades memory for near-instant membership tests.",
    sections: [
      {
        heading: "The core idea: turn a pair search into a lookup",
        body: 'The brute-force approach asks, for every element, whether any other element completes the target, which means comparing each number against all the others. The key move is to stop thinking about pairs and start thinking about complements: if the current number is num, then the only value that can possibly pair with it is target minus num. That value is fully determined, so you are no longer searching for "some element that works" but checking for "this one specific element". A hash map answers that specific question in constant time, which collapses the second loop entirely.',
      },
      {
        heading: "How the single pass operates",
        body: "You keep a map called seen whose keys are values you have already walked past and whose values are the indices where they appeared. At each index i you compute complement = target - num and look it up in seen. If it is there, you already met the partner earlier, so you return that stored index alongside i and stop. If it is not there, you insert num with index i and move on, which makes the current element available as a partner for everyone still ahead of you. Notice the order: you always check before you insert, and the whole answer materialises the moment the second half of a pair arrives.",
      },
      {
        heading: "Why checking before inserting is what makes it correct",
        body: "The invariant is that when you begin processing index i, seen contains exactly the values at indices 0 through i minus 1, each mapped to a valid earlier index. Because of that, a hit on the complement is guaranteed to be a genuinely different element rather than the current one reused twice. Correctness in the other direction comes from considering the true answer pair and letting j be its later index: at the moment the scan reaches j, the earlier partner is already in the map by the invariant, so the lookup must succeed and the algorithm cannot walk past the solution. If you inserted before checking, a target of exactly twice the current value would match the element against itself and return a bogus duplicate index.",
      },
      {
        heading: "When to use hashing versus the sorted two-pointer approach",
        body: "The hash-map version is the right default when the array is unsorted and the problem wants original indices, because it neither reorders the data nor pays for sorting. If the input is already sorted, or the problem asks for the values rather than positions, the two-pointer walk from both ends solves it with no extra memory at all, which is the better choice under a tight space budget. Sorting an unsorted array just to use two pointers costs more than a linear pass and destroys index information unless you carry the original positions along. The trade is explicit: hashing buys time with memory, two pointers buy memory with an ordering requirement.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "Duplicate values are the classic trap, and they are exactly why the map stores an index rather than a count: for nums = [3, 3] with target 6, the first 3 is recorded, and the second 3 finds it and returns [0, 1] correctly. Storing values without indices, or overwriting entries carelessly, is fine here only because the problem promises a single valid answer; if it did not, you would need to collect all matches instead of returning early. Negative numbers and zero need no special handling, since the complement arithmetic is just subtraction. Remember that hash-map lookups are constant on average but not worst case, so with adversarial keys or a poor hash the guarantee softens.",
      },
      {
        heading: "How the pattern generalises",
        body: 'Fix one element and the same complement trick solves Three Sum, where you loop over each candidate and run a two-sum search on the remainder; the same nesting extends to Four Sum. Replace the target sum with a running prefix total and you get "count sub-arrays summing to k", where the map holds prefix sums instead of raw values and you look for a prefix that differs from the current one by k. The deeper reusable move is complement-and-remember: whenever a problem couples two items by an equation, solve the equation for the unknown item and store what you have seen so the unknown becomes a lookup. Anagram grouping, duplicate detection, and longest-substring problems all lean on that same remembered-state discipline.',
      },
    ],
    keyTerms: [
      {
        term: "Hash map",
        definition:
          "A dictionary that maps keys to values with average constant-time insertion and lookup. Here it maps each number you have seen to the index where it appeared.",
      },
      {
        term: "Complement",
        definition:
          "The exact value needed to reach the target alongside the current number, computed as target minus num. Framing the search around it is what removes the inner loop.",
      },
      {
        term: "Single pass",
        definition:
          "An algorithm that visits each element exactly once, carrying enough remembered state to finish without revisiting. Two Sum qualifies because the map preserves everything the scan needs.",
      },
      {
        term: "Space-time trade-off",
        definition:
          "Spending extra memory to reduce running time, or the reverse. The hash map here is pure trade: linear extra storage in exchange for dropping from quadratic to linear time.",
      },
      {
        term: "Loop invariant",
        definition:
          "A property that is true before and after every iteration and is used to argue correctness. Here it is that the map holds precisely the elements strictly before the current index.",
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
