import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export const KADANE_MAX_SUBARRAY_CODE = `def max_sub_array(nums: list[int]) -> int:
    current_max = nums[0]
    global_max = nums[0]
    start = end = temp_start = 0

    for i in range(1, len(nums)):
        if nums[i] > current_max + nums[i]:
            current_max = nums[i]
            temp_start = i
        else:
            current_max += nums[i]

        if current_max > global_max:
            global_max = current_max
            start = temp_start
            end = i

    return global_max`;

export const generateKadaneMaxSubarraySteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

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
        customState: {
          currentMax: String(variables.currentMax ?? 0),
          globalMax: String(variables.globalMax),
        },
      },
      variables,
    });
  };

  const n = elements.length;

  if (n === 0) {
    addStep(
      1,
      "Handle empty input",
      "There are no elements to build a subarray from, so the best sum defaults to 0 and we stop right away.",
      { currentMax: 0, globalMax: 0, n: 0 },
    );
    return steps;
  }

  let currentMax = Number(elements[0].value);
  let globalMax = Number(elements[0].value);
  let start = 0;
  let end = 0;
  let tempStart = 0;

  elements[0].state = "active";
  elements[0].pointers = ["start", "end"];

  addStep(
    2,
    `Start both sums at ${currentMax}`,
    `The only subarray that ends at index 0 is [${elements[0].value}] by itself, so both our running sum and our best-so-far begin there. From now on, every element just has to decide: join the current run, or start a new one.`,
    { currentMax, globalMax, start, end, tempStart, i: 0, "nums[0]": elements[0].value },
  );

  for (let i = 1; i < n; i++) {
    const val = Number(elements[i].value);

    // Reset element states to default, then set active bounds
    for (let k = 0; k < n; k++) {
      if (k >= tempStart && k < i) {
        elements[k].state = "active";
      } else {
        elements[k].state = "default";
      }
      elements[k].pointers = undefined;
    }

    elements[i].state = "compare";
    elements[i].pointers = ["i"];

    // Captured before mutation so explanations can show the sum being abandoned/extended
    const prevSum = currentMax;

    if (val > currentMax + val) {
      currentMax = val;
      tempStart = i;

      // Update pointers for new window start
      elements[i].state = "active";
      elements[i].pointers = ["i", "tempStart"];

      addStep(
        7,
        `Restart the subarray at index ${i}`,
        `The sum we were carrying, ${prevSum}, is negative — adding ${val} on top of it would leave less than ${val} alone. So we drop that stretch and let a fresh subarray begin here.`,
        { i, "nums[i]": val, currentMax, globalMax, tempStart },
      );
    } else {
      currentMax += val;

      addStep(
        11,
        `Extend the subarray to ${currentMax}`,
        `Our running sum ${prevSum} is worth keeping, so we let it absorb ${val}. The best subarray ending at index ${i} is now worth ${currentMax}.`,
        { i, "nums[i]": val, currentMax, globalMax, tempStart },
      );
    }

    if (currentMax > globalMax) {
      globalMax = currentMax;
      start = tempStart;
      end = i;

      addStep(
        14,
        `Record new best sum ${globalMax}`,
        `The subarray ending at index ${i} sums to ${currentMax}, better than anything we've seen so far. We note the new record and its span [${start}..${end}].`,
        { i, currentMax, globalMax, start, end, tempStart },
      );
    }
  }

  // Highlight the best subarray as sorted
  for (let k = 0; k < n; k++) {
    if (k >= start && k <= end) {
      elements[k].state = "sorted";
      const ptrs: string[] = [];
      if (k === start) ptrs.push("max_start");
      if (k === end) ptrs.push("max_end");
      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    } else {
      elements[k].state = "default";
      elements[k].pointers = undefined;
    }
  }

  addStep(
    18,
    `Kadane's scan complete`,
    `The best contiguous run spans [${start}..${end}] with a sum of ${globalMax}. One linear pass was enough, because each element only had to answer a single question: extend the run or start over.`,
    { globalMax, start, end },
  );

  return steps;
};

const KADANE_MAX_SUBARRAY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given a list of numbers, return the largest sum obtainable from any contiguous run inside it.",
    2: "Seeds the running sum with nums[0], since the only subarray ending at index 0 is that single element by itself.",
    3: "Seeds the best-seen sum with nums[0] too, so a single-element array already has a valid answer before the loop starts.",
    4: "Initializes start, end, and temp_start to 0, the bookkeeping that will track the boundaries of the best run once one is found.",
    6: "Iterates from index 1 onward — index 0 was already handled by the seeding above — so each remaining element makes one extend-or-restart decision.",
    7: "Compares taking nums[i] alone against extending the running sum: if the running sum is negative, adding nums[i] to it produces less than nums[i] alone, so it isn't worth carrying forward.",
    8: "Restarts the running sum at nums[i] alone, discarding the previous run because it was actively hurting rather than helping.",
    9: "Marks index i as the new start of the current run, since the run now begins fresh here.",
    11: "Extends the running sum by folding in nums[i], because the run so far was non-negative and worth keeping.",
    13: "Checks whether the run ending here beats the best run recorded anywhere so far.",
    14: "Updates the best-known sum to the current run's total, since it is now the new record.",
    15: "Records temp_start as the officially reported start of the best subarray, promoting it only now that this run has actually won.",
    16: "Records i as the end of the best subarray, completing the [start, end] span that produced global_max.",
    18: "Returns the best sum found across the whole scan, the answer to the problem.",
  },
};

export const kadaneMaxSubarray: AlgorithmDefinition<number[]> = {
  id: "kadane-max-subarray",
  title: "Kadane's Algorithm (Maximum Subarray)",
  category: "arrays_and_hashing",
  difficulty: "Medium",
  description:
    "Kadane's Algorithm finds the maximum sum of a contiguous subarray in a single pass by making one decision at each index: extend the current run, or abandon it and start fresh.",
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
      outputDisplay: "6",
      title: "Basic Example",
      input: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      output: "6",
      explanation: "The contiguous subarray [4, -1, 2, 1] has the largest sum = 6.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [5, 4, -1, 7, 8]",
      outputDisplay: "23",
      title: "Complex Edge Case",
      input: [5, 4, -1, 7, 8],
      output: "23",
      explanation:
        "All positive elements except -1; the maximum subarray spans the entire array with sum 23.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [-5, -2, -8, -1]",
      outputDisplay: "-1",
      title: "Failing / Boundary Case",
      input: [-8, -3, -6, -2, -5],
      output: "-2",
      explanation:
        "All elements are negative. Kadane's algorithm selects the single max element -2.",
    },
  ],
  code: KADANE_MAX_SUBARRAY_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "We make a single left-to-right pass, and at each element we do only a constant amount of work: one comparison to decide whether to extend or restart the run, and one to update the best-so-far. That's n constant-time decisions, so the total is O(n) in every case — no input can make the pass longer.",
    space:
      "We carry just a handful of scalars — the running sum, the best sum, and a few indices — no matter how long the array gets, so extra memory stays constant at O(1).",
  },
  topicGuide: {
    overview:
      "Kadane's Algorithm is the classic example of dynamic programming compressed down to two variables. The maximum-subarray problem asks for the largest total achievable by any contiguous slice of an array, and with mixed positive and negative values that is genuinely non-trivial, because a promising run can be ruined by a dip or rescued by a later spike. Kadane's reframes the question so that each index needs only one local decision, which removes all the nested scanning. Understanding it teaches you how to recognise when a global optimum can be assembled from a single running local optimum.",
    sections: [
      {
        heading: "The core idea: one local decision per element",
        body: "Instead of asking about all sub-arrays, ask a narrower question at each index: what is the best sum of a contiguous run that ends exactly here? That version has a beautifully small answer, because a run ending at index i either extends the best run ending at i minus 1, or it consists of nums[i] alone. So you compare nums[i] against current_max plus nums[i] and take the larger, which is the whole decision. The insight that unlocks it is that a negative running sum is never worth carrying forward: whatever comes next is strictly better off starting fresh. Every sub-array ends somewhere, so the answer to the original question is just the largest of these per-index answers.",
      },
      {
        heading: "How the two counters work together",
        body: "You maintain current_max, the best sum of a run ending at the current index, and global_max, the best sum seen anywhere so far. On each step you first update current_max with the extend-or-restart comparison, then update global_max if current_max has beaten it. The two must stay separate: current_max is allowed to fall as you pass through negative territory, while global_max never decreases, and collapsing them into one variable loses the answer the moment a good run ends. To recover the actual sub-array boundaries rather than just its sum, you track temp_start, moving it to i whenever you restart, and commit it to start along with end = i at the exact moment global_max improves.",
      },
      {
        heading: "Why it is correct: the ending-here invariant",
        body: "The invariant is that after processing index i, current_max is exactly the maximum sum over all sub-arrays that end at i, and global_max is exactly the maximum over all sub-arrays that end at or before i. The base case holds because the only sub-array ending at index 0 is the single element itself. The inductive step holds because any run ending at i with more than one element must have its prefix ending at i minus 1, and to be optimal that prefix must itself be the best run ending there, so taking the max of the two candidates is exhaustive rather than greedy guesswork. Since every sub-array ends at some index, the running maximum over all of them ends up in global_max, and no candidate is ever skipped.",
      },
      {
        heading: "When to reach for it versus other approaches",
        body: "Use Kadane's whenever you need the best contiguous run under a single additive measure and the data arrives in one direction, including streaming settings where you cannot store the array at all. If the problem allows non-contiguous picks, this is the wrong tool: you would simply sum the positive elements. If you need many range answers over a static array rather than one global best, prefix sums or a segment tree fit better, and a segment tree is also what you reach for when elements change between queries. The divide-and-conquer formulation solves the same problem and is instructive, but it does strictly more work for no benefit here, so treat it as a teaching device rather than a competitor.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "The single most common bug is initialising both counters to zero, which silently returns zero for an all-negative array instead of the least-bad element. Seeding both from nums[0] and starting the loop at index 1 avoids that entirely, which is why the code here does exactly that. A one-element array must return that element, and an empty array is genuinely undefined for this problem, so decide and document your contract rather than letting it crash. When you also report indices, remember that temp_start updates on restarts but must only be promoted to start when global_max actually improves, otherwise the reported boundaries drift away from the reported sum. Ties are harmless for the sum but mean the winning sub-array is not unique.",
      },
      {
        heading: "How the pattern generalises",
        body: "Flip the comparisons and you get the minimum-subarray sum, which combined with the total lets you solve the circular version by treating the answer as either a normal run or the complement of the worst middle stretch. Replace addition with multiplication and you must carry both the largest and the smallest running product, because a negative value can turn the worst candidate into the best. Extend to two dimensions by fixing a pair of columns, collapsing those rows into a single array of sums, and running Kadane's on it to find the maximum-sum rectangle. The transferable lesson is the dynamic-programming compression itself: when each state depends only on the immediately preceding state, you can drop the whole table and keep a couple of scalars.",
      },
    ],
    keyTerms: [
      {
        term: "Subarray",
        definition:
          "A contiguous slice of the array, defined by a start and end index. Contiguity is what makes the problem interesting, since you cannot cherry-pick the positive values.",
      },
      {
        term: "current_max",
        definition:
          "The best sum achievable by a run that ends at the index you are currently visiting. It may drop or reset as the scan moves forward.",
      },
      {
        term: "global_max",
        definition:
          "The best sum found anywhere so far in the scan, which is the value you ultimately return. Unlike current_max it never decreases.",
      },
      {
        term: "Extend or restart",
        definition:
          "The single decision made at each element: keep the previous run and add this value, or throw the run away and begin again at this value. Restarting wins precisely when the running sum has gone negative.",
      },
      {
        term: "Dynamic programming",
        definition:
          'Solving a problem by combining answers to smaller overlapping subproblems. Here the subproblem is "best run ending at index i", and each answer is built directly from the previous one.',
      },
    ],
  },
  trivia: KADANE_MAX_SUBARRAY_TRIVIA,
  leetcode: {
    id: 53,
    url: "https://leetcode.com/problems/maximum-subarray/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #53",
      leetcodeId: 53,
      url: "https://leetcode.com/problems/maximum-subarray/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 2",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 2,
      section: "2.4 Maximum subarray sum",
    },
  ],
  defaultInput: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  generateSteps: generateKadaneMaxSubarraySteps,
};
