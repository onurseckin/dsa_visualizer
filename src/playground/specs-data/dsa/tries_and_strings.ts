import { cases, defineDsaExecution, input } from "./helpers";

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
      method: "sumScores",
      arguments: [input()],
    },
    cases: cases(
      { label: "String 'babab'", input: "babab", expected: 9 },
      { label: "String 'azbazbaz'", input: "azbazbaz", expected: 14 },
      { label: "Single char 'a'", input: "a", expected: 1 },
    ),
    audit: {
      signature: "Solution().sumScores(s: str) -> int",
      defaultInputShape: "string",
      argumentMapping: ["s <- $"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns sum of Z-box scores.",
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
      method: "shortestPalindrome",
      arguments: [input()],
    },
    cases: cases(
      { label: "String 'aacecaaa'", input: "aacecaaa", expected: "aaacecaaa" },
      { label: "String 'abcd'", input: "abcd", expected: "dcbabcd" },
      { label: "Empty string", input: "", expected: "" },
    ),
    audit: {
      signature: "Solution().shortestPalindrome(s: str) -> str",
      defaultInputShape: "string",
      argumentMapping: ["s <- $"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns shortest palindrome.",
    },
  }),
  defineDsaExecution({
    id: "aho-corasick",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findWords",
      arguments: [input("board"), input("words")],
    },
    cases: cases(
      {
        label: "Standard word search",
        input: {
          board: [
            ["o", "a", "a", "n"],
            ["e", "t", "a", "e"],
            ["i", "h", "k", "r"],
            ["i", "f", "l", "v"],
          ],
          words: ["oath", "pea", "eat", "rain"],
        },
        expected: ["eat", "oath"],
        comparison: "unordered",
      },
      {
        label: "No words found",
        input: {
          board: [
            ["a", "b"],
            ["c", "d"],
          ],
          words: ["abcb"],
        },
        expected: [],
      },
      {
        label: "Single cell",
        input: {
          board: [["a"]],
          words: ["a"],
        },
        expected: ["a"],
      },
    ),
    audit: {
      signature: "Solution().findWords(board: list[list[str]], words: list[str]) -> list[str]",
      defaultInputShape: "{ board: string[][]; words: string[] }",
      argumentMapping: ["board <- $.board", "words <- $.words"],
      mutation: "Board is temporarily mutated during DFS, restored after.",
      returnBehavior: "Returns all words found in the board.",
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
    cases: cases(
      { label: "Array [3,10,5,25,2,8]", input: [3, 10, 5, 25, 2, 8], expected: 28 },
      {
        label: "Array [14,70,53,83,49,91,36,80,92,51]",
        input: [14, 70, 53, 83, 49, 91, 36, 80, 92, 51],
        expected: 127,
      },
      { label: "Array [8,10]", input: [8, 10], expected: 2 },
    ),
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
