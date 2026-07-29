import type {
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import type { TriePrefixTreeInput, InternalTrieNode } from "./types";
import { DEFAULT_TRIE_INPUT } from "./types";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A Trie (Prefix Tree) is an efficient tree-based data structure used to store and retrieve string keys in O(L) time per operation where L is string length.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "active" },
        { id: "c", label: "c", x: 200, y: 110, state: "default" },
        { id: "d", label: "d", x: 400, y: 110, state: "default" },
        { id: "ca", label: "a", x: 200, y: 180, state: "default" },
        { id: "cat", label: "t", x: 150, y: 250, state: "pivot" },
        { id: "car", label: "r", x: 250, y: 250, state: "pivot" },
      ],
      edges: [
        { from: "root", to: "c", isTraversed: true },
        { from: "root", to: "d", isTraversed: false },
        { from: "c", to: "ca", isTraversed: true },
        { from: "ca", to: "cat", isTraversed: true },
        { from: "ca", to: "car", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Common Prefix Invariant: words sharing identical initial letter sequences (like 'cat' and 'car') share parent nodes down to their branching point.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "visited" },
        { id: "c", label: "c", x: 200, y: 110, state: "sorted" },
        { id: "d", label: "d", x: 400, y: 110, state: "default" },
        { id: "ca", label: "a", x: 200, y: 180, state: "sorted" },
        { id: "cat", label: "t", x: 150, y: 250, state: "pivot" },
        { id: "car", label: "r", x: 250, y: 250, state: "pivot" },
      ],
      edges: [
        { from: "root", to: "c", isTraversed: true },
        { from: "root", to: "d", isTraversed: false },
        { from: "c", to: "ca", isTraversed: true },
        { from: "ca", to: "cat", isTraversed: true },
        { from: "ca", to: "car", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Insert Method (insert(word)): traverses character by character from the root, creating a new child node only when a character branch does not already exist.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "visited" },
        { id: "c", label: "c", x: 200, y: 110, state: "visited" },
        { id: "d", label: "d", x: 400, y: 110, state: "active" },
        { id: "ca", label: "a", x: 200, y: 180, state: "default" },
        { id: "do", label: "o", x: 400, y: 180, state: "compare" },
      ],
      edges: [
        { from: "root", to: "c", isTraversed: false },
        { from: "root", to: "d", isTraversed: true },
        { from: "d", to: "do", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Terminal Marker (isEndOfWord): setting isEndOfWord = true on the final node marks the boundary of a complete word, distinguishing full words from prefixes.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "visited" },
        { id: "d", label: "d", x: 300, y: 110, state: "visited" },
        { id: "do", label: "o", x: 300, y: 180, state: "visited" },
        { id: "dog", label: "g", x: 300, y: 250, state: "pivot" },
      ],
      edges: [
        { from: "root", to: "d", isTraversed: true },
        { from: "d", to: "do", isTraversed: true },
        { from: "do", to: "dog", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Search Method (search(word)): walks matching child pointers down the trie and returns true if and only if the final character node exists and has isEndOfWord = true.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "visited" },
        { id: "c", label: "c", x: 200, y: 110, state: "visited" },
        { id: "ca", label: "a", x: 200, y: 180, state: "visited" },
        { id: "car", label: "r", x: 250, y: 250, state: "active" },
      ],
      edges: [
        { from: "root", to: "c", isTraversed: true },
        { from: "c", to: "ca", isTraversed: true },
        { from: "ca", to: "car", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "StartsWith Method (startsWith(prefix)): walks matching child pointers and returns true if all characters in the prefix exist, regardless of isEndOfWord.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "visited" },
        { id: "c", label: "c", x: 200, y: 110, state: "visited" },
        { id: "ca", label: "a", x: 200, y: 180, state: "active" },
      ],
      edges: [
        { from: "root", to: "c", isTraversed: true },
        { from: "c", to: "ca", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Trie performance is independent of dataset size N; operations depend strictly on string length L, making tries ideal for autocomplete and IP routing tables.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "sorted" },
        { id: "c", label: "c", x: 200, y: 110, state: "sorted" },
        { id: "d", label: "d", x: 400, y: 110, state: "sorted" },
        { id: "ca", label: "a", x: 200, y: 180, state: "sorted" },
        { id: "cat", label: "t", x: 150, y: 250, state: "sorted" },
        { id: "car", label: "r", x: 250, y: 250, state: "sorted" },
      ],
      edges: [
        { from: "root", to: "c", isTraversed: true },
        { from: "root", to: "d", isTraversed: true },
        { from: "c", to: "ca", isTraversed: true },
        { from: "ca", to: "cat", isTraversed: true },
        { from: "ca", to: "car", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Complexity Summary: Trie search, insert, and startsWith achieve optimal O(L) time and O(N * L) space bounds.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "root", label: "ROOT", x: 300, y: 40, state: "visited" },
        { id: "c", label: "c", x: 200, y: 110, state: "visited" },
        { id: "d", label: "d", x: 400, y: 110, state: "visited" },
        { id: "ca", label: "a", x: 200, y: 180, state: "visited" },
        { id: "cat", label: "t", x: 150, y: 250, state: "pivot" },
        { id: "car", label: "r", x: 250, y: 250, state: "pivot" },
      ],
      edges: [
        { from: "root", to: "c", isTraversed: true },
        { from: "root", to: "d", isTraversed: true },
        { from: "c", to: "ca", isTraversed: true },
        { from: "ca", to: "cat", isTraversed: true },
        { from: "ca", to: "car", isTraversed: true },
      ],
    },
  },
];

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

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.searchWord === DEFAULT_TRIE_INPUT.searchWord &&
      input.prefixToSearch === DEFAULT_TRIE_INPUT.prefixToSearch &&
      Array.isArray(input.wordsToInsert) &&
      input.wordsToInsert.length === DEFAULT_TRIE_INPUT.wordsToInsert.length);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const snapshotGraph = (
    activeNodeId?: string,
    highlightedEdges: string[] = [],
    overrideNodeStates: Map<string, ElementState> = new Map(),
  ): PrimaryVisualSnapshot => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    const layoutNode = (node: InternalTrieNode, depth: number, xMin: number, xMax: number) => {
      const cx = (xMin + xMax) / 2;
      const cy = 40 + depth * 70;

      let state: ElementState = node.isEndOfWord ? "pivot" : "default";
      if (overrideNodeStates.has(node.id)) {
        state = overrideNodeStates.get(node.id)!;
      } else if (activeNodeId && node.id === activeNodeId) {
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
    return {
      kind: "graph",
      nodes,
      edges,
    };
  };

  addStep(
    `Having established the mental model, let's now transition to our Trie operations for words: [${wordsToInsert.join(", ")}].`,
    snapshotGraph("trie-root", [], new Map([["trie-root", "compare"]])),
  );

  // Insert Phase
  for (const word of wordsToInsert) {
    let current = rootTrieNode;
    const traversedEdges: string[] = [];

    addStep(
      `Begin inserting word "${word}" starting at Trie root node.`,
      snapshotGraph(current.id, traversedEdges),
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
          `Allocated new Trie node for char '${char}' at depth ${i + 1} of word "${word}".`,
          snapshotGraph(current.id, traversedEdges),
        );
      } else {
        const childNode = current.children.get(char)!;
        const edgeId = `${current.id}->${childNode.id}`;
        traversedEdges.push(edgeId);
        current = childNode;

        addStep(
          `Reusing existing child node '${char}' at depth ${i + 1} for shared prefix of word "${word}".`,
          snapshotGraph(current.id, traversedEdges),
        );
      }
    }

    current.isEndOfWord = true;
    const endStates = new Map<string, ElementState>();
    endStates.set(current.id, "sorted");

    addStep(
      `Marked terminal node for word "${word}": set isEndOfWord = true on character node '${current.char}'.`,
      snapshotGraph(current.id, traversedEdges, endStates),
    );
  }

  // Search Phase
  let searchCurrent: InternalTrieNode | undefined = rootTrieNode;
  const searchEdges: string[] = [];
  let searchFound = true;

  addStep(
    `Begin search("${searchWord}"): traversing character nodes down the Trie.`,
    snapshotGraph(searchCurrent.id, searchEdges),
  );

  for (let i = 0; i < searchWord.length; i++) {
    const char = searchWord[i];
    const currNode: InternalTrieNode | undefined = searchCurrent;
    if (currNode && currNode.children.has(char)) {
      const childNode: InternalTrieNode = currNode.children.get(char)!;
      const edgeId = `${currNode.id}->${childNode.id}`;
      searchEdges.push(edgeId);
      searchCurrent = childNode;

      addStep(
        `Search matched character '${char}' at index ${i}: advanced to child node '${childNode.char}'.`,
        snapshotGraph(childNode.id, searchEdges),
      );
    } else {
      searchFound = false;
      const failState = new Map<string, ElementState>();
      if (currNode) failState.set(currNode.id, "swap");

      addStep(
        `Search failed at character '${char}': missing child node link under current Trie node. search("${searchWord}") returns false.`,
        snapshotGraph(currNode?.id, searchEdges, failState),
      );
      break;
    }
  }

  if (searchFound && searchCurrent) {
    const isTerminal = searchCurrent.isEndOfWord;
    const finalSearchState = new Map<string, ElementState>();
    finalSearchState.set(searchCurrent.id, isTerminal ? "sorted" : "compare");

    addStep(
      `Search completed for "${searchWord}": reached final node '${searchCurrent.char}' with isEndOfWord = ${isTerminal}. search("${searchWord}") returns ${isTerminal}.`,
      snapshotGraph(searchCurrent.id, searchEdges, finalSearchState),
    );
  }

  // StartsWith Phase
  let prefixCurrent: InternalTrieNode | undefined = rootTrieNode;
  const prefixEdges: string[] = [];
  let prefixFound = true;

  addStep(
    `Begin startsWith("${prefixToSearch}"): traversing prefix character nodes.`,
    snapshotGraph(prefixCurrent.id, prefixEdges),
  );

  for (let i = 0; i < prefixToSearch.length; i++) {
    const char = prefixToSearch[i];
    const currNode: InternalTrieNode | undefined = prefixCurrent;
    if (currNode && currNode.children.has(char)) {
      const childNode: InternalTrieNode = currNode.children.get(char)!;
      const edgeId = `${currNode.id}->${childNode.id}`;
      prefixEdges.push(edgeId);
      prefixCurrent = childNode;

      addStep(
        `Prefix matched character '${char}' at index ${i}: advanced to child node '${childNode.char}'.`,
        snapshotGraph(childNode.id, prefixEdges),
      );
    } else {
      prefixFound = false;
      const failState = new Map<string, ElementState>();
      if (currNode) failState.set(currNode.id, "swap");

      addStep(
        `Prefix match failed at character '${char}': missing child node link. startsWith("${prefixToSearch}") returns false.`,
        snapshotGraph(currNode?.id, prefixEdges, failState),
      );
      break;
    }
  }

  if (prefixFound && prefixCurrent) {
    const finalPrefixState = new Map<string, ElementState>();
    finalPrefixState.set(prefixCurrent.id, "sorted");

    addStep(
      `Prefix search completed for "${prefixToSearch}": all characters matched in Trie. startsWith("${prefixToSearch}") returns true.`,
      snapshotGraph(prefixCurrent.id, prefixEdges, finalPrefixState),
    );
  }

  return steps;
};

export default generateTriePrefixTreeSteps;
