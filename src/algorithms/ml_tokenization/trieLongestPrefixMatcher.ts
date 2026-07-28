import {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphNodeItem,
  GraphEdgeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";

export interface TrieLongestPrefixMatcherInput {
  text: string;
  vocab: string[];
}

export const DEFAULT_TRIE_LONGEST_PREFIX_INPUT: TrieLongestPrefixMatcherInput = {
  text: "unwantedly",
  vocab: ["un", "unwant", "unwanted", "want", "ed", "ly"],
};

export const TRIE_LONGEST_PREFIX_CODE = `def trie_longest_prefix_match(text: str, vocab: list[str]) -> list[str]:
    vocab_set = set(vocab)
    tokens = []
    idx = 0

    while idx < len(text):
        longest_match = ""

        for end in range(idx + 1, len(text) + 1):
            sub = text[idx:end]
            if sub in vocab_set:
                longest_match = sub

        if longest_match:
            tokens.append(longest_match)
            idx += len(longest_match)
        else:
            tokens.append(text[idx])
            idx += 1

    return tokens`;

interface TrieGraphNode {
  id: string;
  prefix: string;
  char: string;
  isEnd: boolean;
  depth: number;
  children: Map<string, TrieGraphNode>;
}

function buildTrieGraph(vocab: string[]): TrieGraphNode {
  const root: TrieGraphNode = {
    id: "trie-root",
    prefix: "",
    char: "ROOT",
    isEnd: false,
    depth: 0,
    children: new Map(),
  };

  let nodeCounter = 0;

  for (const word of vocab) {
    let curr = root;
    let currentPrefix = "";
    for (const ch of word) {
      currentPrefix += ch;
      if (!curr.children.has(ch)) {
        nodeCounter++;
        const newNode: TrieGraphNode = {
          id: `trie-${nodeCounter}`,
          prefix: currentPrefix,
          char: ch,
          isEnd: false,
          depth: curr.depth + 1,
          children: new Map(),
        };
        curr.children.set(ch, newNode);
      }
      curr = curr.children.get(ch)!;
    }
    curr.isEnd = true;
  }

  return root;
}

function countLeaves(node: TrieGraphNode): number {
  if (node.children.size === 0) return 1;
  let count = 0;
  for (const child of node.children.values()) {
    count += countLeaves(child);
  }
  return count;
}

interface TrieLayout {
  positions: Map<string, { x: number; y: number }>;
}

function computeTrieGraphLayout(root: TrieGraphNode): TrieLayout {
  const positions = new Map<string, { x: number; y: number }>();
  const totalLeaves = countLeaves(root);

  const canvasWidth = 900;
  const slotW = Math.min(120, Math.max(60, 800 / Math.max(1, totalLeaves)));
  const startX = (canvasWidth - totalLeaves * slotW) / 2 + slotW / 2;

  let currentLeafIdx = 0;

  function layoutNode(node: TrieGraphNode): number {
    const y = 45 + node.depth * 58;
    if (node.children.size === 0) {
      const x = startX + currentLeafIdx * slotW;
      currentLeafIdx++;
      positions.set(node.id, { x, y });
      return x;
    }

    const childXs: number[] = [];
    for (const child of node.children.values()) {
      childXs.push(layoutNode(child));
    }
    const x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    positions.set(node.id, { x, y });
    return x;
  }

  layoutNode(root);
  return { positions };
}

export const generateTrieLongestPrefixSteps = (
  input: TrieLongestPrefixMatcherInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, vocab } = input;
  let stepIndex = 0;

  const trieRoot = buildTrieGraph(vocab);
  const layout = computeTrieGraphLayout(trieRoot);

  const getSnapshot = (
    activePrefix: string | null,
    matchedPrefixes: Set<string>,
    traversedPath: Set<string>,
  ): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    const traverse = (node: TrieGraphNode) => {
      const pos = layout.positions.get(node.id) || { x: 450, y: 40 };
      let state: ElementState = "default";
      if (node.prefix === activePrefix) {
        state = "active";
      } else if (matchedPrefixes.has(node.prefix) && node.prefix !== "") {
        state = "pivot";
      } else if (traversedPath.has(node.prefix) && node.prefix !== "") {
        state = "visited";
      } else if (node.isEnd) {
        state = "sorted";
      }

      nodes.push({
        id: node.id,
        label: node.char === "ROOT" ? "ROOT" : node.char,
        state,
        x: pos.x,
        y: pos.y,
      });

      for (const child of node.children.values()) {
        const isTraversed = traversedPath.has(child.prefix);
        const isPath = matchedPrefixes.has(child.prefix);
        edges.push({
          from: node.id,
          to: child.id,
          isTraversed,
          isPath,
        });
        traverse(child);
      }
    };

    traverse(trieRoot);
    return { kind: "graph", nodes, edges };
  };

  const vocabSet = new Set(vocab);
  const tokens: string[] = [];
  let idx = 0;

  // Line 2: vocab_set = set(vocab)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Initialize Trie vocabulary lookup set",
      why: `Loaded ${vocab.length} subword tokens into Trie vocabulary: [${vocab
        .map((v) => `"${v}"`)
        .join(", ")}].`,
    },
    primarySnapshot: getSnapshot(null, new Set(), new Set()),
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        vocabSize: String(vocab.length),
        idx: "0",
        tokens: "[]",
        status: "Initialized",
      },
    },
    variables: { text, vocabSize: vocab.length, tokens: [] },
  });

  // Line 3: tokens = []
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initialize empty tokens array",
      why: "Created empty list `tokens` to store matched subwords.",
    },
    primarySnapshot: getSnapshot(null, new Set(), new Set()),
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        idx: "0",
        tokens: "[]",
      },
    },
    variables: { text, tokens: [] },
  });

  // Line 4: idx = 0
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize character index pointer `idx = 0`",
      why: `Matching cursor starts at index 0, pointing to character '${text[0] || ""}' in text "${text}".`,
    },
    primarySnapshot: getSnapshot(null, new Set(), new Set()),
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        idx: "0",
        currChar: text[0] ? `'${text[0]}'` : "EOF",
        tokens: "[]",
      },
    },
    variables: { idx: 0, textLen: text.length },
  });

  while (idx < text.length) {
    // Line 6: while idx < len(text)
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Check loop condition: idx (${idx}) < len(text) (${text.length})`,
        why: `Pointer idx = ${idx} is within bounds of text "${text}". Proceeding to find greedy subword match.`,
      },
      primarySnapshot: getSnapshot(null, new Set(), new Set()),
      auxiliaryState: {
        customState: {
          idx: String(idx),
          currChar: `'${text[idx]}'`,
          remainingText: `"${text.substring(idx)}"`,
          tokens: `[${tokens.map((t) => `"${t}"`).join(", ")}]`,
        },
      },
      variables: { idx, textLen: text.length, remainingText: text.substring(idx) },
    });

    let longestMatch = "";

    // Line 7: longest_match = ""
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: 'Reset candidate longest_match = ""',
        why: `Starting greedy Trie prefix lookup starting at text index ${idx} ('${text[idx]}').`,
      },
      primarySnapshot: getSnapshot(null, new Set(), new Set()),
      auxiliaryState: {
        customState: {
          idx: String(idx),
          longestMatch: '""',
          tokens: `[${tokens.map((t) => `"${t}"`).join(", ")}]`,
        },
      },
      variables: { idx, longestMatch: "" },
    });

    const traversedPath = new Set<string>();

    for (let end = idx + 1; end <= text.length; end++) {
      // Line 9: for end in range(idx + 1, len(text) + 1)
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Iterate end pointer to ${end} (end index range [${idx + 1}..${text.length}])`,
          why: `Testing prefix substring candidate from index ${idx} to ${end}.`,
        },
        primarySnapshot: getSnapshot(null, new Set(), new Set(traversedPath)),
        auxiliaryState: {
          customState: {
            idx: String(idx),
            end: String(end),
            longestMatch: `"${longestMatch}"`,
          },
        },
        variables: { idx, end, longestMatch },
      });

      const sub = text.substring(idx, end);
      traversedPath.add(sub);

      // Line 10: sub = text[idx:end]
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Extract substring candidate sub = text[${idx}:${end}] -> "${sub}"`,
          why: `Extracted substring candidate "${sub}" (length ${sub.length}).`,
        },
        primarySnapshot: getSnapshot(sub, new Set(), new Set(traversedPath)),
        auxiliaryState: {
          customState: {
            idx: String(idx),
            end: String(end),
            sub: `"${sub}"`,
            longestMatch: `"${longestMatch}"`,
          },
        },
        variables: { idx, end, sub, longestMatch },
      });

      const isMatch = vocabSet.has(sub);

      // Line 11: if sub in vocab_set
      if (isMatch) {
        longestMatch = sub;
        const matchedPrefixes = new Set<string>([longestMatch]);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 11,
          explanation: {
            what: `Check "if sub in vocab_set": Substring "${sub}" IS in vocabulary!`,
            why: `Found matching subword token "${sub}" in Trie vocabulary. Updating longest_match to "${sub}".`,
          },
          primarySnapshot: getSnapshot(sub, matchedPrefixes, new Set(traversedPath)),
          auxiliaryState: {
            customState: {
              sub: `"${sub}"`,
              inVocab: "true",
              longestMatch: `"${longestMatch}"`,
            },
          },
          variables: { sub, inVocab: true, longestMatch },
        });

        // Line 12: longest_match = sub
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 12,
          explanation: {
            what: `Update longest_match = "${longestMatch}"`,
            why: `Recorded "${longestMatch}" as the current longest prefix match starting at index ${idx}.`,
          },
          primarySnapshot: getSnapshot(sub, matchedPrefixes, new Set(traversedPath)),
          auxiliaryState: {
            customState: {
              longestMatch: `"${longestMatch}"`,
              matchLen: String(longestMatch.length),
            },
          },
          variables: { longestMatch, matchLen: longestMatch.length },
        });
      } else {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 11,
          explanation: {
            what: `Check "if sub in vocab_set": Substring "${sub}" NOT in vocabulary`,
            why: `Substring "${sub}" does not exist as a token in Trie vocabulary. Keeping current longest_match = "${longestMatch}".`,
          },
          primarySnapshot: getSnapshot(sub, new Set(), new Set(traversedPath)),
          auxiliaryState: {
            customState: {
              sub: `"${sub}"`,
              inVocab: "false",
              longestMatch: `"${longestMatch}"`,
            },
          },
          variables: { sub, inVocab: false, longestMatch },
        });
      }
    }

    // Line 14: if longest_match:
    if (longestMatch) {
      const matchedPrefixes = new Set<string>([longestMatch]);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Check "if longest_match": Found valid prefix "${longestMatch}" (len ${longestMatch.length})`,
          why: `Greedy selection found valid vocabulary token "${longestMatch}".`,
        },
        primarySnapshot: getSnapshot(null, matchedPrefixes, new Set()),
        auxiliaryState: {
          customState: {
            longestMatch: `"${longestMatch}"`,
            idx: String(idx),
          },
        },
        variables: { longestMatch, matchFound: true },
      });

      tokens.push(longestMatch);

      // Line 15: tokens.append(longest_match)
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 15,
        explanation: {
          what: `Append "${longestMatch}" to tokens list`,
          why: `Added subword token "${longestMatch}" to output. Tokens so far: [${tokens.map((t) => `"${t}"`).join(", ")}].`,
        },
        primarySnapshot: getSnapshot(null, matchedPrefixes, new Set()),
        auxiliaryState: {
          customState: {
            tokens: `[${tokens.map((t) => `"${t}"`).join(", ")}]`,
            latestToken: `"${longestMatch}"`,
          },
        },
        variables: { tokens: [...tokens], latestToken: longestMatch },
      });

      idx += longestMatch.length;

      // Line 16: idx += len(longest_match)
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Advance pointer idx by len("${longestMatch}") = ${longestMatch.length} -> idx = ${idx}`,
          why: `Moved search cursor forward by ${longestMatch.length} characters to index ${idx}.`,
        },
        primarySnapshot: getSnapshot(null, new Set(), new Set()),
        auxiliaryState: {
          customState: {
            idx: String(idx),
            tokens: `[${tokens.map((t) => `"${t}"`).join(", ")}]`,
          },
        },
        variables: { idx, textLen: text.length },
      });
    } else {
      const fallbackChar = text[idx];

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Check "if longest_match": No vocabulary prefix match starting at index ${idx}`,
          why: `No token in Trie vocabulary matches prefix starting at '${fallbackChar}'. Falling back to single character emission.`,
        },
        primarySnapshot: getSnapshot(null, new Set(), new Set()),
        auxiliaryState: {
          customState: {
            idx: String(idx),
            fallbackChar: `'${fallbackChar}'`,
            longestMatch: '""',
          },
        },
        variables: { longestMatch: "", matchFound: false, fallbackChar },
      });

      tokens.push(fallbackChar);

      // Line 18: tokens.append(text[idx])
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 18,
        explanation: {
          what: `Append single fallback character token '${fallbackChar}' to tokens`,
          why: `Emitted single-character fallback token '${fallbackChar}'. Tokens so far: [${tokens.map((t) => `"${t}"`).join(", ")}].`,
        },
        primarySnapshot: getSnapshot(null, new Set(), new Set()),
        auxiliaryState: {
          customState: {
            tokens: `[${tokens.map((t) => `"${t}"`).join(", ")}]`,
            fallbackChar: `'${fallbackChar}'`,
          },
        },
        variables: { tokens: [...tokens], fallbackChar },
      });

      idx += 1;

      // Line 19: idx += 1
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 19,
        explanation: {
          what: `Advance pointer idx by 1 -> idx = ${idx}`,
          why: `Moved search cursor forward by 1 character to index ${idx}.`,
        },
        primarySnapshot: getSnapshot(null, new Set(), new Set()),
        auxiliaryState: {
          customState: {
            idx: String(idx),
            tokens: `[${tokens.map((t) => `"${t}"`).join(", ")}]`,
          },
        },
        variables: { idx, textLen: text.length },
      });
    }
  }

  // Line 21: return tokens
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Trie Longest-Prefix Matching Complete! Return ${tokens.length} tokens`,
      why: `Final tokenization of "${text}": [${tokens.map((t) => `"${t}"`).join(", ")}].`,
    },
    primarySnapshot: getSnapshot(null, new Set(), new Set()),
    auxiliaryState: {
      customState: {
        finalTokens: tokens.map((t) => `"${t}"`).join(" + "),
        totalTokens: String(tokens.length),
        status: "Completed",
      },
    },
    variables: { totalTokens: tokens.length, finalTokens: tokens, complete: true },
  });

  return steps;
};

export const trieLongestPrefixMatcher: AlgorithmDefinition<TrieLongestPrefixMatcherInput> = {
  id: "trie-longest-prefix-matcher",
  title: "Trie Longest-Prefix Matcher (WordPiece)",
  topicIds: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Medium",
  description:
    "Executes greedy Longest-Prefix Matching over a Trie vocabulary (WordPiece tokenization engine, Wu et al., 2016 / Devlin et al., 2018 BERT). At each character position, the algorithm traverses the Trie to find the maximum-length subword token present in the vocabulary.\n\nInput Format:\n- text: Input text string.\n- vocab: List of subword vocabulary strings.\n\nOutput Format:\n- Returns array of longest matching subword token strings `[t_1, t_2, ..., t_K]`.\n\nEdge Cases & Constraints:\n- Overlapping prefix tokens ('un' vs 'unwanted'): Always selects the longest prefix ('unwanted').",
  constraints: ["vocab contains unique string subword tokens."],
  examples: [
    {
      kind: "basic",
      title: "Greedy Longest Prefix Match for 'unwantedly'",
      inputDisplay: "text = 'unwantedly', vocab = ['un', 'unwant', 'unwanted', 'want', 'ed', 'ly']",
      outputDisplay: "Tokens: ['unwanted', 'ly']",
      input: DEFAULT_TRIE_LONGEST_PREFIX_INPUT,
      output: "['unwanted', 'ly']",
      explanation:
        "Selects longest matching prefix 'unwanted' over shorter prefixes 'un' and 'unwant'.",
    },
    {
      kind: "complex",
      title: "Fallback to Shorter Prefixes",
      inputDisplay: "text = 'unwantedly', vocab without 'unwanted'",
      outputDisplay: "Tokens: ['unwant', 'ed', 'ly']",
      input: {
        text: "unwantedly",
        vocab: ["un", "unwant", "want", "ed", "ly"],
      },
      output: "['unwant', 'ed', 'ly']",
      explanation: "Selects next longest matching subword 'unwant'.",
    },
    {
      kind: "negative",
      title: "Character Fallback for Unknown Word",
      inputDisplay: "text = 'xyz', empty vocab",
      outputDisplay: "Tokens: ['x', 'y', 'z']",
      input: { text: "xyz", vocab: [] },
      output: "['x', 'y', 'z']",
      explanation: "Falls back to single character tokens when no vocabulary prefixes match.",
    },
  ],
  defaultInput: DEFAULT_TRIE_LONGEST_PREFIX_INPUT,
  code: TRIE_LONGEST_PREFIX_CODE,
  timeComplexity: {
    best: "O(N * L_max)",
    average: "O(N * L_max)",
    worst: "O(N * L_max)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N * L_max) greedy scan time where N is text length and L_max is maximum subword token length in vocabulary.",
    space: "O(N) auxiliary space to store final token output list.",
  },
  topicGuide: {
    overview:
      "WordPiece tokenization (Schuster & Nakajima 2012, BERT Devlin et al. 2018) uses greedy longest-prefix matching to tokenize text. Given a vocabulary stored in a Trie, WordPiece repeatedly picks the longest prefix matching subword token, appending `##` continuation markers for non-initial subwords.",
    sections: [
      {
        heading: "Core Concept & Greedy Maximal Matching",
        body: "Starting at text index i, the Trie is traversed as far as possible to find the longest substring text[i..j] present in vocabulary V.",
      },
      {
        heading: "WordPiece vs BPE Matching",
        body: "While BPE tokenization performs merge rules in priority rank order, WordPiece tokenization performs deterministic left-to-right longest-prefix matching.",
      },
      {
        heading: "Trie Memory Optimization",
        body: "Using a Trie data structure ensures that checking for all prefix matches starting at index i executes in a single linear pass of length L_max.",
      },
    ],
    keyTerms: [
      {
        term: "Longest-Prefix Matching",
        definition:
          "Greedy heuristic selecting the maximum length vocabulary subword starting at current position.",
      },
      {
        term: "WordPiece",
        definition: "Subword tokenization algorithm used by BERT and Electra model architectures.",
      },
      {
        term: "Subword Continuation Marker (##)",
        definition: "Prefix appended to non-initial subword tokens in WordPiece vocabularies.",
      },
    ],
  },
  sources: [
    {
      type: "ml_infra",
      kind: "ml_infra",
      label: "BERT WordPiece Tokenizer (Devlin et al. NAACL 2019)",
    },
  ],
  generateSteps: generateTrieLongestPrefixSteps,
};
