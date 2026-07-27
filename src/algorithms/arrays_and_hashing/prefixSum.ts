import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface PrefixSumInput {
  nums: number[];
}

export const PREFIX_SUM_CODE = `def compute_prefix_sum(nums: list[int]) -> list[int]:
    n = len(nums)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]
    return prefix`;

export const DEFAULT_PREFIX_SUM_INPUT: PrefixSumInput = {
  nums: [2, 4, 1, 3, 5],
};

export const generatePrefixSumSteps = (input: PrefixSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const n = nums.length;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const prefixValues: number[] = new Array(n + 1).fill(0);

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
        visited: [...prefixValues],
        customState: {
          prefixArray: prefixValues.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Start building prefix sums",
    `We'll turn [${nums.join(", ")}] into a ladder of running totals, so that later any range sum can be read off with one subtraction instead of re-adding the whole slice.`,
    { length: n },
  );

  addStep(
    3,
    "Allocate the prefix array",
    `We make room for ${n + 1} totals, all zero for now: [${prefixValues.join(", ")}]. The extra leading 0 means even a range starting at index 0 has something clean to subtract.`,
    { prefixLength: n + 1 },
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = ["i"];

    const currentVal = nums[i];
    const prevPrefix = prefixValues[i];
    const newPrefix = prevPrefix + currentVal;
    prefixValues[i + 1] = newPrefix;

    addStep(
      4,
      `Visit nums[${i}] = ${currentVal}`,
      `So far our running total is ${prevPrefix}. Now we bring in ${currentVal} so the total covers everything up through index ${i}.`,
      { i, "nums[i]": currentVal, "prefix[i]": prevPrefix },
    );

    addStep(
      5,
      `Set prefix[${i + 1}] = ${newPrefix}`,
      `We add ${currentVal} to the previous total ${prevPrefix} and get ${newPrefix} — the sum of everything from index 0 through ${i}, banked for instant reuse later.`,
      { i, "prefix[i]": prevPrefix, "nums[i]": currentVal, "prefix[i+1]": newPrefix },
    );

    elements[i].state = "visited";
    elements[i].pointers = undefined;
  }

  addStep(
    6,
    "Finish the prefix array",
    `Our finished ladder of totals is [${prefixValues.join(", ")}]. From here, the sum of any range L..R is just prefix[R+1] minus prefix[L] — one subtraction, constant time.`,
    { result: prefixValues.join(", ") },
  );

  return steps;
};

const PREFIX_SUM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given nums, build a table of running totals one entry longer than the input.",
    2: "Caches the length of nums in n, used to size the prefix array and bound the loop below.",
    3: "Allocates a prefix array of n + 1 zeros; the extra leading slot represents the sum of zero elements, so a range starting at index 0 needs no special case.",
    4: "Walks every index of nums once, building each new prefix entry from the one immediately before it.",
    5: "Defines prefix[i + 1] as prefix[i] plus nums[i] — the running total absorbs one more element per step, costing a single addition.",
    6: "Returns the completed table, from which the sum of any range is now a single subtraction rather than a loop.",
  },
};

export const prefixSum: AlgorithmDefinition<PrefixSumInput> = {
  id: "prefix-sum",
  title: "Prefix Sum",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description:
    "Computes cumulative prefix sums for an array, so any later sub-array range sum can be answered in O(1) time with a single subtraction of two precomputed totals.",
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      input: "nums = [2, 4, 1, 3, 5]",
      output: "prefix = [0, 2, 6, 7, 10, 15]",
      explanation:
        "Sum of sub-array from index 1 to 3 (4 + 1 + 3 = 8) is evaluated in O(1) time as prefix[4] - prefix[1] = 10 - 2 = 8.",
    },
    {
      input: "nums = [1, 1, 1]",
      output: "prefix = [0, 1, 2, 3]",
      explanation: "Prefix sums build incrementally at each step.",
    },
  ],
  code: PREFIX_SUM_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "We fill the prefix array in one pass over the input: each new entry is just the previous entry plus one array value, a single addition. With n elements that's n constant-time updates, so the work grows linearly — O(n). Best and worst case are identical because we always touch every element exactly once.",
    space:
      "We allocate one extra array of n + 1 running totals alongside the input, so extra memory grows linearly with the input size — O(n).",
  },
  topicGuide: {
    overview:
      "A prefix sum is a precomputed table of running totals: prefix[k] holds the sum of the first k elements of your array. Once you have that table, the sum of any contiguous range becomes a single subtraction instead of a loop, which turns a problem with many range queries from repeated scanning into constant-time lookups. It is the simplest member of a family of precomputation techniques where you pay once up front to make an unbounded number of later questions cheap. You will meet it whenever a problem asks about sums, counts, or averages over sub-arrays.",
    sections: [
      {
        heading: "The core idea: pay once, answer forever",
        body: 'The naive way to answer "what is the sum from index i to index j" is to walk from i to j and add as you go. If a problem asks that question many times, you keep re-adding the same middle elements over and over. The prefix-sum insight is that every range sum is the difference of two totals that both start at the beginning of the array: everything up to j plus one, minus everything up to i. Because both of those totals can be looked up rather than recomputed, the shared middle work cancels out algebraically instead of being repeated. That reframing — express the thing you want as a difference of cumulative quantities — is the whole technique.',
      },
      {
        heading: "How the table is actually built",
        body: 'You allocate an array of length n + 1 and set prefix[0] to zero, which represents the sum of no elements at all. Then you sweep left to right and define each entry in terms of the one before it: prefix[i + 1] is prefix[i] plus nums[i]. Each entry therefore costs one addition, and you never look back further than a single slot, which is why the build is a single clean pass. For nums = [2, 4, 1, 3, 5] you end up with [0, 2, 6, 7, 10, 15], and the sum from index 1 through 3 is prefix[4] minus prefix[1], or 10 minus 2, which is 8. The off-by-one that trips people up disappears once you internalise that prefix[k] means "sum of the first k elements", not "sum up to index k".',
      },
      {
        heading: "Why it is correct: the running-total invariant",
        body: "The loop maintains one promise at all times: after processing index i, prefix[i + 1] equals the exact sum of nums[0] through nums[i]. That holds at the start because prefix[0] is zero and the empty sum is zero, and each iteration preserves it because adding one more element to a correct total gives the correct larger total. Since the invariant holds for every k, the difference prefix[j + 1] minus prefix[i] is the sum of the first j + 1 elements minus the sum of the first i elements, and the shared front portion cancels exactly. What remains is precisely nums[i] through nums[j], which is what a range query asks for. Correctness never depends on the values being positive, so negatives and zeros work with no special handling.",
      },
      {
        heading: "When to reach for it, and when not to",
        body: "Prefix sums win when the array is static and you expect many range questions, because the O(n) build amortises across all of them. If you only need one range sum, just loop over that range and skip the table entirely. If the underlying values change between queries, a plain prefix array becomes stale after every update and rebuilding it each time is worse than scanning, so that is the moment to move up to a Fenwick tree or a segment tree, which support updates and queries together. And if your question is not decomposable as a difference of cumulative values — for example, the maximum in a range rather than the sum — prefix sums do not apply, because maxima do not subtract.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "The most common bug is indexing: because the table is shifted by one, writing prefix[j] minus prefix[i] instead of prefix[j + 1] minus prefix[i] silently drops the last element of the range. Some people avoid the extra slot and store the running total in place, which works but forces an awkward special case when the range starts at index 0. Watch overflow in fixed-width integer languages, since running totals grow much larger than any single element even when the individual values look small. An empty range should answer zero, and the n + 1 layout gives you that for free rather than requiring a guard.",
      },
      {
        heading: "How the pattern generalises",
        body: "Swap addition for another invertible operation and the same trick keeps working: prefix products answer range products, and prefix XOR answers range XOR, because XOR is its own inverse. Extend the sweep to two dimensions and you get the integral-image technique, where the sum of any rectangle is four table lookups combined with two subtractions and one addition. Pair prefix sums with a hash map of previously seen totals and you can count sub-arrays summing to a target, since a range sums to k exactly when two prefix values differ by k — the same insight that powers Two Sum, applied to cumulative totals. The mirror image of the technique is the difference array, where you write range updates cheaply and take one prefix pass at the end to materialise the final values.",
      },
    ],
    keyTerms: [
      {
        term: "Prefix sum",
        definition:
          "The cumulative total of an array from its start up to some position. Stored as a table so that any prefix total is a single lookup instead of a loop.",
      },
      {
        term: "Range sum query",
        definition:
          "A request for the total of a contiguous slice of the array, given by its start and end indices. With a prefix table it costs one subtraction regardless of how long the slice is.",
      },
      {
        term: "Sentinel zero",
        definition:
          "The leading prefix[0] = 0 entry standing for the sum of no elements. It exists so that ranges beginning at index 0 need no special-case branch.",
      },
      {
        term: "Precomputation",
        definition:
          "Doing extra work once, before any queries arrive, so each later query becomes cheap. It is a trade of memory and setup time for query speed.",
      },
      {
        term: "Difference array",
        definition:
          "The inverse construction, where you record only the changes at range boundaries and recover the real values with a final prefix-sum pass. It makes many range updates cheap instead of many range queries.",
      },
    ],
  },
  trivia: PREFIX_SUM_TRIVIA,
  leetcode: {
    id: 303,
    url: "https://leetcode.com/problems/range-sum-query-immutable/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #303",
      leetcodeId: 303,
      url: "https://leetcode.com/problems/range-sum-query-immutable/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 9",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.1 Static array queries",
    },
  ],
  defaultInput: DEFAULT_PREFIX_SUM_INPUT,
  generateSteps: generatePrefixSumSteps,
};
