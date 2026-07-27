import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface CountingBitsInput {
  n: number;
}

export const DEFAULT_COUNTING_BITS_INPUT: CountingBitsInput = {
  n: 5,
};

function createBitArrayElements(
  ans: number[],
  currentIdx: number,
  halfIdx: number,
): ArrayElement[] {
  return ans.map((val, idx) => {
    let state: ElementState = "default";
    const pointers: string[] = [];

    if (idx === currentIdx) {
      state = "active";
      pointers.push(`i=${idx}`);
    } else if (idx === halfIdx && currentIdx > 0) {
      state = "compare";
      pointers.push(`i>>1=${halfIdx}`);
    } else if (idx < currentIdx) {
      state = "sorted";
    }

    return {
      id: `bit-ans-${idx}`,
      value: val,
      state,
      pointers,
    };
  });
}

export function generateCountingBitsSteps(input: CountingBitsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const n = Math.max(0, Math.min(input.n ?? 5, 32));
  const ans: number[] = new Array(n + 1).fill(0);

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Create an answer array of ${n + 1} zeros`,
      why: `We set up one slot per number from 0 to ${n}, and slot 0 is already correct — zero has no binary ones. Every later entry will be built from an earlier one.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: createBitArrayElements(ans, -1, -1),
    },
    auxiliaryState: {
      customState: {
        n,
        ans: `[${ans.join(", ")}]`,
      },
    },
    variables: { n, i: 0 },
  });

  for (let i = 1; i <= n; i++) {
    const half = i >> 1;
    const lowestBit = i & 1;

    ans[i] = ans[half] + lowestBit;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 4,
      explanation: {
        what: `Count bits for ${i} (binary ${i.toString(2)})`,
        why: `Shifting ${i} right one bit gives ${half}, whose count we already know is ${ans[half]}, and the bit we dropped is ${lowestBit}. So we just add them — ${ans[half]} + ${lowestBit} = ${ans[i]} — with no bit-by-bit counting at all.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createBitArrayElements(ans, i, half),
      },
      auxiliaryState: {
        customState: {
          currentNumber: i,
          binaryString: i.toString(2),
          halfIndex: half,
          lowestBit,
          computedBits: ans[i],
        },
      },
      variables: {
        i,
        binary: i.toString(2),
        half,
        lowestBit,
        bitsCount: ans[i],
      },
    });
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 5,
    explanation: {
      what: `Finish: counts for 0 through ${n}`,
      why: `The table now holds the number of ones for every value up to ${n}. Because each entry reused a smaller answer in constant time, the whole build took just one linear pass — O(n) overall.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: ans.map((val, idx) => ({
        id: `bit-ans-final-${idx}`,
        value: val,
        state: "sorted",
        pointers: [`i=${idx}`],
      })),
    },
    auxiliaryState: {
      customState: {
        result: `[${ans.join(", ")}]`,
      },
    },
    variables: {
      n,
      completed: true,
    },
  });

  return steps;
}

const COUNTING_BITS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "This problem sits exactly where bit manipulation meets dynamic programming, and it is the friendliest place to see the two ideas cooperate. You are asked for the population count, the number of 1 bits, of every integer from 0 up to n, and the interesting part is that you never have to inspect bits one at a time. The insight is that the binary form of a number is the binary form of a smaller number with one extra bit appended, which turns integers into recursive objects you can tabulate. Once you internalise that, a whole family of bitmask problems starts to look like ordinary dynamic programming.",
  sections: [
    {
      heading: "Seeing a number as a smaller number plus one bit",
      body: "Write any positive integer in binary and delete its rightmost digit; what remains is exactly the number you get by shifting right by one, and the digit you deleted is exactly the value of i AND 1. Put formally, i equals two times (i shifted right by one) plus (i AND 1), so the multiset of set bits in i is the set bits of the shifted value plus possibly one more at position zero. That gives the recurrence that the bit count of i equals the bit count of i shifted right by one, plus the lowest bit of i. The crucial structural fact is that the shifted value is strictly smaller than i for every i of at least 1, so the recurrence only ever refers backwards. A recurrence that only looks backwards is precisely what a bottom-up table can evaluate in order with no recursion and no memo checks.",
    },
    {
      heading: "How the table gets filled",
      body: "You allocate an answer array of n plus 1 slots so that index i really means the number i, and you seed it with the one fact you know for free: zero has no set bits, so slot 0 is 0. Then you sweep i upward from 1 to n and write the recurrence directly, computing half as i shifted right by one and the low bit as i AND 1, and storing their combined value. Every read touches an index strictly below i, which the sweep has already finalised, so no slot is ever read before it is correct. Take i equal to 5, which is 101 in binary: shifting right gives 2, which is 10 and already recorded as having one set bit, and the dropped bit is 1, so the answer is 2. The entire method is one addition, one shift, and one mask per number, and the array you finish with is the answer itself rather than a scratch structure.",
    },
    {
      heading: "Why the recurrence is correct",
      body: "The loop invariant is that when the sweep arrives at index i, every slot from 0 through i minus 1 already holds the true population count of its index. The base case establishes it for slot 0, since zero genuinely has no ones. For the inductive step, notice that the set bits of i split cleanly into the bit at position zero and the bits at positions one and above, and shifting right by one renames those higher positions down by one without adding or removing any of them. So the count of the higher part is literally the count of the shifted value, which the invariant guarantees is already correct because the shifted value is smaller than i. Adding the low bit accounts for position zero exactly once, so slot i becomes correct and the invariant survives to the next iteration. When the sweep ends, the invariant covers the whole array.",
    },
    {
      heading: "Other decompositions that work just as well",
      body: "Shifting right is only one way to peel a bit off a number, and each alternative yields its own valid recurrence. The Brian Kernighan identity says i AND (i minus 1) clears the lowest set bit, so the count of i equals the count of that value plus one, which is attractive because it removes a set bit rather than an arbitrary one. Another version subtracts the largest power of two not exceeding i, giving the count of the remainder plus one, and it corresponds to filling the table in power-of-two blocks where each block copies the previous blocks with one added. All three are the same idea wearing different clothes: strip exactly one bit, then reuse the answer for what is left. The right-shift form is usually preferred simply because the index it needs is trivially computed and always roughly half of i, so nothing needs to be tracked between iterations.",
    },
    {
      heading: "When a table beats counting on demand",
      body: "Build the table when you need population counts for many values across a contiguous range, because the amortised cost per value drops to a couple of machine operations and the lookups afterwards are free. For one value in isolation, do not allocate anything: loop and mask, use the Kernighan trick to iterate once per set bit, or call the hardware population count your language exposes, such as the bit_count method on Python integers or the compiler builtin in C and C++. The tabulated approach is also the seed of a common engineering trick where you precompute counts for every possible byte or nibble and then sum a few lookups to count a wide word, which is how many bitset libraries work. The trade-off is plain: the table costs memory proportional to the range, so it only pays off when the range is modest and reuse is high.",
    },
    {
      heading: "Pitfalls, and where the idea returns",
      body: "The most common mistakes are arithmetic rather than conceptual: sizing the array as n instead of n plus 1, forgetting to seed slot 0, or looping from 0 and reading a slot that does not exist. Negative inputs have no meaning here because the recurrence relies on right shift strictly reducing the value, which fails for negative numbers under arithmetic shift, so guard the input as this implementation does by clamping it. In JavaScript there is a second trap, since bitwise operators coerce their operands to signed 32-bit integers, so numbers beyond that range silently misbehave and you must switch to BigInt or arithmetic division. The bigger payoff comes later, in bitmask dynamic programming over subsets, where you iterate masks in increasing numeric order and reuse the answer for a mask with one element removed. That is the same backwards-only recurrence, and recognizing it is what makes subset-sum over masks, Gray code constructions, and sum-over-subsets transforms feel routine.",
    },
  ],
  keyTerms: [
    {
      term: "Population count",
      definition:
        "The number of 1 bits in the binary representation of a value, also called the Hamming weight. It is what each slot of the answer array stores.",
    },
    {
      term: "Right shift",
      definition:
        "The operation that moves every bit one position toward the least significant end, discarding the lowest bit and halving the value for non-negative integers. It is how you obtain the smaller subproblem here.",
    },
    {
      term: "Bit mask",
      definition:
        "A value combined with another using a bitwise operator to isolate specific bits. Masking with 1 keeps only the lowest bit, which is exactly the bit the shift threw away.",
    },
    {
      term: "Bottom-up tabulation",
      definition:
        "Filling a dynamic programming table in an order that guarantees every dependency is already computed, avoiding recursion entirely. Sweeping indices upward works here because each answer depends only on a smaller index.",
    },
    {
      term: "Brian Kernighan trick",
      definition:
        "The identity that i AND (i minus 1) removes the lowest set bit of i. Repeating it counts set bits in as many steps as there are ones, and it also yields an alternative recurrence for this table.",
    },
  ],
};

const COUNTING_BITS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the function signature: it takes n and returns one bit count per integer from 0 through n.",
    2: "Allocates the answer table with n + 1 slots, seeding every entry with 0 — slot 0 is already correct since zero has no set bits.",
    3: "Sweeps i upward from 1 to n, since slot 0 is already known and every other slot only ever depends on a smaller index.",
    4: "Reuses the already-computed bit count for i shifted right by one and adds back the bit that shift dropped, so each answer costs one addition instead of scanning every bit of i.",
    5: "Returns the completed table of population counts for every value from 0 to n.",
  },
};

export const countingBits: AlgorithmDefinition<CountingBitsInput> = {
  id: "counting-bits",
  title: "Counting Bits",
  category: "bit_manipulation",
  categories: ["bit_manipulation"],
  difficulty: "Easy",
  description:
    "Given an integer n, return an array ans of length n + 1 where ans[i] is the number of 1s (population count / Hamming weight) in the binary representation of i.\n\nSolve this in O(n) linear time without relying on built-in bit-count functions by using bottom-up dynamic programming: for each integer i, derive its 1-bit count from ans[i >> 1] plus (i & 1).",
  constraints: ["0 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "n = 5",
      outputDisplay: "[0, 1, 1, 2, 1, 2]",
      title: "Basic Example",
      input: { n: 5 },
      output: "[0, 1, 1, 2, 1, 2]",
      explanation:
        "Counts set bits for 0 through 5: 0=0b0(0), 1=0b1(1), 2=0b10(1), 3=0b11(2), 4=0b100(1), 5=0b101(2).",
    },
    {
      kind: "complex",
      inputDisplay: "n = 15",
      outputDisplay: "[0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4]",
      title: "Complex Edge Case",
      input: { n: 15 },
      output: "[0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4]",
      explanation:
        "Sweeps through numbers up to 15 across multiple powers of 2, reusing dp[i] = dp[i >> 1] + (i & 1).",
    },
    {
      kind: "negative",
      inputDisplay: "n = 0",
      outputDisplay: "[0]",
      title: "Failing / Boundary Case",
      input: { n: 0 },
      output: "[0]",
      explanation:
        "Boundary input n=0 produces a single-element array [0] since 0 has zero set bits in binary.",
    },
  ],
  code: `def countBits(n):
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans`,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "We fill the answer array in a single pass from 1 to n, and each entry costs constant work: one right shift, one bitwise AND, and one addition that reuses an answer we already computed. There is no inner loop over the bits of each number, which is exactly what beats the naive approach of counting every number's bits from scratch — that would cost O(n log n) instead of O(n).",
    space:
      "The answer array itself holds n + 1 entries, so memory grows linearly with n. Beyond the output we keep only a couple of loop variables, so the extra working space is constant.",
  },
  topicGuide: COUNTING_BITS_TOPIC_GUIDE,
  trivia: COUNTING_BITS_TRIVIA,
  leetcode: {
    id: 338,
    url: "https://leetcode.com/problems/counting-bits/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #338",
      leetcodeId: 338,
      url: "https://leetcode.com/problems/counting-bits/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 10",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 10,
      section: "10.2 Bit operations",
    },
  ],
  generateSteps: generateCountingBitsSteps,
  defaultInput: DEFAULT_COUNTING_BITS_INPUT,
};
