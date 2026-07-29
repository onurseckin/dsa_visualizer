import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface ManacherAlgorithmInput {
  s: string;
}

export const PYTHON_MANACHER_ALGORITHM_CODE = `def manachers_algorithm(s: str) -> str:
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
      "To find the longest palindromic substring, we can expand around every center. However, doing this for all possible centers takes quadratic time.",
    primarySnapshot: {
      kind: "array",
      name: "s",
      mode: "box",
      elements: [{ id: "c1", value: "b", label: "String", state: "default" }],
    },
  },
  {
    narrative:
      "Manacher's Algorithm optimizes this by utilizing previously computed palindrome lengths. It avoids redundant comparisons by mirroring lengths across a known palindromic center.",
    primarySnapshot: {
      kind: "array",
      name: "s",
      mode: "box",
      elements: [{ id: "c1", value: "b", label: "String", state: "default" }],
    },
  },
];

export function generateManacherAlgorithmSteps(input: ManacherAlgorithmInput): AlgorithmStep[] {
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
  const t = "#" + s.split("").join("#") + "#";

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "First, we preprocess the string by inserting special characters between all letters. This allows us to handle both even and odd length palindromes uniformly.",
      primarySnapshot: {
        kind: "array",
        name: "t",
        mode: "box",
        elements: t.split("").map((char, i) => ({
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
        "As we iterate through the preprocessed string, we use the known palindromic bounds to skip unnecessary character comparisons, maintaining a linear runtime.",
      primarySnapshot: {
        kind: "array",
        name: "t",
        mode: "box",
        elements: t.split("").map((char, i) => ({
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

export const manacherAlgorithm: AlgorithmDefinition<ManacherAlgorithmInput> = {
  id: "manacher-algorithm",
  title: "Manacher's Algorithm",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description:
    "<p>Find the longest palindromic substring in a string in linear time using Manacher's Algorithm.</p>",
  constraints: ["1 <= s.length <= 10^5", "s consists of English letters"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { s: "babad" },
      output: "bab",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { s: "a" },
      output: "a",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { s: "aaaaaa" },
      output: "aaaaaa",
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
    time: "The rightmost boundary of the current palindrome only moves forward, resulting in at most O(N) expansions.",
    space: "We construct a new string of size 2N+1 and maintain an array of the same size.",
  },
  topicGuide: {
    overview: "<p>Explanation of Manacher's Algorithm and the preprocessing trick.</p>",
    sections: [
      {
        heading: "Mental Model",
        body: "<p>Use previously computed palindrome radii to avoid redundant work when expanding around new centers.</p>",
      },
    ],
  },
  sources: [],
  defaultInput: DEFAULT_MANACHER_ALGORITHM_INPUT,
  generateSteps: generateManacherAlgorithmSteps,
};
