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
      method: "starts_with",
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
      signature: "Trie().insert(word); Trie().starts_with(prefix) -> bool",
      defaultInputShape: "{ wordsToInsert: string[]; searchWord: string; prefixToSearch: string }",
      argumentMapping: ["setup insert($.word1)", "setup insert($.word2)", "prefix <- $.prefix"],
      mutation: "Setup inserts mutate the Trie instance.",
      returnBehavior: "Returns whether the authored prefix is present after insertion.",
    },
  }),
  defineDsaExecution({
    id: "z-algorithm",
    entrypoint: "z_algorithm",
    invocation: { kind: "function", arguments: [input("text"), input("pattern")] },
    cases: cases(
      {
        label: "Overlapping matches",
        input: { text: "ababa", pattern: "aba" },
        expected: [0, 2],
      },
      {
        label: "Pattern longer than text",
        input: { text: "abc", pattern: "abcd" },
        expected: [],
      },
      {
        label: "Repeated-character matches",
        input: { text: "aaaaa", pattern: "aa" },
        expected: [0, 1, 2, 3],
      },
    ),
    audit: {
      signature: "z_algorithm(text: str, pattern: str) -> list[int]",
      defaultInputShape: "{ text: string; pattern: string }",
      argumentMapping: ["text <- $.text", "pattern <- $.pattern"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns every zero-based pattern start, including overlaps.",
    },
  }),
  defineDsaExecution({
    id: "kmp-string-match",
    entrypoint: "kmp_search",
    invocation: { kind: "function", arguments: [input("text"), input("pattern")] },
    cases: cases(
      {
        label: "Two matches",
        input: { text: "ababa", pattern: "aba" },
        expected: [0, 2],
      },
      { label: "Empty pattern", input: { text: "abc", pattern: "" }, expected: [] },
      {
        label: "Repeated overlap",
        input: { text: "aaaaa", pattern: "aa" },
        expected: [0, 1, 2, 3],
      },
    ),
    audit: {
      signature: "kmp_search(text: str, pattern: str) -> list[int]",
      defaultInputShape: "{ text: string; pattern: string }",
      argumentMapping: ["text <- $.text", "pattern <- $.pattern"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns every zero-based KMP match start.",
    },
  }),
  defineDsaExecution({
    id: "string-hashing",
    entrypoint: "string_hashing_search",
    invocation: {
      kind: "function",
      arguments: [input("text"), input("pattern"), input("base"), input("mod")],
    },
    cases: cases(
      {
        label: "Two verified hashes",
        input: { text: "abracadabra", pattern: "abra", base: 31, mod: 1_000_000_007 },
        expected: [0, 7],
      },
      {
        label: "Empty pattern",
        input: { text: "abc", pattern: "", base: 31, mod: 1_000_000_007 },
        expected: [],
      },
      {
        label: "Repeated matches",
        input: { text: "aaaaa", pattern: "aa", base: 37, mod: 1_000_000_009 },
        expected: [0, 1, 2, 3],
      },
    ),
    audit: {
      signature: "string_hashing_search(text, pattern, p=31, mod=1000000007) -> list[int]",
      defaultInputShape: "{ text: string; pattern: string; base?: number; mod?: number }",
      argumentMapping: ["text <- $.text", "pattern <- $.pattern", "p <- $.base", "mod <- $.mod"],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns collision-verified rolling-hash match starts.",
    },
  }),
  defineDsaExecution({
    id: "bitwise-trie-xor",
    entrypoint: "find_maximum_xor",
    invocation: { kind: "function", arguments: [input("nums")] },
    cases: cases(
      { label: "[3,10,5,25,2,8]", input: { nums: [3, 10, 5, 25, 2, 8] }, expected: 28 },
      {
        label: "[14,70,53,83,49,91,36]",
        input: { nums: [14, 70, 53, 83, 49, 91, 36] },
        expected: 127,
      },
      { label: "[0]", input: { nums: [0] }, expected: 0 },
    ),
    audit: {
      signature: "find_maximum_xor(nums: list[int]) -> int",
      defaultInputShape: "{ nums: number[] }",
      argumentMapping: ["nums <- $.nums"],
      mutation: "No input mutation.",
      returnBehavior: "Returns max XOR pair value.",
    },
  }),
  defineDsaExecution({
    id: "aho-corasick",
    entrypoint: "aho_corasick",
    invocation: { kind: "function", arguments: [input("patterns"), input("text")] },
    cases: cases(
      {
        label: "Patterns and text",
        input: { patterns: ["he", "she", "his", "hers"], text: "ushers" },
        expected: ["she", "he", "hers"],
      },
      { label: "No match", input: { patterns: ["abc"], text: "xyz" }, expected: [] },
      { label: "Single char", input: { patterns: ["a"], text: "aaa" }, expected: ["a", "a", "a"] },
    ),
    audit: {
      signature: "aho_corasick(patterns: list[str], text: str) -> list[str]",
      defaultInputShape: "{ patterns: string[]; text: string }",
      argumentMapping: ["patterns <- $.patterns", "text <- $.text"],
      mutation: "No input mutation.",
      returnBehavior: "Returns matches in text.",
    },
  }),
  defineDsaExecution({
    id: "manacher-algorithm",
    entrypoint: "manachers_algorithm",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "babad", input: "babad", expected: "bab" },
      { label: "cbbd", input: "cbbd", expected: "bb" },
      { label: "a", input: "a", expected: "a" },
    ),
    audit: {
      signature: "manachers_algorithm(s: str) -> str",
      defaultInputShape: "string",
      argumentMapping: ["s <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns longest palindromic substring.",
    },
  }),
  defineDsaExecution({
    id: "suffix-array-lcp",
    entrypoint: "build_suffix_array",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "banana", input: "banana", expected: [5, 3, 1, 0, 4, 2] },
      { label: "ab", input: "ab", expected: [0, 1] },
      { label: "a", input: "a", expected: [0] },
    ),
    audit: {
      signature: "build_suffix_array(s: str) -> list[int]",
      defaultInputShape: "string",
      argumentMapping: ["s <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns suffix array indices.",
    },
  }),
] as const;
