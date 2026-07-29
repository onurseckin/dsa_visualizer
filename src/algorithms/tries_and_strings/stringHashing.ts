import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface StringHashingInput {
  text: string;
  pattern: string;
  p?: number;
  mod?: number;
}

export const PYTHON_STRING_HASHING_CODE = `class Solution:
    def __init__(self):
        pass

    def findMatches(self, text: str, pattern: str, base: int = 31, mod: int = 1_000_000_007) -> list[int]:
        if pattern == "":
            return list(range(len(text) + 1))
        if len(pattern) > len(text):
            return []

        power = pow(base, len(pattern) - 1, mod)
        pattern_hash = window_hash = 0
        for index, char in enumerate(pattern):
            pattern_hash = (pattern_hash * base + ord(char)) % mod
            window_hash = (window_hash * base + ord(text[index])) % mod

        matches = []
        for start in range(len(text) - len(pattern) + 1):
            if window_hash == pattern_hash and text[start : start + len(pattern)] == pattern:
                matches.append(start)
            if start + len(pattern) < len(text):
                window_hash = (window_hash - ord(text[start]) * power) % mod
                window_hash = (window_hash * base + ord(text[start + len(pattern)])) % mod
        return matches`;

export const DEFAULT_STRING_HASHING_INPUT: StringHashingInput = {
  text: "abracadabra",
  pattern: "abra",
  p: 31,
  mod: 1000000007,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "String matching asks us to locate all starting indices in a text T where a pattern P occurs.",
    primarySnapshot: {
      kind: "array",
      name: "text",
      mode: "box",
      elements: [
        { id: "t0", value: "a", label: "[0]", state: "default" },
        { id: "t1", value: "b", label: "[1]", state: "default" },
        { id: "t2", value: "r", label: "[2]", state: "default" },
        { id: "t3", value: "a", label: "[3]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Naive pattern matching compares M characters at each of the (N - M + 1) alignments, taking O(N · M) time.",
    primarySnapshot: {
      kind: "array",
      name: "naive_matching",
      mode: "box",
      elements: [
        { id: "t0", value: "a", label: "[0]", state: "compare", pointers: ["p[0]"] },
        { id: "t1", value: "b", label: "[1]", state: "compare", pointers: ["p[1]"] },
        { id: "t2", value: "r", label: "[2]", state: "compare", pointers: ["p[2]"] },
        { id: "t3", value: "a", label: "[3]", state: "compare", pointers: ["p[3]"] },
      ],
    },
  },
  {
    narrative:
      "Polynomial Rolling Hash converts strings into integer hash values, enabling O(1) constant-time substring comparisons.",
    primarySnapshot: {
      kind: "hashtable",
      name: "hash_concept",
      buckets: [
        { index: 0, entries: [{ key: '"abra"', value: "hash = 105672", state: "sorted" }] },
      ],
    },
  },
  {
    narrative:
      "The polynomial hash formula encodes string S as H = sum(S[k] · p^(len - 1 - k)) mod M, using a prime base p and modulus M.",
    primarySnapshot: {
      kind: "array",
      name: "formula_terms",
      mode: "box",
      elements: [
        { id: "p1", value: 31, label: "Base p = 31", state: "sorted" },
        { id: "p2", value: 1000000007, label: "Mod = 10^9 + 7", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "We precompute a prefix hash array h in linear O(N) time, where h[i] holds the rolling hash of prefix T[0..i-1].",
    primarySnapshot: {
      kind: "array",
      name: "prefix_hashes",
      mode: "box",
      elements: [
        { id: "h0", value: 0, label: "h[0]=0", state: "visited" },
        { id: "h1", value: 1, label: "h[1]=1", state: "visited" },
        { id: "h2", value: 33, label: "h[2]=33", state: "visited" },
        { id: "h3", value: 1041, label: "h[3]=1041", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Using precomputed prefix hashes, any substring hash hash(T[L..R]) is extracted in O(1) time: (h[R+1] - h[L] · p^(R-L+1)) mod M.",
    primarySnapshot: {
      kind: "array",
      name: "o1_extraction",
      mode: "box",
      elements: [{ id: "e1", value: 105672, label: "Query T[0..3] -> O(1) hash", state: "sorted" }],
    },
  },
  {
    narrative:
      "We compute the integer hash for the query pattern P once in O(M) time before launching the search.",
    primarySnapshot: {
      kind: "hashtable",
      name: "pattern_hash",
      buckets: [
        { index: 0, entries: [{ key: 'pattern "abra"', value: "hash = 105672", state: "active" }] },
      ],
    },
  },
  {
    narrative:
      "Sliding search window: extract O(1) substring hash at index i and compare directly with pattern hash.",
    primarySnapshot: {
      kind: "array",
      name: "sliding_window",
      mode: "box",
      elements: [
        { id: "w0", value: "a", label: "[0]", state: "compare", pointers: ["L"] },
        { id: "w1", value: "b", label: "[1]", state: "compare" },
        { id: "w2", value: "r", label: "[2]", state: "compare" },
        { id: "w3", value: "a", label: "[3]", state: "compare", pointers: ["R"] },
      ],
    },
  },
  {
    narrative:
      "The entire search completes in O(N + M) time with O(N) auxiliary space, scaling to massive text search engines.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N + M)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(N)", state: "sorted" },
      ],
    },
  },
];

export const generateStringHashingSteps = (input: StringHashingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const text =
    input && typeof input.text === "string" && input.text.length > 0
      ? input.text
      : DEFAULT_STRING_HASHING_INPUT.text;
  const pattern =
    input && typeof input.pattern === "string" && input.pattern.length > 0
      ? input.pattern
      : DEFAULT_STRING_HASHING_INPUT.pattern;
  const p =
    input && typeof input.p === "number" && input.p > 0 ? input.p : DEFAULT_STRING_HASHING_INPUT.p!;
  const mod =
    input && typeof input.mod === "number" && input.mod > 0
      ? input.mod
      : DEFAULT_STRING_HASHING_INPUT.mod!;

  const isDefaultInput =
    !input ||
    (input.text === DEFAULT_STRING_HASHING_INPUT.text &&
      input.pattern === DEFAULT_STRING_HASHING_INPUT.pattern);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const n = text.length;
  const m = pattern.length;

  const hashVals = new Array<number>(n + 1).fill(0);
  const powP = new Array<number>(n + 1).fill(1);

  const makeElements = (
    activeWindow?: { l: number; r: number },
    matchIndices: number[] = [],
    highlightIdx?: number,
  ): ArrayElement[] => {
    return text.split("").map((ch, idx) => {
      let state: ElementState = "default";
      const isMatched = matchIndices.some((mIdx) => idx >= mIdx && idx < mIdx + m);
      const isInWindow = activeWindow && idx >= activeWindow.l && idx <= activeWindow.r;

      if (isMatched) {
        state = "sorted";
      } else if (idx === highlightIdx) {
        state = "active";
      } else if (isInWindow) {
        state = "compare";
      }

      return {
        id: `char-${idx}`,
        value: ch.charCodeAt(0),
        state,
        pointers: [ch, `h=${hashVals[idx + 1]}`],
      };
    });
  };

  addStep(
    `Initialize Polynomial Rolling Hash search for text "${text}" (N = ${n}) and pattern "${pattern}" (M = ${m}).`,
    { kind: "array", name: "text", mode: "box", elements: makeElements() },
  );

  if (m > n || m === 0) {
    addStep(
      `Pattern length M = ${m} is invalid for text length N = ${n}. Returning empty matches list [].`,
      { kind: "array", name: "text", mode: "box", elements: makeElements() },
    );
    return steps;
  }

  for (let i = 0; i < n; i++) {
    const charVal = text.charCodeAt(i) - 96;
    const prevH = hashVals[i];
    const newH = (prevH * p + charVal) % mod;
    hashVals[i + 1] = newH;

    const prevPow = powP[i];
    const newPow = (prevPow * p) % mod;
    powP[i + 1] = newPow;

    addStep(
      `Precompute prefix hash h[${i + 1}] for "${text.slice(0, i + 1)}": (${prevH} × ${p} + ${charVal}) mod ${mod} = ${newH}.`,
      { kind: "array", name: "text", mode: "box", elements: makeElements(undefined, [], i) },
    );
  }

  let patternHash = 0;
  for (let j = 0; j < pattern.length; j++) {
    const ch = pattern[j];
    const charVal = ch.charCodeAt(0) - 96;
    patternHash = (patternHash * p + charVal) % mod;
  }

  addStep(`Computed target hash for pattern "${pattern}": patternHash = ${patternHash}.`, {
    kind: "array",
    name: "text",
    mode: "box",
    elements: makeElements(),
  });

  const queryHash = (l: number, r: number): number => {
    return (hashVals[r + 1] - ((hashVals[l] * powP[r - l + 1]) % mod) + mod) % mod;
  };

  const matches: number[] = [];
  for (let i = 0; i <= n - m; i++) {
    const windowHash = queryHash(i, i + m - 1);

    addStep(
      `Extract O(1) hash for window text[${i}..${i + m - 1}] ("${text.slice(i, i + m)}"): hash = ${windowHash}. Target patternHash = ${patternHash}.`,
      {
        kind: "array",
        name: "text",
        mode: "box",
        elements: makeElements({ l: i, r: i + m - 1 }, matches),
      },
    );

    if (windowHash === patternHash) {
      const subStr = text.slice(i, i + m);
      const isExactMatch = subStr === pattern;
      if (isExactMatch) {
        matches.push(i);
        addStep(
          `Match confirmed at index ${i}! Substring "${subStr}" equals pattern "${pattern}". Total matches found so far: ${matches.length}.`,
          {
            kind: "array",
            name: "text",
            mode: "box",
            elements: makeElements({ l: i, r: i + m - 1 }, matches),
          },
        );
      }
    }
  }

  addStep(
    `String hashing search complete! Found ${matches.length} occurrence(s) of "${pattern}" at starting indices: [${matches.join(", ")}].`,
    { kind: "array", name: "text", mode: "box", elements: makeElements(undefined, matches) },
  );

  return steps;
};

export const STRING_HASHING_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Polynomial Rolling Hashing</strong> maps string prefixes to modular integers such that the hash value of any arbitrary substring <code>S[L..R]</code> can be evaluated in <code>O(1)</code> constant time following an initial <code>O(N)</code> linear preprocessing pass.</p>",
  sections: [
    {
      heading: "Core Concept: Polynomial Rolling Hash Formula",
      body: "<p>The prefix hash H[i] for prefix S[0..i-1] is defined as <code>H[i] = ∑ S[k] × p^(i-1-k) mod M</code> where p is a prime base and M is a large prime modulus.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Prefix Hash Table",
      definition:
        "An array H where H[i] stores the polynomial rolling hash of prefix string S[0..i-1].",
    },
  ],
};

export const STRING_HASHING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines function string_hashing_search using Polynomial Rolling Hash for O(N + M) pattern search.",
    2: "Extracts string lengths n (text) and m (pattern).",
    3: "Guards against invalid inputs: pattern longer than text or empty pattern.",
    4: "Returns empty list immediately when no match is possible.",
    5: "Blank line before prefix hash precomputation arrays.",
    6: "Allocates prefix hash table h of size n + 1 initialized to zeros.",
    7: "Allocates prime power table pow_p of size n + 1 initialized to ones.",
    8: "Iterates through each character index i of text string.",
    9: "Converts character text[i] to 1-indexed value (a=1, b=2, ...).",
    10: "Updates prefix hash h[i+1] = (h[i] * p + char_val) % mod.",
    11: "Updates prime power table pow_p[i+1] = (pow_p[i] * p) % mod.",
    12: "Blank line before pattern hash computation.",
    13: "Initializes pattern_hash accumulator to 0.",
    14: "Loops through each character ch in pattern string.",
    15: "Converts pattern character ch to 1-indexed value char_val.",
    16: "Updates pattern_hash accumulator using rolling polynomial formula.",
    17: "Blank line before O(1) query helper definition.",
    18: "Defines helper function query_hash(l, r) for O(1) substring hash queries.",
    19: "Computes (h[r+1] - h[l]*pow_p[r-l+1]) % mod with positive modulo correction.",
    20: "Blank line before sliding window search loop.",
    21: "Initializes matches list to store 0-based starting indices.",
    22: "Iterates through all possible starting window indices i from 0 to n - m.",
    23: "Compares O(1) query_hash(i, i + m - 1) against target pattern_hash.",
    24: "Verifies substring text[i : i + m] == pattern to guard against modulo collisions.",
    25: "Appends valid starting match index i to matches list.",
    26: "Blank line before return statement.",
    27: "Returns list of all verified starting match indices.",
  },
};

export const stringHashing: AlgorithmDefinition<StringHashingInput> = {
  id: "string-hashing",
  title: "Polynomial Rolling String Hashing",
  topicIds: ["tries_and_strings"],
  difficulty: "Medium",
  description:
    "<p>Given a text string and a pattern string, find all starting indices of pattern occurrences using Polynomial Rolling String Hashing.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>text</code>: Primary text string of length N.</li>" +
    "  <li><code>pattern</code>: Target query pattern string of length M.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an array of integers representing 0-based starting indices where the pattern occurs in the text.</p>",
  constraints: ["1 <= text.length <= 1000", "1 <= pattern.length <= text.length"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Find 'abra' in 'abracadabra'",
      input: DEFAULT_STRING_HASHING_INPUT,
      output: "Indices [0, 7]",
      explanation: "Pattern 'abra' matches at index 0 and index 7.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Multiple Overlapping Patterns",
      input: { text: "aabaacaadaabaaba", pattern: "aaba" },
      output: "Indices [0, 9, 12]",
      explanation: "Pattern 'aaba' matches at indices 0, 9, and 12.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "No Match Present",
      input: { text: "hello world", pattern: "xyz" },
      output: "Indices []",
      explanation: "Pattern 'xyz' does not occur in text.",
    },
  ],
  code: PYTHON_STRING_HASHING_CODE,
  timeComplexity: {
    best: "O(N + M)",
    average: "O(N + M)",
    worst: "O(N + M)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) to compute prefix hashes and O(1) for each of the N - M + 1 substring comparisons.",
    space: "Requires O(N) space for prefix hash array and powers array.",
  },
  topicGuide: STRING_HASHING_TOPIC_GUIDE,
  trivia: STRING_HASHING_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 26,
      label: "Competitive Programmer's Handbook, Ch 26",
    },
  ],
  defaultInput: DEFAULT_STRING_HASHING_INPUT,
  generateSteps: generateStringHashingSteps,
};

export default stringHashing;
