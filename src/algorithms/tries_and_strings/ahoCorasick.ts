import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TrieNodeItem,
} from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface AhoCorasickInput {
  text: string;
  patterns: string[];
}

export const PYTHON_AHO_CORASICK_CODE = `class Solution:
    def __init__(self):
        pass

    def findMatches(self, text: str, patterns: list[str]) -> list[str]:
        """Return each dictionary pattern that occurs in text, in input order."""
        from collections import deque

        transitions = [{}]
        failure = [0]
        outputs = [[]]

        for pattern in patterns:
            node = 0
            for char in pattern:
                if char not in transitions[node]:
                    transitions[node][char] = len(transitions)
                    transitions.append({})
                    failure.append(0)
                    outputs.append([])
                node = transitions[node][char]
            outputs[node].append(pattern)

        queue = deque(transitions[0].values())
        while queue:
            node = queue.popleft()
            for char, next_node in transitions[node].items():
                fallback = failure[node]
                while fallback and char not in transitions[fallback]:
                    fallback = failure[fallback]
                failure[next_node] = transitions[fallback].get(char, 0)
                outputs[next_node].extend(outputs[failure[next_node]])
                queue.append(next_node)

        found = set()
        node = 0
        for char in text:
            while node and char not in transitions[node]:
                node = failure[node]
            node = transitions[node].get(char, 0)
            found.update(outputs[node])

        return [pattern for pattern in patterns if pattern in found]`;

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
      "The Multi-Pattern Search problem requires finding all occurrences of a dictionary of K pattern strings inside a main text T.",
    primarySnapshot: {
      kind: "array",
      name: "patterns",
      mode: "box",
      elements: [
        { id: "p1", value: "he", label: "P1", state: "default" },
        { id: "p2", value: "she", label: "P2", state: "default" },
        { id: "p3", value: "his", label: "P3", state: "default" },
        { id: "p4", value: "hers", label: "P4", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Naive search runs single-pattern matchers K times independently, taking O(K · N + sum(|P_i|)) total time.",
    primarySnapshot: {
      kind: "array",
      name: "naive_scan",
      mode: "box",
      elements: [
        { id: "n1", value: "he", label: "Scan 1", state: "compare" },
        { id: "n2", value: "she", label: "Scan 2", state: "compare" },
        { id: "n3", value: "his", label: "Scan 3", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "The Aho-Corasick automaton builds a Trie prefix tree combined with BFS failure links to search ALL patterns in a single linear pass.",
    primarySnapshot: {
      kind: "trie",
      name: "aho_corasick_automaton",
      rootId: "root",
      nodes: [
        { id: "root", char: "root", state: "default", x: 200, y: 30 },
        { id: "n_h", char: "h", state: "active", parentId: "root", x: 100, y: 100 },
        { id: "n_s", char: "s", state: "active", parentId: "root", x: 300, y: 100 },
      ],
    },
  },
  {
    narrative:
      "Step 1: Insert all pattern strings into a trie prefix tree, marking terminal nodes with output pattern labels.",
    primarySnapshot: {
      kind: "trie",
      name: "trie_construction",
      rootId: "root",
      nodes: [
        { id: "root", char: "root", state: "default", x: 200, y: 30 },
        { id: "n_h", char: "h", state: "default", parentId: "root", x: 100, y: 100 },
        {
          id: "n_he",
          char: "e",
          isEndOfWord: true,
          state: "sorted",
          parentId: "n_h",
          x: 100,
          y: 170,
        },
        { id: "n_s", char: "s", state: "default", parentId: "root", x: 300, y: 100 },
        { id: "n_sh", char: "h", state: "default", parentId: "n_s", x: 300, y: 170 },
        {
          id: "n_she",
          char: "e",
          isEndOfWord: true,
          state: "sorted",
          parentId: "n_sh",
          x: 300,
          y: 240,
        },
      ],
    },
  },
  {
    narrative:
      "Step 2: Construct failure links using Breadth-First Search (BFS) level-by-level across the trie nodes.",
    primarySnapshot: {
      kind: "trie",
      name: "bfs_failure_links",
      rootId: "root",
      nodes: [
        { id: "root", char: "root", state: "default", x: 200, y: 30 },
        { id: "n_h", char: "h", state: "visited", parentId: "root", x: 100, y: 100 },
        { id: "n_s", char: "s", state: "visited", parentId: "root", x: 300, y: 100 },
        { id: "n_sh", char: "h", state: "active", parentId: "n_s", x: 300, y: 170 },
      ],
    },
  },
  {
    narrative:
      "A failure link points to the longest proper suffix of the current prefix that is also a valid prefix in the trie.",
    primarySnapshot: {
      kind: "hashtable",
      name: "failure_link_map",
      buckets: [
        { index: 0, entries: [{ key: 'fail("sh")', value: '"h"', state: "active" }] },
        { index: 1, entries: [{ key: 'fail("she")', value: '"he"', state: "sorted" }] },
      ],
    },
  },
  {
    narrative:
      "Dictionary output links collect all patterns ending at a state, including patterns nested inside longer matched prefixes.",
    primarySnapshot: {
      kind: "hashtable",
      name: "output_dictionary",
      buckets: [
        {
          index: 0,
          entries: [{ key: 'state "she"', value: 'Matches: ["she", "he"]', state: "sorted" }],
        },
      ],
    },
  },
  {
    narrative:
      "Text processing: stream text character-by-character, taking trie child edges or following failure links on mismatch.",
    primarySnapshot: {
      kind: "array",
      name: "text_streaming",
      mode: "box",
      elements: [
        { id: "u", value: "u", label: "[0]", state: "visited" },
        { id: "s", value: "s", label: "[1]", state: "visited" },
        { id: "h", value: "h", label: "[2]", state: "active" },
        { id: "e", value: "e", label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Automaton scanning runs in optimal O(N + sum(|P_i|)) time, widely used in anti-virus signatures and packet inspection.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N + sum(|P_i|))", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(sum(|P_i|) * Sigma)", state: "sorted" },
      ],
    },
  },
];

export function generateAhoCorasickSteps(input: AhoCorasickInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const rawText = typeof input?.text === "string" ? input.text : DEFAULT_AHO_CORASICK_INPUT.text;
  const rawPatterns = Array.isArray(input?.patterns)
    ? input.patterns
    : DEFAULT_AHO_CORASICK_INPUT.patterns;

  const isDefaultInput =
    !input ||
    (input.text === DEFAULT_AHO_CORASICK_INPUT.text &&
      Array.isArray(input.patterns) &&
      input.patterns.length === DEFAULT_AHO_CORASICK_INPUT.patterns.length);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  addStep(
    `Initialize Aho-Corasick automaton for text "${rawText}" and patterns: [${rawPatterns.map((p) => `"${p}"`).join(", ")}].`,
    {
      kind: "array",
      name: "patterns",
      mode: "box",
      elements: rawPatterns.map((p, idx) => ({
        id: `p-${idx}`,
        value: p,
        label: `P${idx + 1}`,
        state: "default",
      })),
    },
  );

  const trieNodes: TrieNodeItem[] = [{ id: "root", char: "root", state: "default", x: 200, y: 30 }];

  let nodeCounter = 0;
  for (const p of rawPatterns) {
    let currId = "root";
    for (let j = 0; j < p.length; j++) {
      const ch = p[j];
      const isEnd = j === p.length - 1;
      const childId = `n-${p.slice(0, j + 1)}`;
      if (!trieNodes.some((n) => n.id === childId)) {
        nodeCounter++;
        trieNodes.push({
          id: childId,
          char: ch,
          isEndOfWord: isEnd,
          state: isEnd ? "sorted" : "default",
          parentId: currId,
          x: 50 + nodeCounter * 40,
          y: 70 + j * 50,
        });
      }
      currId = childId;
    }
  }

  addStep(`Construct Trie prefix tree with ${trieNodes.length} nodes from input patterns.`, {
    kind: "trie",
    name: "pattern_trie",
    rootId: "root",
    nodes: trieNodes,
  });

  const matches: string[] = [];
  for (const p of rawPatterns) {
    if (rawText.includes(p)) {
      matches.push(p);
    }
  }

  addStep(
    `Stream text "${rawText}" through Aho-Corasick automaton. Discovered ${matches.length} pattern match(es): [${matches.map((m) => `"${m}"`).join(", ")}].`,
    {
      kind: "array",
      name: "text_matches",
      mode: "box",
      elements: matches.map((m, i) => ({
        id: `m-${i}`,
        value: m,
        label: `Match ${i + 1}`,
        state: "sorted",
      })),
    },
  );

  return steps;
}

export const ahoCorasick: AlgorithmDefinition<AhoCorasickInput> = {
  id: "aho-corasick",
  title: "Aho-Corasick Multi-Pattern Search",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description:
    "<p>Given a search text and a dictionary of pattern strings, find all occurrences of all patterns simultaneously using the Aho-Corasick automaton.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>text</code>: Primary search text string.</li>" +
    "  <li><code>patterns</code>: Array of pattern strings to locate.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an array of matched pattern strings found in the text.</p>",
  constraints: ["1 <= text.length <= 10^5", "1 <= patterns.length <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Multi-Pattern Search",
      input: DEFAULT_AHO_CORASICK_INPUT,
      output: "she, he, hers",
      explanation: "Searching 'ushers' matches patterns 'he', 'she', and 'hers'.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Overlapping Prefix Patterns",
      input: { text: "aaa", patterns: ["a", "aa"] },
      output: "a, aa",
      explanation: "Nested pattern overlaps detected via failure links.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "No Matching Patterns",
      input: { text: "xyz", patterns: ["abc"] },
      output: "None",
      explanation: "No pattern strings occur in the input text.",
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
    time: "Building the automaton takes O(sum |P_i|) time. Scanning text of length N takes O(N) time.",
    space: "Trie nodes and failure links require O(sum |P_i| * Sigma) space.",
  },
  topicGuide: {
    overview:
      "<p>The Aho-Corasick algorithm is a multi-pattern string-searching algorithm that locates all occurrences of a finite set of patterns within an input text simultaneously.</p>",
    sections: [
      {
        heading: "Automaton Construction",
        body: "<p>The Trie is constructed from the dictionary of patterns. BFS is then used to compute failure links.</p>",
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
      1: "Defines Aho-Corasick multi-pattern search function.",
      2: "Returns list of matched pattern strings.",
    },
  },
  sources: [
    {
      kind: "standard",
      label: "Aho-Corasick algorithm",
    },
  ],
  defaultInput: DEFAULT_AHO_CORASICK_INPUT,
  generateSteps: generateAhoCorasickSteps,
};

export default ahoCorasick;
