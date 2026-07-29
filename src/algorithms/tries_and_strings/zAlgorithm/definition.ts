import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { Z_ALGORITHM_CODE } from "./pythonCode";
import {
  DEFAULT_Z_ALGORITHM_INPUT,
  generateZAlgorithmSteps,
  type ZAlgorithmInput,
} from "./stepGenerator";

export { DEFAULT_Z_ALGORITHM_INPUT };

const Z_ALGORITHM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: find every index in text where pattern occurs, returned as a list of starting positions.",
    2: "Glue the pattern in front of the text with a separator between them, so a single self-similarity scan of s can double as a pattern search.",
    3: "Cache the combined string's length and the pattern's length, both needed repeatedly throughout the scan.",
    4: "Allocate the Z-array, one entry per position in s; z[i] will record how long a copy of s's own prefix starts at position i.",
    5: "The Z-box: the interval of the most recently found match against the prefix, which lets later positions reuse work instead of recomputing it from scratch.",
    6: "Collects the text indices where the pattern was found.",
    7: "Blank line before starting the Z-array main calculation loop.",
    8: "Compute a Z-value for every position except index 0, which trivially matches the whole prefix and carries no useful information.",
    9: "Check whether position i falls inside the window of characters already known to mirror the prefix.",
    10: "Reuse the previously computed Z-value from the mirrored position inside the prefix, capped at how much of the window is left — this is the shortcut that keeps the whole algorithm linear.",
    11: "Extend the match past whatever was reused (or start from scratch if nothing was) by comparing characters directly, one at a time.",
    12: "Each successful comparison extends the known match by one more character.",
    13: "Check whether this position's match reaches further right than anything found before it.",
    14: "Update the window's left edge to this new, farther-reaching match.",
    15: "Update the window's right edge, so later positions inside this new range can reuse today's work.",
    16: "A Z-value exactly equal to the pattern length, found past the pattern-plus-separator portion of s, means the whole pattern reappeared starting here.",
    17: "Convert the combined-string index back into a text index by subtracting the pattern length and the separator character.",
    18: "Hand back every text position where the pattern was found, all discovered in one linear pass over s.",
  },
};

export const zAlgorithm: AlgorithmDefinition<ZAlgorithmInput> = {
  id: "z-algorithm",
  title: "Z-Algorithm String Matching",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description: `<p>Find all occurrences of a pattern in a text string in linear <em>O(N + M)</em> time by constructing <code>S = pattern + '$' + text</code> and computing its Z-array.</p>
<h3>Problem Statement</h3>
<p>Given a text string <code>text</code> of length <em>N</em> and a pattern string <code>pattern</code> of length <em>M</em>, find all starting indices in <code>text</code> where <code>pattern</code> occurs.</p>
<p>The Z-algorithm constructs a combined string <code>S = pattern + '$' + text</code> (where <code>'$'</code> is a sentinel character present in neither string) and computes its Z-array. <code>Z[i]</code> stores the length of the longest substring starting at index <em>i</em> that matches the prefix of <em>S</em>. Any position <em>i &gt; M</em> with <code>Z[i] == M</code> corresponds to a complete match of <code>pattern</code> in <code>text</code> starting at index <em>i - M - 1</em>.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>text</code>: Search text string of length <em>N</em>.</li>
  <li><code>pattern</code>: Target pattern string of length <em>M</em>.</li>
</ul>
<h3>Output</h3>
<p>Returns an array of integers representing the starting 0-based text indices of all pattern matches.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; N &le; 10<sup>5</sup></code>.</li>
  <li><code>1 &le; M &le; 10<sup>4</sup></code>.</li>
  <li>Sentinel character <code>'$'</code> must not appear in either input string.</li>
  <li>Overlapping matches are correctly reported.</li>
</ul>`,
  constraints: [
    "1 <= text.length <= 10^5",
    "1 <= pattern.length <= 10^4",
    "Strings consist of printable ASCII characters",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: 'text = "ababaaba", pattern = "aba"',
      outputDisplay: "[0, 2, 5]",
      title: "Standard Pattern Match Search",
      input: DEFAULT_Z_ALGORITHM_INPUT,
      output: "[0, 2, 5]",
      explanation:
        "Constructs combined string aba$ababaaba and computes Z-array to find pattern matches at indices 0, 2, and 5.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: 'text = "aaaaa", pattern = "aa"',
      outputDisplay: "[0, 1, 2, 3]",
      title: "Adversarial Uniform Overlapping Pattern",
      input: { text: "aaaaa", pattern: "aa" },
      output: "[0, 1, 2, 3]",
      explanation:
        "Overlapping pattern occurrences in uniform text, reusing Z-box right boundaries.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 'text = "abcdef", pattern = "xyz"',
      outputDisplay: "[]",
      title: "Boundary Disjoint No-Match Case",
      input: { text: "abcdef", pattern: "xyz" },
      output: "[]",
      explanation: "No characters match; Z-array remains 0 for all text positions.",
    },
  ],
  code: Z_ALGORITHM_CODE,
  timeComplexity: {
    best: "O(n + m)",
    average: "O(n + m)",
    worst: "O(n + m)",
  },
  spaceComplexity: "O(n + m)",
  complexityAnalysis: {
    time: "The inner while loop looks like it could blow up, but every character comparison it makes either pushes the window's right edge R further right or ends the loop — and R never moves backwards. So the total number of comparisons across the entire run is bounded by the length of S = pattern + '$' + text, making the algorithm O(n + m). There is no bad case: even highly repetitive strings cannot force R to retreat.",
    space:
      "We store the concatenated string S and its Z-array, each about n + m characters long, so extra memory grows linearly with the combined input size — O(n + m).",
  },
  topicGuide: {
    overview:
      "<p>The Z-algorithm computes, for every position of a string, how far the string agrees with itself when you slide a copy of it to that position. The Z-array turns out to answer a surprising range of questions: glue the pattern in front of the text and any position whose Z-value equals the pattern length is an occurrence.</p>",
    sections: [
      {
        heading: "The core idea: measure how a string matches itself",
        body: "<p><code>Z[i]</code> is defined as the length of the longest substring starting at position <em>i</em> that is also a prefix of the whole string. For example, in <code>'aabxaab'</code>, the value at index 4 is 3 because <code>'aab'</code> starts there and matches the prefix.</p>",
      },
      {
        heading: "The concatenation trick with a separator",
        body: "<p>To search for a pattern, build <code>S = pattern + '$' + text</code>, placing the pattern at the prefix. Every index <em>i</em> beyond the separator with <code>Z[i] == pattern.length</code> indicates a full match.</p>",
      },
      {
        heading: "How the mechanism works: the Z-box",
        body: "<p>The algorithm maintains a window <code>[L, R]</code> representing the rightmost substring matching a prefix (the Z-box). When current index <em>i</em> falls within <code>[L, R]</code>, we reuse previously computed <code>Z[i - L]</code> values up to the boundary <code>R - i + 1</code>, avoiding redundant character comparisons.</p>",
      },
      {
        heading: "Why it is correct: the window is a verified copy",
        body: "<p>Because <code>S[L..R]</code> is identical to <code>S[0..R-L]</code>, any prefix match property inside <code>S[L..R]</code> mirrors the front of the string. The right boundary <code>R</code> only advances forward, guaranteeing amortized linear time.</p>",
      },
      {
        heading: "When to use it, and how it compares to KMP",
        body: "<p>Use the Z-algorithm when calculating full self-similarity tables or searching patterns where Z-box maintenance is preferred. KMP uses less memory by avoiding concatenated strings, whereas Z-algorithm is versatile for periodicity and self-similarity queries.</p>",
      },
      {
        heading: "Pitfalls and how it generalizes",
        body: "<p>Common pitfalls include omitting the unique sentinel character or forgetting to offset text match indices by <code>pattern.length + 1</code>. Z-arrays generalize to longest palindromic prefix and string periodicity problems.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Z-array",
        definition:
          "The table where Z[i] is the length of the longest substring starting at index i that also matches the beginning of the string.",
      },
      {
        term: "Z-box",
        definition:
          "The interval from L to R currently known to be an exact copy of the string prefix, allowing earlier answers to be reused.",
      },
      {
        term: "Separator character",
        definition:
          "A sentinel such as '$' placed between pattern and text so no match can straddle the string boundary.",
      },
      {
        term: "Prefix match",
        definition: "An agreement between a substring and the front of the same string.",
      },
    ],
  },
  trivia: Z_ALGORITHM_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 26",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 26,
      section: "26.4 Z-algorithm",
    },
  ],
  defaultInput: DEFAULT_Z_ALGORITHM_INPUT,
  generateSteps: generateZAlgorithmSteps,
};

export default zAlgorithm;
