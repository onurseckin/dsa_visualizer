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
    def compute_corpus_log_loss(current_vocab: dict[str, float]) -> float:
        total_loss = 0.0
        for text in corpus:
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
                    word_cost += 10.0
                    idx += 1
            total_loss += word_cost
        return total_loss

    baseline_loss = compute_corpus_log_loss(vocab)
    impact_ranks = []

    for candidate in candidates:
        pruned_vocab = {k: v for k, v in vocab.items() if k != candidate}
        pruned_loss = compute_corpus_log_loss(pruned_vocab)
        loss_increase = pruned_loss - baseline_loss
        impact_ranks.append((round(loss_increase, 4), candidate))

    impact_ranks.sort(key=lambda x: x[0])
    return impact_ranks`;

export const generateUnigramCandidateLossSteps = (
  input: UnigramCandidateLossRanksInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { corpus, vocab, candidatesToEvaluate } = input;
  let stepIndex = 0;

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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: "Calculate Baseline Corpus Log-Loss L(V)",
      why: `Full vocabulary loss L(V) = ${baselineLoss.toFixed(
        4,
      )}. Loss increase for candidate tokens will be measured relative to this baseline.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: candidatesToEvaluate.map((cand, idx) => ({
        id: `cand-${idx}`,
        value: 0,
        label: `"${cand}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        baselineLoss: baselineLoss.toFixed(4),
        candidateCount: String(candidatesToEvaluate.length),
        status: "Baseline Computed",
      },
    },
    variables: { baselineLoss: Math.round(baselineLoss * 10000) / 10000 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: "Initialize Candidates Impact Ranking List",
      why: "Initialize empty impact_ranks list to store pairs of (loss_increase, candidate).",
    },
    primarySnapshot: {
      kind: "array",
      elements: candidatesToEvaluate.map((cand, idx) => ({
        id: `cand-${idx}`,
        value: 0,
        label: `"${cand}"`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        baselineLoss: baselineLoss.toFixed(4),
        impactRanksCount: "0",
        status: "Ready for Evaluation",
      },
    },
    variables: { impactRanks: [] },
  });

  const impacts: { candidate: string; lossIncrease: number; prunedLoss: number }[] = [];

  for (let cIdx = 0; cIdx < candidatesToEvaluate.length; cIdx++) {
    const cand = candidatesToEvaluate[cIdx];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 27,
      explanation: {
        what: `Select Candidate Token "${cand}" (${cIdx + 1}/${candidatesToEvaluate.length})`,
        why: `Begin evaluating negative log-likelihood loss impact for candidate token "${cand}".`,
      },
      primarySnapshot: {
        kind: "array",
        elements: candidatesToEvaluate.map((c, idx) => ({
          id: `cand-${idx}`,
          value: idx < cIdx ? Math.round(impacts[idx].lossIncrease * 10000) / 10000 : 0,
          label: `"${c}" ${idx < cIdx ? `(dL=${impacts[idx].lossIncrease.toFixed(4)})` : ""}`,
          state:
            idx === cIdx
              ? ("active" as ElementState)
              : idx < cIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === cIdx ? ["Evaluating"] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentCandidate: `"${cand}"`,
          baselineLoss: baselineLoss.toFixed(4),
          evaluatedCount: `${cIdx}/${candidatesToEvaluate.length}`,
        },
      },
      variables: { currentCandidate: cand, candidateIndex: cIdx },
    });

    const prunedVocab: Record<string, number> = {};
    for (const [k, v] of Object.entries(vocab)) {
      if (k !== cand) prunedVocab[k] = v;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 28,
      explanation: {
        what: `Construct Pruned Vocabulary (V \\ {"${cand}"})`,
        why: `Remove subword "${cand}" from vocabulary V. Pruned vocabulary now has ${
          Object.keys(prunedVocab).length
        } tokens.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: candidatesToEvaluate.map((c, idx) => ({
          id: `cand-${idx}`,
          value: idx < cIdx ? Math.round(impacts[idx].lossIncrease * 10000) / 10000 : 0,
          label: `"${c}" ${idx < cIdx ? `(dL=${impacts[idx].lossIncrease.toFixed(4)})` : ""}`,
          state:
            idx === cIdx
              ? ("active" as ElementState)
              : idx < cIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === cIdx ? ["Pruned from V"] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentCandidate: `"${cand}"`,
          prunedVocabSize: String(Object.keys(prunedVocab).length),
          status: "Vocabulary Pruned",
        },
      },
      variables: { currentCandidate: cand, prunedVocabTokens: Object.keys(prunedVocab) },
    });

    const prunedLoss = computeLoss(prunedVocab);
    const lossIncrease = Math.max(0, prunedLoss - baselineLoss);
    impacts.push({ candidate: cand, lossIncrease, prunedLoss });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 30,
      explanation: {
        what: `Compute Loss Impact for "${cand}": dL = ${lossIncrease.toFixed(4)}`,
        why: `Corpus loss without "${cand}" = ${prunedLoss.toFixed(4)}. Loss increase L(V\\{"${cand}"}) - L(V) = ${lossIncrease.toFixed(
          4,
        )}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: candidatesToEvaluate.map((c, idx) => ({
          id: `cand-${idx}`,
          value: idx <= cIdx ? Math.round(impacts[idx].lossIncrease * 10000) / 10000 : 0,
          label: `"${c}" ${idx <= cIdx ? `(dL=${impacts[idx].lossIncrease.toFixed(4)})` : ""}`,
          state:
            idx === cIdx
              ? ("active" as ElementState)
              : idx < cIdx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === cIdx ? [`dL = ${lossIncrease.toFixed(4)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentCandidate: `"${cand}"`,
          prunedLoss: prunedLoss.toFixed(4),
          baselineLoss: baselineLoss.toFixed(4),
          lossIncrease: lossIncrease.toFixed(4),
        },
      },
      variables: {
        candidate: cand,
        prunedLoss: Math.round(prunedLoss * 10000) / 10000,
        lossIncrease: Math.round(lossIncrease * 10000) / 10000,
      },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 31,
      explanation: {
        what: `Append (${lossIncrease.toFixed(4)}, "${cand}") to Impact Ranks List`,
        why: `Impact tuple (${lossIncrease.toFixed(4)}, "${cand}") added to impact_ranks list.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: candidatesToEvaluate.map((c, idx) => ({
          id: `cand-${idx}`,
          value: idx <= cIdx ? Math.round(impacts[idx].lossIncrease * 10000) / 10000 : 0,
          label: `"${c}" (dL=${idx <= cIdx ? impacts[idx].lossIncrease.toFixed(4) : "?"})`,
          state: idx <= cIdx ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          evaluatedCandidatesCount: `${impacts.length}/${candidatesToEvaluate.length}`,
          latestRecordedImpact: `(${lossIncrease.toFixed(4)}, "${cand}")`,
        },
      },
      variables: { recordedCandidates: impacts.map((i) => i.candidate) },
    });
  }

  impacts.sort((a, b) => a.lossIncrease - b.lossIncrease);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 33,
    explanation: {
      what: "Sort Candidate Tokens by Ascending Loss Impact",
      why: "Candidates causing the lowest loss increase are ranked first. Lowest loss increase indicates candidate is redundant and safest to prune.",
    },
    primarySnapshot: {
      kind: "array",
      elements: impacts.map((item, rank) => ({
        id: `res-${rank}`,
        value: Math.round(item.lossIncrease * 10000) / 10000,
        label: `Rank ${rank + 1}: "${item.candidate}" (dL=${item.lossIncrease.toFixed(4)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Safest to Prune"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        safestToken: `"${impacts[0]?.candidate}"`,
        minLossIncrease: impacts[0]?.lossIncrease.toFixed(4),
        status: "Candidates Ranked",
      },
    },
    variables: { sortedCandidates: impacts.map((i) => i.candidate) },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 34,
    explanation: {
      what: "Return Candidate Loss Impact Ranks",
      why: `Final evaluation complete. Token "${impacts[0]?.candidate}" causes the minimal loss increase (${impacts[0]?.lossIncrease.toFixed(
        4,
      )}) and is prioritized for pruning.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: impacts.map((item, rank) => ({
        id: `res-${rank}`,
        value: Math.round(item.lossIncrease * 10000) / 10000,
        label: `Rank ${rank + 1}: "${item.candidate}" (dL=${item.lossIncrease.toFixed(4)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Safest to Prune"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        safestToken: `"${impacts[0]?.candidate}"`,
        minLossIncrease: impacts[0]?.lossIncrease.toFixed(4),
        status: "Completed",
      },
    },
    variables: {
      safestCandidate: impacts[0]?.candidate,
      minIncrease: Math.round((impacts[0]?.lossIncrease ?? 0) * 10000) / 10000,
      complete: true,
    },
  });

  return steps;
};

export const unigramCandidateLossRanks: AlgorithmDefinition<UnigramCandidateLossRanksInput> = {
  id: "unigram-candidate-loss-ranks",
  title: "Unigram Candidate Loss Impact Ranking",
  topicIds: ["ml_tokenization"],
  difficulty: "Hard",
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
