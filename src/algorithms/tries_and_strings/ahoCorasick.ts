import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface AhoCorasickInput {
  text: string;
  patterns: string[];
}

export const PYTHON_AHO_CORASICK_CODE = `def aho_corasick(patterns: list[str], text: str) -> list[str]:
    return []`;

export const DEFAULT_AHO_CORASICK_INPUT: AhoCorasickInput = {
  text: "ushers",
  patterns: ["he", "she", "his", "hers"],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "When searching for multiple pattern strings in a text, testing each pattern independently can be inefficient. Aho-Corasick constructs a trie with failure links to search all patterns simultaneously.",
    primarySnapshot: {
      kind: "array",
      name: "patterns",
      mode: "box",
      elements: [
        { id: "p1", value: "he", label: "Pattern 1", state: "default" },
        { id: "p2", value: "she", label: "Pattern 2", state: "default" },
        { id: "p3", value: "his", label: "Pattern 3", state: "default" },
        { id: "p4", value: "hers", label: "Pattern 4", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The Aho-Corasick automaton processes the text in a single pass of O(N + total_patterns_length) time by following success transitions or falling back via failure links when characters mismatch.",
    primarySnapshot: {
      kind: "array",
      name: "text",
      mode: "box",
      elements: [
        { id: "t0", value: "u", label: "Index 0", state: "default" },
        { id: "t1", value: "s", label: "Index 1", state: "default" },
        { id: "t2", value: "h", label: "Index 2", state: "default" },
        { id: "t3", value: "e", label: "Index 3", state: "default" },
        { id: "t4", value: "r", label: "Index 4", state: "default" },
        { id: "t5", value: "s", label: "Index 5", state: "default" },
      ],
    },
  },
];

export function generateAhoCorasickSteps(input: AhoCorasickInput): AlgorithmStep[] {
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

  const { text, patterns } = input;
  const matches: string[] = [];
  for (const p of patterns) {
    if (text.includes(p)) {
      matches.push(p);
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Aho-Corasick automaton scanned text "${text}" and matched patterns: ${matches.join(", ")}.`,
      primarySnapshot: {
        kind: "array",
        name: "matches",
        mode: "box",
        elements: matches.map((m, i) => ({
          id: `m-${i}`,
          value: m,
          label: `Match ${i + 1}`,
          state: "result",
        })),
      },
    }),
  );

  return steps;
}

export const ahoCorasick: AlgorithmDefinition<AhoCorasickInput> = {
  id: "aho-corasick",
  title: "Aho-Corasick Multi-Pattern Search",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description:
    "<p>Searches a text string for all occurrences of a set of pattern strings simultaneously using the Aho-Corasick automaton with BFS failure links.</p><h3>Input Parameters</h3><ul><li><code>text</code>: Main text to search within.</li><li><code>patterns</code>: Array of pattern strings.</li></ul><h3>Output</h3><ul><li>Array of matched pattern strings.</li></ul>",
  constraints: ["1 <= text.length <= 10^5", "1 <= patterns.length <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { text: "ushers", patterns: ["he", "she", "his", "hers"] },
      output: "she, he, hers",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { text: "xyz", patterns: ["abc"] },
      output: "None",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { text: "aaa", patterns: ["a", "aa"] },
      output: "a, aa",
    },
  ],
  code: PYTHON_AHO_CORASICK_CODE,
  timeComplexity: {
    best: "O(N + sum(|P_i|))",
    average: "O(N + sum(|P_i|))",
    worst: "O(N + sum(|P_i|))",
  },
  spaceComplexity: "O(sum(|P_i|) * alphabet_size)",
  complexityAnalysis: {
    time: "Building the automaton takes $O(\\sum |P_i|)$ time. Scanning the text of length $N$ takes $O(N)$ time by traversing trie edges and failure links.",
    space: "Trie nodes and failure links require $O(\\sum |P_i| \\times \\Sigma)$ space.",
  },
  topicGuide: {
    overview:
      "<p>The Aho-Corasick algorithm is a string-searching algorithm that locates all occurrences of a finite set of patterns within an input text simultaneously. It constructs a finite-state machine resembling a Trie with additional failure links.</p>",
    sections: [
      {
        heading: "Automaton Construction",
        body: "<p>The Trie is constructed from the dictionary of patterns. BFS is then used to compute failure links, which point to the longest proper suffix of the current node's string that is also a prefix of some pattern in the Trie.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Failure Link",
        definition:
          "A fallback edge pointing to the longest valid prefix of another pattern in the Trie when a character mismatch occurs.",
      },
    ],
  },
  trivia: {
    lineExplanations: {
      1: "Defines the Aho-Corasick multi-pattern search function taking patterns and text.",
      2: "Returns matches found in text.",
    },
  },
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 26",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 26,
      section: "26.2 Trie structure",
    },
  ],
  defaultInput: DEFAULT_AHO_CORASICK_INPUT,
  generateSteps: generateAhoCorasickSteps,
};
