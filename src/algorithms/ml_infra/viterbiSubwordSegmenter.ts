import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ViterbiSubwordInput {
  text: string;
  vocabScores: Record<string, number>; // token -> log probability score (negative)
}

export const VITERBI_SUBWORD_SEGMENTER_CODE = `def viterbi_subword_segment(text: str, vocab_scores: dict[str, float]) -> list[str]:
    n = len(text)
    dp = [-float("inf")] * (n + 1)
    dp[0] = 0.0
    parent = [-1] * (n + 1)
    
    for i in range(1, n + 1):
        for j in range(0, i):
            sub = text[j:i]
            if sub in vocab_scores:
                score = dp[j] + vocab_scores[sub]
                if score > dp[i]:
                    dp[i] = score
                    parent[i] = j
                    
    tokens = []
    curr = n
    while curr > 0:
        prev = parent[curr]
        if prev == -1:
            return []
        tokens.append(text[prev:curr])
        curr = prev
        
    tokens.reverse()
    return tokens`;

export const DEFAULT_VITERBI_SUBWORD_INPUT: ViterbiSubwordInput = {
  text: "unbreakable",
  vocabScores: {
    un: -1.2,
    break: -1.5,
    able: -1.1,
    unbreak: -3.5,
    k: -4.0,
    a: -3.0,
    b: -3.0,
    l: -3.0,
    e: -3.0,
  },
};

export const generateViterbiSubwordSegmenterSteps = (
  input: ViterbiSubwordInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const text = input.text;
  const n = text.length;
  const dp: number[] = new Array(n + 1).fill(-Infinity);
  dp[0] = 0.0;
  const parent: number[] = new Array(n + 1).fill(-1);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initialize Viterbi DP Array",
      why: `Input string "${text}" (len=${n}). DP table initialized with dp[0]=0.0, dp[1..${n}]=-inf. Unigram LM tokenization models optimal subword segmentation via DP over prefix log-likelihoods.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: Array.from(text).map((char, idx) => ({
        id: `char-${idx}`,
        value: char,
        label: `dp[${idx + 1}]=-inf`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries(
        dp.map((val, idx) => [`dp_${idx}`, val === -Infinity ? -999 : Number(val.toFixed(2))]),
      ),
    },
    variables: {
      textLength: n,
    },
  });

  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      const sub = text.slice(j, i);
      if (sub in input.vocabScores) {
        const score = dp[j] + input.vocabScores[sub];
        const isBetter = score > dp[i];

        if (isBetter) {
          dp[i] = score;
          parent[i] = j;
        }

        steps.push({
          stepIndex: stepIndex++,
          codeLine: isBetter ? 13 : 12,
          explanation: {
            what: `Evaluate Substring "${sub}" (j=${j}..i=${i})`,
            why: `Candidate token "${sub}" score: dp[${j}] (${dp[j] === -Infinity ? "-inf" : dp[j].toFixed(2)}) + logP("${sub}") (${input.vocabScores[sub]}) = ${score.toFixed(2)}. ${isBetter ? "Updated dp[" + i + "] to " + score.toFixed(2) + " and set parent[" + i + "] = " + j : "Kept existing dp[" + i + "]"}.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: Array.from(text).map((char, idx) => {
              let state: ElementState = "default";
              if (idx >= j && idx < i) state = isBetter ? "sorted" : "active";
              else if (idx < j) state = "visited";
              const valDp = dp[idx + 1];
              const dpStr = valDp === -Infinity ? "-inf" : valDp.toFixed(1);
              return {
                id: `char-${idx}`,
                value: char,
                label: `dp[${idx + 1}]=${dpStr}`,
                state,
                pointers: idx === j ? ["j"] : idx === i - 1 ? ["i"] : undefined,
              };
            }),
          },
          auxiliaryState: {
            distanceTable: Object.fromEntries(
              dp.map((val, idx) => [
                `dp_${idx}`,
                val === -Infinity ? -999 : Number(val.toFixed(2)),
              ]),
            ),
          },
          variables: {
            sub,
            score: Number(score.toFixed(2)),
            i,
            j,
          },
        });
      }
    }
  }

  // Backtrack
  const tokens: string[] = [];
  let curr = n;
  while (curr > 0) {
    const prev = parent[curr];
    if (prev === -1) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 21,
        explanation: {
          what: "Backtrack Failed (OOV)",
          why: `Position ${curr} has parent=-1. Text string cannot be fully segmented with given vocabulary.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: [],
        },
        auxiliaryState: {
          distanceTable: { Failed: 1 },
        },
        variables: { curr, prev: -1 },
      });
      return steps;
    }

    const token = text.slice(prev, curr);
    tokens.push(token);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 22,
      explanation: {
        what: `Backtrack Subword Token "${token}"`,
        why: `From position ${curr}, parent pointer is ${prev}. Extracted subword token "${token}" (logP: ${input.vocabScores[token] ?? 0}).`,
      },
      primarySnapshot: {
        kind: "array",
        elements: Array.from(text).map((char, idx) => ({
          id: `char-${idx}`,
          value: char,
          label: idx >= prev && idx < curr ? token : undefined,
          state:
            idx >= prev && idx < curr ? ("sorted" as ElementState) : ("visited" as ElementState),
          pointers: idx === prev ? ["prev"] : idx === curr - 1 ? ["curr"] : undefined,
        })),
      },
      auxiliaryState: {
        distanceTable: Object.fromEntries(
          dp.map((val, idx) => [`dp_${idx}`, val === -Infinity ? -999 : Number(val.toFixed(2))]),
        ),
      },
      variables: {
        curr,
        prev,
        token,
      },
    });

    curr = prev;
  }

  tokens.reverse();
  const finalLogProb = dp[n];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: "Backtrack Optimal Subword Tokens",
      why: `Optimal Unigram subword segmentation: [${tokens.map((t) => `'${t}'`).join(", ")}] (Total Log-Likelihood: ${finalLogProb.toFixed(2)}). Backtracking parent pointers recovers highest probability token sequence.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: tokens.map((t, idx) => ({
        id: `token-${idx}`,
        value: t,
        label: `score: ${input.vocabScores[t] ?? 0}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      distanceTable: Object.fromEntries([
        ["TotalLogProb", Number(finalLogProb.toFixed(2))],
        ...tokens.map((t) => [`Token_${t}`, input.vocabScores[t] ?? 0]),
      ]),
    },
    variables: {
      tokensJoined: tokens.join(" | "),
      totalScore: Number(finalLogProb.toFixed(2)),
    },
  });

  return steps;
};

const VITERBI_SUBWORD_SEGMENTER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["if score < dp[i]:", "dp[i] = dp[j] * vocab_scores[sub]", "while curr >= 0:"],
  hints: [
    {
      line: 11,
      hint: "Add subword log-probability score to prefix score dp[j] to evaluate candidate segmentation.",
    },
    {
      line: 13,
      hint: "Update dp[i] and set parent[i] = j when new candidate score exceeds current dp[i].",
    },
    {
      line: 18,
      hint: "Backtrack from position N to 0 using parent pointers to reconstruct optimal subword sequence.",
    },
  ],
  lineExplanations: {
    1: "Defines Unigram Language Model Viterbi subword segmentation algorithm.",
    11: "Calculates candidate joint log-probability dp[j] + logP(subword).",
    13: "Updates max log-likelihood DP state and split parent index.",
    18: "Reconstructs subword token sequence by walking parent pointers backward.",
  },
};

export const viterbiSubwordSegmenter: AlgorithmDefinition<ViterbiSubwordInput> = {
  id: "viterbi-subword-segmenter",
  title: "Unigram Language Model Viterbi Subword Segmentation",
  topicIds: ["ml_tokenization"],
  difficulty: "Hard",
  description:
    "Segments text into subword vocabulary tokens (SentencePiece Unigram LM) using Viterbi dynamic programming to maximize total joint log-probability.",
  constraints: [
    "len(text) >= 1",
    "vocabScores contains single-character or multi-character token log-probabilities",
  ],
  examples: [
    {
      kind: "basic",
      title: "Unigram Subword Tokenization ('unbreakable')",
      inputDisplay:
        "text='unbreakable', vocab={'un': -1.2, 'break': -1.5, 'able': -1.1, 'unbreak': -3.5}",
      outputDisplay: "['un', 'break', 'able'] (logP=-3.80)",
      input: DEFAULT_VITERBI_SUBWORD_INPUT,
      output: "['un', 'break', 'able']",
      explanation:
        "Segmentation ['un', 'break', 'able'] gives log-prob -1.2 + -1.5 + -1.1 = -3.80, outperforming ['unbreak', 'able'] (-4.60).",
    },
    {
      kind: "complex",
      title: "Compound Subword Resolution",
      inputDisplay: "text='transformer', multi-token vocabulary",
      outputDisplay: "['transform', 'er']",
      input: {
        text: "transformer",
        vocabScores: {
          trans: -2.0,
          former: -2.2,
          transform: -1.8,
          er: -0.8,
          t: -4.0,
        },
      },
      output: "['transform', 'er']",
      explanation:
        "Viterbi DP selects ['transform', 'er'] (-2.6 total) over ['trans', 'former'] (-4.2 total).",
    },
    {
      kind: "negative",
      title: "Unsegmentable Out-of-Vocabulary Input",
      inputDisplay: "text='xyz', vocabulary has no matching tokens",
      outputDisplay: "[] (Segmentation failed)",
      input: {
        text: "xyz",
        vocabScores: {
          a: -1.0,
          b: -1.0,
        },
      },
      output: "[]",
      explanation:
        "When no substring matches vocabulary entries, parent pointers remain -1 and Viterbi returns an empty list.",
    },
  ],
  code: VITERBI_SUBWORD_SEGMENTER_CODE,
  timeComplexity: {
    best: "O(N^2)",
    average: "O(N^2)",
    worst: "O(N^2)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Evaluates N * (N + 1) / 2 substrings for text of length N, checking vocabulary hash table lookups in O(1) time.",
    space: "Requires O(N) space for DP log-probability array and parent backtracking pointers.",
  },
  topicGuide: {
    overview:
      "The Unigram Language Model (kudo et al., 2018) is an essential subword tokenization framework used in SentencePiece and T5/AlBERT/LLaMA tokenizers. Unlike greedy BPE, Unigram treats tokenization probabilistically.",
    sections: [
      {
        heading: "Viterbi Decoding",
        body: "Dynamic programming finds the global Viterbi path (highest total log-probability sequence of tokens) in O(N^2) time.",
      },
      {
        heading: "Vocabulary Pruning",
        body: "During tokenizer training, subwords with minimal impact on total corpus log-likelihood are iteratively pruned using Expectation-Maximization (EM).",
      },
    ],
    keyTerms: [
      {
        term: "Unigram LM",
        definition:
          "Probabilistic subword tokenizer assuming subword tokens occur independently with unigram probabilities.",
      },
      {
        term: "Viterbi Algorithm",
        definition:
          "Dynamic programming method for finding the most likely sequence of hidden states.",
      },
    ],
  },
  trivia: VITERBI_SUBWORD_SEGMENTER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 5" }],
  defaultInput: DEFAULT_VITERBI_SUBWORD_INPUT,
  generateSteps: generateViterbiSubwordSegmenterSteps,
};
