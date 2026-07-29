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
  description: `<p>Implement a Trie (Prefix Tree) with <code>insert</code>, <code>search</code>, and <code>startsWith</code> methods.</p>
<h3>Problem Statement</h3>
<p>A Trie (pronounced as 'try') or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Common prefixes are shared across paths in the tree, allowing for rapid prefix search and autocomplete operations.</p>
<p>Implement the <code>Trie</code> class:</p>
<ul>
  <li><code>Trie()</code> Initializes the trie object.</li>
  <li><code>void insert(String word)</code> Inserts the string <code>word</code> into the trie.</li>
  <li><code>boolean search(String word)</code> Returns <code>true</code> if the string <code>word</code> is in the trie, and <code>false</code> otherwise.</li>
  <li><code>boolean startsWith(String prefix)</code> Returns <code>true</code> if there is a previously inserted string <code>word</code> that has the prefix <code>prefix</code>, and <code>false</code> otherwise.</li>
</ul>
<h3>Input Parameters</h3>
<ul>
  <li><code>wordsToInsert</code>: Array of strings to be inserted into the Trie.</li>
  <li><code>searchWord</code>: Target string for <code>search()</code> operation.</li>
  <li><code>prefixToSearch</code>: Target string for <code>startsWith()</code> operation.</li>
</ul>
<h3>Output</h3>
<p>Boolean results for <code>search(searchWord)</code> and <code>startsWith(prefixToSearch)</code>.</p>
`,
  constraints: [
    "1 <= wordsToInsert.length <= 100",
    "1 <= word.length <= 20",
    "Strings consist of lowercase English letters",
  ],
  examples: [
    {
      kind: "basic",
      kind: "basic",
      scenario: "standard",
      inputDisplay: 'words = ["cat", "car", "dog"], search("car"), startsWith("ca")',
      outputDisplay: 'search("car") -> true, startsWith("ca") -> true',
      title: "Standard Shared Prefix Insertion & Search",
      input: DEFAULT_TRIE_INPUT,
      output: 'search("car") -> true, startsWith("ca") -> true',
      explanation: 'Words "cat" and "car" share prefix "ca". Searching "car" finds terminal node.',
    },
    {
      kind: "complex",
      kind: "complex",
      scenario: "adversarial",
      inputDisplay:
        'words = ["apple", "app", "apricot", "banana"], search("app"), startsWith("apr")',
      outputDisplay: 'search("app") -> true, startsWith("apr") -> true',
      title: "Adversarial Multi-Prefix & Substring Words",
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
      kind: "negative",
      scenario: "boundary",
      inputDisplay: 'words = ["tree", "trie"], search("trip"), startsWith("tra")',
      outputDisplay: 'search("trip") -> false, startsWith("tra") -> false',
      title: "Boundary Missing Word & Prefix Case",
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
