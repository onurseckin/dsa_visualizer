import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const TRIE_PREFIX_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A trie, also called a prefix tree, is a tree whose edges are labelled with single characters, so the path you walk from the root spells out a string. Instead of storing 'cat' and 'car' as two independent keys, a trie stores the shared beginning 'ca' once and lets the two words branch apart only where they actually differ. That layout is what makes a trie the natural home for prefix questions: autocomplete, dictionary lookups, spell-check candidates, and IP routing tables.</p>",
  sections: [
    {
      heading: "The core idea: let shared prefixes share a path",
      body: "<p>The insight is that a set of strings has structure a hash set throws away. Hashing scrambles 'car' and 'cat' into unrelated buckets; a trie deliberately keeps them adjacent because they begin the same way. Every node in the trie represents one prefix of the inserted words, and its children represent the ways that prefix can be extended by one character. Once you accept that a node is a prefix, every operation becomes the same walk: start at the root and consume characters one at a time.</p>",
    },
    {
      heading: "How the mechanism works: one child link per character",
      body: "<p>Each node holds a small map from a character to the child node reached by that character, plus a boolean flag usually named <code>is_end_of_word</code>. Inserting a word walks down from the root and, whenever the needed child link is missing, creates a fresh node before descending into it; after the last character, it sets <code>is_end_of_word</code>. Searching does the same walk without creating nodes: the moment a character has no matching child, search fails.</p>",
    },
    {
      heading: "Why it is correct: the path is the key",
      body: "<p>The invariant the structure maintains is that for every node, the concatenation of edge characters from root to that node equals exactly one prefix. Searching relies on this invariant: reaching a node proves the prefix exists in some word, and failing to find a child proves no word continues that way. The <code>is_end_of_word</code> flag distinguishes a stored word from a mere prefix.</p>",
    },
    {
      heading: "Search versus starts_with: two different questions",
      body: "<p>The two lookup operations walk identically and differ only in what they check when characters run out. <code>search</code> asks whether the node reached is marked as a word ending, whereas <code>startsWith</code> asks only whether the path walk succeeded at all.</p>",
    },
    {
      heading: "When to reach for a trie instead of a hash set",
      body: "<p>Pick a hash set when your only question is exact membership. Pick a trie the moment prefixes matter: incremental autocomplete as the user types, listing every word with a given beginning, or finding the longest stored prefix of an input.</p>",
    },
    {
      heading: "Pitfalls and how the idea generalizes",
      body: "<p>Watch for edge cases: empty strings, node deletion pruning, and alphabet size assumptions. Beyond basic lookups, tries generalize to wildcard matching, Aho-Corasick multi-pattern search, and binary tries for bitwise XOR queries.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Prefix",
      definition:
        "Any beginning slice of a string, taken from its first character onward. In a trie every node corresponds to exactly one prefix of the words stored beneath it.",
    },
    {
      term: "Trie node",
      definition:
        "A single position in the tree holding a map from characters to child nodes plus an end-of-word flag. The node stores no string itself; its identity comes from the path taken to reach it.",
    },
    {
      term: "is_end_of_word",
      definition:
        "The boolean marking that some inserted word stops at this node. Without it a trie could only answer prefix questions, since a path existing does not mean the path spells a stored word.",
    },
    {
      term: "Branching factor",
      definition:
        "The number of distinct characters a node can fan out to, bounded by the alphabet size. It drives how much memory each node costs and whether a map or a fixed array is the better child container.",
    },
    {
      term: "Autocomplete query",
      definition:
        "Walking to the node for a typed prefix and then enumerating the words in its subtree. It is the operation tries exist for, and the reason keeping related words adjacent pays off.",
    },
  ],
};

export const TRIE_PREFIX_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines class TrieNode representing a single node in the prefix tree with child pointers.",
    2: "Initializes a new TrieNode instance.",
    3: "Dictionary mapping single characters to child TrieNode instances for path branching.",
    4: "Boolean flag marking whether a valid inserted word terminates at this node.",
    5: "Blank line between TrieNode declaration and Trie class definition.",
    6: "Defines class Trie implementing prefix tree operations (insert, search, starts_with).",
    7: "Initializes a new Trie instance.",
    8: "Creates the empty root node representing the empty string prefix.",
    9: "Blank line between constructor and insert method.",
    10: "Inserts string word into the Trie in O(L) time.",
    11: "Sets node pointer to root to start character path traversal.",
    12: "Iterates through each character in the target word.",
    13: "Checks if a child node corresponding to char exists under current node.",
    14: "Creates a new TrieNode and attaches it to children[char] if missing.",
    15: "Traverses down into child node for char.",
    16: "Sets is_end_of_word = True on terminal node after placing all characters.",
    17: "Blank line between insert and search method.",
    18: "Searches for exact string word in the Trie in O(L) time.",
    19: "Sets node pointer to root to start search traversal.",
    20: "Iterates through each character in search word.",
    21: "Checks if child node for char exists.",
    22: "Returns False if char path does not exist (word was never inserted).",
    23: "Traverses down into child node for char.",
    24: "Returns True only if terminal node has is_end_of_word == True.",
    25: "Blank line between search and starts_with method.",
    26: "Checks if any inserted word starts with prefix in O(L) time.",
    27: "Sets node pointer to root to start prefix traversal.",
    28: "Iterates through each character in target prefix.",
    29: "Checks if child node for char exists.",
    30: "Returns False if prefix path breaks partway through.",
    31: "Traverses down into child node for char.",
    32: "Returns True if prefix path is fully traversed (is_end_of_word check not required).",
  },
};
