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
        node["#"] = True
        
    node = trie
    for ch in search_prefix:
        if ch not in node:
            return []
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

  const flattenedTreeNodes = (activeId: string | null, visitedIds: Set<string>): TreeNodeItem[] => {
    const list: TreeNodeItem[] = [];

    const traverse = (n: InternalTrieNode, depth: number, xMin: number, xMax: number) => {
      let state: TreeNodeItem["state"] = "default";
      if (n.id === activeId) state = "active";
      else if (visitedIds.has(n.id)) state = "visited";
      else if (n.isEnd) state = "sorted";

      const childKeys = Object.keys(n.children);
      const firstChildKey = childKeys[0];
      const secondChildKey = childKeys[1];

      const cx = (xMin + xMax) / 2;
      const cy = 40 + depth * 70;

      list.push({
        id: n.id,
        val: n.ch === "ROOT" ? 0 : n.ch.charCodeAt(0),
        state,
        leftId: firstChildKey ? n.children[firstChildKey].id : undefined,
        rightId: secondChildKey ? n.children[secondChildKey].id : undefined,
        x: cx,
        y: cy,
      });

      if (childKeys.length > 0) {
        const sliceWidth = (xMax - xMin) / childKeys.length;
        childKeys.forEach((k, idx) => {
          const childXMin = xMin + idx * sliceWidth;
          const childXMax = childXMin + sliceWidth;
          traverse(n.children[k], depth + 1, childXMin, childXMax);
        });
      }
    };

    traverse(root, 0, 40, 560);
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
    `Initialize Trie prefix tree root`,
    `Building Trie for vocabulary: [${words.join(", ")}].`,
    "node-root",
    visited,
    [],
    { vocabSize: words.length, phase: "build_trie" },
  );

  // Insert words into Trie
  for (const word of words) {
    addStep(
      3,
      `Start inserting vocabulary word "${word}" into Trie`,
      `Iterating through characters of word "${word}".`,
      "node-root",
      visited,
      [],
      { currentWord: word, phase: "insert" },
    );

    let curr = root;
    addStep(
      4,
      `Set node pointer to root for word "${word}"`,
      `Begin character path insertion from Trie root.`,
      curr.id,
      visited,
      [],
      { currentWord: word, nodeChar: curr.ch },
    );

    for (const ch of word) {
      let isNewNode = false;
      if (!curr.children[ch]) {
        nodeCounter++;
        curr.children[ch] = {
          id: `node-${nodeCounter}`,
          ch,
          isEnd: false,
          children: {},
        };
        isNewNode = true;
      }
      addStep(
        isNewNode ? 7 : 6,
        isNewNode
          ? `Create new Trie node for character '${ch}'`
          : `Character '${ch}' already exists under current node`,
        isNewNode
          ? `Allocated new node ID node-${nodeCounter} for character '${ch}'.`
          : `Reusing existing branch node for character '${ch}'.`,
        curr.children[ch].id,
        visited,
        [],
        { char: ch, isNewNode },
      );

      curr = curr.children[ch];
      visited.add(curr.id);

      addStep(
        8,
        `Advance pointer to child node '${ch}'`,
        `Traversed to node '${ch}' (ID: ${curr.id}).`,
        curr.id,
        visited,
        [],
        { char: ch, nodeId: curr.id },
      );
    }
    curr.isEnd = true;
    addStep(
      9,
      `Mark end-of-word indicator '#' for "${word}"`,
      `Set terminal marker on node '${curr.ch}' indicating complete word "${word}".`,
      curr.id,
      visited,
      [],
      { word, isEnd: true },
    );
  }

  // Search prefix
  let searchCurr: InternalTrieNode | null = root;
  const pathVisited = new Set<string>();
  pathVisited.add("node-root");

  addStep(
    11,
    `Reset pointer to root to search prefix "${searchPrefix}"`,
    `Begin matching characters of search prefix "${searchPrefix}" down the Trie tree.`,
    searchCurr.id,
    pathVisited,
    [],
    { searchPrefix, phase: "search" },
  );

  for (let i = 0; i < searchPrefix.length; i++) {
    const ch = searchPrefix[i];
    addStep(
      12,
      `Inspect character '${ch}' of search prefix "${searchPrefix}"`,
      `Checking if character '${ch}' exists at step ${i + 1}/${searchPrefix.length}.`,
      searchCurr ? searchCurr.id : null,
      pathVisited,
      [],
      { char: ch, depth: i + 1 },
    );

    if (!searchCurr || !searchCurr.children[ch]) {
      addStep(
        14,
        `Prefix character '${ch}' not found in Trie! Return []`,
        `No tokens match prefix "${searchPrefix}". Search aborted.`,
        searchCurr ? searchCurr.id : null,
        pathVisited,
        [],
        { searchPrefix, found: false, matches: 0, complete: true },
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
      { char: ch, depth: i + 1, found: true },
    );
  }

  // Collect completions
  const completions: string[] = [];
  addStep(
    17,
    `Initialize results list for token completions`,
    `Preparing to collect all vocabulary tokens extending prefix "${searchPrefix}".`,
    searchCurr ? searchCurr.id : null,
    pathVisited,
    [],
    { searchPrefix, phase: "collect" },
  );

  const collect = (n: InternalTrieNode, prefixAcc: string) => {
    if (n.isEnd) {
      completions.push(prefixAcc);
      addStep(
        20,
        `Found end-of-word '#'! Append token "${prefixAcc}" to results`,
        `Reached valid terminal token "${prefixAcc}". Added to match list.`,
        n.id,
        pathVisited,
        [...completions],
        { match: prefixAcc, totalMatches: completions.length },
      );
    }

    for (const k of Object.keys(n.children)) {
      pathVisited.add(n.children[k].id);
      collect(n.children[k], prefixAcc + k);
    }
  };

  addStep(
    25,
    `Invoke DFS collect() from prefix node '${searchCurr ? searchCurr.ch : "ROOT"}'`,
    `Recursively traversing subtree below prefix "${searchPrefix}" to gather all completions.`,
    searchCurr ? searchCurr.id : null,
    pathVisited,
    [],
    { searchPrefix, phase: "collect_dfs" },
  );

  if (searchCurr) {
    collect(searchCurr, searchPrefix);
  }

  addStep(
    26,
    `Prefix completion search complete (${completions.length} tokens found)`,
    `Found tokens starting with prefix "${searchPrefix}": [${completions.join(", ")}].`,
    searchCurr ? searchCurr.id : null,
    pathVisited,
    completions,
    { matches: completions.length, complete: true, results: `[${completions.join(", ")}]` },
  );

  return steps;
};

export const TRIE_PREFIX_TREE_SEARCH_TRIVIA: TriviaMeta = {
  skipLines: [2],
  hints: [
    { line: 6, hint: "Check if character exists in child node dictionary" },
    { line: 9, hint: "Mark end-of-word indicator '#' on terminal node" },
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
  topicIds: ["ml_tokenization"],
  difficulty: "Medium",
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
