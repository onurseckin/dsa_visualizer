import type { TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";

export const TRIE_PREFIX_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    'A trie, also called a prefix tree, is a tree whose edges are labelled with single characters, so the path you walk from the root spells out a string. Instead of storing "cat" and "car" as two independent keys, a trie stores the shared beginning "ca" once and lets the two words branch apart only where they actually differ. That layout is what makes a trie the natural home for prefix questions: autocomplete, dictionary lookups, spell-check candidates, IP routing tables, and word-search puzzles all ask "what continues from here?" rather than "does this exact key exist?". Learning the trie means learning to store a set of strings by their structure instead of by their hash.',
  sections: [
    {
      heading: "The core idea: let shared prefixes share a path",
      body: 'The insight is that a set of strings has structure a hash set throws away. Hashing scrambles "car" and "cat" into unrelated buckets, so nothing about one tells you anything about the other; a trie deliberately keeps them adjacent because they begin the same way. Every node in the trie represents one prefix of the inserted words, and its children represent the ways that prefix can be extended by one character. Once you accept that a node is a prefix, every operation becomes the same walk: start at the root, which stands for the empty prefix, and consume characters one at a time. The tree is not a fancy index built on top of the words, it is the words, factored by their common beginnings.',
    },
    {
      heading: "How the mechanism works: one child link per character",
      body: 'Each node holds a small map from a character to the child node reached by that character, plus a boolean flag usually named is_end_of_word. Inserting a word walks down from the root and, whenever the needed child link is missing, creates a fresh node before descending into it; after the last character, it sets is_end_of_word on the node you landed on. Searching does the same walk but never creates anything: the moment a character has no matching child you can stop and report failure, because that prefix does not exist in the tree at all. Inserting "cat" then "car" builds root, c, a, t and then reuses the existing c and a nodes while adding only an r sibling to t. Nothing is compared character by character against whole stored words, because the descent itself does the comparing.',
    },
    {
      heading: "Why it is correct: the path is the key",
      body: 'The invariant the structure maintains is that for every node, the concatenation of the edge characters from the root to that node equals exactly one prefix, and that node exists if and only if some inserted word starts with that prefix. Insert preserves the invariant because it only ever creates the single child that the next character demands, extending an existing prefix by one letter. Search relies on the invariant in both directions: reaching a node proves the prefix is present in some word, and failing to find a child proves no word continues that way, so returning False early is safe rather than merely a shortcut. The is_end_of_word flag exists because presence of a path is not the same claim as presence of a word. In the example trie, the node for "ca" exists and yet "ca" was never inserted, so its flag stays false while the flag on "car" is true.',
    },
    {
      heading: "Search versus starts_with: two different questions",
      body: 'The two lookup operations walk identically and differ only in what they check when the characters run out. search asks whether the node you landed on is marked as a word ending, so search("ca") is False even though the walk succeeded. starts_with asks only whether the walk succeeded at all, so starts_with("ca") is True because "cat" and "car" both live below that node. Confusing the two is the single most common trie bug, and it usually shows up as an autocomplete box that refuses to suggest anything until you have typed a complete word. When you need to know how many words sit under a prefix, store a counter in each node during insertion rather than exploring the whole subtree at query time.',
    },
    {
      heading: "When to reach for a trie instead of a hash set",
      body: "Pick a hash set when your only question is exact membership, because it is simpler, more compact, and does not care about key length beyond hashing it once. Pick a trie the moment prefixes matter: incremental autocomplete as the user types, listing every word with a given beginning, finding the longest stored prefix of an input, or doing repeated dictionary probes while you walk a board or a string. A trie also gives you sorted iteration for free if you visit children in alphabetical order, which a hash set cannot do. The costs are real: many small child maps use more memory than one flat table, and the pointer chasing is less cache friendly than a single hash probe, so a trie earns its keep through the prefix queries, not through raw lookup speed.",
    },
    {
      heading: "Pitfalls and how the idea generalizes",
      body: 'Watch for the edge cases first: an empty string is legitimate and simply marks the root as a word ending, deleting a word should clear its flag and prune only nodes that have no children and no flag, and the alphabet you assume matters because a fixed 26-slot array breaks on uppercase, digits, or Unicode. Once the shape is familiar, the same tree supports much more. Adding a wildcard character to search turns into trying every child at that position, which is how "add and search word" problems work. Aho-Corasick bolts failure links onto a trie so you can match many patterns in one text pass, exactly as KMP does for a single pattern. Replacing characters with bits gives you a binary trie, the structure behind maximum-XOR-pair queries and longest-prefix IP routing.',
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
    1: "Defines a single node in the trie: a small object holding child links and a marker for whether a word ends here.",
    2: "Constructor run every time a new node is created — every node starts identically empty.",
    3: "A dictionary from a single character to the child node reached by that character — this is what lets shared prefixes branch off from a common path.",
    4: 'Marks whether some inserted word stops exactly at this node; without it the trie could only answer "does this prefix exist", not "is this a real stored word".',
    6: "The container that owns the whole tree and exposes insert, search, and starts_with as its public operations.",
    7: "Constructor for the trie itself.",
    8: "The root represents the empty string — every inserted word grows as a path of characters down from this single starting point.",
    10: "Adds a word to the trie by walking (and extending) the path that spells it out one character at a time.",
    11: "Start every insertion at the root, since every word begins as an extension of the empty prefix.",
    12: "Walk the word one character at a time, descending one tree level per character.",
    13: "Check whether a path for this character already exists at the current node.",
    14: "No such child exists yet, so create one — this is the moment the trie actually grows to accommodate a new branch.",
    15: "Step into the child for this character, whether it just got created or already existed from an earlier word.",
    16: "After placing every character of the word, flag the node we landed on as a genuine word ending, distinguishing it from a node that's merely a prefix of something else.",
    18: "Checks whether an exact word was previously inserted into the trie.",
    19: "Begin the walk at the root, same starting point as insertion.",
    20: "Follow the word's character path exactly as insert would, but this time only reading, never creating.",
    21: "If the path breaks — no child exists for this character — the word was never inserted.",
    22: "Report failure immediately rather than continuing to search a path that can't lead anywhere.",
    23: "The character's child exists, so step into it and keep matching the rest of the word.",
    24: "Having matched every character, the word was inserted only if this final node is actually flagged as a word ending — matching the path alone isn't enough, since it might just be someone else's prefix.",
    26: "Checks whether any inserted word begins with the given prefix — unlike search, it doesn't care whether the prefix itself is a complete word.",
    27: "Start the walk at the root, exactly as the other two operations do.",
    28: "Follow the prefix's character path one step at a time.",
    29: "If the path breaks partway through, no stored word can possibly continue with this prefix.",
    30: "Report immediately that no word starts with this prefix.",
    31: "The child exists, so descend into it and keep matching the rest of the prefix.",
    32: "Every prefix character was found along a real path, so at least one stored word begins with it — no end-of-word flag needs to be checked here, unlike search.",
  },
};
