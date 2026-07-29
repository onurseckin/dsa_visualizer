import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SuffixArrayLcpInput {
  s: string;
}

export const PYTHON_SUFFIX_ARRAY_LCP_CODE = `def build_suffix_array(s: str) -> list[int]:
    n = len(s)
    suffixes = [(s[i:], i) for i in range(n)]
    suffixes.sort()
    return [suffix[1] for suffix in suffixes]

def build_lcp_array(s: str, sa: list[int]) -> list[int]:
    n = len(s)
    rank = [0] * n
    for i, suffix_idx in enumerate(sa):
        rank[suffix_idx] = i
        
    lcp = [0] * n
    h = 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and s[i + h] == s[j + h]:
                h += 1
            lcp[rank[i]] = h
            if h > 0:
                h -= 1
    return lcp

def solve(s: str) -> tuple[list[int], list[int]]:
    sa = build_suffix_array(s)
    lcp = build_lcp_array(s, sa)
    return sa, lcp`;

export const DEFAULT_SUFFIX_ARRAY_LCP_INPUT: SuffixArrayLcpInput = {
  s: "banana",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Suffix Array is a sorted array of all suffixes of a given string. Sorting suffixes provides a powerful tool for string matching and pattern discovery.",
    primarySnapshot: {
      kind: "array",
      name: "s",
      mode: "box",
      elements: [{ id: "c1", value: "b", label: "String", state: "default" }],
    },
  },
  {
    narrative:
      "The Longest Common Prefix (LCP) array stores the lengths of the longest common prefixes between adjacent suffixes in the sorted suffix array. This helps find repeating substrings efficiently.",
    primarySnapshot: {
      kind: "array",
      name: "s",
      mode: "box",
      elements: [{ id: "c1", value: "b", label: "String", state: "default" }],
    },
  },
];

export function generateSuffixArrayLcpSteps(input: SuffixArrayLcpInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const { narrative, primarySnapshot } of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative,
        primarySnapshot,
      }),
    );
  }

  const { s } = input;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "First, we construct all suffixes of the given string and sort them lexicographically to build the Suffix Array.",
      primarySnapshot: {
        kind: "array",
        name: "s",
        mode: "box",
        elements: s.split("").map((char, i) => ({
          id: `char_${i}`,
          value: char,
          label: `[${i}]`,
          state: "default",
        })),
      },
    }),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "Next, we compute the LCP array. By iterating through the original string and maintaining the matching prefix length, we populate the array in linear time.",
      primarySnapshot: {
        kind: "array",
        name: "s",
        mode: "box",
        elements: s.split("").map((char, i) => ({
          id: `char_${i}`,
          value: char,
          label: `[${i}]`,
          state: "visited",
        })),
      },
    }),
  );

  return steps;
}

export const suffixArrayLcp: AlgorithmDefinition<SuffixArrayLcpInput> = {
  id: "suffix-array-lcp",
  title: "Suffix Array & LCP Array",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description: "<p>Construct the Suffix Array and LCP Array for a given string.</p>",
  constraints: ["1 <= s.length <= 10^5", "s consists of English letters"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { s: "banana" },
      output: "[5, 3, 1, 0, 4, 2]",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { s: "a" },
      output: "[0]",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { s: "aaaa" },
      output: "[3, 2, 1, 0]",
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
    time: "Sorting the suffixes takes O(N log N) using a fast suffix array construction algorithm. Computing the LCP array takes O(N).",
    space: "The Suffix Array and LCP array require O(N) space.",
  },
  topicGuide: {
    overview: "<p>Explanation of Suffix Arrays and the LCP Array.</p>",
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
