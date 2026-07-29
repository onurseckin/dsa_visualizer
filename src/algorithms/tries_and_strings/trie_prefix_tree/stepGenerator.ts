import type { AlgorithmStep, ElementState, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import type { TriePrefixTreeInput, InternalTrieNode } from "./types";
import { DEFAULT_TRIE_INPUT } from "./types";

export const generateTriePrefixTreeSteps = (input: TriePrefixTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  let nodeCounter = 0;

  const wordsToInsert =
    Array.isArray(input?.wordsToInsert) && input.wordsToInsert.length > 0
      ? input.wordsToInsert
      : DEFAULT_TRIE_INPUT.wordsToInsert;
  const searchWord =
    typeof input?.searchWord === "string" ? input.searchWord : DEFAULT_TRIE_INPUT.searchWord;
  const prefixToSearch =
    typeof input?.prefixToSearch === "string"
      ? input.prefixToSearch
      : DEFAULT_TRIE_INPUT.prefixToSearch;

  const rootTrieNode: InternalTrieNode = {
    id: "trie-root",
    char: "ROOT",
    isEndOfWord: false,
    children: new Map(),
  };

  const snapshotGraph = (
    activeNodeId?: string,
    highlightedEdges: string[] = [],
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    const layoutNode = (node: InternalTrieNode, depth: number, xMin: number, xMax: number) => {
      const cx = (xMin + xMax) / 2;
      const cy = 40 + depth * 70;

      let state: ElementState = node.isEndOfWord ? "pivot" : "default";
      if (activeNodeId && node.id === activeNodeId) {
        state = "active";
      }

      nodes.push({
        id: node.id,
        label: node.char,
        x: cx,
        y: cy,
        state,
      });

      const childEntries = Array.from(node.children.entries());
      if (childEntries.length > 0) {
        const sliceWidth = (xMax - xMin) / childEntries.length;
        childEntries.forEach(([_, childNode], index) => {
          const childXMin = xMin + index * sliceWidth;
          const childXMax = childXMin + sliceWidth;
          const edgeId = `${node.id}->${childNode.id}`;
          const isTraversed = highlightedEdges.includes(edgeId);

          edges.push({
            from: node.id,
            to: childNode.id,
            weight: undefined,
            isTraversed,
            isPath: isTraversed,
          });

          layoutNode(childNode, depth + 1, childXMin, childXMax);
        });
      }
    };

    layoutNode(rootTrieNode, 0, 40, 560);
    return { nodes, edges };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeNodeId?: string,
    highlightedEdges: string[] = [],
    extraVars: Record<string, string | number | boolean> = {},
  ) => {
    const { nodes, edges } = snapshotGraph(activeNodeId, highlightedEdges);
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "graph",
        nodes,
        edges,
      },
      auxiliaryState: {
        customState: {
          insertedWords: wordsToInsert.join(", "),
          searchWord: searchWord,
          prefixToSearch: prefixToSearch,
        },
      },
      variables: extraVars,
    });
  };

  addStep(
    8,
    "Initialize Trie root node",
    "We start with a single root representing the empty string prefix. Every inserted word grows a character path extending downward from the root.",
    "trie-root",
    [],
    { status: "Initialized" },
  );

  for (const word of wordsToInsert) {
    let current = rootTrieNode;
    const traversedEdges: string[] = [];

    addStep(
      11,
      `Begin inserting word "${word}"`,
      `Traversing character path for "${word}" starting at root node. New child nodes are created only when a prefix path diverges.`,
      current.id,
      [],
      { operation: "insert", word },
    );

    for (let i = 0; i < word.length; i++) {
      const char = word[i];

      if (!current.children.has(char)) {
        nodeCounter++;
        const newNode: InternalTrieNode = {
          id: `node-${nodeCounter}`,
          char,
          isEndOfWord: false,
          children: new Map(),
        };
        current.children.set(char, newNode);

        const edgeId = `${current.id}->${newNode.id}`;
        traversedEdges.push(edgeId);
        current = newNode;

        addStep(
          14,
          `Create new Trie node for '${char}'`,
          `No child link for '${char}' exists under current node. Allocating a new node for character ${i + 1} of "${word}".`,
          current.id,
          [...traversedEdges],
          { operation: "insert", word, char, created: true },
        );
      } else {
        const existingNode = current.children.get(char)!;
        const edgeId = `${current.id}->${existingNode.id}`;
        traversedEdges.push(edgeId);
        current = existingNode;

        addStep(
          15,
          `Traverse existing node for '${char}'`,
          `A node for character '${char}' already exists from a previously inserted word. Reusing shared prefix node to optimize memory.`,
          current.id,
          [...traversedEdges],
          { operation: "insert", word, char, created: false },
        );
      }
    }

    current.isEndOfWord = true;
    addStep(
      16,
      `Mark node '${current.char}' as terminal word ending`,
      `All characters of "${word}" inserted. Setting is_end_of_word flag to distinguish complete words from intermediate prefixes.`,
      current.id,
      [...traversedEdges],
      { operation: "insert", word, isEndOfWord: true },
    );
  }

  let currentSearch = rootTrieNode;
  const searchEdges: string[] = [];
  let found = true;

  addStep(
    19,
    `Search for exact key "${searchWord}"`,
    `Following root-to-leaf character path for "${searchWord}". The search succeeds only if all characters exist and the terminal node is flagged as a word ending.`,
    currentSearch.id,
    [],
    { operation: "search", targetWord: searchWord },
  );

  for (let i = 0; i < searchWord.length; i++) {
    const char = searchWord[i];
    if (!currentSearch.children.has(char)) {
      found = false;
      addStep(
        22,
        `Path broken at character '${char}'`,
        `Current node '${currentSearch.char}' has no child link for '${char}'. Search for "${searchWord}" terminates early with false.`,
        currentSearch.id,
        [...searchEdges],
        { operation: "search", targetWord: searchWord, char, found: false },
      );
      break;
    }

    const nextNode = currentSearch.children.get(char)!;
    const edgeId = `${currentSearch.id}->${nextNode.id}`;
    searchEdges.push(edgeId);
    currentSearch = nextNode;

    addStep(
      23,
      `Traverse child link for '${char}'`,
      `Character '${char}' matched. Advancing down the Trie branch to check subsequent characters of "${searchWord}".`,
      currentSearch.id,
      [...searchEdges],
      { operation: "search", targetWord: searchWord, char },
    );
  }

  if (found) {
    const isComplete = currentSearch.isEndOfWord;
    addStep(
      24,
      isComplete
        ? `Exact key "${searchWord}" verified`
        : `"${searchWord}" is only an incomplete prefix`,
      isComplete
        ? `Matched all characters of "${searchWord}" and verified is_end_of_word flag is true. Return search success.`
        : `Matched all characters of "${searchWord}", but terminal node is not marked as a word ending. Return search failure.`,
      currentSearch.id,
      [...searchEdges],
      { operation: "search", targetWord: searchWord, found: isComplete },
    );
  }

  let currentPrefix = rootTrieNode;
  const prefixEdges: string[] = [];
  let prefixFound = true;

  addStep(
    27,
    `Verify prefix existence for "${prefixToSearch}"`,
    `Checking if any stored key begins with prefix "${prefixToSearch}". Only path presence is required; word-ending flags are ignored.`,
    currentPrefix.id,
    [],
    { operation: "startsWith", prefix: prefixToSearch },
  );

  for (let i = 0; i < prefixToSearch.length; i++) {
    const char = prefixToSearch[i];
    if (!currentPrefix.children.has(char)) {
      prefixFound = false;
      addStep(
        30,
        `Prefix path broken at character '${char}'`,
        `Node '${currentPrefix.char}' has no child for '${char}'. No stored word contains prefix "${prefixToSearch}". Return startsWith failure.`,
        currentPrefix.id,
        [...prefixEdges],
        { operation: "startsWith", prefix: prefixToSearch, char, found: false },
      );
      break;
    }

    const nextNode = currentPrefix.children.get(char)!;
    const edgeId = `${currentPrefix.id}->${nextNode.id}`;
    prefixEdges.push(edgeId);
    currentPrefix = nextNode;

    addStep(
      31,
      `Match prefix character '${char}'`,
      `Character '${char}' matched in Trie. Moving down to verify remaining characters of prefix "${prefixToSearch}".`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: "startsWith", prefix: prefixToSearch, char },
    );
  }

  if (prefixFound) {
    addStep(
      32,
      `Prefix "${prefixToSearch}" verified`,
      `Successfully traversed all characters of prefix "${prefixToSearch}". At least one word in the Trie shares this prefix. Return startsWith success.`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: "startsWith", prefix: prefixToSearch, found: true },
    );
  }

  return steps;
};
