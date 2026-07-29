import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { KMP_CODE } from "./pythonCode";
import { DEFAULT_KMP_INPUT, generateKmpSteps, type KmpInput } from "./stepGenerator";

export { DEFAULT_KMP_INPUT };

const KMP_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: search for every occurrence of pattern inside text and return their starting indices.",
    2: "Cache both lengths up front since they are used repeatedly in both the preprocessing and matching loops.",
    3: "Guard against degenerate inputs: an empty pattern, an empty text, or a pattern that can't possibly fit inside a shorter text.",
    4: "No match is possible in any of those cases, so bail out immediately with an empty result.",
    5: "Allocate the Longest-Prefix-Suffix table, one entry per pattern character, which will record how much of the pattern's own start echoes just before each position.",
    6: "Tracks the length of the current matching prefix-suffix while building the LPS table; it starts at zero since no overlap has been found yet.",
    7: "The LPS table always starts scanning from index 1, since lps[0] is trivially 0 — a single character can't be a proper prefix of itself.",
    8: "Walk through the rest of the pattern to fill in every remaining LPS entry.",
    9: "Check whether extending the current prefix-suffix match by one more character still works, by comparing the next pattern character against the one right after the matched prefix.",
    10: "The match grew by one character, so record the longer overlap length.",
    11: "Store that new, extended prefix-suffix length as the answer for position i.",
    12: "Move on to the next pattern position now that this one is resolved.",
    13: "The characters didn't match, but we had a partial overlap going — rather than giving up entirely, fall back to a shorter overlap that might still work.",
    14: "Shrink to the next-best candidate overlap length, already computed for an earlier position — this is the same self-referential trick the search phase uses later.",
    15: "Neither did the characters match, nor was there any overlap left to fall back on.",
    16: "Record that nothing before this position echoes the pattern's start.",
    17: "With length already at zero there is nothing more to try here, so advance to the next position.",
    18: "Two independent pointers for the matching phase: one into the pattern, one into the text — both start at the beginning.",
    19: "Collects the starting index of every match found in the text.",
    20: "Scan through the text exactly once; the text pointer only ever moves forward, never backward.",
    21: "Compare the current pattern character against the current text character.",
    22: "On a match, advance the pattern pointer — one more character of the pattern has now been confirmed present in the text.",
    23: "Also advance the text pointer, since this text character has been consumed by the match.",
    24: "Check whether the pattern pointer has walked all the way past the end of the pattern, meaning a full match just completed.",
    25: "Record where that match started: subtract the pattern's length from the current text position.",
    26: "Instead of resetting to zero, fall back using the LPS table so overlapping occurrences of the pattern can still be found.",
    27: "A mismatch happened partway through a potential match (and we haven't already handled it above as a full match).",
    28: "If some characters were already matched, we don't have to restart from scratch.",
    29: "Use the LPS table to jump the pattern pointer back to the next-best position to resume from, without ever moving the text pointer backward.",
    30: "There was nothing matched yet when the mismatch occurred — the pattern pointer is already at zero.",
    31: "With no partial match to fall back on, the only option is to try the next text character.",
    32: "Hand back every match position found in this single linear pass over the text.",
  },
};

export const kmpStringMatch: AlgorithmDefinition<KmpInput> = {
  id: "kmp-string-match",
  title: "KMP String Matching",
  topicIds: ["tries_and_strings"],
  difficulty: "Hard",
  description: `<p>Find all starting index occurrences of a pattern string in a text string in linear <em>O(N + M)</em> time using the Knuth-Morris-Pratt (KMP) algorithm.</p>
<h3>Problem Statement</h3>
<p>Given a text string <code>text</code> of length <em>N</em> and a pattern string <code>pattern</code> of length <em>M</em>, find all starting indices in <code>text</code> where <code>pattern</code> appears as a contiguous substring.</p>
<p>The KMP algorithm preprocesses <code>pattern</code> into a Longest Prefix Suffix (LPS) array in <em>O(M)</em> time. The LPS table <code>lps[i]</code> stores the length of the longest proper prefix of <code>pattern[0..i]</code> that is also a suffix of <code>pattern[0..i]</code>. During text scanning, when a mismatch occurs, the text pointer never moves backward; instead, the pattern pointer falls back to <code>lps[j-1]</code>, guaranteeing linear <em>O(N + M)</em> execution.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>text</code>: Search text string of length <em>N</em>.</li>
  <li><code>pattern</code>: Target pattern string of length <em>M</em>.</li>
</ul>
<h3>Output</h3>
<p>Returns an array of integer indices representing all 0-based starting positions of <code>pattern</code> in <code>text</code>.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; N &le; 10<sup>5</sup></code>.</li>
  <li><code>1 &le; M &le; 10<sup>4</sup></code>.</li>
  <li>Strings contain ASCII printable characters.</li>
  <li>Pattern longer than text (<em>M &gt; N</em>): Returns empty array <code>[]</code>.</li>
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
      inputDisplay: 'text = "ABABDABACDABABCABAB", pattern = "ABABCABAB"',
      outputDisplay: "10",
      title: "Basic Example",
      input: { text: "ABABDABACDABABCABAB", pattern: "ABABCABAB" },
      output: "[10]",
      explanation:
        "Precomputed LPS table allows skipping backward text comparisons during partial mismatches.",
    },
    {
      kind: "complex",
      inputDisplay: 'text = "AAAAABAAABA", pattern = "AAAA"',
      outputDisplay: "0",
      title: "Complex Edge Case",
      input: { text: "AABAACAADAABAABA", pattern: "AABA" },
      output: "[0, 9, 12]",
      explanation:
        "Pattern appears at multiple indices including overlapping positions, efficiently using LPS fallback transitions.",
    },
    {
      kind: "negative",
      inputDisplay: 'text = "ABCDEFG", pattern = "XYZ"',
      outputDisplay: "-1",
      title: "Failing / Boundary Case",
      input: { text: "AAAAABAAAAA", pattern: "AAAAAC" },
      output: "[]",
      explanation:
        "Long prefix match fails at character 'C', returning no matches after skipping unnecessary re-checks.",
    },
  ],
  code: KMP_CODE,
  timeComplexity: {
    best: "O(n + m)",
    average: "O(n + m)",
    worst: "O(n + m)",
  },
  spaceComplexity: "O(m)",
  complexityAnalysis: {
    time: "There are two linear phases. Building the LPS table scans the pattern once — the fallback step can only give back match length that earlier steps built up, so it totals O(m). The matching phase never moves the text pointer backwards: every comparison either advances it or shrinks the pattern pointer, which only ever grew alongside it, so that phase is O(n). Together that's O(n + m), even in the worst case.",
    space:
      "The only extra structure is the LPS table, one integer per pattern character — O(m). The text itself needs no bookkeeping at all.",
  },
  topicGuide: {
    overview:
      "<p>Knuth-Morris-Pratt avoids the inefficiency of naive string search: when a partial match fails, KMP uses precomputed pattern self-similarity (the LPS table) so the text pointer never backtracks.</p>",
    sections: [
      {
        heading: "The core idea: a failure should teach you something",
        body: "<p>When a mismatch occurs at pattern index <em>j</em>, the previously matched prefix of length <em>j</em> is already known. The LPS table indicates how much of that matched prefix can be repurposed as a starting prefix of the next candidate alignment without re-reading text.</p>",
      },
      {
        heading: "The LPS table: the pattern describing itself",
        body: "<p>LPS stands for <em>Longest Prefix Suffix</em>. <code>lps[k]</code> holds the length of the longest proper prefix of <code>pattern[0..k]</code> that is also a suffix of <code>pattern[0..k]</code>. Proper means the prefix cannot equal the full substring.</p>",
      },
      {
        heading: "How the search loop uses it",
        body: "<p>Two pointers advance: <code>t_idx</code> into text and <code>p_idx</code> into pattern. On a match, both advance. On a mismatch, <code>p_idx</code> falls back to <code>lps[p_idx - 1]</code> while <code>t_idx</code> stays fixed, ensuring linear time complexity.</p>",
      },
      {
        heading: "Why it is correct: the invariant on the two pointers",
        body: "<p>The invariant maintains that <code>pattern[0..p_idx-1]</code> matches <code>text[t_idx-p_idx..t_idx-1]</code>. Falling back to <code>lps[p_idx - 1]</code> preserves this invariant for the longest possible candidate prefix.</p>",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "<p>Common pitfalls include using 1-based indexing for LPS fallback, forgetting proper prefix constraints, or resetting <code>p_idx</code> to 0 instead of <code>lps[m - 1]</code> after a full match (which misses overlapping matches).</p>",
      },
      {
        heading: "When to use it and how it generalizes",
        body: "<p>KMP provides guaranteed <em>O(N + M)</em> linear time for single-pattern matching on non-backtrackable streams. The LPS concept extends to multi-pattern matching via Aho-Corasick failure links.</p>",
      },
    ],
    keyTerms: [
      {
        term: "LPS table",
        definition:
          "Array where lps[i] stores the length of the longest proper prefix of pattern[0..i] that is also a suffix of pattern[0..i].",
      },
      {
        term: "Proper prefix",
        definition: "A prefix of a string that is strictly shorter than the string itself.",
      },
      {
        term: "Fallback",
        definition:
          "Updating the pattern pointer to lps[p_idx - 1] after a mismatch without decrementing the text pointer.",
      },
      {
        term: "Overlapping matches",
        definition: "Pattern occurrences that share characters in the search text.",
      },
    ],
  },
  trivia: KMP_TRIVIA,
  leetcode: {
    id: 28,
    url: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #28",
      leetcodeId: 28,
      url: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 26",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 26,
      section: "26.1 String pattern matching",
    },
  ],
  defaultInput: DEFAULT_KMP_INPUT,
  generateSteps: generateKmpSteps,
};

export default kmpStringMatch;
