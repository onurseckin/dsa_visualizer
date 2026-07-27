import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface WordpiecePmiScoredTokenizerInput {
  tokenCounts: Record<string, number>;
  pairCounts: Record<string, number>;
}

export const DEFAULT_WORDPIECE_PMI_INPUT: WordpiecePmiScoredTokenizerInput = {
  tokenCounts: {
    un: 10,
    want: 20,
    ed: 15,
    in: 50,
    side: 40,
  },
  pairCounts: {
    "un,want": 8, // High PMI (8 / (10 * 20) = 0.04)
    "want,ed": 12, // High PMI (12 / (20 * 15) = 0.04)
    "in,side": 5, // Low PMI (5 / (50 * 40) = 0.0025)
  },
};

export const WORDPIECE_PMI_CODE = `import math

def compute_wordpiece_pmi_scores(token_counts: dict[str, int], pair_counts: dict[str, int]) -> list[tuple[float, str]]:
    """
    WordPiece candidate pair selection via Pointwise Mutual Information (PMI).
    Score(A, B) = count(A, B) / (count(A) * count(B)).
    Selects candidate pair with highest PMI score for merging into vocabulary.
    """
    pmi_scores = []

    for pair_str, pair_freq in pair_counts.items():
        sym_a, sym_b = pair_str.split(",")
        count_a = token_counts.get(sym_a, 1)
        count_b = token_counts.get(sym_b, 1)

        # WordPiece PMI likelihood ratio score formula
        pmi_score = pair_freq / (count_a * count_b)
        pmi_scores.append((round(pmi_score, 6), f"('{sym_a}', '{sym_b}')"))

    pmi_scores.sort(key=lambda x: x[0], reverse=True)
    return pmi_scores`;

export const generateWordpiecePmiSteps = (
  input: WordpiecePmiScoredTokenizerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { tokenCounts, pairCounts } = input;
  let stepIndex = 0;

  const pairEntries = Object.entries(pairCounts);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize WordPiece PMI Scored Pair Trainer (BERT Tokenizer)",
      why: `Evaluating Pointwise Mutual Information (PMI) scores for ${pairEntries.length} candidate symbol pairs.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: pairEntries.map(([pStr, freq], idx) => ({
        id: `pair-${idx}`,
        value: freq,
        label: `("${pStr.replace(",", `", "`)}") : freq ${freq}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        totalPairs: String(pairEntries.length),
        pmiFormula: "Score(A,B) = count(A,B) / (count(A) * count(B))",
        status: "Initialized",
      },
    },
    variables: { pairCount: pairEntries.length },
  });

  const pmiResults: {
    pairStr: string;
    score: number;
    countAB: number;
    countA: number;
    countB: number;
  }[] = [];

  for (let i = 0; i < pairEntries.length; i++) {
    const [pStr, pairFreq] = pairEntries[i];
    const [symA, symB] = pStr.split(",");
    const countA = tokenCounts[symA] || 1;
    const countB = tokenCounts[symB] || 1;

    const pmiScore = pairFreq / (countA * countB);
    pmiResults.push({ pairStr: pStr, score: pmiScore, countAB: pairFreq, countA, countB });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Calculate WordPiece PMI Score for Pair ("${symA}", "${symB}")`,
        why: `PMI Score = count("${symA}","${symB}") / (count("${symA}") * count("${symB}")) = ${pairFreq} / (${countA} * ${countB}) = ${pmiScore.toFixed(
          6,
        )}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: pairEntries.map(([p, f], idx) => ({
          id: `pair-${idx}`,
          value: idx === i ? Math.round(pmiScore * 10000) : f,
          label: `("${p.replace(",", `", "`)}") : ${idx <= i ? pmiResults[idx].score.toFixed(4) : "?"}`,
          state: idx === i ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: idx === i ? [`PMI = ${pmiScore.toFixed(6)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activePair: `("${symA}", "${symB}")`,
          countAB: String(pairFreq),
          countA: String(countA),
          countB: String(countB),
          pmiScore: pmiScore.toFixed(6),
        },
      },
      variables: { i, symA, symB, pmiScore: Math.round(pmiScore * 10000) / 10000 },
    });
  }

  // Step Final: Sorted
  pmiResults.sort((a, b) => b.score - a.score);
  const best = pmiResults[0];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `WordPiece Pair Selection Complete: Top Pair ${best?.pairStr.replace(",", "+")} (Score = ${best?.score.toFixed(
        6,
      )})`,
      why: `Selected highest PMI pair ("${best?.pairStr.replace(
        ",",
        `", "`,
      )}") for inclusion in WordPiece vocabulary. Maximum mutual likelihood ratio achieved.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: pmiResults.map((res, rank) => ({
        id: `res-${rank}`,
        value: Math.round(res.score * 10000),
        label: `Rank ${rank + 1}: ("${res.pairStr.replace(",", `", "`)}") : ${res.score.toFixed(6)}`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Top WordPiece Pair"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        topPair: `("${best?.pairStr.replace(",", `", "`)}")`,
        topPmiScore: best?.score.toFixed(6),
        status: "Completed",
      },
    },
    variables: { bestPair: best?.pairStr, topScore: best?.score, complete: true },
  });

  return steps;
};

export const wordpiecePmiScoredTokenizer: AlgorithmDefinition<WordpiecePmiScoredTokenizerInput> = {
  id: "wordpiecePmiScoredTokenizer",
  title: "WordPiece PMI-Scored Tokenizer Engine",
  category: "ml_tokenization",
  categories: ["ml_tokenization"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tokenization",
  description:
    "Executes candidate pair scoring for WordPiece tokenization (Schuster & Nakajima 2012 / Devlin et al. BERT 2018). Unlike BPE which selects pairs based purely on raw co-occurrence frequency count(A, B), WordPiece maximizes Pointwise Mutual Information (PMI) Score(A, B) = count(A, B) / (count(A) * count(B)), prioritizing pairs whose constituents appear together more frequently than expected by chance.\n\nInput Format:\n- tokenCounts: Dictionary mapping individual subword tokens to unigram frequencies.\n- pairCounts: Dictionary mapping pair string 'A,B' to co-occurrence frequency counts.\n\nOutput Format:\n- Returns sorted list of (pmiScore, pairString) candidates in descending order.",
  constraints: ["tokenCounts contains non-zero unigram frequency counts for constituents."],
  examples: [
    {
      kind: "basic",
      title: "PMI Selection of Rare Co-occurring Pair",
      inputDisplay: "('un','want') vs ('in','side')",
      outputDisplay: "Top Pair: ('un', 'want') with PMI Score 0.0400",
      input: DEFAULT_WORDPIECE_PMI_INPUT,
      output: "('un', 'want')",
      explanation:
        "('un','want') has higher PMI ratio (8/(10*20) = 0.04) than ('in','side') (5/(50*40) = 0.0025).",
    },
    {
      kind: "complex",
      title: "Equal Pair Frequencies Divergent PMI",
      inputDisplay: "Equal pair frequencies with different unigram counts",
      outputDisplay: "Higher score for rarer unigram pair",
      input: {
        tokenCounts: { a: 10, b: 10, x: 100, y: 100 },
        pairCounts: { "a,b": 5, "x,y": 5 },
      },
      output: "('a', 'b')",
      explanation: "('a','b') score = 5/100 = 0.05 vs ('x','y') score = 5/10000 = 0.0005.",
    },
    {
      kind: "negative",
      title: "Zero Co-occurrence Frequency",
      inputDisplay: "pairCounts = {'a,b': 0}",
      outputDisplay: "PMI Score: 0.0",
      input: {
        tokenCounts: { a: 10, b: 10 },
        pairCounts: { "a,b": 0 },
      },
      output: "0.0",
      explanation: "Zero pair frequency yields zero PMI score.",
    },
  ],
  defaultInput: DEFAULT_WORDPIECE_PMI_INPUT,
  code: WORDPIECE_PMI_CODE,
  timeComplexity: {
    best: "O(P log P)",
    average: "O(P log P)",
    worst: "O(P log P)",
  },
  spaceComplexity: "O(P)",
  complexityAnalysis: {
    time: "O(P log P) where P is the number of candidate pairs evaluated for PMI scoring and sorting.",
    space: "O(P) auxiliary memory to store candidate PMI scores.",
  },
  topicGuide: {
    overview:
      "WordPiece tokenization (Schuster & Nakajima 2012) is the subword algorithm powering BERT, RoBERTa-WordPiece, and Electra. While BPE tends to merge high-frequency trivial characters (like 'th' or 'in'), WordPiece uses Pointwise Mutual Information (PMI) to merge pairs that carry strong mutual information (like 'un' + 'wanted').",
    sections: [
      {
        heading: "Core Concept & Likelihood Ratio Formulation",
        body: "WordPiece maximizes the log-likelihood of a unigram language model. The gain from merging pair AB is delta L = count(A, B) * log(P(AB) / (P(A) * P(B))), which simplifies directly to PMI ratio count(A, B) / (count(A) * count(B)).",
      },
      {
        heading: "WordPiece vs BPE Comparison",
        body: "BPE: Merges argmax_{(A,B)} count(A, B). WordPiece: Merges argmax_{(A,B)} count(A, B) / (count(A) * count(B)). WordPiece favors domain-specific compound tokens.",
      },
      {
        heading: "Vocabulary Size Tuning",
        body: "BERT uses a 30,522 WordPiece vocabulary containing English subwords and subword continuation markers `##`.",
      },
    ],
    keyTerms: [
      {
        term: "Pointwise Mutual Information (PMI)",
        definition:
          "Statistical measure quantifying the discrepancy between the joint probability of two events and their independent probabilities.",
      },
      {
        term: "WordPiece Tokenizer",
        definition: "PMI-based subword tokenization algorithm utilized by Google BERT and Electra.",
      },
      {
        term: "Likelihood Ratio Gain",
        definition:
          "Increase in corpus likelihood resulting from adding a merged token to vocabulary.",
      },
    ],
  },
  sources: [
    {
      type: "ml_infra",
      kind: "ml_infra",
      label: "Japanese and Korean Voice Search (Schuster & Nakajima IEEE 2012)",
    },
  ],
  generateSteps: generateWordpiecePmiSteps,
};
