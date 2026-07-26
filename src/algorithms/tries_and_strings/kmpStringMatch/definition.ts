import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { KMP_CODE } from "./pythonCode";
import { generateKmpSteps, type KmpInput } from "./stepGenerator";

export const DEFAULT_KMP_INPUT: KmpInput = {
  text: "ABABDABACDABABCABAB",
  pattern: "ABABCABAB",
};

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
  category: "tries_and_strings",
  difficulty: "Hard",
  description:
    "Knuth-Morris-Pratt (KMP) finds a pattern in a text in linear O(n + m) time. It first preprocesses the pattern into a Longest Prefix Suffix (LPS) table, which records how the pattern overlaps with itself; on a mismatch, that table says exactly where to resume — so the text pointer never moves backwards and no comparison is repeated.",
  constraints: [
    "1 <= text.length <= 10^5",
    "1 <= pattern.length <= 10^4",
    "Strings consist of printable ASCII characters",
  ],
  examples: [
    {
      input: 'text = "ABABDABACDABABCABAB", pattern = "ABABCABAB"',
      output: "Match at index 10",
      explanation:
        "Precomputed LPS table allows skipping backward text comparisons during partial mismatches.",
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
      "Knuth-Morris-Pratt is the classic answer to a nagging inefficiency in naive string search: when a partial match fails, the naive loop throws away everything it just learned and restarts one character later in the text. KMP observes that the characters you already matched are pattern characters, so the pattern itself can tell you how far to jump without ever re-reading text. All of that knowledge is packed into one small table of self-overlaps computed before the search begins. Learning KMP is really learning to precompute the structure of your query so that failures become informative instead of wasteful.",
    sections: [
      {
        heading: "The core idea: a failure should teach you something",
        body: 'Suppose you are hunting for "ABABCABAB" and you have matched the first four characters, "ABAB", when the fifth comparison fails. The naive reaction is to shift the pattern one step and start over from its first character, re-examining text you have already read. But you know exactly what those four text characters were, because they equalled pattern characters, and you can see that the pattern begins with "AB" and the matched region ends with "AB". So instead of restarting at zero you may resume as though two characters were already matched, sliding the pattern forward by two while the text pointer stays exactly where it is. The whole algorithm is that one observation applied systematically, with the shifts worked out ahead of time.',
      },
      {
        heading: "The LPS table: the pattern describing itself",
        body: 'LPS stands for longest prefix that is also a suffix, and lps[k] holds the length of the longest proper prefix of the first k+1 pattern characters which is also a suffix of that same slice. The word proper matters: the whole slice does not count, otherwise every entry would be trivially its own length. For "ABABCABAB" the table reads 0, 0, 1, 2, 0, 1, 2, 3, 4, and that final 4 says the pattern ends with the same four characters it starts with. Building the table uses the same fallback logic as the search, comparing the pattern against a shifted copy of itself and, on a mismatch, dropping the candidate length to lps[length - 1] rather than to zero. That self-application is why the preprocessing loop looks confusingly similar to the matching loop, and reading them side by side is the fastest way to make both click.',
      },
      {
        heading: "How the search loop uses it",
        body: "Two pointers walk forward: t_idx into the text and p_idx into the pattern. On a character match both advance, and if p_idx reaches the pattern length you record a match and then set p_idx to lps[m - 1], which lets a later occurrence overlap the one you just found. On a mismatch with p_idx already past zero, you set p_idx to lps[p_idx - 1] and leave t_idx untouched, which is the jump the table earned you. Only when p_idx is already zero, meaning nothing is matched and there is nothing to fall back on, does t_idx move forward by one. The crucial property to notice is that t_idx never decreases, so each text character is looked at a bounded number of times no matter how adversarial the input.",
      },
      {
        heading: "Why it is correct: the invariant on the two pointers",
        body: "The invariant is that the first p_idx characters of the pattern always equal the p_idx text characters immediately preceding t_idx. Advancing on a match extends that agreement by one character on both sides, so the invariant survives. Falling back to lps[p_idx - 1] also preserves it, because that value is by definition the length of a prefix which is also a suffix of the region you had matched, so the shorter prefix still lines up with the text ending at t_idx. What justifies the skipping is the other half of the argument: any alignment between the old one and the new one would need a longer prefix-suffix overlap than the table records, and the table records the longest one, so those alignments cannot possibly produce a match. Nothing is lost by leaping over them, which is why KMP is exact and not heuristic.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: 'The most common bug is indexing the table with p_idx instead of p_idx - 1, which silently shifts every fallback by one and produces missed matches on repetitive patterns. The second is forgetting that the prefix must be proper when building the table, which makes every entry equal to its index and turns the search into nonsense. After a full match, resetting p_idx to zero rather than lps[m - 1] still finds non-overlapping matches but quietly loses overlapping ones, so searching "AAA" for "AA" reports one occurrence instead of two. Guard the degenerate inputs up front, since an empty pattern, an empty text, or a pattern longer than the text has no meaningful match to report. Finally, test with patterns like "AAAA" and "ABABAB" rather than "ABCDE", because a pattern with no self-overlap exercises none of the interesting logic.',
      },
      {
        heading: "When to use it and how it generalizes",
        body: "For everyday single-pattern search in application code, your language built-in is usually fine and often faster in practice thanks to Boyer-Moore-style skipping, which can leap by many characters on mismatch instead of just realigning. KMP earns its place when you need guaranteed linear behaviour with no bad case, when you are streaming text and cannot back up over it, or when you need the LPS table itself. That table is a result in its own right: it reveals the smallest period of a string, tells you the minimum characters to append to make a string a full repetition, and answers longest-border questions. The same fallback idea scales up to Aho-Corasick, which builds failure links across a trie of many patterns, and the Z-algorithm solves the same matching problem from the self-similarity direction instead.",
      },
    ],
    keyTerms: [
      {
        term: "LPS table",
        definition:
          "One integer per pattern character recording the longest proper prefix of that slice which is also its suffix. It is the entire preprocessing output and drives every fallback during the search.",
      },
      {
        term: "Proper prefix",
        definition:
          "A beginning slice of a string that stops short of the whole string. The restriction is what keeps LPS entries meaningful rather than trivially maximal.",
      },
      {
        term: "Border",
        definition:
          'A string that is simultaneously a prefix and a suffix of another string, for example "AB" in "ABAB". LPS values are precisely the lengths of longest borders.',
      },
      {
        term: "Fallback",
        definition:
          "Reducing the pattern pointer to lps of the previous position after a mismatch instead of restarting at zero. It is the move that preserves already-earned matching while shifting the pattern forward.",
      },
      {
        term: "Overlapping matches",
        definition:
          'Occurrences of the pattern that share text characters, such as the two copies of "AA" in "AAA". Resuming from lps of the last position after a hit is what lets KMP report them.',
      },
    ],
  },
  trivia: KMP_TRIVIA,
  defaultInput: DEFAULT_KMP_INPUT,
  generateSteps: generateKmpSteps,
};

export default kmpStringMatch;
