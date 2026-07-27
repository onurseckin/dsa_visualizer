import type { AlgorithmDefinition, AlgorithmStep, TreeNodeItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TriePrefixTreeSearchInput {
  words: string[];
  searchPrefix: string;
}

export const TRIE_PREFIX_TREE_SEARCH_CODE = `def trie_prefix_search(words: list[str], search_prefix: str) -> list[str]:
    trie = {}
    for word in words:
        node = trie
        for ch in word:
            if ch not in node:
                node[ch] = {}
            node = node[ch]
        node["#"] = True  # End of word mark
        
    node = trie
    for ch in search_prefix:
        if ch not in node:
            return []  # Prefix not found
        node = node[ch]
        
    results = []
    def collect(curr_node, curr_prefix):
        if "#" in curr_node:
            results.append(curr_prefix)
        for ch in curr_node:
            if ch != "#":
                collect(curr_node[ch], curr_prefix + ch)
                
    collect(node, search_prefix)
    return results`;

export const DEFAULT_TRIE_PREFIX_TREE_SEARCH_INPUT: TriePrefixTreeSearchInput = {
  words: ["cat", "car", "card", "dog"],
  searchPrefix: "ca",
};

interface InternalTrieNode {
  id: string;
  ch: string;
  isEnd: boolean;
  children: Record<string, InternalTrieNode>;
}

export const generateTriePrefixTreeSearchSteps = (
  input: TriePrefixTreeSearchInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  let nodeCounter = 0;

  const { words, searchPrefix } = input;

  const root: InternalTrieNode = {
    id: "node-root",
    ch: "ROOT",
    isEnd: false,
    children: {},
  };

  // Build tree nodes for TreeVisualSnapshot
  const flattenedTreeNodes = (activeId: string | null, visitedIds: Set<string>): TreeNodeItem[] => {
    const list: TreeNodeItem[] = [];

    const traverse = (n: InternalTrieNode, depth: number, posIndex: number) => {
      let state: TreeNodeItem["state"] = "default";
      if (n.id === activeId) state = "active";
      else if (visitedIds.has(n.id)) state = "visited";
      else if (n.isEnd) state = "sorted";

      const childKeys = Object.keys(n.children);
      const firstChildKey = childKeys[0];
      const secondChildKey = childKeys[1];

      list.push({
        id: n.id,
        val: n.ch === "ROOT" ? 0 : n.ch.charCodeAt(0),
        state,
        leftId: firstChildKey ? n.children[firstChildKey].id : undefined,
        rightId: secondChildKey ? n.children[secondChildKey].id : undefined,
        x: posIndex * 20,
        y: depth * 20,
      });

      childKeys.forEach((k, idx) => {
        traverse(n.children[k], depth + 1, posIndex * 2 + idx);
      });
    };

    traverse(root, 0, 0);
    return list;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeId: string | null,
    visitedSet: Set<string>,
    matchedWords: string[],
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "tree",
        rootId: "node-root",
        nodes: flattenedTreeNodes(activeId, visitedSet),
      },
      auxiliaryState: {
        customState: {
          searchPrefix,
          vocab: `[${words.join(", ")}]`,
          results: `[${matchedWords.join(", ")}]`,
        },
      },
      variables: vars,
    });
  };

  const visited = new Set<string>();
  visited.add("node-root");

  addStep(
    2,
    `Initialize Trie Token Tree construction`,
    `Building prefix tree for vocabulary: [${words.join(", ")}].`,
    "node-root",
    visited,
    [],
    { vocabSize: words.length },
  );

  // Insert words into Trie
  for (const word of words) {
    let curr = root;
    for (const ch of word) {
      if (!curr.children[ch]) {
        nodeCounter++;
        curr.children[ch] = {
          id: `node-${nodeCounter}`,
          ch,
          isEnd: false,
          children: {},
        };
      }
      curr = curr.children[ch];
      visited.add(curr.id);
    }
    curr.isEnd = true;
  }

  addStep(
    9,
    `Trie construction complete (${nodeCounter + 1} total nodes)`,
    `Inserted all ${words.length} vocabulary words into the Trie tree.`,
    "node-root",
    visited,
    [],
    { nodeCount: nodeCounter + 1 },
  );

  // Search prefix
  let searchCurr: InternalTrieNode | null = root;
  const pathVisited = new Set<string>();
  pathVisited.add("node-root");

  for (let i = 0; i < searchPrefix.length; i++) {
    const ch = searchPrefix[i];
    if (!searchCurr || !searchCurr.children[ch]) {
      addStep(
        14,
        `Prefix character '${ch}' not found in Trie!`,
        `No tokens match prefix "${searchPrefix}". Search aborted.`,
        searchCurr ? searchCurr.id : null,
        pathVisited,
        [],
        { searchPrefix, found: false },
      );
      return steps;
    }

    searchCurr = searchCurr.children[ch];
    pathVisited.add(searchCurr.id);

    addStep(
      15,
      `Match prefix char '${ch}' -> Move to node '${searchCurr.ch}'`,
      `Traversing Trie branch for character '${ch}' (step ${i + 1}/${searchPrefix.length}).`,
      searchCurr.id,
      new Set(pathVisited),
      [],
      { char: ch, depth: i + 1 },
    );
  }

  // Collect completions
  const completions: string[] = [];

  const collect = (n: InternalTrieNode, prefixAcc: string) => {
    if (n.isEnd) {
      completions.push(prefixAcc);
    }
    for (const k of Object.keys(n.children)) {
      collect(n.children[k], prefixAcc + k);
    }
  };

  if (searchCurr) {
    collect(searchCurr, searchPrefix);
  }

  addStep(
    22,
    `Prefix completion search complete (${completions.length} tokens found)`,
    `Found tokens starting with prefix "${searchPrefix}": [${completions.join(", ")}].`,
    searchCurr ? searchCurr.id : null,
    pathVisited,
    completions,
    { matches: completions.length, complete: true },
  );

  return steps;
};

export const TRIE_PREFIX_TREE_SEARCH_TRIVIA: TriviaMeta = {
  skipLines: [2],
  hints: [
    { line: 6, hint: "Check if character exists in child node dictionary" },
    { line: 8, hint: "Mark end-of-word indicator '#' on terminal node" },
    { line: 18, hint: "Recursively collect words matching search prefix" },
  ],
  distractors: [
    "node[ch] = word",
    "if '#' not in curr_node: results.append(curr_prefix)",
    "for ch in search_prefix: trie.clear()",
  ],
};

export const triePrefixTreeSearch: AlgorithmDefinition<TriePrefixTreeSearchInput> = {
  id: "trie-prefix-tree-search",
  title: "Trie Prefix Tree Token Search",
  category: "ml_tokenization",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 5,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Build a Trie (prefix tree) vocabulary and execute fast subword token prefix matches.",
  code: TRIE_PREFIX_TREE_SEARCH_CODE,
  defaultInput: DEFAULT_TRIE_PREFIX_TREE_SEARCH_INPUT,
  examples: [
    {
      kind: "basic",
      title: "Prefix 'ca' Completion Search",
      input: DEFAULT_TRIE_PREFIX_TREE_SEARCH_INPUT,
      output: "['cat', 'car', 'card']",
      explanation: "Trie search down 'c' -> 'a' branch finds completions cat, car, card.",
    },
    {
      kind: "complex",
      title: "Full Word Prefix Match",
      input: {
        words: ["apple", "app", "application", "apt"],
        searchPrefix: "app",
      },
      output: "['app', 'apple', 'application']",
      explanation: "Matches exact word 'app' and downstream completions 'apple' and 'application'.",
    },
    {
      kind: "negative",
      title: "Non-Existent Prefix Search",
      input: {
        words: ["cat", "dog"],
        searchPrefix: "z",
      },
      output: "[]",
      explanation: "Prefix 'z' does not exist in Trie branch.",
    },
  ],
  timeComplexity: {
    best: "O(L + M)",
    average: "O(L + M)",
    worst: "O(L + M)",
  },
  spaceComplexity: "O(N * L)",
  complexityAnalysis: {
    time: "O(L) to traverse prefix of length L, plus O(M) to collect M matching completions.",
    space: "O(N * L) space to store N words of average length L in Trie nodes.",
  },
  topicGuide: {
    overview:
      "A Trie (Prefix Tree) is an ordered tree structure used for fast string lookup and prefix matching. In LLM tokenizers (BPE, WordPiece), Tries enable O(L) longest-prefix matching against giant 50,000+ token vocabularies.",
    sections: [
      {
        heading: "Tokenization & Vocab Lookup",
        body: "Tokenizers slice raw text into subwords by walking a Trie of known vocabulary tokens.",
      },
    ],
    keyTerms: [
      {
        term: "Trie",
        definition: "Tree structure where edges represent characters and paths represent words.",
      },
      {
        term: "Prefix Search",
        definition: "Finding all vocabulary tokens sharing a common query prefix.",
      },
    ],
  },
  trivia: TRIE_PREFIX_TREE_SEARCH_TRIVIA,
  generateSteps: generateTriePrefixTreeSearchSteps,
};
