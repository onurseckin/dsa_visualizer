import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BpeTokenizerInput {
  text: string;
  numMerges: number;
}

export const BPE_TOKENIZER_CODE = `def bpe_tokenize(text: str, num_merges: int) -> tuple[list[str], list[tuple[str, str]]]:
    words = text.split()
    vocab = [list(w) + ["</w>"] for w in words]
    merges = []
    
    for iteration in range(num_merges):
        # Count adjacent token pair frequencies across corpus
        pair_counts = {}
        for word in vocab:
            for i in range(len(word) - 1):
                pair = (word[i], word[i+1])
                pair_counts[pair] = pair_counts.get(pair, 0) + 1
                
        if not pair_counts:
            break
            
        best_pair = max(pair_counts, key=pair_counts.get)
        if pair_counts[best_pair] < 2:
            break  # Stop if no pair frequency > 1
            
        merges.append(best_pair)
        target_pair = best_pair[0] + best_pair[1]
        
        # Merge best pair in vocabulary tokens
        new_vocab = []
        for word in vocab:
            new_word = []
            i = 0
            while i < len(word):
                if i < len(word) - 1 and (word[i], word[i+1]) == best_pair:
                    new_word.append(target_pair)
                    i += 2
                else:
                    new_word.append(word[i])
                    i += 1
            new_vocab.append(new_word)
        vocab = new_vocab
        
    flat_tokens = [t for w in vocab for t in w]
    return flat_tokens, merges`;

export const DEFAULT_BPE_TOKENIZER_INPUT: BpeTokenizerInput = {
  text: "hug hugging hugger",
  numMerges: 3,
};

export const generateBpeTokenizerSteps = (input: BpeTokenizerInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawWords = input.text.trim().split(/\s+/).filter(Boolean);
  let vocab: string[][] = rawWords.map((w) => [...w.split(""), "</w>"]);
  const merges: Array<[string, string]> = [];

  const getSnapshotElements = (
    currentVocab: string[][],
    mergedPair?: [string, string],
  ): ArrayElement[] => {
    const elements: ArrayElement[] = [];
    let idx = 0;

    currentVocab.forEach((wordTokens) => {
      wordTokens.forEach((token) => {
        const isMerged = mergedPair !== undefined && token === mergedPair[0] + mergedPair[1];
        elements.push({
          id: `tok-${idx++}`,
          value: token.length,
          state: isMerged ? "sorted" : "default",
          pointers: [token],
        });
      });
    });

    return elements;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentVocab: string[][],
    mergedPair?: [string, string],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: getSnapshotElements(currentVocab, mergedPair),
      },
      auxiliaryState: {
        customState: {
          text: input.text,
          vocab: currentVocab.map((w) => w.join(" | ")).join(" || "),
          merges: merges.map((m) => `'${m[0]}'+'${m[1]}'`).join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Byte-Pair Encoding (BPE) Subword Tokenizer",
    `Target text: "${input.text}". Splitting into initial character tokens with '</w>' end-of-word markers. Max merges: ${input.numMerges}.`,
    { numMerges: input.numMerges, numWords: rawWords.length },
    vocab,
  );

  for (let iter = 0; iter < input.numMerges; iter++) {
    const pairCounts = new Map<string, number>();

    vocab.forEach((word) => {
      for (let i = 0; i < word.length - 1; i++) {
        const pairKey = `${word[i]}|${word[i + 1]}`;
        pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
      }
    });

    if (pairCounts.size === 0) {
      addStep(
        15,
        "No adjacent pairs remaining to merge",
        "Vocabulary contains no adjacent token pairs.",
        { iteration: iter },
        vocab,
      );
      break;
    }

    let bestPairKey = "";
    let maxCount = -1;

    for (const [key, count] of pairCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestPairKey = key;
      }
    }

    if (maxCount < 2) {
      addStep(
        20,
        `Stop condition reached at iteration ${iter}: highest pair frequency = ${maxCount}`,
        `No pair appears at least 2 times. Halting BPE merge iterations.`,
        { iteration: iter, maxCount },
        vocab,
      );
      break;
    }

    const [t1, t2] = bestPairKey.split("|");
    const mergedPair: [string, string] = [t1, t2];
    merges.push(mergedPair);
    const targetToken = t1 + t2;

    addStep(
      18,
      `Iteration ${iter + 1}: Most frequent pair is ('${t1}', '${t2}') with count=${maxCount}`,
      `Selected pair ('${t1}', '${t2}') for vocabulary merge into single subword token '${targetToken}'.`,
      { iteration: iter + 1, pair1: t1, pair2: t2, count: maxCount, newToken: targetToken },
      vocab,
      mergedPair,
    );

    // Apply merge
    const newVocab: string[][] = vocab.map((word) => {
      const newWord: string[] = [];
      let i = 0;
      while (i < word.length) {
        if (i < word.length - 1 && word[i] === t1 && word[i + 1] === t2) {
          newWord.push(targetToken);
          i += 2;
        } else {
          newWord.push(word[i]);
          i += 1;
        }
      }
      return newWord;
    });

    vocab = newVocab;

    addStep(
      34,
      `Merged '${t1}' + '${t2}' -> '${targetToken}' across corpus`,
      `Updated vocabulary tokens: [${vocab.map((w) => w.join("")).join(", ")}].`,
      { iteration: iter + 1, newToken: targetToken, totalMerges: merges.length },
      vocab,
      mergedPair,
    );
  }

  const finalTokens = vocab.flat();

  addStep(
    38,
    `BPE Subword Tokenization Complete`,
    `Final subword vocabulary tokens: [${finalTokens.map((t) => `'${t}'`).join(", ")}]. Total merges executed: ${merges.length}.`,
    { totalTokens: finalTokens.length, mergesExecuted: merges.length },
    vocab,
  );

  return steps;
};

const BPE_TOKENIZER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "pair_counts[pair] = len(pair)",
    "if pair_counts[best_pair] == 0: break",
    "words = text.to_lowercase()",
    "vocab = [w.split() for w in words]",
  ],
  hints: [
    {
      line: 7,
      hint: "Count frequencies of all adjacent subword pairs across words in corpus.",
    },
    {
      line: 18,
      hint: "Find the most frequent adjacent pair to merge into a single vocabulary subword.",
    },
    {
      line: 28,
      hint: "Replace occurrences of the selected pair in vocabulary words with the merged token.",
    },
  ],
  lineExplanations: {
    1: "Defines Byte-Pair Encoding subword tokenizer training & application function.",
    7: "Counts adjacent pair frequencies across all words in the text corpus.",
    18: "Extracts pair with maximum occurrence frequency.",
    20: "Halts merging when no adjacent pair occurs more than once.",
    28: "Applies vocabulary pair replacement across all tokenized words.",
    38: "Returns flattened subword tokens list and executed merge rules.",
  },
};

export const bpeTokenizer: AlgorithmDefinition<BpeTokenizerInput> = {
  id: "bpe-tokenizer",
  title: "Byte-Pair Encoding Subword Tokenizer",
  category: "ml_tokenization",
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  description:
    "Constructs a subword vocabulary and tokenizes text using Byte-Pair Encoding (BPE), iteratively merging the most frequent adjacent pair of characters/tokens.",
  constraints: ["len(text) > 0", "numMerges >= 1"],
  examples: [
    {
      kind: "basic",
      title: "Basic Corpus Subword Merges",
      inputDisplay: "text = 'hug hugging hugger', numMerges = 3",
      outputDisplay:
        "tokens = ['hug</w>', 'hug', 'g', 'i', 'n', 'g</w>', 'hug', 'g', 'e', 'r</w>']",
      input: DEFAULT_BPE_TOKENIZER_INPUT,
      output: "['hug</w>', 'hug', 'g', 'i', 'n', 'g</w>', 'hug', 'g', 'e', 'r</w>']",
      explanation:
        "Iterative merges count 'h'+'u' -> 'hu', then 'hu'+'g' -> 'hug', creating subword 'hug'.",
    },
    {
      kind: "complex",
      title: "Common Subword Prefix Extraction ('low')",
      inputDisplay: "text = 'low lower newest lowest', numMerges = 4",
      outputDisplay: "subwords include 'lo', 'low', 'est</w>'",
      input: {
        text: "low lower newest lowest",
        numMerges: 4,
      },
      output: "subwords learned: ['lo', 'low', 'est</w>']",
      explanation:
        "BPE extracts high-frequency subword prefixes 'lo' and 'low' and suffix 'est</w>' across vocabulary.",
    },
    {
      kind: "negative",
      title: "Unique Characters (No Merges Possible)",
      inputDisplay: "text = 'a b c d', numMerges = 3",
      outputDisplay: "tokens = ['a', '</w>', 'b', '</w>', 'c', '</w>', 'd', '</w>'], 0 merges",
      input: {
        text: "a b c d",
        numMerges: 3,
      },
      output: "0 merges executed",
      explanation:
        "All characters are distinct with frequency 1 (< 2), so 0 merges occur and search halts early.",
    },
  ],
  code: BPE_TOKENIZER_CODE,
  timeComplexity: {
    best: "O(K * N)",
    average: "O(K * N)",
    worst: "O(K * N * V)",
  },
  spaceComplexity: "O(N + K)",
  complexityAnalysis: {
    time: "Each of the K merge iterations scans the N text corpus tokens to count pair frequencies and update vocabulary words in linear time.",
    space: "Stores current subword token array and learned merge rules in auxiliary memory.",
  },
  topicGuide: {
    overview:
      "Byte-Pair Encoding (BPE) is the core tokenization algorithm behind modern Transformer language models (GPT-2/3/4, LLaMA, RoBERTa, Tiktoken). It bridges character-level and word-level tokenization, preventing Out-Of-Vocabulary (OOV) errors while keeping vocabulary sizes manageable (typically 32k - 100k tokens).",
    sections: [
      {
        heading: "Tokenization Spectrum",
        body: "Word-level tokenization suffers from huge OOV issues with rare or misspelled words. Character-level tokenization creates extremely long sequences that strain attention context windows. BPE learns optimal subword units automatically from corpus statistics.",
      },
      {
        heading: "Subword Compression in LLMs",
        body: "Common words (e.g. 'the', 'algorithm') become single tokens, while rare words are broken into subwords (e.g. 'un' + 'believ' + 'able'), balancing compression efficiency and sequence length.",
      },
    ],
    keyTerms: [
      {
        term: "Subword Tokenization",
        definition:
          "Breaking words into variable-length sub-strings based on character frequency statistics.",
      },
      {
        term: "Tiktoken / BPE",
        definition: "Fast BPE tokenization implementation used in OpenAI models.",
      },
    ],
  },
  trivia: BPE_TOKENIZER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 5" }],
  defaultInput: DEFAULT_BPE_TOKENIZER_INPUT,
  generateSteps: generateBpeTokenizerSteps,
};
