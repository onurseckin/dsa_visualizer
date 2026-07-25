import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
} from '../../types/dsa';

export interface TriePrefixTreeInput {
  wordsToInsert: string[];
  searchWord: string;
  prefixToSearch: string;
}

export const TRIE_PREFIX_TREE_CODE = `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True`;

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

      let state: ElementState = node.isEndOfWord ? 'pivot' : 'default';
      if (activeNodeId && node.id === activeNodeId) {
        state = 'active';
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
    8,
    'Initialize Trie Data Structure',
    'Root node created for the prefix tree. The root represents an empty string prefix.',
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
          `Node for '${char}' did not exist. Created new child node and connected edge.`,
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
          `Node for '${char}' already exists in Trie. Reusing shared prefix path.`,
          current.id,
          [...traversedEdges],
          { operation: 'insert', word, char, created: false }
        );
      }
    }

    current.isEndOfWord = true;
    addStep(
      16,
      `Mark node '${current.char}' as endOfWord for "${word}"`,
      `Finished inserting word "${word}". Marked is_end_of_word = True on terminal node.`,
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
    19,
    `Search for word "${searchWord}"`,
    `Starting search at ROOT node for exact word "${searchWord}".`,
    currentSearch.id,
    [],
    { operation: 'search', targetWord: searchWord }
  );

  for (let i = 0; i < searchWord.length; i++) {
    const char = searchWord[i];
    if (!currentSearch.children.has(char)) {
      found = false;
      addStep(
        22,
        `Character '${char}' not found in Trie!`,
        `Child for '${char}' does not exist under node '${currentSearch.char}'. Search for word "${searchWord}" fails.`,
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
      23,
      `Traverse edge for character '${char}'`,
      `Found matching child node '${char}'. Traversing down Trie.`,
      currentSearch.id,
      [...searchEdges],
      { operation: 'search', targetWord: searchWord, char }
    );
  }

  if (found) {
    const isComplete = currentSearch.isEndOfWord;
    addStep(
      24,
      isComplete
        ? `Word "${searchWord}" found in Trie!`
        : `Prefix "${searchWord}" exists, but is_end_of_word is False`,
      isComplete
        ? `All characters matched and target node has is_end_of_word = True. Returns True.`
        : `Node reached but not marked as end of word. Search returns False because "${searchWord}" is only a proper prefix of another word.`,
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
    27,
    `Check starts_with prefix "${prefix}"`,
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
        30,
        `Prefix character '${char}' missing in Trie!`,
        `Child for '${char}' does not exist. starts_with returns False.`,
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
      31,
      `Matched prefix character '${char}'`,
      `Moving down prefix path for character '${char}'.`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: 'startsWith', prefix, char }
    );
  }

  if (prefixFound) {
    addStep(
      32,
      `Prefix "${prefix}" exists in Trie!`,
      `All characters of prefix "${prefix}" matched in Trie. starts_with returns True regardless of is_end_of_word.`,
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
  category: 'tries_and_strings',
  difficulty: 'Medium',
  description:
    'A Trie (Prefix Tree) is a tree-like data structure used for efficient key storage and retrieval. All descendants of a node share a common string prefix. Supports fast O(L) insertion, exact word search, and prefix matching (autocomplete).',
  constraints: [
    '1 <= wordsToInsert.length <= 100',
    '1 <= word.length <= 20',
    'Strings consist of lowercase English letters',
  ],
  examples: [
    {
      input: 'wordsToInsert = ["cat", "car", "dog"], searchWord = "car", prefixToSearch = "ca"',
      output: 'search("car") -> True, startsWith("ca") -> True',
      explanation: 'Words "cat" and "car" share the prefix "ca". Searching "car" finds terminal node with is_end_of_word = True.',
    },
  ],
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
