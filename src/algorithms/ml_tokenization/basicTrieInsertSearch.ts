import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface BasicTrieInsertSearchInput {
  wordsToInsert: string[];
  searchTarget: string;
}

export const DEFAULT_BASIC_TRIE_INPUT: BasicTrieInsertSearchInput = {
  wordsToInsert: ["app", "apple", "apply", "apt"],
  searchTarget: "apple",
};

export const BASIC_TRIE_CODE = `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class BasicTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        curr = self.root
        for char in word:
            if char not in curr.children:
                curr.children[char] = TrieNode()
            curr = curr.children[char]
        curr.is_end_of_word = True

    def search(self, word: str) -> bool:
        curr = self.root
        for char in word:
            if char not in curr.children:
                return False
            curr = curr.children[char]
        return curr.is_end_of_word`;

interface InternalTrieNode {
  id: string;
  char: string;
  isEndOfWord: boolean;
  children: Map<string, InternalTrieNode>;
  depth: number;
}

function buildGraphSnapshot(root: InternalTrieNode, activeId: string | null, pathIds: Set<string>) {
  const nodes: ElementState extends string
    ? Array<{
        id: string;
        label: string;
        x: number;
        y: number;
        state: ElementState;
      }>
    : never = [];
  const edges: Array<{
    from: string;
    to: string;
    isTraversed: boolean;
    isPath: boolean;
  }> = [];

  const getLeaves = (n: InternalTrieNode): InternalTrieNode[] => {
    if (n.children.size === 0) return [n];
    const leaves: InternalTrieNode[] = [];
    for (const child of n.children.values()) {
      leaves.push(...getLeaves(child));
    }
    return leaves;
  };

  const getTreeMaxDepth = (n: InternalTrieNode): number => {
    if (n.children.size === 0) return n.depth;
    let max = n.depth;
    for (const child of n.children.values()) {
      max = Math.max(max, getTreeMaxDepth(child));
    }
    return max;
  };

  const allLeaves = getLeaves(root);
  const leafCount = Math.max(allLeaves.length, 1);
  const canvasW = 800;
  const canvasH = 480;
  const marginX = 70;
  const marginY = 50;

  const stepX = leafCount > 1 ? (canvasW - 2 * marginX) / (leafCount - 1) : 0;
  const leafXMap = new Map<string, number>();

  if (leafCount === 1) {
    leafXMap.set(allLeaves[0].id, canvasW / 2);
  } else {
    allLeaves.forEach((leaf, idx) => {
      leafXMap.set(leaf.id, marginX + idx * stepX);
    });
  }

  const maxDepth = Math.max(getTreeMaxDepth(root), 1);
  const stepY = (canvasH - 2 * marginY) / Math.max(maxDepth, 1);

  const calculatePositions = (n: InternalTrieNode): number => {
    let x: number;
    if (n.children.size === 0) {
      x = leafXMap.get(n.id) ?? canvasW / 2;
    } else {
      const childXs: number[] = [];
      for (const child of n.children.values()) {
        childXs.push(calculatePositions(child));
      }
      x = childXs.reduce((a, b) => a + b, 0) / childXs.length;
    }

    const y = marginY + n.depth * stepY;

    let state: ElementState = "default";
    if (n.id === activeId) {
      state = "active";
    } else if (pathIds.has(n.id)) {
      state = "visited";
    } else if (n.isEndOfWord) {
      state = "sorted";
    }

    nodes.push({
      id: n.id,
      label: n.char === "ROOT" ? "ROOT" : `'${n.char}'`,
      x,
      y,
      state,
    });

    for (const child of n.children.values()) {
      const isPathEdge = pathIds.has(n.id) && pathIds.has(child.id);
      edges.push({
        from: n.id,
        to: child.id,
        isTraversed: pathIds.has(child.id),
        isPath: isPathEdge,
      });
    }

    return x;
  };

  calculatePositions(root);

  return {
    kind: "graph" as const,
    nodes,
    edges,
  };
}

export const generateBasicTrieSteps = (input: BasicTrieInsertSearchInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { wordsToInsert, searchTarget } = input;
  let stepIndex = 0;
  let nodeCounter = 0;

  const root: InternalTrieNode = {
    id: "node-root",
    char: "ROOT",
    isEndOfWord: false,
    children: new Map(),
    depth: 0,
  };

  // Step 0: Init root
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Initialize Prefix Trie Data Structure",
      why: `Instantiated BasicTrie root node. Vocabulary to insert: [${wordsToInsert
        .map((w) => `"${w}"`)
        .join(", ")}]; Search target: "${searchTarget}".`,
    },
    primarySnapshot: buildGraphSnapshot(root, root.id, new Set([root.id])),
    auxiliaryState: {
      customState: {
        insertedWords: "[]",
        searchTarget: `"${searchTarget}"`,
        status: "Initialized",
      },
    },
    variables: { totalWords: wordsToInsert.length, target: searchTarget },
  });

  const insertedWordsList: string[] = [];

  for (let i = 0; i < wordsToInsert.length; i++) {
    const word = wordsToInsert[i];
    let curr = root;
    const currentPathIds: string[] = [root.id];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Start inserting word "${word}" (Word ${i + 1}/${wordsToInsert.length})`,
        why: `Set pointer curr = root to traverse/insert character sequence [${word
          .split("")
          .map((c) => `'${c}'`)
          .join(" -> ")}].`,
      },
      primarySnapshot: buildGraphSnapshot(root, curr.id, new Set(currentPathIds)),
      auxiliaryState: {
        customState: {
          insertedWords: insertedWordsList.map((w) => `"${w}"`).join(", ") || "[]",
          activeWord: `"${word}"`,
          phase: "Insertion",
        },
      },
      variables: { currentWord: word, currNode: curr.char },
    });

    for (let cIdx = 0; cIdx < word.length; cIdx++) {
      const char = word[cIdx];

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 13,
        explanation: {
          what: `Check character '${char}' in curr.children`,
          why: `Inspecting child node pointers of '${curr.char}' for character '${char}' (Position ${cIdx + 1}/${word.length} of "${word}").`,
        },
        primarySnapshot: buildGraphSnapshot(root, curr.id, new Set(currentPathIds)),
        auxiliaryState: {
          customState: {
            insertedWords: insertedWordsList.map((w) => `"${w}"`).join(", ") || "[]",
            activeWord: `"${word}"`,
            currentChar: `'${char}'`,
            prefix: word.substring(0, cIdx + 1),
          },
        },
        variables: { currentWord: word, char, charIndex: cIdx },
      });

      if (!curr.children.has(char)) {
        nodeCounter++;
        const newNode: InternalTrieNode = {
          id: `node-${nodeCounter}`,
          char,
          isEndOfWord: false,
          children: new Map(),
          depth: curr.depth + 1,
        };
        curr.children.set(char, newNode);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 14,
          explanation: {
            what: `Create new TrieNode for character '${char}'`,
            why: `Character '${char}' was missing from curr.children; created new TrieNode '${char}' at depth ${newNode.depth}.`,
          },
          primarySnapshot: buildGraphSnapshot(
            root,
            newNode.id,
            new Set([...currentPathIds, newNode.id]),
          ),
          auxiliaryState: {
            customState: {
              insertedWords: insertedWordsList.map((w) => `"${w}"`).join(", ") || "[]",
              activeWord: `"${word}"`,
              createdChar: `'${char}'`,
            },
          },
          variables: { currentWord: word, newChar: char, newNodeId: newNode.id },
        });
      }

      curr = curr.children.get(char)!;
      currentPathIds.push(curr.id);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 15,
        explanation: {
          what: `Advance curr pointer to '${curr.char}'`,
          why: `Moved pointer curr = curr.children['${char}'] along path prefix "${word.substring(0, cIdx + 1)}".`,
        },
        primarySnapshot: buildGraphSnapshot(root, curr.id, new Set(currentPathIds)),
        auxiliaryState: {
          customState: {
            insertedWords: insertedWordsList.map((w) => `"${w}"`).join(", ") || "[]",
            activeWord: `"${word}"`,
            currNode: `'${curr.char}'`,
          },
        },
        variables: { currentWord: word, currNode: curr.char, prefix: word.substring(0, cIdx + 1) },
      });
    }

    curr.isEndOfWord = true;
    insertedWordsList.push(word);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Mark node '${curr.char}' as is_end_of_word = True`,
        why: `Finished inserting all characters of "${word}". Marked node '${curr.char}' as terminal word boundary.`,
      },
      primarySnapshot: buildGraphSnapshot(root, curr.id, new Set(currentPathIds)),
      auxiliaryState: {
        customState: {
          insertedWords: insertedWordsList.map((w) => `"${w}"`).join(", "),
          activeWord: `"${word}"`,
          status: `Inserted "${word}"`,
        },
      },
      variables: { currentWord: word, is_end_of_word: true },
    });
  }

  // Search Phase
  let searchCurr: InternalTrieNode | null = root;
  const searchPathIds: string[] = [root.id];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Start search for word "${searchTarget}"`,
      why: `Set pointer curr = root to query exact word match for target "${searchTarget}".`,
    },
    primarySnapshot: buildGraphSnapshot(root, root.id, new Set(searchPathIds)),
    auxiliaryState: {
      customState: {
        searchTarget: `"${searchTarget}"`,
        phase: "Search",
      },
    },
    variables: { searchTarget, currNode: "ROOT" },
  });

  let searchFound = false;

  for (let cIdx = 0; cIdx < searchTarget.length; cIdx++) {
    const char = searchTarget[cIdx];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 21,
      explanation: {
        what: `Check character '${char}' in curr.children`,
        why: `Inspecting child pointers of node '${searchCurr!.char}' for character '${char}' (Pos ${cIdx + 1}/${searchTarget.length}).`,
      },
      primarySnapshot: buildGraphSnapshot(root, searchCurr!.id, new Set(searchPathIds)),
      auxiliaryState: {
        customState: {
          searchTarget: `"${searchTarget}"`,
          currentChar: `'${char}'`,
          matchedPrefix: searchTarget.substring(0, cIdx),
        },
      },
      variables: { searchTarget, char, charIndex: cIdx },
    });

    if (!searchCurr!.children.has(char)) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 22,
        explanation: {
          what: `Character '${char}' not found: return False`,
          why: `Child node for character '${char}' missing under node '${searchCurr!.char}'. Target "${searchTarget}" is not in Trie.`,
        },
        primarySnapshot: buildGraphSnapshot(root, searchCurr!.id, new Set(searchPathIds)),
        auxiliaryState: {
          customState: {
            searchTarget: `"${searchTarget}"`,
            searchResult: "False",
            status: "Search Failed",
          },
        },
        variables: { searchTarget, missingChar: char, result: false },
      });
      searchCurr = null;
      break;
    }

    searchCurr = searchCurr!.children.get(char)!;
    searchPathIds.push(searchCurr.id);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Advance curr pointer to '${searchCurr.char}'`,
        why: `Matched character '${char}'; moved pointer to node '${searchCurr.char}' along prefix "${searchTarget.substring(0, cIdx + 1)}".`,
      },
      primarySnapshot: buildGraphSnapshot(root, searchCurr.id, new Set(searchPathIds)),
      auxiliaryState: {
        customState: {
          searchTarget: `"${searchTarget}"`,
          matchedPrefix: searchTarget.substring(0, cIdx + 1),
          currNode: `'${searchCurr.char}'`,
        },
      },
      variables: { searchTarget, currNode: searchCurr.char },
    });
  }

  if (searchCurr !== null) {
    searchFound = searchCurr.isEndOfWord;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 24,
      explanation: {
        what: `Return curr.is_end_of_word (${searchFound ? "True" : "False"})`,
        why: searchFound
          ? `Reached node '${searchCurr.char}' for "${searchTarget}" with is_end_of_word = True. Target exists as an exact word!`
          : `Reached node '${searchCurr.char}' for "${searchTarget}", but is_end_of_word = False. "${searchTarget}" is only a prefix, not a complete word.`,
      },
      primarySnapshot: buildGraphSnapshot(root, searchCurr.id, new Set(searchPathIds)),
      auxiliaryState: {
        customState: {
          searchTarget: `"${searchTarget}"`,
          searchResult: searchFound ? "True" : "False",
          status: "Completed",
        },
      },
      variables: { searchTarget, is_end_of_word: searchCurr.isEndOfWord, result: searchFound },
    });
  }

  return steps;
};

export const basicTrieInsertSearch: AlgorithmDefinition<BasicTrieInsertSearchInput> = {
  id: "basic-trie-insert-search",
  title: "Basic Trie Insert & Prefix Search",
  topicIds: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Easy",
  description:
    "Standard Prefix Trie (Reorder Tree) insertion and search operations. Serves as the fundamental building block for subword token vocabulary lookup, prefix matching, and wordpiece tokenization in NLP models.\n\nInput Format:\n- wordsToInsert: Array of vocabulary strings to populate into Trie.\n- searchTarget: Target word string to query.\n\nOutput Format:\n- Returns boolean true if searchTarget exists as a complete word in Trie, false otherwise.\n\nEdge Cases & Constraints:\n- Prefix match vs exact word: Requires is_end_of_word flag to distinguish 'app' from 'apple'.",
  constraints: ["wordsToInsert strings contain standard ASCII or UTF-8 characters."],
  examples: [
    {
      kind: "basic",
      title: "Insert and Search Exact Word 'apple'",
      inputDisplay: "words = ['app', 'apple', 'apply', 'apt'], target = 'apple'",
      outputDisplay: "Result: True",
      input: DEFAULT_BASIC_TRIE_INPUT,
      output: "True",
      explanation: "Inserts 4 words and verifies 'apple' is present.",
    },
    {
      kind: "complex",
      title: "Prefix Exists but Not End-of-Word ('appl')",
      inputDisplay: "target = 'appl'",
      outputDisplay: "Result: False",
      input: {
        ...DEFAULT_BASIC_TRIE_INPUT,
        searchTarget: "appl",
      },
      output: "False",
      explanation: "'appl' is a valid prefix path but is_end_of_word is False.",
    },
    {
      kind: "negative",
      title: "Missing Character Path ('banana')",
      inputDisplay: "target = 'banana'",
      outputDisplay: "Result: False",
      input: {
        ...DEFAULT_BASIC_TRIE_INPUT,
        searchTarget: "banana",
      },
      output: "False",
      explanation: "Character 'b' is missing from root node children.",
    },
  ],
  defaultInput: DEFAULT_BASIC_TRIE_INPUT,
  code: BASIC_TRIE_CODE,
  timeComplexity: {
    best: "O(L)",
    average: "O(L)",
    worst: "O(L)",
  },
  spaceComplexity: "O(V * L)",
  complexityAnalysis: {
    time: "O(L) insertion and search time where L is the length of the word string, independent of total vocabulary size V.",
    space: "O(V * L) space to store Trie nodes and character child pointers.",
  },
  topicGuide: {
    overview:
      "Prefix Tries (Fredkin, 1960) store strings as character paths where shared prefixes share ancestor nodes. In subword tokenizers (WordPiece, BPE, SentencePiece), Tries enable O(L) dictionary lookups regardless of whether the vocabulary has 30,000 or 1,000,000 tokens.",
    sections: [
      {
        heading: "Core Concept & Node Structuring",
        body: "Each TrieNode contains a dictionary/array of child pointers `children[char]` and boolean `is_end_of_word`. Common prefixes (e.g. 'app' in 'apple' and 'apply') share the same physical nodes.",
      },
      {
        heading: "Systems & Memory Optimization",
        body: "Standard pointer-based Tries have high memory overhead. Production systems use Double-Array Tries (DAT) or Radix Trees (patricia tries) to compress linear chains into flat integer arrays.",
      },
      {
        heading: "Role in ML Tokenization",
        body: "Tries enable greedy longest-prefix matching during inference and fast candidate generation during subword lattice construction.",
      },
    ],
    keyTerms: [
      {
        term: "Prefix Trie",
        definition:
          "Tree data structure where nodes represent individual characters along string paths.",
      },
      {
        term: "is_end_of_word Flag",
        definition:
          "Boolean attribute marking nodes that represent complete valid vocabulary words.",
      },
      {
        term: "Double-Array Trie (DAT)",
        definition: "Flat array compression technique reducing Trie memory pointer overhead.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "Fredkin's Trie Data Structure (CACM 1960)" },
  ],
  generateSteps: generateBasicTrieSteps,
};
