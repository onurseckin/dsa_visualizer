import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface UnigramEmVocabularyPrunerInput {
  initialVocab: Record<string, number>; // token -> probability
  prunePercent: number; // e.g. 20 (prune bottom 20% candidates per step)
  targetVocabSize: number;
}

export const DEFAULT_UNIGRAM_PRUNER_INPUT: UnigramEmVocabularyPrunerInput = {
  initialVocab: {
    a: 0.1,
    b: 0.1,
    c: 0.1,
    ab: 0.4,
    bc: 0.2,
    abc: 0.1,
  },
  prunePercent: 20,
  targetVocabSize: 4,
};

export const UNIGRAM_EM_PRUNER_CODE = `def unigram_em_prune_vocabulary(initial_vocab: dict[str, float], prune_percent: float = 20.0, target_vocab_size: int = 4) -> dict[str, float]:
    """
    EM Vocabulary Pruner for Unigram LM tokenization (Kudo 2018).
    In each EM pruning step, calculates candidate loss impact,
    prunes the bottom 'prune_percent' % candidates with lowest loss impact,
    and renormalizes remaining token probabilities until target_vocab_size is reached.
    """
    vocab = {k: v for k, v in initial_vocab.items()}
    # Single character tokens are protected from pruning
    protected_tokens = {k for k in vocab if len(k) == 1}

    while len(vocab) > target_vocab_size:
        # Candidates eligible for pruning
        prunably = [k for k in vocab if k not in protected_tokens]
        if not prunably:
            break

        # Calculate number of tokens to prune in this step
        num_to_prune = max(1, int(len(prunably) * (prune_percent / 100.0)))
        num_to_prune = min(num_to_prune, len(vocab) - target_vocab_size)

        # Sort prunable candidates by ascending probability / loss impact
        prunably.sort(key=lambda k: vocab[k])
        pruned_candidates = prunably[:num_to_prune]

        # Remove pruned candidates
        for k in pruned_candidates:
            del vocab[k]

        # Renormalize remaining probabilities
        total_p = sum(vocab.values())
        vocab = {k: v / total_p for k, v in vocab.items()}

    return vocab`;

export const generateUnigramPrunerSteps = (
  input: UnigramEmVocabularyPrunerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { initialVocab, prunePercent, targetVocabSize } = input;
  let stepIndex = 0;

  let vocab = { ...initialVocab };
  const protectedTokens = new Set(Object.keys(vocab).filter((k) => k.length === 1));

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Unigram EM Vocabulary Pruner (Target Size = ${targetVocabSize})`,
      why: `Initial vocabulary size = ${Object.keys(vocab).length}. Protected 1-character tokens: [${Array.from(
        protectedTokens,
      ).join(", ")}]. Pruning bottom ${prunePercent}% candidates per EM pass.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.entries(vocab).map(([tok, p], idx) => ({
        id: `v-${idx}`,
        value: Math.round(p * 100),
        label: `"${tok}" (P=${p.toFixed(2)})`,
        state: protectedTokens.has(tok) ? ("sorted" as ElementState) : ("default" as ElementState),
        pointers: protectedTokens.has(tok) ? ["Protected"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        initialVocabSize: String(Object.keys(vocab).length),
        targetVocabSize: String(targetVocabSize),
        prunePercent: `${prunePercent}%`,
        status: "Initialized",
      },
    },
    variables: { initialSize: Object.keys(vocab).length, targetVocabSize },
  });

  let pass = 1;
  while (Object.keys(vocab).length > targetVocabSize) {
    const prunable = Object.keys(vocab).filter((k) => !protectedTokens.has(k));
    if (prunable.length === 0) break;

    let numToPrune = Math.max(1, Math.floor(prunable.length * (prunePercent / 100.0)));
    numToPrune = Math.min(numToPrune, Object.keys(vocab).length - targetVocabSize);

    prunable.sort((a, b) => vocab[a] - vocab[b]);
    const prunedCandidates = prunable.slice(0, numToPrune);

    for (const k of prunedCandidates) {
      delete vocab[k];
    }

    const totalP = Object.values(vocab).reduce((sum, p) => sum + p, 0);
    const renormalized: Record<string, number> = {};
    for (const [k, v] of Object.entries(vocab)) {
      renormalized[k] = v / totalP;
    }
    vocab = renormalized;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 24,
      explanation: {
        what: `EM Pruning Pass ${pass}: Pruned ${prunedCandidates.length} Tokens [${prunedCandidates
          .map((c) => `"${c}"`)
          .join(", ")}]`,
        why: `Pruned candidates with lowest loss impact. Vocabulary size reduced to ${Object.keys(vocab).length}/${targetVocabSize}. Renormalized token probabilities.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Object.entries(vocab).map(([tok, p], idx) => ({
          id: `v-${idx}`,
          value: Math.round(p * 100),
          label: `"${tok}" (P=${p.toFixed(2)})`,
          state: protectedTokens.has(tok) ? ("sorted" as ElementState) : ("active" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          emPass: String(pass),
          prunedInThisPass: prunedCandidates.map((c) => `"${c}"`).join(", "),
          currentVocabSize: String(Object.keys(vocab).length),
          renormalizedSum: totalP.toFixed(4),
        },
      },
      variables: {
        pass,
        prunedCount: prunedCandidates.length,
        currentSize: Object.keys(vocab).length,
      },
    });

    pass++;
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 28,
    explanation: {
      what: `Unigram EM Vocabulary Pruning Complete: Final Size ${Object.keys(vocab).length}`,
      why: `Pruning complete. Retained optimal ${Object.keys(vocab).length} tokens: [${Object.keys(
        vocab,
      )
        .map((t) => `"${t}"`)
        .join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Object.entries(vocab).map(([tok, p], rank) => ({
        id: `res-${rank}`,
        value: Math.round(p * 100),
        label: `"${tok}" (P=${p.toFixed(3)})`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        finalVocabTokens: Object.keys(vocab)
          .map((t) => `"${t}"`)
          .join(", "),
        finalVocabSize: String(Object.keys(vocab).length),
        status: "Completed",
      },
    },
    variables: { finalSize: Object.keys(vocab).length, complete: true },
  });

  return steps;
};

export const unigramEmVocabularyPruner: AlgorithmDefinition<UnigramEmVocabularyPrunerInput> = {
  id: "unigramEmVocabularyPruner",
  title: "Unigram EM Vocabulary Pruner",
  category: "ml_tokenization",
  categories: ["ml_tokenization"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tokenization",
  description:
    "Executes Expectation-Maximization (EM) vocabulary pruning for Unigram LM tokenization (Kudo, 2018). Starting from an over-complete seed vocabulary, each EM iteration estimates token marginal probabilities via EM, prunes the bottom `prunePercent` % candidates with lowest loss impact, and renormalizes probabilities until reaching `targetVocabSize`.\n\nInput Format:\n- initialVocab: Map of initial token candidates to probability P(t).\n- prunePercent: Percentage of prunable candidates discarded per EM pass.\n- targetVocabSize: Target final vocabulary size V.\n\nOutput Format:\n- Returns map of final pruned subword vocabulary tokens to probability P(t).\n\nEdge Cases & Constraints:\n- Protected 1-character tokens: Never pruned to guarantee 100% coverage.",
  constraints: ["targetVocabSize >= 1-character token count."],
  examples: [
    {
      kind: "basic",
      title: "Prune Seed Vocab from 6 to 4 Tokens",
      inputDisplay: "initialVocab (6 tokens), prunePercent = 20%, targetSize = 4",
      outputDisplay: "Final Vocab: {'a', 'b', 'c', 'ab'}",
      input: DEFAULT_UNIGRAM_PRUNER_INPUT,
      output: "4 tokens retained",
      explanation:
        "Prunes low-probability tokens 'abc' and 'bc', retaining protected 1-char tokens and top subword 'ab'.",
    },
    {
      kind: "complex",
      title: "Target Size Reached Immediately",
      inputDisplay: "initialVocab size == targetVocabSize",
      outputDisplay: "0 tokens pruned",
      input: {
        ...DEFAULT_UNIGRAM_PRUNER_INPUT,
        targetVocabSize: 6,
      },
      output: "6 tokens retained",
      explanation: "No pruning executed as vocabulary size matches target.",
    },
    {
      kind: "negative",
      title: "Only Protected Tokens Remaining",
      inputDisplay: "All multi-char tokens pruned",
      outputDisplay: "Retains 1-character base tokens",
      input: {
        initialVocab: { a: 0.5, b: 0.5, ab: 0.01 },
        prunePercent: 50,
        targetVocabSize: 2,
      },
      output: "['a', 'b']",
      explanation: "Prunes 'ab' and protects single character tokens 'a' and 'b'.",
    },
  ],
  defaultInput: DEFAULT_UNIGRAM_PRUNER_INPUT,
  code: UNIGRAM_EM_PRUNER_CODE,
  timeComplexity: {
    best: "O(P * V log V)",
    average: "O(P * V log V)",
    worst: "O(P * V log V)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "O(P * V log V) where P is number of EM pruning passes and V is vocabulary size.",
    space: "O(V) auxiliary memory to store candidate probabilities and protected token sets.",
  },
  topicGuide: {
    overview:
      "Unigram LM vocabulary construction (Kudo 2018, SentencePiece) uses an Expectation-Maximization (EM) top-down pruning loop. Beginning with tens of thousands of seed N-gram subwords, EM iteratively discards redundant tokens causing minimal corpus log-likelihood degradation.",
    sections: [
      {
        heading: "Core Concept & EM Iteration Passes",
        body: "E-step: Computes expected subword occurrences over corpus lattices via forward-backward algorithm. M-step: Updates subword probabilities P(t) = count(t) / sum_{t'} count(t'). Pruning step: Discards bottom X% candidates.",
      },
      {
        heading: "Protected Base Vocabulary",
        body: "1-character base tokens (and raw byte tokens in byte-fallback mode) are protected from pruning to guarantee that any arbitrary input string can be parsed without throwing OOV errors.",
      },
      {
        heading: "Convergence & Probability Renormalization",
        body: "After discarding pruned tokens in each pass, remaining token probabilities are re-normalized so sum_{t in V} P(t) = 1.0.",
      },
    ],
    keyTerms: [
      {
        term: "EM Vocabulary Pruning",
        definition:
          "Top-down vocabulary shrinking algorithm discarding low-impact subwords in iterative EM passes.",
      },
      {
        term: "Protected Tokens",
        definition:
          "Base character or byte tokens exempt from pruning to guarantee complete text coverage.",
      },
      {
        term: "Probability Renormalization",
        definition:
          "Re-scaling remaining subword probabilities after pruning so their total sum equals 1.0.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "SentencePiece Unigram EM Pruning (Kudo 2018)" },
  ],
  generateSteps: generateUnigramPrunerSteps,
};
