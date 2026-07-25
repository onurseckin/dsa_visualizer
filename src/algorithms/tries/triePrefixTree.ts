import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface TriePrefixTreeInput {
  wordsToInsert: string[];
  searchWord: string;
  prefixToSearch: string;
}

export const TRIE_PREFIX_TREE_CODE = `class TrieNode {
  children = {};
  isEndOfWord = false;
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  search(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return node.isEndOfWord;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return true;
  }
}`;

export const DEFAULT_TRIE_INPUT: TriePrefixTreeInput = {
  wordsToInsert: ['cat', 'car', 'dog'],
  searchWord: 'car',
  prefixToSearch: 'ca',
};

interface InternalTrieNode {
  id: string;
  char: string;
  isEndOfWord: boolean;
  children: Map<string, InternalTrieNode>;
}

export const generateTriePrefixTreeSteps = (
  input: TriePrefixTreeInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  let nodeCounter = 0;

  const rootTrieNode: InternalTrieNode = {
    id: 'trie-root',
    char: 'ROOT',
    isEndOfWord: false,
    children: new Map(),
  };

  const snapshotGraph = (
    activeNodeId?: string,
    highlightedEdges: string[] = []
  ): { nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    const layoutNode = (
      node: InternalTrieNode,
      depth: number,
      xMin: number,
      xMax: number
    ) => {
      const cx = (xMin + xMax) / 2;
      const cy = 40 + depth * 70;

      let state = node.isEndOfWord ? 'pivot' : 'default';
      if (activeNodeId && node.id === activeNodeId) {
        state = 'active';
      }

      nodes.push({
        id: node.id,
        label: node.char,
        x: cx,
        y: cy,
        state: state as GraphNodeItem['state'],
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
    extraVars: Record<string, string | number | boolean> = {}
  ) => {
    const { nodes, edges } = snapshotGraph(activeNodeId, highlightedEdges);
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'graph',
        nodes,
        edges,
      },
      auxiliaryState: {
        customState: {
          insertedWords: input.wordsToInsert.join(', '),
          searchWord: input.searchWord,
          prefixToSearch: input.prefixToSearch,
        },
      },
      variables: extraVars,
    });
  };

  addStep(
    7,
    'Initialize Trie Data Structure',
    'Root node created.',
    'trie-root',
    [],
    { status: 'Initialized' }
  );

  // 1. Insert words
  for (const word of input.wordsToInsert) {
    let current = rootTrieNode;
    const traversedEdges: string[] = [];

    addStep(
      11,
      `Start inserting word "${word}"`,
      `Starting at ROOT node to insert "${word}".`,
      current.id,
      [],
      { operation: 'insert', word }
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
          `Create new TrieNode for character '${char}' (index ${i} of "${word}")`,
          `Node for '${char}' did not exist. Created new child node.`,
          current.id,
          [...traversedEdges],
          { operation: 'insert', word, char, created: true }
        );
      } else {
        const existingNode = current.children.get(char)!;
        const edgeId = `${current.id}->${existingNode.id}`;
        traversedEdges.push(edgeId);
        current = existingNode;

        addStep(
          15,
          `Follow existing node for character '${char}'`,
          `Node for '${char}' already exists. Transitioning down trie.`,
          current.id,
          [...traversedEdges],
          { operation: 'insert', word, char, created: false }
        );
      }
    }

    current.isEndOfWord = true;
    addStep(
      18,
      `Mark node '${current.char}' as endOfWord for "${word}"`,
      `Finished inserting word "${word}". Marked endOfWord = true.`,
      current.id,
      [...traversedEdges],
      { operation: 'insert', word, isEndOfWord: true }
    );
  }

  // 2. Search for word
  const searchWord = input.searchWord;
  let currentSearch = rootTrieNode;
  const searchEdges: string[] = [];
  let found = true;

  addStep(
    22,
    `Search for word "${searchWord}"`,
    `Starting search at ROOT node for "${searchWord}".`,
    currentSearch.id,
    [],
    { operation: 'search', targetWord: searchWord }
  );

  for (let i = 0; i < searchWord.length; i++) {
    const char = searchWord[i];
    if (!currentSearch.children.has(char)) {
      found = false;
      addStep(
        25,
        `Character '${char}' not found in Trie!`,
        `Child for '${char}' does not exist. Search failed.`,
        currentSearch.id,
        [...searchEdges],
        { operation: 'search', targetWord: searchWord, char, found: false }
      );
      break;
    }

    const nextNode = currentSearch.children.get(char)!;
    const edgeId = `${currentSearch.id}->${nextNode.id}`;
    searchEdges.push(edgeId);
    currentSearch = nextNode;

    addStep(
      26,
      `Traverse edge for character '${char}'`,
      `Found child node '${char}'. Moving to next node.`,
      currentSearch.id,
      [...searchEdges],
      { operation: 'search', targetWord: searchWord, char }
    );
  }

  if (found) {
    const isComplete = currentSearch.isEndOfWord;
    addStep(
      28,
      isComplete
        ? `Word "${searchWord}" found in Trie!`
        : `Prefix "${searchWord}" exists, but isEndOfWord is false`,
      isComplete
        ? `All characters matched and node has isEndOfWord = true.`
        : `Node reached but not marked as end of word. Search returns false.`,
      currentSearch.id,
      [...searchEdges],
      { operation: 'search', targetWord: searchWord, found: isComplete }
    );
  }

  // 3. startsWith prefix
  const prefix = input.prefixToSearch;
  let currentPrefix = rootTrieNode;
  const prefixEdges: string[] = [];
  let prefixFound = true;

  addStep(
    31,
    `Check startsWith prefix "${prefix}"`,
    `Starting prefix check at ROOT for "${prefix}".`,
    currentPrefix.id,
    [],
    { operation: 'startsWith', prefix }
  );

  for (let i = 0; i < prefix.length; i++) {
    const char = prefix[i];
    if (!currentPrefix.children.has(char)) {
      prefixFound = false;
      addStep(
        34,
        `Prefix character '${char}' missing in Trie!`,
        `Child for '${char}' does not exist. startsWith returns false.`,
        currentPrefix.id,
        [...prefixEdges],
        { operation: 'startsWith', prefix, char, found: false }
      );
      break;
    }

    const nextNode = currentPrefix.children.get(char)!;
    const edgeId = `${currentPrefix.id}->${nextNode.id}`;
    prefixEdges.push(edgeId);
    currentPrefix = nextNode;

    addStep(
      35,
      `Matched prefix character '${char}'`,
      `Moving down prefix path for character '${char}'.`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: 'startsWith', prefix, char }
    );
  }

  if (prefixFound) {
    addStep(
      37,
      `Prefix "${prefix}" exists in Trie!`,
      `All characters of prefix "${prefix}" matched in Trie. startsWith returns true.`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: 'startsWith', prefix, found: true }
    );
  }

  return steps;
};

export const triePrefixTree: AlgorithmDefinition<TriePrefixTreeInput> = {
  id: 'trie-prefix-tree',
  title: 'Trie (Prefix Tree)',
  category: 'data-structures',
  difficulty: 'Medium',
  description:
    'A tree-like data structure used for efficient storage and retrieval of strings. Supports fast word insertion, full word searching, and prefix matching.',
  code: TRIE_PREFIX_TREE_CODE,
  timeComplexity: {
    best: 'O(L)',
    average: 'O(L)',
    worst: 'O(L)',
  },
  spaceComplexity: 'O(N * L)',
  defaultInput: DEFAULT_TRIE_INPUT,
  generateSteps: generateTriePrefixTreeSteps,
};
