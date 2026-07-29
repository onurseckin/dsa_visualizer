import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ManacherAlgorithmInput {
  s: string;
}

export const PYTHON_MANACHER_ALGORITHM_CODE = `class Solution:
    def __init__(self):
        pass

    def longestPalindrome(self, s: str) -> str:
        if not s:
            return ""

        t = "#" + "#".join(s) + "#"
        n = len(t)
        p = [0] * n
        center = right = 0
        max_len = max_center = 0

        for i in range(n):
            mirror = 2 * center - i

            if i < right:
                p[i] = min(right - i, p[mirror])

            while i + p[i] + 1 < n and i - p[i] - 1 >= 0 and t[i + p[i] + 1] == t[i - p[i] - 1]:
                p[i] += 1

            if i + p[i] > right:
                center = i
                right = i + p[i]

            if p[i] > max_len:
                max_len = p[i]
                max_center = i

        start = (max_center - max_len) // 2
        return s[start:start + max_len]`;

export const DEFAULT_MANACHER_ALGORITHM_INPUT: ManacherAlgorithmInput = {
  s: "babad",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A palindrome reads the same forwards and backwards. Manacher's Algorithm finds the longest palindromic substring in linear time.",
    primarySnapshot: {
      kind: "array",
      name: "s",
      mode: "box",
      elements: [
        { id: "s0", value: "b", label: "[0]", state: "default" },
        { id: "s1", value: "a", label: "[1]", state: "default" },
        { id: "s2", value: "b", label: "[2]", state: "default" },
        { id: "s3", value: "a", label: "[3]", state: "default" },
        { id: "s4", value: "d", label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Naive center expansion expands outwards around all 2N - 1 odd and even centers, taking quadratic O(N²) time.",
    primarySnapshot: {
      kind: "array",
      name: "naive_expansion",
      mode: "box",
      elements: [
        { id: "s0", value: "b", label: "L", state: "compare" },
        { id: "s1", value: "a", label: "Center", state: "active" },
        { id: "s2", value: "b", label: "R", state: "compare" },
        { id: "s3", value: "a", label: "[3]", state: "default" },
        { id: "s4", value: "d", label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Symmetry property: inside a palindrome centered at C, any sub-palindrome at position i mirrors a matching sub-palindrome at i' = 2C - i.",
    primarySnapshot: {
      kind: "array",
      name: "mirror_symmetry",
      mode: "box",
      elements: [
        { id: "m1", value: "a", label: "i' (Mirror)", state: "sorted" },
        { id: "c", value: "b", label: "Center C", state: "active" },
        { id: "m2", value: "a", label: "Current i", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Preprocessing trick: insert delimiter '#' between characters (e.g. 'babad' -> '#b#a#b#a#d#') to handle even and odd palindromes uniformly.",
    primarySnapshot: {
      kind: "array",
      name: "preprocessed_t",
      mode: "box",
      elements: [
        { id: "t0", value: "#", label: "[0]", state: "default" },
        { id: "t1", value: "b", label: "[1]", state: "default" },
        { id: "t2", value: "#", label: "[2]", state: "default" },
        { id: "t3", value: "a", label: "[3]", state: "default" },
        { id: "t4", value: "#", label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Radius array P[i] stores the radius of the longest palindrome centered at index i in the preprocessed string.",
    primarySnapshot: {
      kind: "array",
      name: "radius_array",
      mode: "box",
      elements: [
        { id: "p0", value: 0, label: "P[0]", state: "visited" },
        { id: "p1", value: 1, label: "P[1]", state: "visited" },
        { id: "p2", value: 0, label: "P[2]", state: "visited" },
        { id: "p3", value: 3, label: "P[3]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Mirror lookup: if i < R, initialize P[i] = min(R - i, P[i']), reusing previously calculated palindrome radius in O(1) time.",
    primarySnapshot: {
      kind: "array",
      name: "o1_reuse",
      mode: "box",
      elements: [
        { id: "r1", value: 3, label: "P[mirror]=3", state: "sorted" },
        { id: "r2", value: 3, label: "P[i]=min(R-i, 3)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "When a palindrome extends beyond current right boundary R, expand outward manually and update center C and boundary R.",
    primarySnapshot: {
      kind: "array",
      name: "boundary_update",
      mode: "box",
      elements: [
        { id: "b1", value: "C", label: "New Center", state: "active" },
        { id: "b2", value: "R", label: "New Right Boundary", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Because the right boundary R strictly advances to the right, total outward character comparisons across the entire algorithm are bounded by O(N).",
    primarySnapshot: {
      kind: "array",
      name: "linear_bound",
      mode: "box",
      elements: [{ id: "l1", value: "R ->", label: "Strictly Advances", state: "sorted" }],
    },
  },
  {
    narrative:
      "Manacher's Algorithm completes in linear O(N) time using O(N) auxiliary space for the preprocessed string and radius array.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(N)", state: "sorted" },
      ],
    },
  },
];

export function generateManacherAlgorithmSteps(input: ManacherAlgorithmInput): AlgorithmStep[] {
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
    typeof input?.s === "string" && input.s.length > 0
      ? input.s
      : DEFAULT_MANACHER_ALGORITHM_INPUT.s;

  const isDefaultInput = !input || input.s === DEFAULT_MANACHER_ALGORITHM_INPUT.s;

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const t = "#" + s.split("").join("#") + "#";
  const n = t.length;
  const p = new Array<number>(n).fill(0);

  addStep(
    `Preprocess string "${s}" by inserting '#' delimiters: preprocessed string t = "${t}" of length ${n}.`,
    {
      kind: "array",
      name: "preprocessed_string",
      mode: "box",
      elements: t.split("").map((ch, i) => ({
        id: `t-${i}`,
        value: ch,
        label: `[${i}]`,
        state: "default",
      })),
    },
  );

  let C = 0;
  let R = 0;
  let maxLen = 0;
  let maxCenter = 0;

  for (let i = 0; i < n; i++) {
    const mirror = 2 * C - i;

    if (i < R) {
      p[i] = Math.min(R - i, p[mirror] || 0);
    }

    while (i + p[i] + 1 < n && i - p[i] - 1 >= 0 && t[i + p[i] + 1] === t[i - p[i] - 1]) {
      p[i]++;
    }

    if (i + p[i] > R) {
      C = i;
      R = i + p[i];
    }

    if (p[i] > maxLen) {
      maxLen = p[i];
      maxCenter = i;
    }

    addStep(
      `Inspect center index [${i}] ('${t[i]}'): radius P[${i}] = ${p[i]} (center C = ${C}, right boundary R = ${R}).`,
      {
        kind: "composite",
        layout: "horizontal",
        items: [
          {
            id: "string-view",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "string_t",
              mode: "box",
              elements: t.split("").map((ch, idx) => {
                let state: "default" | "active" | "sorted" | "compare" = "default";
                if (idx === i) state = "active";
                else if (idx === C) state = "sorted";
                else if (Math.abs(idx - i) <= p[i]) state = "compare";
                return { id: `t-${idx}`, value: ch, label: `[${idx}]`, state };
              }),
            },
          },
          {
            id: "radius-view",
            role: "auxiliary",
            snapshot: {
              kind: "array",
              name: "radius_p",
              mode: "box",
              elements: p.map((val, idx) => ({
                id: `p-${idx}`,
                value: val,
                label: `[${idx}]`,
                state: idx === i ? "active" : idx < i ? "visited" : "default",
              })),
            },
          },
        ],
      },
    );
  }

  const start = Math.floor((maxCenter - maxLen) / 2);
  const result = s.slice(start, start + maxLen);

  addStep(
    `Manacher's Algorithm complete! Longest palindromic substring = "${result}" with length ${maxLen} starting at index ${start}.`,
    {
      kind: "array",
      name: "result_string",
      mode: "box",
      elements: s.split("").map((ch, idx) => ({
        id: `res-${idx}`,
        value: ch,
        label: `[${idx}]`,
        state: idx >= start && idx < start + maxLen ? "sorted" : "default",
      })),
    },
  );

  return steps;
}

export const manacherAlgorithm: AlgorithmDefinition<ManacherAlgorithmInput> = {
  id: "manacher-algorithm",
  title: "Manacher's Algorithm",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description:
    "<p>Given a string, find its longest palindromic substring in linear O(N) time using Manacher's Algorithm.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>s</code>: Input text string consisting of English letters.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns the longest palindromic substring contained within string <code>s</code>.</p>",
  constraints: ["1 <= s.length <= 10^5", "s consists of English letters"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Palindromic String",
      input: DEFAULT_MANACHER_ALGORITHM_INPUT,
      output: "bab",
      explanation: "Finds longest palindrome 'bab' (or 'aba') in 'babad'.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "All Identical Characters",
      input: { s: "aaaaaa" },
      output: "aaaaaa",
      explanation: "Entire string is a palindrome of length 6.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single Character String",
      input: { s: "a" },
      output: "a",
      explanation: "Single character string is trivially a palindrome of length 1.",
    },
  ],
  code: PYTHON_MANACHER_ALGORITHM_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "The rightmost boundary R strictly advances to the right, bounding total character comparisons by O(N).",
    space: "Requires O(N) memory for preprocessed string array and radius array P.",
  },
  topicGuide: {
    overview:
      "<p>Manacher's Algorithm computes the longest palindromic substring of an N-character string in linear O(N) time by reusing previously computed palindrome radii across symmetric centers.</p>",
    sections: [
      {
        heading: "Mental Model",
        body: "<p>Use previously computed palindrome radii to avoid redundant work when expanding around new centers.</p>",
      },
    ],
  },
  trivia: {
    lineExplanations: {
      1: "Defines Manacher's Algorithm entry point.",
      2: "Returns longest palindromic substring.",
    },
  },
  sources: [],
  defaultInput: DEFAULT_MANACHER_ALGORITHM_INPUT,
  generateSteps: generateManacherAlgorithmSteps,
};

export default manacherAlgorithm;
