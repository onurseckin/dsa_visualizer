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
    'Create the empty root node',
    'We start with a single root that stands for the empty string — every word we insert will grow a path of characters down from here.',
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
      `Start inserting "${word}"`,
      `We begin at the root and walk down one character of "${word}" at a time, creating branches only where the path doesn't exist yet.`,
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
          `Create a new node for '${char}'`,
          `No child for '${char}' exists on this path yet, so we grow the tree here — character ${i + 1} of "${word}" is the point where it diverges from everything stored so far.`,
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
          `Reuse the existing '${char}' node`,
          `A '${char}' child is already here from an earlier word, so we simply step into it — shared prefixes share nodes, which is the trie's whole space-saving trick.`,
          current.id,
          [...traversedEdges],
          { operation: 'insert', word, char, created: false }
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
    `Search for "${searchWord}"`,
    `We go back to the root and follow the exact character path for "${searchWord}" — the word is stored only if the path exists and ends on a marked node.`,
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
        `Stop — no '${char}' child here`,
        `Node '${currentSearch.char}' has no child for '${char}', so "${searchWord}" was never inserted — the search returns False.`,
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
      `Follow the '${char}' edge`,
      `The child for '${char}' exists, so we step down into it and keep matching "${searchWord}" one character at a time.`,
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
        ? `Confirm "${searchWord}" is stored`
        : `"${searchWord}" is only a prefix`,
      isComplete
        ? `We matched every character and landed on a node flagged as a word ending, so search returns True.`
        : `We matched all the characters, but this node was never marked as a word ending — "${searchWord}" is just the start of a longer word, so search returns False.`,
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
    `Check the prefix "${prefix}"`,
    `starts_with only asks whether some word begins with "${prefix}", so we walk the same path from the root — this time no end-of-word flag is needed.`,
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
        `Stop — the path breaks at '${char}'`,
        `There is no child for '${char}' here, so no stored word starts with "${prefix}" — starts_with returns False.`,
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
      `Match prefix character '${char}'`,
      `The '${char}' child exists, so we step into it — so far every character of the prefix agrees with what's stored.`,
      currentPrefix.id,
      [...prefixEdges],
      { operation: 'startsWith', prefix, char }
    );
  }

  if (prefixFound) {
    addStep(
      32,
      `Confirm prefix "${prefix}" exists`,
      `We walked the whole prefix without falling off the tree, so at least one stored word starts with "${prefix}" — starts_with returns True. Every operation here cost one node per character, which is where the O(L) bound comes from.`,
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
    'A Trie (Prefix Tree) is a tree-like data structure for storing strings so that words with a common prefix share a path. Each edge represents one character, which makes insertion, exact word search, and prefix matching (the basis of autocomplete) all cost O(L) — one step per character.',
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
  complexityAnalysis: {
    time: 'Insert, search, and starts_with all walk one node per character, so each operation costs O(L) where L is the length of the word or prefix. The cost never depends on how many words the trie holds — we just follow (or create) one child link per letter. That is why best, average, and worst case are all the same.',
    space: 'The tree itself is the memory cost: in the worst case no words share prefixes and we store one node per character, O(N * L) for N words of length L. Shared prefixes let words reuse nodes, so real tries are usually much smaller.',
  },
  defaultInput: DEFAULT_TRIE_INPUT,
  generateSteps: generateTriePrefixTreeSteps,
};
