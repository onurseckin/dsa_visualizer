import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { Z_ALGORITHM_CODE } from "./pythonCode";
import { generateZAlgorithmSteps, type ZAlgorithmInput } from "./stepGenerator";

export const DEFAULT_Z_ALGORITHM_INPUT: ZAlgorithmInput = {
  text: "ababaaba",
  pattern: "aba",
};

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
  category: "tries_and_strings",
  categories: ["tries_and_strings"],
  difficulty: "Hard",
  description:
    "Find all occurrences of a pattern in a text string in linear $O(N + M)$ time by constructing $S = \\text{pattern} + \\text{'$'} + \\text{text}$ and computing its Z-array.\n\n### Problem Statement\nGiven a text string `text` of length $N$ and a pattern string `pattern` of length $M$, find all starting indices in `text` where `pattern` occurs.\n\nThe Z-algorithm constructs a combined string $S = \\text{pattern} + \\text{'$'} + \\text{text}$ (where `'$'` is a unique sentinel character present in neither string) and computes the Z-array $Z$. $Z[i]$ stores the length of the longest substring starting at index $i$ that matches the prefix of $S$. Any position $i > M$ with $Z[i] == M$ corresponds to a complete match of `pattern` in `text` starting at index $i - M - 1$.\n\n### Input Parameters\n- `text`: Search text string of length $N$.\n- `pattern`: Target pattern string of length $M$.\n\n### Output\n- Returns an array of integers representing the starting 0-based text indices of all pattern matches.\n\n### Constraints & Edge Cases\n- `1 <= N <= 10^5`.\n- `1 <= M <= 10^4`.\n- Sentinel character `'$'` must not appear in either input string.\n- Overlapping matches (e.g. `text = \"aaaaa\", pattern = \"aa\"`): Correctly reported at `[0, 1, 2, 3]`.",
  constraints: [
    "1 <= text.length <= 10^5",
    "1 <= pattern.length <= 10^4",
    "Strings consist of printable ASCII characters",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: 's = "aabxaab"',
      outputDisplay: "[0, 1, 0, 0, 3, 1, 0]",
      title: "Basic Example",
      input: { text: "ababaaba", pattern: "aba" },
      output: "[0, 2, 5]",
      explanation:
        "Constructs combined string aba$ababaaba and computes Z-array to find pattern matches at indices 0, 2, and 5.",
    },
    {
      kind: "complex",
      inputDisplay: 's = "aaaaa"',
      outputDisplay: "[0, 4, 3, 2, 1]",
      title: "Complex Edge Case",
      input: { text: "aaaaa", pattern: "aa" },
      output: "[0, 1, 2, 3]",
      explanation:
        "Overlapping pattern occurrences in uniform text, reusing Z-box right boundaries.",
    },
    {
      kind: "negative",
      inputDisplay: 's = "abcdef"',
      outputDisplay: "[0, 0, 0, 0, 0, 0]",
      title: "Failing / Boundary Case",
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
      "The Z-algorithm computes, for every position of a string, how far the string agrees with itself when you slide a copy of it to that position. That single table, the Z-array, turns out to answer a surprising range of questions, and pattern matching is only the most famous one: glue the pattern in front of the text and any position whose Z-value equals the pattern length is an occurrence. What makes it worth learning is the reuse trick at its heart, where already-computed answers let you skip comparisons instead of redoing them. Once you can read a Z-array you have a general-purpose tool for periodicity, repeated substrings, and self-similarity.",
    sections: [
      {
        heading: "The core idea: measure how a string matches itself",
        body: 'Z[i] is defined as the length of the longest substring starting at position i that is also a prefix of the whole string. For "aabxaab" the value at index 4 is 3, because "aab" starts there and "aab" is also the beginning of the string. Position 0 is a degenerate case since the whole string trivially matches its own prefix, so it is left as zero and skipped. The reason this definition is powerful is that a prefix match is exactly what a pattern search is looking for, provided the pattern is the prefix. So the algorithm never mentions patterns or texts internally; it only ever compares a string against its own front.',
      },
      {
        heading: "The concatenation trick with a separator",
        body: 'To search for a pattern you build S = pattern + "$" + text, which makes the pattern the prefix of S and puts the text where the Z-array can be read off. Every index i beyond the separator whose Z-value equals the pattern length marks a full occurrence, and subtracting the pattern length plus one for the separator converts that index back into a text index. The separator must be a character that appears in neither the pattern nor the text, and that requirement is not cosmetic: without it a match could run past the end of the pattern into the text, producing Z-values larger than the pattern length and blurring where matches start. With "aba" and "ababaaba" the combined string is "aba$ababaaba" and the Z-values reach 3 at combined indices 4 and 9, which map to text indices 0 and 5.',
      },
      {
        heading: "How the mechanism works: the Z-box",
        body: "The algorithm carries a window written as l and r, the interval of the most recently discovered match with the prefix, often called the Z-box. When the next index i lies inside that window, the characters from i to r are known to be a copy of characters from i - l onward in the prefix, so the previously computed Z[i - l] already describes what happens there and can be copied instead of recomputed. That copy is capped at r - i + 1 because beyond r nothing has been verified yet, and only that unverified tail is explored with an explicit character-by-character while loop. When i falls outside the window there is nothing to reuse, so the comparison starts from scratch at zero. Whenever the extension reaches further right than r, the window slides forward to the new match, keeping l and r as the freshest evidence available.",
      },
      {
        heading: "Why it is correct: the window is a verified copy",
        body: "The invariant is that the segment from l to r has already been confirmed equal to the prefix of the same length, so anything you deduce inside the window is a statement about the prefix restated in a different place. Copying Z[i - l] is therefore sound rather than a guess, because the inner substring and its mirror in the prefix are literally the same characters. The cap at r - i + 1 keeps you honest: past r nothing has been verified, so the algorithm never claims a match it has not either seen or inherited, and the while loop resumes real comparisons exactly at the first uncertain character. The second half of the invariant is that r only ever moves right, which is why the algorithm never revisits a character it has already consumed while extending. That combination, verified copies inside the window and fresh comparisons only past its edge, is what makes the single pass both correct and non-redundant.",
      },
      {
        heading: "When to use it, and how it compares to KMP",
        body: "Reach for the Z-algorithm when you want a general self-similarity table, when you find its case analysis easier to remember than the failure-function recurrence, or when the same table will answer several questions about one string. KMP solves the same matching problem in the same linear time and uses less memory because it never builds the concatenated string, so for plain single-pattern search in a huge text KMP or a language built-in is usually the better engineering choice. If you need to match many patterns at once, neither one is right and you should build an Aho-Corasick automaton; if you want randomized simplicity, rolling hashes are shorter to write but carry a collision risk. The Z-array shines when the question is about the string itself rather than about a search.",
      },
      {
        heading: "Pitfalls and how it generalizes",
        body: "The mistakes cluster in a few places: forgetting the separator, choosing a separator that occurs in the input, starting the loop at 0 instead of 1, and writing the window update as an assignment to r without the guard that only extends it rightward. Another subtle one is reporting matches without checking that the index sits past the pattern portion of S, which lets self-matches inside the pattern masquerade as text matches. Once you are comfortable, the same table answers much more. Running the Z-algorithm on a string and its reverse gives you the tools for longest palindromic prefix questions, the value pattern reveals the smallest period of a string, and Z-values combined across concatenations count distinct substrings or find the longest common prefix between suffixes. Every one of these reuses a single idea: a table of self-agreements can substitute for a great many direct comparisons.",
      },
    ],
    keyTerms: [
      {
        term: "Z-array",
        definition:
          "The table where Z[i] is the length of the longest substring starting at index i that also matches the beginning of the string. It is the only output the core algorithm produces; matches are read off it afterwards.",
      },
      {
        term: "Z-box",
        definition:
          "The interval from l to r that is currently known to be a copy of the string prefix. It is the memory that lets the algorithm reuse earlier answers instead of comparing characters again.",
      },
      {
        term: "Separator character",
        definition:
          'A sentinel such as "$" placed between the pattern and the text so no match can straddle the boundary. It must not appear in either input or the match detection breaks.',
      },
      {
        term: "Prefix match",
        definition:
          "An agreement between a substring and the front of the same string. The Z-algorithm turns pattern searching into prefix matching by making the pattern the front of the combined string.",
      },
      {
        term: "Period of a string",
        definition:
          'The smallest shift that maps a string onto itself, for example 2 in "ababab". Reading the Z-array reveals it directly, which is why the table is useful well beyond searching.',
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
