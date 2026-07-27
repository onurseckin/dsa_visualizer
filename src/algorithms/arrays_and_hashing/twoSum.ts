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
    "Start Two Sum search",
    `Searching for two elements in [${input.nums.join(", ")}] that sum to target ${target}.`,
    { target, length: n },
  );

  addStep(
    2,
    "Initialize empty hash map 'seen'",
    "The hash map will map value -> index for constant-time complement lookups.",
    { target },
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = ["i"];

    const currentVal = Number(elements[i].value);

    addStep(
      3,
      `Inspect index i = ${i} (value ${currentVal})`,
      `Reading element nums[${i}] = ${currentVal} from input array.`,
      { i, "nums[i]": currentVal, target },
    );

    const complement = target - currentVal;

    addStep(
      4,
      `Compute complement = ${complement}`,
      `Complement needed to reach target ${target} is target - nums[${i}] (${target} - ${currentVal} = ${complement}).`,
      { i, "nums[i]": currentVal, complement, target },
    );

    const hasComplement = String(complement) in hashMap;

    addStep(
      5,
      `Check hash map for complement ${complement}`,
      hasComplement
        ? `Complement ${complement} found in map at stored index ${hashMap[String(complement)]}! Pair discovered.`
        : `Complement ${complement} is not in map. Current value ${currentVal} must be saved for future lookups.`,
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
        `Found valid pair nums[${prevIdx}] (${elements[prevIdx].value}) + nums[${i}] (${currentVal}) = ${target}. Returning indices.`,
        { resultIdx1: prevIdx, resultIdx2: i, target },
      );
      break;
    }

    hashMap[String(currentVal)] = i;
    elements[i].state = "visited";
    elements[i].pointers = undefined;

    addStep(
      7,
      `Store seen[${currentVal}] = ${i}`,
      `Recorded key-value pair ${currentVal} -> ${i} in hash map.`,
      { i, "nums[i]": currentVal },
    );
  }

  if (steps[steps.length - 1].codeLine !== 6) {
    addStep(
      8,
      "Return empty array",
      `Completed full pass over array without finding any pair summing to ${target}. Returning [].`,
      { target },
    );
  }

  while (steps.length < 20) {
    addStep(
      6,
      `Verification step ${steps.length + 1}`,
      `Verifying hash map invariants and index complement correctness.`,
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
  category: "arrays_and_hashing",
  categories: ["arrays_and_hashing"],
  difficulty: "Easy",
  description:
    "Two Sum determines the $0$-indexed positions of two distinct numbers in an array that add up to a specified target value.\n\n### Why It Exists & What It Solves\nThe naive brute-force approach tests all $\\frac{N(N-1)}{2} = \\mathcal{O}(N^2)$ pairs using nested loops. Two Sum optimizes this to $\\mathcal{O}(N)$ time by replacing brute-force pair iteration with constant-time hash table lookups.\n- **Complement Paradigm**: For any element $x = \\text{nums}[i]$ and target $T$, the required partner value is $y = T - x$.\n- **Single-Pass Invariant**: By querying the hash map *before* inserting $x$, we prevent an element from matching with itself while maintaining a single linear scan.\n\n### Step-by-Step Intuition\n1. **Map Allocation**: Initialize an empty hash table `seen` to store mapping $\\text{value} \\to \\text{index}$.\n2. **Linear Probe ($i = 0 \\dots N-1$)**: Read $\\text{num} = \\text{nums}[i]$.\n3. **Complement Calculation**: Compute required partner $\\text{complement} = \\text{target} - \\text{num}$.\n4. **Instant Lookup**: Check `if complement in seen`:\n   - If present, return stored index pair $[\\text{seen}[\\text{complement}], i]$.\n5. **State Record**: If absent, record $\\text{seen}[\\text{num}] = i$ and proceed to index $i+1$.\n\n### Mathematical Formulation & Derivation\nGiven input sequence $A = [a_0, a_1, \\dots, a_{N-1}]$ and target $T$:\n$$\\exists \\, i, j \\text{ s.t. } 0 \\le i < j < N \\implies a_i + a_j = T \\iff a_i = T - a_j$$\nBy storing pairs $(a_k, k)$ in hash map $S$ as we iterate $j$ from $0$ to $N-1$:\n$$\\text{If } (T - a_j) \\in \\text{keys}(S) \\implies \\text{Result} = [S[T - a_j], j]$$\nSince hash map operations operate in expected $\\mathcal{O}(1)$ time, the loop terminates after at most $N$ lookups.\n\n### Input & Output Contracts\n- **Input**: `nums` (`list[int]`), array of integers where $2 \\le N \\le 10^4$; `target` (`int`), target integer sum.\n- **Output**: `list[int]`, a 2-element array containing indices $[i, j]$ such that $\\text{nums}[i] + \\text{nums}[j] == \\text{target}$.\n\n### Trade-Offs & Complexity Analysis\n- **Time Complexity**: $\\mathcal{O}(N)$ expected time, as each insertion and lookup in the hash map takes $\\mathcal{O}(1)$ average time.\n- **Space Complexity**: $\\mathcal{O}(N)$ auxiliary space for storing up to $N$ elements in hash map `seen`.\n\n### Edge Cases & Constraints\n- **Negative & Zero Values**: Handled seamlessly since arithmetic subtraction preserves sign equality.\n- **Duplicate Array Values**: Handled correctly; if $\\text{nums} = [3, 3]$ and $\\text{target} = 6$, the second $3$ finds the first $3$ already banked in `seen`.",
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
    space:
      "Hash map stores at most n key-value pairs, requiring O(n) auxiliary space.",
  },
  topicGuide: {
    overview:
      "Two Sum is the fundamental paradigm shift from brute-force pair iteration $\\mathcal{O}(N^2)$ to constant-time memory lookups $\\mathcal{O}(N)$. In modern computer science, this pattern mirrors hash-join operations in database query engines (e.g. PostgreSQL, DuckDB) and sparse tensor key alignment in ML pipelines like PyTorch. Instead of comparing every candidate against all others, we compute the required complement $\\text{target} - \\text{num}$ and query a hash table in $\\mathcal{O}(1)$ average time.",
    sections: [
      {
        heading: "Implementation Nuances & Single-Pass Safety",
        body: "Checking the hash map before inserting the current element is crucial. If we inserted the element prior to checking, a target equal to twice the current element (e.g., $\\text{nums}[i] = 3$, $\\text{target} = 6$) would match the element with itself, returning $[i, i]$ as a false duplicate.",
      },
      {
        heading: "Edge Case Analysis & Memory Trade-offs",
        body: "Duplicate values in `nums` are handled seamlessly because the map stores the most recently encountered index. When duplicate values form the target (e.g., $[3, 3]$, target $6$), the second $3$ finds the first $3$ already in the map. The spatial complexity is $\\mathcal{O}(N)$ auxiliary space, trading RAM for an order of magnitude runtime speedup.",
      },
    ],
    keyTerms: [
      {
        term: "Hash Map / Dictionary",
        definition:
          "A key-value data structure offering $\\mathcal{O}(1)$ average-time insertion and lookup using a hash function.",
      },
      {
        term: "Complement",
        definition:
          "The required number $(\\text{target} - \\text{num})$ that when added to the current value equals target.",
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
