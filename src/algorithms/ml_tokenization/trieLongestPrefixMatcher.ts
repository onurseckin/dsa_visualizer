import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface TrieLongestPrefixMatcherInput {
  text: string;
  vocab: string[];
}

export const DEFAULT_TRIE_LONGEST_PREFIX_INPUT: TrieLongestPrefixMatcherInput = {
  text: "unwantedly",
  vocab: ["un", "unwant", "unwanted", "want", "ed", "ly"],
};

export const TRIE_LONGEST_PREFIX_CODE = `def trie_longest_prefix_match(text: str, vocab: list[str]) -> list[str]:
    """
    Greedy Longest-Prefix Trie Matcher (WordPiece Tokenizer).
    Repeatedly finds the longest matching subword token in vocabulary starting at current index.
    If no subword matches, emits single character or OOV symbol.
    """
    vocab_set = set(vocab)
    tokens = []
    idx = 0

    while idx < len(text):
        longest_match = ""

        # Search for longest matching subword starting at idx
        for end in range(idx + 1, len(text) + 1):
            sub = text[idx:end]
            if sub in vocab_set:
                longest_match = sub

        if longest_match:
            tokens.append(longest_match)
            idx += len(longest_match)
        else:
            # Fallback to single character
            tokens.append(text[idx])
            idx += 1

    return tokens`;

export const generateTrieLongestPrefixSteps = (
  input: TrieLongestPrefixMatcherInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, vocab } = input;
  let stepIndex = 0;

  const vocabSet = new Set(vocab);
  const tokens: string[] = [];
  let idx = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Greedy Longest-Prefix Trie Matcher (WordPiece)",
      why: `Tokenizing text "${text}" using Trie vocabulary containing ${vocab.length} tokens: [${vocab
        .map((v) => `"${v}"`)
        .join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: text.split("").map((ch, i) => ({
        id: `c-${i}`,
        value: i,
        label: `'${ch}'`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        vocabSize: String(vocab.length),
        status: "Initialized",
      },
    },
    variables: { textLen: text.length, vocabSize: vocab.length },
  });

  while (idx < text.length) {
    let longestMatch = "";

    for (let end = idx + 1; end <= text.length; end++) {
      const sub = text.substring(idx, end);
      if (vocabSet.has(sub)) {
        longestMatch = sub;
      }
    }

    if (longestMatch) {
      tokens.push(longestMatch);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Greedy Match at Position ${idx}: Longest Token "${longestMatch}" (len = ${longestMatch.length})`,
          why: `Found longest prefix match "${longestMatch}" in Trie vocabulary starting at index ${idx}. Advanced pointer by ${longestMatch.length}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: text.split("").map((ch, i) => ({
            id: `c-${i}`,
            value: i,
            label: `'${ch}'`,
            state:
              i >= idx && i < idx + longestMatch.length
                ? ("active" as ElementState)
                : i < idx
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
            pointers: i === idx ? [`Token "${longestMatch}"`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            position: String(idx),
            longestMatch: `"${longestMatch}"`,
            tokensSoFar: tokens.map((t) => `"${t}"`).join(", "),
          },
        },
        variables: { idx, longestMatch },
      });

      idx += longestMatch.length;
    } else {
      const fallbackChar = text[idx];
      tokens.push(fallbackChar);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 20,
        explanation: {
          what: `No Vocab Match at Position ${idx}: Single Character Fallback '${fallbackChar}'`,
          why: `No subword in vocabulary matches prefix starting at '${fallbackChar}'. Emitted single character fallback token.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: text.split("").map((ch, i) => ({
            id: `c-${i}`,
            value: i,
            label: `'${ch}'`,
            state:
              i === idx
                ? ("highlighted" as ElementState)
                : i < idx
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
            pointers: i === idx ? [`Fallback '${fallbackChar}'`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            position: String(idx),
            fallbackChar: `'${fallbackChar}'`,
            tokensSoFar: tokens.map((t) => `"${t}"`).join(", "),
          },
        },
        variables: { idx, fallbackChar },
      });

      idx += 1;
    }
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Longest-Prefix Tokenization Complete: ${tokens.length} Tokens Produced`,
      why: `Final tokenization: [${tokens.map((t) => `"${t}"`).join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: tokens.map((tok, rank) => ({
        id: `res-${rank}`,
        value: rank,
        label: `"${tok}"`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        finalTokens: tokens.map((t) => `"${t}"`).join(" + "),
        totalTokens: String(tokens.length),
        status: "Completed",
      },
    },
    variables: { totalTokens: tokens.length, complete: true },
  });

  return steps;
};

export const trieLongestPrefixMatcher: AlgorithmDefinition<TrieLongestPrefixMatcherInput> = {
  id: "trieLongestPrefixMatcher",
  title: "Trie Longest-Prefix Matcher (WordPiece)",
  category: "ml_tokenization",
  categories: ["ml_tokenization", "tries_and_strings"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tokenization",
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
