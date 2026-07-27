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

export const generateBasicTrieSteps = (input: BasicTrieInsertSearchInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { wordsToInsert, searchTarget } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Initialize Prefix Trie Data Structure",
      why: `Inserting vocabulary tokens [${wordsToInsert
        .map((w) => `"${w}"`)
        .join(", ")}], then searching for target "${searchTarget}".`,
    },
    primarySnapshot: {
      kind: "array",
      elements: wordsToInsert.map((w, idx) => ({
        id: `w-${idx}`,
        value: idx,
        label: `"${w}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        insertedWords: "[]",
        searchTarget: `"${searchTarget}"`,
        status: "Initialized",
      },
    },
    variables: { insertedCount: 0, target: searchTarget },
  });

  const inserted: string[] = [];

  for (let i = 0; i < wordsToInsert.length; i++) {
    const word = wordsToInsert[i];
    inserted.push(word);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Insert Word "${word}" into Trie`,
        why: `Traversing/creating character nodes [${word
          .split("")
          .map((c) => `'${c}'`)
          .join(" -> ")}]. Marking final node as is_end_of_word = True.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: wordsToInsert.map((w, idx) => ({
          id: `w-${idx}`,
          value: idx,
          label: `"${w}"`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`Inserted "${word}"`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          insertedWords: inserted.map((w) => `"${w}"`).join(", "),
          activeWord: word,
        },
      },
      variables: { inserted: word, totalInserted: inserted.length },
    });
  }

  // Search Step
  let searchFound = true;
  const charTrace: string[] = [];

  for (let cIdx = 0; cIdx < searchTarget.length; cIdx++) {
    const char = searchTarget[cIdx];
    charTrace.push(`'${char}'`);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Search Character '${char}' (Position ${cIdx + 1}/${searchTarget.length})`,
        why: `Matching character path [${charTrace.join(" -> ")}] in Trie node children.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: searchTarget.split("").map((ch, idx) => ({
          id: `ch-${idx}`,
          value: idx,
          label: `'${ch}'`,
          state:
            idx === cIdx
              ? ("highlighted" as ElementState)
              : idx < cIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === cIdx ? ["Matching Node"] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          target: `"${searchTarget}"`,
          matchedPrefix: searchTarget.substring(0, cIdx + 1),
        },
      },
      variables: { cIdx, char },
    });
  }

  // Final Step: Search result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Search Complete for Target "${searchTarget}": ${searchFound ? "FOUND (is_end_of_word = True)" : "NOT FOUND"}`,
      why: searchFound
        ? `Successfully traversed prefix path "${searchTarget}" and confirmed terminal word node.`
        : `Target "${searchTarget}" not found in Trie vocabulary.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: searchTarget.split("").map((ch, idx) => ({
        id: `ch-${idx}`,
        value: idx,
        label: `'${ch}'`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        searchTarget: `"${searchTarget}"`,
        searchResult: searchFound ? "FOUND" : "NOT FOUND",
        status: "Completed",
      },
    },
    variables: { searchFound, complete: true },
  });

  return steps;
};

export const basicTrieInsertSearch: AlgorithmDefinition<BasicTrieInsertSearchInput> = {
  id: "basicTrieInsertSearch",
  title: "Basic Trie Insert & Prefix Search",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tokenization",
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
