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
  targetVocabSize: 14,
};

export const ITERATIVE_BPE_TRAINER_CODE = `def train_bpe_vocabulary(initial_corpus: dict[str, int], target_vocab_size: int) -> tuple[list[tuple[str, str]], list[str]]:
    corpus = {w: freq for w, freq in initial_corpus.items()}
    vocab = set()
    for word_str in corpus:
        vocab.update(word_str.split())
    merges = []
    while len(vocab) < target_vocab_size:
        pair_counts = {}
        for word_str, freq in corpus.items():
            symbols = word_str.split()
            for i in range(len(symbols) - 1):
                pair = (symbols[i], symbols[i + 1])
                pair_counts[pair] = pair_counts.get(pair, 0) + freq
        if not pair_counts:
            break
        best_pair = max(pair_counts.items(), key=lambda x: x[1])[0]
        merges.append(best_pair)
        new_token = best_pair[0] + best_pair[1]
        vocab.add(new_token)
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize corpus dictionary with ${Object.keys(corpus).length} words`,
      why: `Corpus loaded with initial frequencies: ${Object.entries(corpus)
        .map(([w, f]) => `"${w}": ${f}`)
        .join(", ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.keys(corpus).map((word, idx) => ({
        id: `word-${idx}`,
        value: idx,
        label: `"${word}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        corpusWords: String(Object.keys(corpus).length),
        targetVocabSize: String(targetVocabSize),
        status: "Corpus Loaded",
      },
    },
    variables: { wordCount: Object.keys(corpus).length, targetVocabSize },
  });

  const vocabSet = new Set<string>();
  Object.keys(corpus).forEach((w) => w.split(" ").forEach((s) => vocabSet.add(s)));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Extract initial base character vocabulary (${vocabSet.size} unique symbols)`,
      why: `Base characters found across corpus: [${Array.from(vocabSet)
        .map((s) => `"${s}"`)
        .join(", ")}]. Training goal is target size ${targetVocabSize}.`,
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
        status: "Base Vocabulary Formed",
      },
    },
    variables: { baseVocabSize: vocabSet.size, targetVocabSize },
  });

  const merges: [string, string][] = [];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Initialize empty merge rules list`,
      why: `Will record pair substitution rules as most frequent symbol pairs are iteratively merged.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Array.from(vocabSet).map((sym, idx) => ({
        id: `vocab-${idx}`,
        value: idx,
        label: `"${sym}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        mergesCount: "0",
        currentVocabSize: String(vocabSet.size),
        targetVocabSize: String(targetVocabSize),
      },
    },
    variables: { mergeCount: 0, currentVocabSize: vocabSet.size },
  });

  let iteration = 1;
  while (vocabSet.size < targetVocabSize) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Iteration ${iteration}: Check loop condition (vocab size ${vocabSet.size} < target ${targetVocabSize})`,
        why: `Current vocabulary size (${vocabSet.size}) has not reached target size (${targetVocabSize}). Proceed to pair counting.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Array.from(vocabSet).map((tok, idx) => ({
          id: `vocab-it${iteration}-${idx}`,
          value: idx,
          label: `"${tok}"`,
          state: "default" as ElementState,
        })),
      },
      auxiliaryState: {
        customState: {
          iteration: String(iteration),
          currentVocabSize: String(vocabSet.size),
          targetVocabSize: String(targetVocabSize),
        },
      },
      variables: { iteration, currentVocabSize: vocabSet.size, targetVocabSize },
    });

    const pairCounts: Record<string, number> = {};
    for (const [wStr, freq] of Object.entries(corpus)) {
      const syms = wStr.split(" ");
      for (let i = 0; i < syms.length - 1; i++) {
        const pairKey = `${syms[i]},${syms[i + 1]}`;
        pairCounts[pairKey] = (pairCounts[pairKey] || 0) + freq;
      }
    }

    const pairEntries = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
    if (pairEntries.length === 0) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Iteration ${iteration}: No adjacent pairs available in corpus`,
          why: `No adjacent symbol pairs remain to be merged. Breaking out of loop early.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: Array.from(vocabSet).map((tok, idx) => ({
            id: `vocab-nopairs-${idx}`,
            value: idx,
            label: `"${tok}"`,
            state: "default" as ElementState,
          })),
        },
        auxiliaryState: {
          customState: {
            status: "No Pairs Left",
            currentVocabSize: String(vocabSet.size),
          },
        },
        variables: { pairCount: 0 },
      });
      break;
    }

    const [bestPairStr, bestFreq] = pairEntries[0];
    const [p1, p2] = bestPairStr.split(",");
    const topPairsSummary = pairEntries
      .slice(0, 3)
      .map(([p, f]) => `("${p.replace(",", '", "')}"): ${f}`)
      .join(", ");

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Iteration ${iteration}: Count pair frequencies across corpus`,
        why: `Computed frequency for ${pairEntries.length} unique adjacent pairs. Top pairs: [${topPairsSummary}].`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Array.from(vocabSet).map((tok, idx) => ({
          id: `vocab-cnt-${idx}`,
          value: idx,
          label: `"${tok}"`,
          state:
            tok === p1 || tok === p2
              ? ("highlighted" as ElementState)
              : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          topPairs: topPairsSummary,
          mostFrequentPair: `("${p1}", "${p2}")`,
          pairFrequency: String(bestFreq),
        },
      },
      variables: { uniquePairs: pairEntries.length, bestPair: `("${p1}", "${p2}")`, bestFreq },
    });

    merges.push([p1, p2]);
    const newToken = `${p1}${p2}`;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Iteration ${iteration}: Select best pair ("${p1}", "${p2}") with count ${bestFreq}`,
        why: `Pair ("${p1}", "${p2}") is selected as the argmax frequency pair. Merge rule #${merges.length} added to list.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Array.from(vocabSet).map((tok, idx) => ({
          id: `vocab-sel-${idx}`,
          value: idx,
          label: `"${tok}"`,
          state:
            tok === p1 || tok === p2
              ? ("highlighted" as ElementState)
              : ("default" as ElementState),
          pointers: tok === p1 ? ["Merge Candidate L"] : tok === p2 ? ["Merge Candidate R"] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          selectedPair: `("${p1}", "${p2}")`,
          frequency: String(bestFreq),
          mergesLearned: String(merges.length),
        },
      },
      variables: { selectedPair: `("${p1}", "${p2}")`, bestFreq, mergesCount: merges.length },
    });

    vocabSet.add(newToken);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Iteration ${iteration}: Add new token "${newToken}" to vocabulary`,
        why: `Created new subword token "${newToken}" by merging "${p1}" + "${p2}". Vocabulary size grows to ${vocabSet.size}/${targetVocabSize}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Array.from(vocabSet).map((tok, idx) => ({
          id: `vocab-add-${idx}`,
          value: idx,
          label: `"${tok}"`,
          state: tok === newToken ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: tok === newToken ? [`New Token (#${merges.length})`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          newToken: `"${newToken}"`,
          currentVocabSize: `${vocabSet.size}/${targetVocabSize}`,
          mergeRule: `("${p1}", "${p2}") -> "${newToken}"`,
        },
      },
      variables: { newToken, vocabSize: vocabSet.size, targetVocabSize },
    });

    const oldPairStr = `${p1} ${p2}`;
    const newCorpus: Record<string, number> = {};
    for (const [wStr, freq] of Object.entries(corpus)) {
      const updatedWord = wStr.split(oldPairStr).join(newToken);
      newCorpus[updatedWord] = freq;
    }
    corpus = newCorpus;

    const corpusSample = Object.keys(corpus)
      .slice(0, 2)
      .map((w) => `"${w}"`)
      .join(" | ");
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 25,
      explanation: {
        what: `Iteration ${iteration}: Rewrite corpus words replacing "${p1} ${p2}" with "${newToken}"`,
        why: `Replaced occurrences of "${oldPairStr}" with token "${newToken}" across all corpus entries. Sample updated words: ${corpusSample}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Array.from(vocabSet).map((tok, idx) => ({
          id: `vocab-rep-${idx}`,
          value: idx,
          label: `"${tok}"`,
          state: tok === newToken ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          updatedCorpusSample: corpusSample,
          currentVocabSize: String(vocabSet.size),
        },
      },
      variables: { updatedCorpusWords: Object.keys(corpus).length, newToken },
    });

    iteration++;
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: `BPE Vocabulary Training Complete: Final Vocab Size ${vocabSet.size}`,
      why: `Learned ${merges.length} merge rules: [${merges.map(([a, b]) => `("${a}","${b}")`).join(", ")}]. Final vocabulary contains ${vocabSet.size} tokens ready for model tokenization.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Array.from(vocabSet)
        .sort()
        .map((tok, rank) => ({
          id: `final-vocab-${rank}`,
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
    id: "iterative-bpe-vocabulary-trainer",
    title: "Iterative BPE Vocabulary Trainer",
    topicIds: ["ml_tokenization"],
    difficulty: "Hard",
    description:
      "Full iterative Byte-Pair Encoding (BPE) vocabulary training loop (Sennrich et al., 2016). Starts with a base character vocabulary, repeatedly identifies the most frequent adjacent symbol pair, appends a new merge rule to the vocabulary, and updates corpus words until reaching `targetVocabSize`.\n\nInput Format:\n- initialCorpus: Dictionary mapping word symbol strings to corpus frequency counts.\n- targetVocabSize: Target total vocabulary size V.\n\nOutput Format:\n- Returns tuple (learnedMergeRulesList, finalVocabularyList).\n\nEdge Cases & Constraints:\n- Target size smaller than base character vocabulary: Terminates immediately without merges.",
    constraints: ["targetVocabSize >= base character count."],
    examples: [
      {
        kind: "basic",
        title: "Train BPE Vocabulary to Target Size 14",
        inputDisplay: "initialCorpus (4 words), targetVocabSize = 14",
        outputDisplay:
          "Learned 3 merges: ('e','s') -> 'es', ('es','t') -> 'est', ('est','</w>') -> 'est</w>'",
        input: DEFAULT_ITERATIVE_BPE_TRAINER_INPUT,
        output: "3 merge rules learned",
        explanation: "Iteratively adds most frequent pairs until vocabulary reaches size 14.",
      },
      {
        kind: "complex",
        title: "Small Target Size Equal to Base Vocab",
        inputDisplay: "targetVocabSize = 11",
        outputDisplay: "0 merge rules learned",
        input: {
          ...DEFAULT_ITERATIVE_BPE_TRAINER_INPUT,
          targetVocabSize: 11,
        },
        output: "0 merges",
        explanation: "Base characters already fill target vocabulary size of 11.",
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
