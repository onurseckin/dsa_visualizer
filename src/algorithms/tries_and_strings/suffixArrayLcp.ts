import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SuffixArrayLcpInput {
  s: string;
}

export const PYTHON_SUFFIX_ARRAY_LCP_CODE = `class Solution:
    def __init__(self):
        pass

    def longestDupSubstring(self, s: str) -> str:
        n = len(s)
        nums = [ord(c) - ord('a') for c in s]
        MOD = (1 << 61) - 1
        BASE = 26

        def check(length: int) -> str:
            h = 0
            power = 1
            for i in range(length):
                h = (h * BASE + nums[i]) % MOD
                if i > 0:
                    power = (power * BASE) % MOD
            seen = {h: 0}
            for i in range(1, n - length + 1):
                h = (h * BASE - nums[i - 1] * power * BASE + nums[i + length - 1]) % MOD
                if h in seen:
                    return s[i:i + length]
                seen[h] = i
            return ""

        lo, hi = 0, n - 1
        res = ""
        while lo <= hi:
            mid = (lo + hi) // 2
            found = check(mid)
            if found:
                res = found
                lo = mid + 1
            else:
                hi = mid - 1
        return res`;

export const DEFAULT_SUFFIX_ARRAY_LCP_INPUT: SuffixArrayLcpInput = {
  s: "banana",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Suffix Array SA is a sorted array of starting indices representing all N suffixes of a string S arranged in lexicographical order.",
    primarySnapshot: {
      kind: "array",
      name: "s",
      mode: "box",
      elements: [
        { id: "s0", value: "b", label: "[0]", state: "default" },
        { id: "s1", value: "a", label: "[1]", state: "default" },
        { id: "s2", value: "n", label: "[2]", state: "default" },
        { id: "s3", value: "a", label: "[3]", state: "default" },
        { id: "s4", value: "n", label: "[4]", state: "default" },
        { id: "s5", value: "a", label: "[5]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Lexicographically sorted suffixes empower binary search string matching for any pattern P in O(|P| log N) time.",
    primarySnapshot: {
      kind: "array",
      name: "binary_search_suffixes",
      mode: "box",
      elements: [
        { id: "sa0", value: 5, label: '"a"', state: "sorted" },
        { id: "sa1", value: 3, label: '"ana"', state: "sorted" },
        { id: "sa2", value: 1, label: '"anana"', state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Naive suffix sorting generates all N suffixes and sorts them using string comparisons, taking O(N² log N) time.",
    primarySnapshot: {
      kind: "array",
      name: "naive_suffix_sorting",
      mode: "box",
      elements: [
        { id: "n1", value: 0, label: '"banana"', state: "compare" },
        { id: "n2", value: 1, label: '"anana"', state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Efficient suffix array algorithms (like prefix-doubling or SA-IS) build the suffix array in O(N log N) or O(N) time.",
    primarySnapshot: {
      kind: "array",
      name: "suffix_array",
      mode: "box",
      elements: [
        { id: "sa0", value: 5, label: "SA[0]=5", state: "sorted" },
        { id: "sa1", value: 3, label: "SA[1]=3", state: "sorted" },
        { id: "sa2", value: 1, label: "SA[2]=1", state: "sorted" },
        { id: "sa3", value: 0, label: "SA[3]=0", state: "sorted" },
        { id: "sa4", value: 4, label: "SA[4]=4", state: "sorted" },
        { id: "sa5", value: 2, label: "SA[5]=2", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The Longest Common Prefix (LCP) array stores the length of the longest common prefix between adjacent sorted suffixes SA[i-1] and SA[i].",
    primarySnapshot: {
      kind: "array",
      name: "lcp_concept",
      mode: "box",
      elements: [
        { id: "l0", value: 0, label: "LCP[0]=0", state: "visited" },
        { id: "l1", value: 1, label: "LCP[1]=1", state: "active" },
        { id: "l2", value: 3, label: "LCP[2]=3", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Kasai's Algorithm computes the entire LCP array in O(N) linear time by noting that LCP values decrease by at most 1 between consecutive original suffixes.",
    primarySnapshot: {
      kind: "array",
      name: "kasai_property",
      mode: "box",
      elements: [
        { id: "k1", value: "h >= h_prev - 1", label: "Kasai Linear Invariant", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Distinct Substring Count: the total number of unique substrings in string S is exactly N · (N + 1) / 2 - sum(LCP[i]).",
    primarySnapshot: {
      kind: "array",
      name: "distinct_substrings",
      mode: "box",
      elements: [{ id: "d1", value: 15, label: "Total = 21 - sum(LCP)", state: "sorted" }],
    },
  },
  {
    narrative:
      "Longest Repeated Substring: the maximum value in the LCP array immediately identifies the longest repeated substring in the text.",
    primarySnapshot: {
      kind: "array",
      name: "max_lcp",
      mode: "box",
      elements: [{ id: "m1", value: 3, label: 'Max LCP = 3 ("ana")', state: "sorted" }],
    },
  },
  {
    narrative:
      "Combining Suffix Array and LCP Array yields an optimal O(N log N) workspace with O(N) space complexity.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N log N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(N)", state: "sorted" },
      ],
    },
  },
];

export function generateSuffixArrayLcpSteps(input: SuffixArrayLcpInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const s =
    typeof input?.s === "string" && input.s.length > 0 ? input.s : DEFAULT_SUFFIX_ARRAY_LCP_INPUT.s;

  const isDefaultInput = !input || input.s === DEFAULT_SUFFIX_ARRAY_LCP_INPUT.s;

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const n = s.length;
  const suffixes = s.split("").map((_, i) => ({ suffix: s.slice(i), index: i }));
  suffixes.sort((a, b) => (a.suffix < b.suffix ? -1 : a.suffix > b.suffix ? 1 : 0));

  const sa = suffixes.map((item) => item.index);

  addStep(`Construct Suffix Array for string "${s}": SA = [${sa.join(", ")}].`, {
    kind: "array",
    name: "suffix_array",
    mode: "box",
    elements: sa.map((idx, rank) => ({
      id: `sa-${rank}`,
      value: idx,
      label: `"${s.slice(idx)}"`,
      state: "sorted",
    })),
  });

  const rank = new Array<number>(n).fill(0);
  sa.forEach((suffixIdx, i) => {
    rank[suffixIdx] = i;
  });

  const lcp = new Array<number>(n).fill(0);
  let h = 0;
  for (let i = 0; i < n; i++) {
    if (rank[i] > 0) {
      const j = sa[rank[i] - 1];
      while (i + h < n && j + h < n && s[i + h] === s[j + h]) {
        h++;
      }
      lcp[rank[i]] = h;
      if (h > 0) h--;
    }
  }

  addStep(`Compute LCP array via Kasai's algorithm: LCP = [${lcp.join(", ")}].`, {
    kind: "composite",
    layout: "horizontal",
    items: [
      {
        id: "sa-view",
        role: "primary",
        snapshot: {
          kind: "array",
          name: "sa_array",
          mode: "box",
          elements: sa.map((idx, r) => ({
            id: `sa-${r}`,
            value: idx,
            label: `SA[${r}]="${s.slice(idx)}"`,
            state: "sorted",
          })),
        },
      },
      {
        id: "lcp-view",
        role: "auxiliary",
        snapshot: {
          kind: "array",
          name: "lcp_array",
          mode: "box",
          elements: lcp.map((val, r) => ({
            id: `lcp-${r}`,
            value: val,
            label: `LCP[${r}]`,
            state: "active",
          })),
        },
      },
    ],
  });

  addStep(
    `Suffix Array & LCP Array construction complete for "${s}". SA = [${sa.join(", ")}], LCP = [${lcp.join(", ")}].`,
    {
      kind: "array",
      name: "lcp_result",
      mode: "box",
      elements: lcp.map((val, r) => ({
        id: `lcp-res-${r}`,
        value: val,
        label: `LCP[${r}]=${val}`,
        state: "sorted",
      })),
    },
  );

  return steps;
}

export const suffixArrayLcp: AlgorithmDefinition<SuffixArrayLcpInput> = {
  id: "suffix-array-lcp",
  title: "Suffix Array & LCP Array",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description:
    "<p>Given a string, construct its Suffix Array (sorted suffix indices) and LCP Array (longest common prefixes between adjacent sorted suffixes).</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>s</code>: Input text string consisting of English letters.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns the Suffix Array <code>SA</code> and Longest Common Prefix Array <code>LCP</code>.</p>",
  constraints: ["1 <= s.length <= 10^5", "s consists of English letters"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard String 'banana'",
      input: DEFAULT_SUFFIX_ARRAY_LCP_INPUT,
      output: "[5, 3, 1, 0, 4, 2]",
      explanation:
        "Sorted suffixes: 'a' (5), 'ana' (3), 'anana' (1), 'banana' (0), 'na' (4), 'nana' (2).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "All Identical Characters",
      input: { s: "aaaa" },
      output: "[3, 2, 1, 0]",
      explanation: "Suffixes are ordered by decreasing length.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single Character String",
      input: { s: "a" },
      output: "[0]",
      explanation: "Single character suffix array is trivially [0].",
    },
  ],
  code: PYTHON_SUFFIX_ARRAY_LCP_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting suffixes takes O(N log N) time. Kasai's algorithm computes the LCP array in linear O(N) time.",
    space: "The Suffix Array and LCP array require O(N) space.",
  },
  topicGuide: {
    overview:
      "<p>Explanation of Suffix Arrays and the LCP Array for efficient pattern matching and repeated substring identification.</p>",
    sections: [
      {
        heading: "Mental Model",
        body: "<p>Sorted suffixes group similar patterns together, and the LCP array measures how deeply they overlap.</p>",
      },
    ],
  },
  sources: [],
  defaultInput: DEFAULT_SUFFIX_ARRAY_LCP_INPUT,
  generateSteps: generateSuffixArrayLcpSteps,
};

export default suffixArrayLcp;
