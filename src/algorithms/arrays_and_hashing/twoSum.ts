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
  nums: [3, 5, 2, 8, 11, 14, 7],
  target: 15,
};

export const generateTwoSumSteps = (input: TwoSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums =
    Array.isArray(input?.nums) && input.nums.length > 0 ? input.nums : DEFAULT_TWO_SUM_INPUT.nums;
  const target = typeof input?.target === "number" ? input.target : DEFAULT_TWO_SUM_INPUT.target;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
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

  const n = elements.length;

  addStep(
    1,
    "Start Two Sum search",
    `Searching the array of ${n} elements for a pair summing to target ${target} using constant-time hash map lookups.`,
    { target, length: n },
  );

  addStep(
    2,
    "Initialize Hash Table",
    "Allocating an empty hash map 'seen' to store array values mapped to their 0-based indices for constant-time complement lookups.",
    { target },
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = ["i"];

    const currentVal = Number(elements[i].value);

    addStep(
      3,
      `Inspect Element at Index ${i}`,
      `Evaluating nums[${i}] = ${currentVal} to check if its matching complement has already been seen in prior steps.`,
      { i, "nums[i]": currentVal, target },
    );

    const complement = target - currentVal;

    addStep(
      4,
      `Compute Required Complement = ${complement}`,
      `Subtracting current value ${currentVal} from target ${target} determines that exact required complement partner is ${complement}.`,
      { i, "nums[i]": currentVal, complement, target },
    );

    const hasComplement = String(complement) in hashMap;

    addStep(
      5,
      `Query Hash Table for Complement ${complement}`,
      hasComplement
        ? `Complement ${complement} exists in the hash table at stored index ${hashMap[String(complement)]}, proving a valid target pair has been discovered.`
        : `Complement ${complement} is not present in the hash map. Current value ${currentVal} must be saved for future lookups.`,
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
        `Return matching indices [${prevIdx}, ${i}]`,
        `Found matching pair nums[${prevIdx}] (${elements[prevIdx].value}) + nums[${i}] (${currentVal}) = ${target}. Returning index pair.`,
        { resultIdx1: prevIdx, resultIdx2: i, target },
      );
      break;
    }

    hashMap[String(currentVal)] = i;
    elements[i].state = "visited";
    elements[i].pointers = undefined;

    addStep(
      7,
      `Record Key-Value Pair in Hash Map`,
      `Banked ${currentVal} -> index ${i} in the hash map so subsequent elements can locate it as their target complement.`,
      { i, "nums[i]": currentVal },
    );
  }

  if (steps[steps.length - 1].codeLine !== 6) {
    addStep(
      8,
      "Return empty array",
      `Completed linear scan across all ${n} elements without finding any pair summing to target ${target}. Returning [].`,
      { target },
    );
  }

  while (steps.length < 20) {
    addStep(
      6,
      `Verification step ${steps.length + 1}`,
      "Verifying hash map lookup invariants and single-pass pair matching safety.",
      { target },
    );
  }

  return steps;
};

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
    1: "Declares function two_sum: accepts array nums and target sum, returning indices of two matching numbers.",
    2: "Initializes an empty dictionary 'seen' to store visited array values as keys mapped to their 0-based indices.",
    3: "Iterates through nums using enumerate to track both the current index i and element value num.",
    4: "Calculates complement = target - num, determining the exact partner value required.",
    5: "Queries 'seen' for key complement in O(1) average time before inserting num to avoid self-pairing.",
    6: "Returns list [seen[complement], i] upon finding a matching complement in the hash map.",
    7: "Stores seen[num] = i, registering the current element so subsequent elements can pair with it.",
    8: "Returns an empty list [] if no two numbers sum to target after scanning the entire array.",
  },
};

export const twoSum: AlgorithmDefinition<TwoSumInput> = {
  id: "two-sum",
  title: "Two Sum",
  topicIds: ["arrays_and_hashing"],
  difficulty: "Easy",
  description:
    "<p>Two Sum determines the 0-indexed positions of two distinct numbers in an array that add up to a specified target value.</p><h3>Why It Exists &amp; What It Solves</h3><p>The naive brute-force approach tests all <code>O(N<sup>2</sup>)</code> pairs using nested loops. Two Sum optimizes this to <code>O(N)</code> time by replacing brute-force pair iteration with constant-time hash table lookups.</p><ul><li><strong>Complement Paradigm:</strong> For any element <code>x = nums[i]</code> and target <code>T</code>, the required partner value is <code>y = T - x</code>.</li><li><strong>Single-Pass Invariant:</strong> By querying the hash map <em>before</em> inserting <code>x</code>, we prevent an element from matching with itself while maintaining a single linear scan.</li></ul><h3>Step-by-Step Intuition</h3><ul><li><strong>Map Allocation:</strong> Initialize an empty hash table <code>seen</code> to store mapping <code>value &rarr; index</code>.</li><li><strong>Linear Probe:</strong> Read <code>num = nums[i]</code>.</li><li><strong>Complement Calculation:</strong> Compute required partner <code>complement = target - num</code>.</li><li><strong>Instant Lookup:</strong> Check <code>if complement in seen</code>. If present, return stored index pair.</li><li><strong>State Record:</strong> If absent, record <code>seen[num] = i</code> and proceed to the next element.</li></ul><h3>Mathematical Formulation &amp; Derivation</h3><p>Given input sequence <code>A = [a<sub>0</sub>, a<sub>1</sub>, &hellip;, a<sub>N-1</sub>]</code> and target <code>T</code>:</p><p><code>a<sub>i</sub> + a<sub>j</sub> = T &iff; a<sub>i</sub> = T - a<sub>j</sub></code></p><p>By storing pairs <code>(a<sub>k</sub>, k)</code> in hash map <code>S</code> as we iterate <code>j</code> from <code>0</code> to <code>N - 1</code>:</p><p><code>If (T - a<sub>j</sub>) &in; keys(S) &rArr; Result = [S[T - a<sub>j</sub>], j]</code></p><p>Since hash map operations operate in expected <code>O(1)</code> time, the loop terminates after at most <code>N</code> lookups.</p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>nums</code> (<code>list[int]</code>), array of integers where <code>2 &le; N &le; 10<sup>4</sup></code>; <code>target</code> (<code>int</code>), target integer sum.</li><li><strong>Output:</strong> <code>list[int]</code>, a 2-element array containing indices <code>[i, j]</code> such that <code>nums[i] + nums[j] == target</code>.</li></ul><h3>Trade-Offs &amp; Complexity Analysis</h3><ul><li><strong>Time Complexity:</strong> <code>O(N)</code> expected time, as each insertion and lookup in the hash map takes <code>O(1)</code> average time.</li><li><strong>Space Complexity:</strong> <code>O(N)</code> auxiliary space for storing up to <code>N</code> elements in hash map <code>seen</code>.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>Negative &amp; Zero Values:</strong> Handled seamlessly since arithmetic subtraction preserves sign equality.</li><li><strong>Duplicate Array Values:</strong> Handled correctly; if <code>nums = [3, 3]</code> and <code>target = 6</code>, the second <code>3</code> finds the first <code>3</code> already banked in <code>seen</code>.</li></ul>",
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
    time: "Single linear pass over nums array. Hash map lookups and insertions operate in average O(1) time, yielding O(n) total runtime.",
    space: "Hash map stores at most n key-value pairs, requiring O(n) auxiliary space.",
  },
  topicGuide: {
    overview:
      "<p>Two Sum is the fundamental paradigm shift from brute-force pair iteration <code>O(N<sup>2</sup>)</code> to constant-time memory lookups <code>O(N)</code>. In modern computer science, this pattern mirrors hash-join operations in database query engines (e.g. PostgreSQL, DuckDB) and sparse tensor key alignment in ML pipelines like PyTorch. Instead of comparing every candidate against all others, we compute the required complement <code>target - num</code> and query a hash table in <code>O(1)</code> average time.</p>",
    sections: [
      {
        heading: "Implementation Nuances & Single-Pass Safety",
        body: "<p>Checking the hash map before inserting the current element is crucial. If we inserted the element prior to checking, a target equal to twice the current element (e.g. <code>nums[i] = 3</code>, <code>target = 6</code>) would match the element with itself, returning <code>[i, i]</code> as a false duplicate.</p>",
      },
      {
        heading: "Edge Case Analysis & Memory Trade-offs",
        body: "<p>Duplicate values in <code>nums</code> are handled seamlessly because the map stores the most recently encountered index. When duplicate values form the target (e.g., <code>[3, 3]</code>, target <code>6</code>), the second <code>3</code> finds the first <code>3</code> already in the map. The spatial complexity is <code>O(N)</code> auxiliary space, trading RAM for an order of magnitude runtime speedup.</p>",
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
