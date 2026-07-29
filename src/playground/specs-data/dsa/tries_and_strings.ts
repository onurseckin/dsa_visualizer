import { cases, defineDsaExecution, extraCases, input } from "./helpers";

export const triesAndStringsExecutions = [
  defineDsaExecution({
    id: "trie-prefix-tree",
    entrypoint: "Trie",
    invocation: {
      kind: "class-method",
      constructor: [],
      setup: [
        { method: "insert", arguments: [input("word1")] },
        { method: "insert", arguments: [input("word2")] },
      ],
      method: "startsWith",
      arguments: [input("prefix")],
    },
    cases: cases(
      {
        label: "Shared prefix",
        input: { word1: "cat", word2: "car", prefix: "ca" },
        expected: true,
      },
      {
        label: "Empty prefix",
        input: { word1: "", word2: "a", prefix: "" },
        expected: true,
      },
      {
        label: "Missing branch",
        input: { word1: "apple", word2: "app", prefix: "apr" },
        expected: false,
      },
    ),
    audit: {
      signature: "Trie().insert(word); Trie().startsWith(prefix) -> bool",
      defaultInputShape: "{ wordsToInsert: string[]; searchWord: string; prefixToSearch: string }",
      argumentMapping: ["setup insert($.word1)", "setup insert($.word2)", "prefix <- $.prefix"],
      mutation: "Setup inserts mutate the Trie instance.",
      returnBehavior: "Returns whether the authored prefix is present after insertion.",
    },
  }),
  defineDsaExecution({
    id: "z-algorithm",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findMatches",
      arguments: [input("text"), input("pattern")],
    },
    cases: [
      ...cases(
        {
          label: "Overlapping matches",
          input: { text: "babab", pattern: "bab" },
          expected: [0, 2],
        },
        { label: "No match", input: { text: "azbazbaz", pattern: "zz" }, expected: [] },
        { label: "Single character", input: { text: "a", pattern: "a" }, expected: [0] },
      ),
      ...extraCases(
        { label: "Empty text", input: { text: "", pattern: "a" }, expected: [] },
        { label: "Empty pattern", input: { text: "abc", pattern: "" }, expected: [0, 1, 2, 3] },
        {
          label: "Pattern is text",
          input: { text: "zalgorithm", pattern: "zalgorithm" },
          expected: [0],
        },
        {
          label: "Repeated character matches",
          input: { text: "aaaaa", pattern: "aa" },
          expected: [0, 1, 2, 3],
        },
        {
          label: "Pattern longer than text",
          input: { text: "abc", pattern: "abcd" },
          expected: [],
        },
      ),
    ],
    audit: {
      signature: "Solution().findMatches(text: str, pattern: str) -> list[int]",
      defaultInputShape: "{ text: string; pattern: string }",
      argumentMapping: ["text <- $.text", "pattern <- $.pattern"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns all matching start indices, including overlaps.",
    },
  }),
  defineDsaExecution({
    id: "kmp-string-match",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "strStr",
      arguments: [input("haystack"), input("needle")],
    },
    cases: cases(
      { label: "Match at start", input: { haystack: "sadbutsad", needle: "sad" }, expected: 0 },
      { label: "No match", input: { haystack: "leetcode", needle: "leeto" }, expected: -1 },
      { label: "Match in middle", input: { haystack: "hello", needle: "ll" }, expected: 2 },
    ),
    audit: {
      signature: "Solution().strStr(haystack: str, needle: str) -> int",
      defaultInputShape: "{ haystack: string; needle: string }",
      argumentMapping: ["haystack <- $.haystack", "needle <- $.needle"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns first occurrence index.",
    },
  }),
  defineDsaExecution({
    id: "string-hashing",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findMatches",
      arguments: [input("text"), input("pattern"), input("p"), input("mod")],
    },
    cases: [
      ...cases(
        {
          label: "Two matches",
          input: { text: "abracadabra", pattern: "abra", p: 31, mod: 1_000_000_007 },
          expected: [0, 7],
        },
        {
          label: "No match",
          input: { text: "abcd", pattern: "ef", p: 31, mod: 1_000_000_007 },
          expected: [],
        },
        {
          label: "Overlapping matches",
          input: { text: "aaaa", pattern: "aa", p: 31, mod: 1_000_000_007 },
          expected: [0, 1, 2],
        },
      ),
      ...extraCases(
        {
          label: "Empty text",
          input: { text: "", pattern: "a", p: 31, mod: 1_000_000_007 },
          expected: [],
        },
        {
          label: "Pattern equals text",
          input: { text: "hash", pattern: "hash", p: 31, mod: 1_000_000_007 },
          expected: [0],
        },
        {
          label: "Pattern longer than text",
          input: { text: "hi", pattern: "long", p: 31, mod: 1_000_000_007 },
          expected: [],
        },
        {
          label: "Empty pattern",
          input: { text: "abc", pattern: "", p: 31, mod: 1_000_000_007 },
          expected: [0, 1, 2, 3],
        },
        {
          label: "Small modulus with verification",
          input: { text: "abcabc", pattern: "abc", p: 5, mod: 7 },
          expected: [0, 3],
        },
      ),
    ],
    audit: {
      signature:
        "Solution().findMatches(text: str, pattern: str, base: int, mod: int) -> list[int]",
      defaultInputShape: "{ text: string; pattern: string; p: number; mod: number }",
      argumentMapping: ["text <- $.text", "pattern <- $.pattern", "base <- $.p", "mod <- $.mod"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns every matching start index using a verified rolling hash.",
    },
  }),
  defineDsaExecution({
    id: "aho-corasick",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findMatches",
      arguments: [input("text"), input("patterns")],
    },
    cases: [
      ...cases(
        {
          label: "Shared suffix matches",
          input: { text: "ushers", patterns: ["he", "she", "his", "hers"] },
          expected: ["he", "she", "hers"],
        },
        {
          label: "No pattern occurs",
          input: { text: "xyz", patterns: ["ab", "bc"] },
          expected: [],
        },
        {
          label: "Overlapping prefixes",
          input: { text: "aaaa", patterns: ["a", "aa", "aaa"] },
          expected: ["a", "aa", "aaa"],
        },
      ),
      ...extraCases(
        { label: "Empty text", input: { text: "", patterns: ["a"] }, expected: [] },
        {
          label: "Pattern equals text",
          input: { text: "needle", patterns: ["needle"] },
          expected: ["needle"],
        },
        {
          label: "Failure-link fallback",
          input: { text: "abccab", patterns: ["abc", "bcc", "cab", "ccc"] },
          expected: ["abc", "bcc", "cab"],
        },
        {
          label: "Input order is preserved",
          input: { text: "mississippi", patterns: ["ppi", "iss", "sip", "xyz"] },
          expected: ["ppi", "iss", "sip"],
        },
        {
          label: "Repeated dictionary entry",
          input: { text: "banana", patterns: ["ana", "ana", "na"] },
          expected: ["ana", "ana", "na"],
        },
      ),
    ],
    audit: {
      signature: "Solution().findMatches(text: str, patterns: list[str]) -> list[str]",
      defaultInputShape: "{ text: string; patterns: string[] }",
      argumentMapping: ["text <- $.text", "patterns <- $.patterns"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns every dictionary pattern that occurs in text, in input order.",
    },
  }),
  defineDsaExecution({
    id: "bitwise-trie-xor",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findMaximumXOR",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Classic maximum pair", input: [3, 10, 5, 25, 2, 8], expected: 28 },
        {
          label: "Larger mixed set",
          input: [14, 70, 53, 83, 49, 91, 36, 80, 92, 51],
          expected: 127,
        },
        { label: "Two values", input: [8, 10], expected: 2 },
      ),
      ...extraCases(
        { label: "Single value", input: [0], expected: 0 },
        { label: "Equal values", input: [7, 7, 7], expected: 0 },
        { label: "Zero and all set bits", input: [0, 1023], expected: 1023 },
        { label: "High differing bit", input: [1 << 30, 0, 5], expected: (1 << 30) | 5 },
        { label: "Greedy branch choice", input: [2, 4, 8, 16], expected: 24 },
      ),
    ],
    audit: {
      signature: "Solution().findMaximumXOR(nums: list[int]) -> int",
      defaultInputShape: "number[]",
      argumentMapping: ["nums <- $"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns maximum XOR of any two elements.",
    },
  }),
  defineDsaExecution({
    id: "manacher-algorithm",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "longestPalindrome",
      arguments: [input()],
    },
    cases: cases(
      { label: "String 'babad'", input: "babad", expected: "bab" },
      { label: "String 'cbbd'", input: "cbbd", expected: "bb" },
      { label: "Single char 'a'", input: "a", expected: "a" },
    ),
    audit: {
      signature: "Solution().longestPalindrome(s: str) -> str",
      defaultInputShape: "string",
      argumentMapping: ["s <- $"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns longest palindromic substring.",
    },
  }),
  defineDsaExecution({
    id: "suffix-array-lcp",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "longestDupSubstring",
      arguments: [input()],
    },
    cases: cases(
      { label: "String 'banana'", input: "banana", expected: "anana" },
      { label: "String 'abcd'", input: "abcd", expected: "" },
      {
        label: "String 'nnpxouomcofdjuujloanjimymadkuepightrfodmauhrsy'",
        input: "nnpxouomcofdjuujloanjimymadkuepightrfodmauhrsy",
        expected: "a",
      },
    ),
    audit: {
      signature: "Solution().longestDupSubstring(s: str) -> str",
      defaultInputShape: "string",
      argumentMapping: ["s <- $"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns longest substring that appears at least twice.",
    },
  }),
];
