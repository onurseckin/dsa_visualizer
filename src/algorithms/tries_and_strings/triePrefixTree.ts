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
  topicIds: ["tries_and_strings"],
  difficulty: "Medium",
  description:
    "Implement a Trie (Prefix Tree) with `insert`, `search`, and `startsWith` methods.\n\n### Problem Statement\nA Trie (pronounced as 'try') or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Common prefixes are shared across paths in the tree, allowing for rapid prefix search and autocomplete operations.\n\nImplement the `Trie` class:\n- `Trie()` Initializes the trie object.\n- `void insert(String word)` Inserts the string `word` into the trie in $O(L)$ time.\n- `boolean search(String word)` Returns `true` if the string `word` is in the trie (i.e., was inserted before), and `false` otherwise.\n- `boolean startsWith(String prefix)` Returns `true` if there is a previously inserted string `word` that has the prefix `prefix`, and `false` otherwise.\n\n### Input Parameters\n- `wordsToInsert`: Array of strings to be inserted into the Trie.\n- `searchWord`: Target string for `search()` operation.\n- `prefixToSearch`: Target string for `startsWith()` operation.\n\n### Output\n- Boolean results for `search(searchWord)` and `startsWith(prefixToSearch)`.\n\n### Constraints & Edge Cases\n- `1 <= word.length, prefix.length <= 2000`.\n- `words` consist only of lowercase English letters (`'a'` to `'z'`).\n- At most $3 \\cdot 10^4$ calls in total will be made to `insert`, `search`, and `startsWith`.",
  constraints: [
    "1 <= wordsToInsert.length <= 100",
    "1 <= word.length <= 20",
    "Strings consist of lowercase English letters",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: 'words = ["apple"], search("apple"), search("app"), startsWith("app")',
      outputDisplay: "[true, false, true]",
      title: "Basic Example",
      input: { wordsToInsert: ["cat", "car", "dog"], searchWord: "car", prefixToSearch: "ca" },
      output: 'search("car") -> true, startsWith("ca") -> true',
      explanation: 'Words "cat" and "car" share prefix "ca". Searching "car" finds terminal node.',
    },
    {
      kind: "complex",
      inputDisplay: 'words = ["cat", "cap", "can"], search("cap"), startsWith("ca")',
      outputDisplay: "[true, true]",
      title: "Complex Edge Case",
      input: {
        wordsToInsert: ["apple", "app", "apricot", "banana"],
        searchWord: "app",
        prefixToSearch: "apr",
      },
      output: 'search("app") -> true, startsWith("apr") -> true',
      explanation:
        '"app" is a prefix of "apple" as well as a standalone word; "apr" matches prefix of "apricot".',
    },
    {
      kind: "negative",
      inputDisplay: 'words = ["banana"], search("band"), startsWith("bar")',
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
