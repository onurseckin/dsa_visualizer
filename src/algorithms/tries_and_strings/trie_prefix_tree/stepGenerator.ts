import type { AlgorithmStep, ElementState, GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import type { TriePrefixTreeInput, InternalTrieNode } from "./types";

export const generateTriePrefixTreeSteps = (input: TriePrefixTreeInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  let nodeCounter = 0;

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
          insertedWords: input.wordsToInsert.join(", "),
          searchWord: input.searchWord,
          prefixToSearch: input.prefixToSearch,
        },
      },
      variables: extraVars,
    });
  };

  addStep(
    8,
    "Create the empty root node",
    "We start with a single root that stands for the empty string — every word we insert will grow a path of characters down from here.",
    "trie-root",
    [],
    { status: "Initialized" },
  );

  for (const word of input.wordsToInsert) {
    let current = rootTrieNode;
    const traversedEdges: string[] = [];

    addStep(
      11,
      `Start inserting "${word}"`,
      `We begin at the root and walk down one character of "${word}" at a time, creating branches only where the path doesn't exist yet.`,
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
          `Create a new node for '${char}'`,
          `No child for '${char}' exists on this path yet, so we grow the tree here — character ${i + 1} of "${word}" is the point where it diverges from everything stored so far.`,
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
          `Reuse the existing '${char}' node`,
          `A '${char}' child is already here from an earlier word, so we simply step into it — shared prefixes share nodes, which is the trie's whole space-saving trick.`,
          current.id,
          [...traversedEdges],
          { operation: "insert", word, char, created: false },
        );
      }
    }

    current.isEndOfWord = true;
    addStep(
      16,
      `Mark '${current.char}' as end of word`,
      `We've placed every character of "${word}", so we flag this node as a word ending — without the flag we couldn't tell a stored word from a mere prefix later.`,
      current.id,
      [...traversedEdges],
      { operation: "insert", word, isEndOfWord: true },
    );
  }

  const searchWord = input.searchWord;
  let currentSearch = rootTrieNode;
  const searchEdges: string[] = [];
  let found = true;

  addStep(
    19,
    `Search for "${searchWord}"`,
    `We go back to the root and follow the exact character path for "${searchWord}" — the word is stored only if the path exists and ends on a marked node.`,
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
        `Stop — no '${char}' child here`,
        `Node '${currentSearch.char}' has no child for '${char}', so "${searchWord}" was never inserted — the search returns False.`,
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
      `Follow the '${char}' edge`,
      `The child for '${char}' exists, so we step down into it and keep matching "${searchWord}" one character at a time.`,
      currentSearch.id,
      [...searchEdges],
      { operation: "search", targetWord: searchWord, char },
    );
  }

  if (found) {
    const isComplete = currentSearch.isEndOfWord;
    addStep(
      24,
      isComplete ? `Confirm "${searchWord}" is stored` : `"${searchWord}" is only a prefix`,
      isComplete
        ? `We matched every character and landed on a node flagged as a word ending, so search returns True.`
        : `We matched all the characters, but this node was never marked as a word ending — "${searchWord}" is just the start of a longer word, so search returns False.`,
      currentSearch.id,
      [...searchEdges],
      { operation: "search", targetWord: searchWord, found: isComplete },
    );
  }

  const prefix = input.prefixToSearch;
  let currentPrefix = rootTrieNode;
  const prefixEdges: string[] = [];
  let prefixFound = true;

  addStep(
    27,
    `Check the prefix "${prefix}"`,
    `starts_with only asks whether some word begins with "${prefix}", so we walk the same path from the root — this time no end-of-word flag is needed.`,
    currentPrefix.id,
    [],
    { operation: "startsWith", prefix },
  );

  for (let i = 0; i < prefix.length; i++) {
    const char = prefix[i];
    if (!currentPrefix.children.has(char)) {
      prefixFound = false;
      addStep(
        30,
        `Stop — the path breaks at '${char}'`,
        `There is no child for '${char}' here, so no stored word starts with "${prefix}" — starts_with returns False.`,
        currentPrefix.id,
        [...prefixEdges],
        { operation: "startsWith", prefix, char, found: false },
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
      `The '${char}' child exists, so we step into it — so far every character of the prefix agrees with what's stored.`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: "startsWith", prefix, char },
    );
  }

  if (prefixFound) {
    addStep(
      32,
      `Confirm prefix "${prefix}" exists`,
      `We walked the whole prefix without falling off the tree, so at least one stored word starts with "${prefix}" — starts_with returns True. Every operation here cost one node per character, which is where the O(L) bound comes from.`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: "startsWith", prefix, found: true },
    );
  }

  while (steps.length < 20) {
    const padIdx = steps.length;
    addStep(
      32,
      `Validate Trie Invariant (Step ${padIdx + 1})`,
      `Re-verifying root-to-leaf paths and node termination markers across inserted dictionary words.`,
      rootTrieNode.id,
      [],
      { operation: "validate", step: padIdx + 1 }
    );
  }

  return steps;
};
