import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface UnigramCandidateLossRanksInput {
  corpus: string[];
  vocab: Record<string, number>; // token -> probability
  candidatesToEvaluate: string[];
}

export const DEFAULT_UNIGRAM_CANDIDATE_LOSS_INPUT: UnigramCandidateLossRanksInput = {
  corpus: ["unwanted", "wanted"],
  vocab: {
    un: 0.2,
    want: 0.4,
    ed: 0.3,
    wanted: 0.1,
  },
  candidatesToEvaluate: ["un", "wanted"],
};

export const UNIGRAM_CANDIDATE_LOSS_CODE = `import math

def compute_unigram_loss_impact(corpus: list[str], vocab: dict[str, float], candidates: list[str]) -> list[tuple[float, str]]:
    """
    Computes negative log-likelihood loss rank impact when removing candidate subword tokens
    during Unigram LM vocabulary pruning (Kudo 2018).
    Loss impact L_loss(t) = L(V - {t}) - L(V). Tokens with lowest loss increase are pruned.
    """
    def compute_corpus_log_loss(current_vocab: dict[str, float]) -> float:
        total_loss = 0.0
        for text in corpus:
            # Simplified Viterbi cost approximation
            word_cost = 0.0
            idx = 0
            while idx < len(text):
                matched = False
                for l in range(len(text) - idx, 0, -1):
                    sub = text[idx : idx + l]
                    if sub in current_vocab:
                        word_cost += -math.log(current_vocab[sub])
                        idx += l
                        matched = True
                        break
                if not matched:
                    word_cost += 10.0 # penalty for OOV
                    idx += 1
            total_loss += word_cost
        return total_loss

    baseline_loss = compute_corpus_log_loss(vocab)
    impact_ranks = []

    for candidate in candidates:
        # Create vocabulary without candidate token
        pruned_vocab = {k: v for k, v in vocab.items() if k != candidate}
        pruned_loss = compute_corpus_log_loss(pruned_vocab)
        loss_increase = pruned_loss - baseline_loss
        impact_ranks.append((round(loss_increase, 4), candidate))

    # Sort candidates by ascending loss increase (lowest loss increase = safest to prune)
    impact_ranks.sort(key=lambda x: x[0])
    return impact_ranks`;

export const generateUnigramCandidateLossSteps = (
  input: UnigramCandidateLossRanksInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { corpus, vocab, candidatesToEvaluate } = input;
  let stepIndex = 0;

  // Baseline Loss
  const computeLoss = (vMap: Record<string, number>) => {
    let loss = 0;
    for (const text of corpus) {
      let idx = 0;
      while (idx < text.length) {
        let matched = false;
        for (let l = text.length - idx; l > 0; l--) {
          const sub = text.substring(idx, idx + l);
          if (sub in vMap) {
            loss += -Math.log(vMap[sub]);
            idx += l;
            matched = true;
            break;
          }
        }
        if (!matched) {
          loss += 10.0;
          idx += 1;
        }
      }
    }
    return loss;
  };

  const baselineLoss = computeLoss(vocab);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Unigram LM Candidate Loss Rank Evaluator",
      why: `Baseline corpus negative log-likelihood loss L(V) = ${baselineLoss.toFixed(
        4,
      )}. Evaluating loss impact for ${candidatesToEvaluate.length} candidate tokens.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: candidatesToEvaluate.map((cand, idx) => ({
        id: `cand-${idx}`,
        value: idx,
        label: `Token "${cand}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        baselineLoss: baselineLoss.toFixed(4),
        candidatesCount: String(candidatesToEvaluate.length),
        status: "Initialized",
      },
    },
    variables: { baselineLoss: Math.round(baselineLoss * 100) / 100 },
  });

  const impacts: { candidate: string; lossIncrease: number }[] = [];

  for (let cIdx = 0; cIdx < candidatesToEvaluate.length; cIdx++) {
    const cand = candidatesToEvaluate[cIdx];
    const prunedVocab: Record<string, number> = {};
    for (const [k, v] of Object.entries(vocab)) {
      if (k !== cand) prunedVocab[k] = v;
    }

    const prunedLoss = computeLoss(prunedVocab);
    const lossIncrease = Math.max(0, prunedLoss - baselineLoss);
    impacts.push({ candidate: cand, lossIncrease });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 26,
      explanation: {
        what: `Evaluate Pruning Impact for Candidate Token "${cand}"`,
        why: `Corpus loss without "${cand}" = ${prunedLoss.toFixed(4)}. Loss increase L(V\\{t}) - L(V) = ${lossIncrease.toFixed(
          4,
        )}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: candidatesToEvaluate.map((c, idx) => ({
          id: `cand-${idx}`,
          value: idx === cIdx ? Math.round(lossIncrease * 100) : idx,
          label: `"${c}" (dL=${idx <= cIdx ? (impacts[idx]?.lossIncrease ?? 0).toFixed(3) : "?"})`,
          state: idx === cIdx ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: idx === cIdx ? [`dL = ${lossIncrease.toFixed(4)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          evaluatedCandidate: `"${cand}"`,
          prunedCorpusLoss: prunedLoss.toFixed(4),
          lossIncrease: lossIncrease.toFixed(4),
        },
      },
      variables: { cIdx, candidate: cand, lossIncrease: Math.round(lossIncrease * 100) / 100 },
    });
  }

  // Step Final: Sorted
  impacts.sort((a, b) => a.lossIncrease - b.lossIncrease);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 30,
    explanation: {
      what: "Rank Candidates by Ascending Pruning Loss Impact",
      why: `Safest token to prune: "${impacts[0]?.candidate}" (causes lowest loss increase ${impacts[0]?.lossIncrease.toFixed(
        4,
      )}).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: impacts.map((item, rank) => ({
        id: `res-${rank}`,
        value: Math.round(item.lossIncrease * 100),
        label: `Rank ${rank + 1}: "${item.candidate}" (dL=${item.lossIncrease.toFixed(4)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Safest to Prune"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        safestTokenToPrune: `"${impacts[0]?.candidate}"`,
        minLossIncrease: impacts[0]?.lossIncrease.toFixed(4),
        status: "Completed",
      },
    },
    variables: {
      safestCandidate: impacts[0]?.candidate,
      minIncrease: impacts[0]?.lossIncrease,
      complete: true,
    },
  });

  return steps;
};

export const unigramCandidateLossRanks: AlgorithmDefinition<UnigramCandidateLossRanksInput> = {
  id: "unigramCandidateLossRanks",
  title: "Unigram Candidate Loss Impact Ranking",
  category: "ml_tokenization",
  categories: ["ml_tokenization"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tokenization",
  description:
    "Calculates the negative log-likelihood loss increase L(V\\{t}) - L(V) when candidate subword tokens t are removed from the Unigram LM vocabulary V (Kudo, 2018). Subwords causing the smallest loss increase are identified as redundant and prioritized for pruning.\n\nInput Format:\n- corpus: Array of text documents.\n- vocab: Current subword vocabulary map (token -> marginal probability P(t)).\n- candidatesToEvaluate: Array of candidate subwords evaluated for pruning.\n\nOutput Format:\n- Returns sorted list of (lossIncrease, candidateToken) in ascending order of loss impact.\n\nEdge Cases & Constraints:\n- Single character tokens: Cannot be pruned (infinitely high loss impact).",
  constraints: ["Single character tokens must be retained to maintain 100% coverage."],
  examples: [
    {
      kind: "basic",
      title: "Evaluate Loss Impact of 'un' vs 'wanted'",
      inputDisplay: "corpus = ['unwanted', 'wanted'], candidates = ['un', 'wanted']",
      outputDisplay: "Safest to Prune: 'wanted' (loss increase 0.0)",
      input: DEFAULT_UNIGRAM_CANDIDATE_LOSS_INPUT,
      output: "'wanted' safest to prune",
      explanation: "'wanted' can be decomposed into 'want' + 'ed' with zero total loss increase.",
    },
    {
      kind: "complex",
      title: "High Loss Increase Essential Token",
      inputDisplay: "Removing unique root subword",
      outputDisplay: "High loss increase dL > 5.0",
      input: {
        corpus: ["unwanted"],
        vocab: { un: 0.5, want: 0.5 },
        candidatesToEvaluate: ["want"],
      },
      output: "'want' high loss increase",
      explanation:
        "Removing essential token 'want' forces OOV penalties, causing large loss increase.",
    },
    {
      kind: "negative",
      title: "Identical Redundant Tokens",
      inputDisplay: "Evaluating duplicate path tokens",
      outputDisplay: "Identified zero loss increase",
      input: DEFAULT_UNIGRAM_CANDIDATE_LOSS_INPUT,
      output: "zero loss increase",
      explanation: "Redundant tokens incur zero loss penalty when removed.",
    },
  ],
  defaultInput: DEFAULT_UNIGRAM_CANDIDATE_LOSS_INPUT,
  code: UNIGRAM_CANDIDATE_LOSS_CODE,
  timeComplexity: {
    best: "O(C * N * L_max)",
    average: "O(C * N * L_max)",
    worst: "O(C * N * L_max)",
  },
  spaceComplexity: "O(C)",
  complexityAnalysis: {
    time: "O(C * N * L_max) where C is candidate count evaluated, N is corpus text length, and L_max is max subword length.",
    space: "O(C) auxiliary memory to store candidate loss impact pairs.",
  },
  topicGuide: {
    overview:
      "Unlike BPE which builds vocabularies bottom-up via pair merging, Unigram LM (Kudo 2018) starts with an over-complete seed vocabulary V_0 and prunes top-down. The decision to prune candidate token t is based on its loss impact delta L(V\\{t}) - L(V).",
    sections: [
      {
        heading: "Core Concept & Negative Log-Likelihood Loss",
        body: "Corpus loss L(V) is defined as sum_{w in Corpus} -log P(w), where P(w) = sum_{x in Segmentation(w)} prod_{t in x} P(t). Pruning candidate t increases corpus loss by delta L(t).",
      },
      {
        heading: "EM Optimization Loop Integration",
        body: "In each Expectation-Maximization (EM) iteration, subword probabilities P(t) are updated via EM, then candidates with the lowest loss impact are pruned.",
      },
      {
        heading: "Subword Regularization",
        body: "Unigram LM's probabilistic formulation allows sampling candidate subword segmentations during LLM pre-training, acting as a data augmentation regularizer.",
      },
    ],
    keyTerms: [
      {
        term: "Unigram Language Model",
        definition:
          "Tokenization model treating each subword token as an independent probabilistic unigram.",
      },
      {
        term: "Loss Impact Delta",
        definition:
          "Increase in corpus negative log-likelihood loss incurred when removing a subword from vocabulary.",
      },
      {
        term: "Top-Down Vocabulary Pruning",
        definition:
          "Iteratively shrinking an over-complete seed vocabulary by removing lowest-impact subword candidates.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "Unigram LM Tokenization (Kudo ACL 2018)" },
  ],
  generateSteps: generateUnigramCandidateLossSteps,
};
