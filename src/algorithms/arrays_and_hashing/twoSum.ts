import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  CompositeCanvasSnapshot,
  HashBucketItem,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Given an array of numbers and a target value T, the Two Sum problem asks us to find the 0-based indices of two distinct elements whose sum equals T.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 3, label: "[0]", state: "default" },
        { id: "c2", value: 7, label: "[1]", state: "default" },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 8, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The naive brute-force approach tests every possible pair of elements using nested loops, checking whether nums[i] + nums[j] equals target T.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 3, label: "[0]", state: "compare", pointers: ["i"] },
        { id: "c2", value: 7, label: "[1]", state: "compare", pointers: ["j"] },
        { id: "c3", value: 4, label: "[2]", state: "default" },
        { id: "c4", value: 8, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Checking all pairs requires quadratic O(N²) time because an array of N elements has N × (N - 1) / 2 unique pair combinations to test.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 3, label: "[0]", state: "compare", pointers: ["i"] },
        { id: "c2", value: 7, label: "[1]", state: "visited" },
        { id: "c3", value: 4, label: "[2]", state: "visited" },
        { id: "c4", value: 8, label: "[3]", state: "compare", pointers: ["j"] },
      ],
    },
  },
  {
    narrative:
      "The bottleneck in brute force is redundant searching: standing at element X, we repeatedly scan through the remaining array to check if a partner exists.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 3, label: "[0]", state: "visited" },
        { id: "c2", value: 7, label: "[1]", state: "visited" },
        { id: "c3", value: 4, label: "[2]", state: "active", pointers: ["scan"] },
        { id: "c4", value: 8, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "By elementary algebra, if X + Y = T, then the required partner for any current element X is uniquely fixed as Y = T - X.",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "c1", value: 3, label: "[0]", state: "default" },
        { id: "c2", value: 7, label: "[1]", state: "default" },
        { id: "c3", value: 4, label: "[2]", state: "active", pointers: ["X = 4"] },
        { id: "c4", value: 8, label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Instead of searching forward repeatedly, we store previously visited numbers in a key-value hash map named 'seen', mapping each value to its array index.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 3, label: "[0]", state: "visited" },
              { id: "c2", value: 7, label: "[1]", state: "visited" },
              { id: "c3", value: 4, label: "[2]", state: "active", pointers: ["i"] },
              { id: "c4", value: 8, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-hash",
          role: "auxiliary",
          snapshot: {
            kind: "hashtable",
            name: "seen",
            buckets: [
              { index: 0, entries: [{ key: "3", value: 0, state: "visited" }] },
              { index: 1, entries: [{ key: "7", value: 1, state: "visited" }] },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "For each element X, we compute complement = T - X and query 'seen'; because hash map lookups run in O(1) average time, checking for the partner takes constant time.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 3, label: "[0]", state: "visited" },
              { id: "c2", value: 7, label: "[1]", state: "compare", pointers: ["match"] },
              { id: "c3", value: 4, label: "[2]", state: "active", pointers: ["i"] },
              { id: "c4", value: 8, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-hash",
          role: "auxiliary",
          snapshot: {
            kind: "hashtable",
            name: "seen",
            buckets: [
              { index: 0, entries: [{ key: "3", value: 0, state: "visited" }] },
              { index: 1, entries: [{ key: "7", value: 1, state: "compare" }] },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Crucially, we query 'seen' BEFORE inserting the current element X into the hash map, ensuring an element can never accidentally pair with itself.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 3, label: "[0]", state: "visited" },
              { id: "c2", value: 7, label: "[1]", state: "visited" },
              { id: "c3", value: 4, label: "[2]", state: "active", pointers: ["i"] },
              { id: "c4", value: 8, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-hash",
          role: "auxiliary",
          snapshot: {
            kind: "hashtable",
            name: "seen",
            buckets: [
              { index: 0, entries: [{ key: "3", value: 0, state: "visited" }] },
              { index: 1, entries: [{ key: "7", value: 1, state: "visited" }] },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "When the complement is found in 'seen', we immediately return the stored index pair [seen[complement], i], achieving a single-pass O(N) linear time solution with O(N) space.",
    primarySnapshot: {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "intro-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "c1", value: 3, label: "[0]", state: "visited" },
              { id: "c2", value: 7, label: "[1]", state: "sorted", pointers: ["match"] },
              { id: "c3", value: 4, label: "[2]", state: "sorted", pointers: ["match"] },
              { id: "c4", value: 8, label: "[3]", state: "default" },
            ],
          },
        },
        {
          id: "intro-hash",
          role: "auxiliary",
          snapshot: {
            kind: "hashtable",
            name: "seen",
            buckets: [
              { index: 0, entries: [{ key: "3", value: 0, state: "visited" }] },
              { index: 1, entries: [{ key: "7", value: 1, state: "sorted" }] },
            ],
          },
        },
      ],
    },
  },
];

export const generateTwoSumSteps = (input: TwoSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums =
    Array.isArray(input?.nums) && input.nums.length > 0 ? input.nums : DEFAULT_TWO_SUM_INPUT.nums;
  const target = typeof input?.target === "number" ? input.target : DEFAULT_TWO_SUM_INPUT.target;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input.nums) &&
      input.nums.length === DEFAULT_TWO_SUM_INPUT.nums.length &&
      input.target === DEFAULT_TWO_SUM_INPUT.target);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const elements: ArrayElement[] = nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    label: `[${idx}]`,
    state: "default",
  }));

  const hashMap = new Map<number, number>();

  const buildHashBuckets = (
    activeKey?: number,
    activeState: "compare" | "active" | "sorted" = "compare",
  ): HashBucketItem[] => {
    const buckets: HashBucketItem[] = [];
    let idx = 0;
    hashMap.forEach((storedIdx, numVal) => {
      buckets.push({
        index: idx++,
        entries: [
          {
            key: String(numVal),
            value: storedIdx,
            state: numVal === activeKey ? activeState : "default",
          },
        ],
      });
    });
    return buckets;
  };

  const makeComposite = (
    currentIdx?: number,
    matchIdx?: number,
    activeKey?: number,
    activeState: "compare" | "active" | "sorted" = "compare",
  ): CompositeCanvasSnapshot => ({
    kind: "composite",
    layout: "horizontal",
    items: [
      {
        id: "two-sum-array",
        role: "primary",
        snapshot: {
          kind: "array",
          name: "nums",
          mode: "box",
          elements: elements.map((el, idx) => {
            let state = el.state;
            let pointers: string[] | undefined = undefined;
            if (idx === currentIdx) {
              state = matchIdx !== undefined ? "sorted" : "active";
              pointers = matchIdx !== undefined ? ["match"] : ["i"];
            } else if (idx === matchIdx) {
              state = "sorted";
              pointers = ["match"];
            } else if (hashMap.has(Number(el.value))) {
              state = "visited";
            }
            return { ...el, state, pointers };
          }),
        },
      },
      {
        id: "two-sum-hash",
        role: "auxiliary",
        snapshot: {
          kind: "hashtable",
          name: "seen",
          buckets: buildHashBuckets(activeKey, activeState),
        },
      },
    ],
  });

  addStep(
    `Having established the mental model, let's now transition to our selected input array of ${nums.length} elements with target sum T = ${target}.`,
    makeComposite(),
  );

  let foundMatch = false;
  for (let i = 0; i < nums.length; i++) {
    const currentVal = nums[i];
    const complement = target - currentVal;

    addStep(
      `Inspect element nums[${i}] = ${currentVal}: compute required complement = ${target} - ${currentVal} = ${complement} and query 'seen' hash map.`,
      makeComposite(i, undefined, complement, "compare"),
    );

    if (hashMap.has(complement)) {
      const matchIdx = hashMap.get(complement)!;
      foundMatch = true;
      addStep(
        `Found matching complement ${complement} in 'seen' at index ${matchIdx}! The pair nums[${matchIdx}] (${nums[matchIdx]}) + nums[${i}] (${currentVal}) = ${target}. Returning index pair [${matchIdx}, ${i}].`,
        makeComposite(i, matchIdx, complement, "sorted"),
      );
      break;
    }

    hashMap.set(currentVal, i);
    addStep(
      `Complement ${complement} is not present in 'seen'. Bank current entry ${currentVal} → index ${i} into the hash map so future elements can locate it.`,
      makeComposite(i, undefined, currentVal, "active"),
    );
  }

  if (!foundMatch) {
    addStep(
      `Scanned all ${nums.length} elements without finding any pair summing to target ${target}. Returning empty array [].`,
      makeComposite(),
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
      scenario: "standard",
      inputDisplay: "nums = [3, 5, 2, 8, 11, 14, 7], target = 15",
      outputDisplay: "[3, 6]",
      title: "Standard 7-Element Array",
      input: DEFAULT_TWO_SUM_INPUT,
      output: "[3, 6]",
      explanation: "Looking up complement 15 - 7 = 8 in the hash map finds index 3 (value 8), returning [3, 6].",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [3, 2, 4, 1, 9, 8], target = 12",
      outputDisplay: "[2, 5]",
      title: "Adversarial Complement Search",
      input: { nums: [3, 2, 4, 1, 9, 8], target: 12 },
      output: "[2, 5]",
      explanation:
        "Looking up complement 12 - 8 = 4 in the hash map finds index 2 (value 4), returning [2, 5].",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [4], target = 4",
      outputDisplay: "[]",
      title: "Boundary Single Element",
      input: { nums: [4], target: 4 },
      output: "[]",
      explanation:
        "Single element cannot pair with itself. Hash map stores [4: 0] and [] is returned.",
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

export default twoSum;
