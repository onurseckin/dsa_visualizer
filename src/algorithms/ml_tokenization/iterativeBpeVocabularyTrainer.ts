import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface IterativeBpeVocabularyTrainerInput {
  initialCorpus: Record<string, number>;
  targetVocabSize: number;
}

export const DEFAULT_ITERATIVE_BPE_TRAINER_INPUT: IterativeBpeVocabularyTrainerInput = {
  initialCorpus: {
    "l o w </w>": 5,
    "l o w e r </w>": 2,
    "n e w e s t </w>": 6,
    "w i d e s t </w>": 3,
  },
  targetVocabSize: 10,
};

export const ITERATIVE_BPE_TRAINER_CODE = `def train_bpe_vocabulary(initial_corpus: dict[str, int], target_vocab_size: int) -> tuple[list[tuple[str, str]], list[str]]:
    """
    Iterative Byte-Pair Encoding (BPE) Vocabulary Trainer.
    Repeatedly finds the most frequent adjacent symbol pair, adds it to the merge rule list,
    and updates the corpus words until target_vocab_size is reached.
    """
    corpus = {w: freq for w, freq in initial_corpus.items()}

    # Initialize base vocabulary with single characters
    vocab = set()
    for word_str in corpus:
        vocab.update(word_str.split())

    merges = []

    while len(vocab) < target_vocab_size:
        # Step 1: Count pair frequencies across current corpus
        pair_counts = {}
        for word_str, freq in corpus.items():
            symbols = word_str.split()
            for i in range(len(symbols) - 1):
                pair = (symbols[i], symbols[i + 1])
                pair_counts[pair] = pair_counts.get(pair, 0) + freq

        if not pair_counts:
            break

        # Step 2: Select most frequent pair
        best_pair = max(pair_counts.items(), key=lambda x: x[1])[0]
        merges.append(best_pair)
        new_token = best_pair[0] + best_pair[1]
        vocab.add(new_token)

        # Step 3: Replace best_pair in corpus words
        pair_str = f"{best_pair[0]} {best_pair[1]}"
        new_corpus = {}
        for word_str, freq in corpus.items():
            new_word = word_str.replace(pair_str, new_token)
            new_corpus[new_word] = freq

        corpus = new_corpus

    return merges, sorted(list(vocab))`;

export const generateIterativeBpeTrainerSteps = (
  input: IterativeBpeVocabularyTrainerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { initialCorpus, targetVocabSize } = input;
  let stepIndex = 0;

  let corpus = { ...initialCorpus };
  const vocabSet = new Set<string>();
  Object.keys(corpus).forEach((w) => w.split(" ").forEach((s) => vocabSet.add(s)));
  const merges: [string, string][] = [];

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Iterative BPE Vocabulary Trainer (Target Size = ${targetVocabSize})`,
      why: `Base character vocabulary contains ${vocabSet.size} unique symbols: [${Array.from(
        vocabSet,
      ).join(", ")}]. Training until vocab size reaches ${targetVocabSize}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Array.from(vocabSet).map((sym, idx) => ({
        id: `sym-${idx}`,
        value: idx,
        label: `"${sym}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        baseVocabSize: String(vocabSet.size),
        targetVocabSize: String(targetVocabSize),
        status: "Initialized",
      },
    },
    variables: { currentVocabSize: vocabSet.size, targetVocabSize },
  });

  while (vocabSet.size < targetVocabSize) {
    const pairCounts: Record<string, number> = {};

    for (const [wStr, freq] of Object.entries(corpus)) {
      const syms = wStr.split(" ");
      for (let i = 0; i < syms.length - 1; i++) {
        const pairKey = `${syms[i]},${syms[i + 1]}`;
        pairCounts[pairKey] = (pairCounts[pairKey] || 0) + freq;
      }
    }

    const pairEntries = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
    if (pairEntries.length === 0) break;

    const [bestPairStr, bestFreq] = pairEntries[0];
    const [p1, p2] = bestPairStr.split(",");
    const newToken = `${p1}${p2}`;

    merges.push([p1, p2]);
    vocabSet.add(newToken);

    // Replace in corpus
    const oldPairStr = `${p1} ${p2}`;
    const newCorpus: Record<string, number> = {};
    for (const [wStr, freq] of Object.entries(corpus)) {
      const updatedWord = wStr.split(oldPairStr).join(newToken);
      newCorpus[updatedWord] = freq;
    }
    corpus = newCorpus;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 24,
      explanation: {
        what: `BPE Merge Step ${merges.length}: Added Rule ("${p1}", "${p2}") -> "${newToken}" (count = ${bestFreq})`,
        why: `Merged pair ("${p1}", "${p2}") into new token "${newToken}". Vocabulary size expanded to ${vocabSet.size}/${targetVocabSize}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Array.from(vocabSet).map((tok, idx) => ({
          id: `tok-${idx}`,
          value: idx,
          label: `"${tok}"`,
          state: tok === newToken ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: tok === newToken ? [`New Token (${merges.length})`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          mergeRule: `("${p1}", "${p2}") -> "${newToken}"`,
          frequency: String(bestFreq),
          currentVocabSize: String(vocabSet.size),
          targetVocabSize: String(targetVocabSize),
          corpusSample: Object.keys(corpus).slice(0, 2).join(" | "),
        },
      },
      variables: { mergeStep: merges.length, newToken, vocabSize: vocabSet.size },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 35,
    explanation: {
      what: `BPE Training Complete: Final Vocabulary Size ${vocabSet.size}`,
      why: `Learned ${merges.length} merge rules: [${merges
        .map(([a, b]) => `("${a}","${b}")`)
        .join(", ")}]. Vocabulary ready for model tokenizer deployment.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Array.from(vocabSet).map((tok, rank) => ({
        id: `vocab-${rank}`,
        value: rank,
        label: `"${tok}"`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        finalVocabSize: String(vocabSet.size),
        totalMergeRules: String(merges.length),
        status: "Completed",
      },
    },
    variables: { totalMerges: merges.length, finalSize: vocabSet.size, complete: true },
  });

  return steps;
};

export const iterativeBpeVocabularyTrainer: AlgorithmDefinition<IterativeBpeVocabularyTrainerInput> =
  {
    id: "iterativeBpeVocabularyTrainer",
    title: "Iterative BPE Vocabulary Trainer",
    category: "ml_tokenization",
    categories: ["ml_tokenization"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tokenization",
    description:
      "Full iterative Byte-Pair Encoding (BPE) vocabulary training loop (Sennrich et al., 2016). Starts with a base character vocabulary, repeatedly identifies the most frequent adjacent symbol pair, appends a new merge rule to the vocabulary, and updates corpus words until reaching `targetVocabSize`.\n\nInput Format:\n- initialCorpus: Dictionary mapping word symbol strings to corpus frequency counts.\n- targetVocabSize: Target total vocabulary size V.\n\nOutput Format:\n- Returns tuple (learnedMergeRulesList, finalVocabularyList).\n\nEdge Cases & Constraints:\n- Target size smaller than base character vocabulary: Terminates immediately without merges.",
    constraints: ["targetVocabSize >= base character count."],
    examples: [
      {
        kind: "basic",
        title: "Train BPE Vocabulary to Target Size 10",
        inputDisplay: "initialCorpus (4 words), targetVocabSize = 10",
        outputDisplay:
          "Learned 3 merges: ('e','s') -> 'es', ('es','t') -> 'est', ('e','r') -> 'er'",
        input: DEFAULT_ITERATIVE_BPE_TRAINER_INPUT,
        output: "3 merge rules learned",
        explanation: "Iteratively adds most frequent pairs until vocabulary reaches size 10.",
      },
      {
        kind: "complex",
        title: "Small Target Size Equal to Base Vocab",
        inputDisplay: "targetVocabSize = 7",
        outputDisplay: "0 merge rules learned",
        input: {
          ...DEFAULT_ITERATIVE_BPE_TRAINER_INPUT,
          targetVocabSize: 7,
        },
        output: "0 merges",
        explanation: "Base characters already fill target vocabulary size of 7.",
      },
      {
        kind: "negative",
        title: "Single Word Corpus",
        inputDisplay: "initialCorpus = {'a b c </w>': 10}, targetVocabSize = 6",
        outputDisplay: "Learned merges ('a','b') -> 'ab', ('ab','c') -> 'abc'",
        input: {
          initialCorpus: { "a b c </w>": 10 },
          targetVocabSize: 6,
        },
        output: "2 merges",
        explanation: "Merges single word characters sequentially.",
      },
    ],
    defaultInput: DEFAULT_ITERATIVE_BPE_TRAINER_INPUT,
    code: ITERATIVE_BPE_TRAINER_CODE,
    timeComplexity: {
      best: "O(V * W * L)",
      average: "O(V * W * L)",
      worst: "O(V * W * L)",
    },
    spaceComplexity: "O(V + W * L)",
    complexityAnalysis: {
      time: "O(V * W * L) where V is target vocabulary merges, W is word count, and L is word length.",
      space: "O(V + W * L) auxiliary memory to store corpus dictionary and vocabulary set.",
    },
    topicGuide: {
      overview:
        "Iterative BPE training builds the subword merge table used by LLM tokenizers (RoBERTa, GPT-2, LLaMA). By greedily selecting the most frequent adjacent pair at each iteration, BPE learns subwords that capture common prefix, suffix, and word stem patterns.",
      sections: [
        {
          heading: "Core Concept & Greedy Merge Selection",
          body: "Starting with base characters, each iteration computes pair frequencies over current corpus states, selecting argmax_{(a,b)} count(a, b).",
        },
        {
          heading: "Corpus Rewriting Optimization",
          body: "Rewriting the corpus after each merge shrinks average word length L, accelerating subsequent pair counting passes.",
        },
        {
          heading: "Vocabulary Size Hyperparameter Trade-Offs",
          body: "Smaller vocabularies (e.g. 32k tokens) reduce embedding memory but result in longer sequence lengths. Larger vocabularies (e.g. 128k in LLaMA 3 or 200k in GPT-4o) reduce sequence token count, improving inference QPS.",
        },
      ],
      keyTerms: [
        {
          term: "Vocabulary Size (V)",
          definition: "Total number of discrete subword tokens recognized by a model tokenizer.",
        },
        {
          term: "BPE Merge List",
          definition: "Ordered sequence of pair substitution rules learned during training.",
        },
        {
          term: "Compression Ratio",
          definition: "Ratio of original character length to final token sequence length.",
        },
      ],
    },
    sources: [
      { type: "ml_infra", kind: "ml_infra", label: "BPE Vocabulary Training (Sennrich 2016)" },
    ],
    generateSteps: generateIterativeBpeTrainerSteps,
  };
