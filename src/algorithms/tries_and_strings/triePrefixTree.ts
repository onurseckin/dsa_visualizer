import type { AlgorithmDefinition } from "../../types/dsa";
import type { TriePrefixTreeInput } from "./trie_prefix_tree/types";
import { TRIE_PREFIX_TREE_CODE, DEFAULT_TRIE_INPUT } from "./trie_prefix_tree/types";
import { generateTriePrefixTreeSteps } from "./trie_prefix_tree/stepGenerator";
import { TRIE_PREFIX_TREE_TOPIC_GUIDE, TRIE_PREFIX_TREE_TRIVIA } from "./trie_prefix_tree/metadata";

export type { TriePrefixTreeInput };
export { TRIE_PREFIX_TREE_CODE, DEFAULT_TRIE_INPUT, generateTriePrefixTreeSteps };

export const triePrefixTree: AlgorithmDefinition<TriePrefixTreeInput> = {
  id: "trie-prefix-tree",
  title: "Trie (Prefix Tree)",
  category: "tries_and_strings",
  difficulty: "Medium",
  description:
    "A Trie (Prefix Tree) is a tree-like data structure for storing strings so that words with a common prefix share a path. Each edge represents one character, which makes insertion, exact word search, and prefix matching (the basis of autocomplete) all cost O(L) — one step per character.",
  constraints: [
    "1 <= wordsToInsert.length <= 100",
    "1 <= word.length <= 20",
    "Strings consist of lowercase English letters",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "words = [\"apple\"], search(\"apple\"), search(\"app\"), startsWith(\"app\")",
      outputDisplay: "[true, false, true]",
      title: "Basic Example",
      input: { wordsToInsert: ["cat", "car", "dog"], searchWord: "car", prefixToSearch: "ca" },
      output: 'search("car") -> true, startsWith("ca") -> true',
      explanation: 'Words "cat" and "car" share prefix "ca". Searching "car" finds terminal node.',
    },
    {
      kind: "complex",
      inputDisplay: "words = [\"cat\", \"cap\", \"can\"], search(\"cap\"), startsWith(\"ca\")",
      outputDisplay: "[true, true]",
      title: "Complex Edge Case",
      input: { wordsToInsert: ["apple", "app", "apricot", "banana"], searchWord: "app", prefixToSearch: "apr" },
      output: 'search("app") -> true, startsWith("apr") -> true',
      explanation: '"app" is a prefix of "apple" as well as a standalone word; "apr" matches prefix of "apricot".',
    },
    {
      kind: "negative",
      inputDisplay: "words = [\"banana\"], search(\"band\"), startsWith(\"bar\")",
      outputDisplay: "[false, false]",
      title: "Failing / Boundary Case",
      input: { wordsToInsert: ["tree", "trie"], searchWord: "trip", prefixToSearch: "tra" },
      output: 'search("trip") -> false, startsWith("tra") -> false',
      explanation: 'Neither searchWord "trip" nor prefix "tra" exist in the trie.',
    },
  ],
  code: TRIE_PREFIX_TREE_CODE,
  timeComplexity: {
    best: "O(L)",
    average: "O(L)",
    worst: "O(L)",
  },
  spaceComplexity: "O(N * L)",
  complexityAnalysis: {
    time: "Insert, search, and starts_with all walk one node per character, so each operation costs O(L) where L is the length of the word or prefix. The cost never depends on how many words the trie holds — we just follow (or create) one child link per letter. That is why best, average, and worst case are all the same.",
    space:
      "The tree itself is the memory cost: in the worst case no words share prefixes and we store one node per character, O(N * L) for N words of length L. Shared prefixes let words reuse nodes, so real tries are usually much smaller.",
  },
  topicGuide: TRIE_PREFIX_TREE_TOPIC_GUIDE,
  trivia: TRIE_PREFIX_TREE_TRIVIA,
  leetcode: {
    id: 208,
    url: "https://leetcode.com/problems/implement-trie-prefix-tree/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #208",
      leetcodeId: 208,
      url: "https://leetcode.com/problems/implement-trie-prefix-tree/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 26",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 26,
      section: "26.2 Trie structure",
    },
  ],
  defaultInput: DEFAULT_TRIE_INPUT,
  generateSteps: generateTriePrefixTreeSteps,
};

export default triePrefixTree;
