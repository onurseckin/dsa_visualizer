import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface FastSubwordLatticeViterbiBeamInput {
  text: string;
  tokenCosts: Record<string, number>; // token string -> negative log-prob cost
  beamSize: number;
}

export const DEFAULT_VITERBI_BEAM_INPUT: FastSubwordLatticeViterbiBeamInput = {
  text: "unwanted",
  tokenCosts: {
    un: 1.0,
    want: 1.5,
    ed: 1.0,
    unwant: 4.0,
    wanted: 3.5,
    u: 3.0,
    n: 3.0,
    w: 3.0,
    a: 3.0,
    t: 3.0,
    e: 3.0,
    d: 3.0,
  },
  beamSize: 2,
};

export const FAST_SUBWORD_LATTICE_VITERBI_BEAM_CODE = `import math

def viterbi_beam_subword_segment(text: str, token_costs: dict[str, float], beam_size: int = 2) -> list[str]:
    """
    Subword Lattice Viterbi Beam Search (SentencePiece / Unigram LM).
    Maintains a beam of size 'beam_size' top paths at each character position i.
    Finds optimal subword token segmentation in O(N * beam_size * L_max) time.
    """
    N = len(text)
    # dp[i] stores list of (total_cost, path_tokens) of size <= beam_size
    dp = [[] for _ in range(N + 1)]
    dp[0] = [(0.0, [])]

    for i in range(N):
      if not dp[i]:
          continue

      for total_cost, path in dp[i]:
          for j in range(i + 1, N + 1):
              sub = text[i:j]
              if sub in token_costs:
                  cost = token_costs[sub]
                  new_cost = total_cost + cost
                  new_path = path + [sub]
                  dp[j].append((new_cost, new_path))

      # Beam pruning at position j: retain top 'beam_size' paths with minimum total_cost
      for j in range(i + 1, N + 1):
          if dp[j]:
              dp[j].sort(key=lambda x: x[0])
              dp[j] = dp[j][:beam_size]

    best_path = dp[N][0][1] if dp[N] else []
    return best_path`;

export const generateViterbiBeamSteps = (
  input: FastSubwordLatticeViterbiBeamInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, tokenCosts, beamSize } = input;
  let stepIndex = 0;

  const N = text.length;
  // dp[i] stores array of { cost, path }
  const dp: { cost: number; path: string[] }[][] = Array.from({ length: N + 1 }, () => []);
  dp[0] = [{ cost: 0.0, path: [] }];

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Initialize Viterbi Beam Subword Lattice (beamSize = ${beamSize})`,
      why: `Segmenting text "${text}" (length N = ${N}) into subword tokens using beam capacity ${beamSize}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: text.split("").map((ch, idx) => ({
        id: `c-${idx}`,
        value: idx,
        label: `'${ch}'`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        beamSize: String(beamSize),
        status: "Initialized",
      },
    },
    variables: { N, beamSize },
  });

  for (let i = 0; i < N; i++) {
    if (dp[i].length === 0) continue;

    for (const { cost: totalCost, path } of dp[i]) {
      for (let j = i + 1; j <= N; j++) {
        const sub = text.substring(i, j);
        if (sub in tokenCosts) {
          const cost = tokenCosts[sub];
          const newCost = totalCost + cost;
          const newPath = [...path, sub];
          dp[j].push({ cost: newCost, path: newPath });
        }
      }
    }

    // Prune beam at j
    for (let j = i + 1; j <= N; j++) {
      if (dp[j].length > 0) {
        dp[j].sort((a, b) => a.cost - b.cost);
        dp[j] = dp[j].slice(0, beamSize);
      }
    }

    const topPathAtI = dp[i + 1][0];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Process Position i = ${i} ('${text[i]}')`,
        why: topPathAtI
          ? `Top beam path at index ${i + 1}: [${topPathAtI.path.join(
              ", ",
            )}] with cost ${topPathAtI.cost.toFixed(2)}.`
          : `Evaluated lattice edges extending from index ${i}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: text.split("").map((ch, idx) => ({
          id: `c-${idx}`,
          value: idx,
          label: `'${ch}'`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx <= i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`Active i=${i}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentPos: String(i),
          char: `'${text[i]}'`,
          topPathCost: topPathAtI ? topPathAtI.cost.toFixed(2) : "N/A",
          topPathTokens: topPathAtI ? topPathAtI.path.join(" + ") : "None",
        },
      },
      variables: { i, char: text[i] },
    });
  }

  // Step Final: Complete
  const bestResult = dp[N][0];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: `Viterbi Beam Search Complete: Segmented into [${bestResult?.path.join(", ")}]`,
      why: `Optimal low-cost subword path found: [${bestResult?.path.join(
        ", ",
      )}] with total cost ${bestResult?.cost.toFixed(2)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: (bestResult?.path || []).map((tok, rank) => ({
        id: `tok-${rank}`,
        value: rank,
        label: `Token ${rank + 1}: "${tok}"`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        optimalSegmentation: (bestResult?.path || []).map((t) => `"${t}"`).join(" + "),
        totalCost: bestResult?.cost.toFixed(2) ?? "N/A",
        status: "Completed",
      },
    },
    variables: { optimalCost: bestResult?.cost, complete: true },
  });

  return steps;
};

export const fastSubwordLatticeViterbiBeam: AlgorithmDefinition<FastSubwordLatticeViterbiBeamInput> =
  {
    id: "fastSubwordLatticeViterbiBeam",
    title: "Fast Subword Lattice Viterbi Beam Search",
    category: "ml_tokenization",
    categories: ["ml_tokenization", "dp_1d"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tokenization",
    description:
      "Subword lattice Viterbi beam search engine used by SentencePiece / Unigram LM tokenizers (Kudo, 2018). Maintained by a beam capacity priority queue per character position, this algorithm finds the minimum negative log-likelihood subword segmentation path in bounded O(N * B * L_max) time.\n\nInput Format:\n- text: Input text string to segment.\n- tokenCosts: Dictionary mapping candidate token string to float cost (-log P(t)).\n- beamSize: Priority beam capacity size B.\n\nOutput Format:\n- Returns list of optimal subword token strings `[t_1, t_2, ..., t_K]`.",
    constraints: [
      "beamSize >= 1.",
      "tokenCosts must contain character fallbacks to ensure full text coverage.",
    ],
    examples: [
      {
        kind: "basic",
        title: "Segmenting 'unwanted' into Subwords",
        inputDisplay: "text = 'unwanted', beamSize = 2",
        outputDisplay: "Segmentation: ['un', 'want', 'ed'] (Cost 3.5)",
        input: DEFAULT_VITERBI_BEAM_INPUT,
        output: "['un', 'want', 'ed']",
        explanation: "Finds minimum cost path 'un' (1.0) + 'want' (1.5) + 'ed' (1.0) = 3.5.",
      },
      {
        kind: "complex",
        title: "Narrow Beam Pruning (beamSize = 1)",
        inputDisplay: "beamSize = 1",
        outputDisplay: "Segmentation: ['un', 'want', 'ed']",
        input: {
          ...DEFAULT_VITERBI_BEAM_INPUT,
          beamSize: 1,
        },
        output: "['un', 'want', 'ed']",
        explanation: "Pure Viterbi 1-best dynamic programming.",
      },
      {
        kind: "negative",
        title: "Fallback to Single Characters",
        inputDisplay: "No multi-char tokens available",
        outputDisplay: "Character-by-character tokens",
        input: {
          text: "un",
          tokenCosts: { u: 3.0, n: 3.0 },
          beamSize: 2,
        },
        output: "['u', 'n']",
        explanation:
          "Falls back to individual character tokens when no multi-character subwords match.",
      },
    ],
    defaultInput: DEFAULT_VITERBI_BEAM_INPUT,
    code: FAST_SUBWORD_LATTICE_VITERBI_BEAM_CODE,
    timeComplexity: {
      best: "O(N * B * L_max)",
      average: "O(N * B * L_max)",
      worst: "O(N * B * L_max)",
    },
    spaceComplexity: "O(N * B)",
    complexityAnalysis: {
      time: "O(N * B * L_max) where N is text length, B is beam size, and L_max is maximum subword token length.",
      space: "O(N * B) auxiliary space to store beam paths at each character index position.",
    },
    topicGuide: {
      overview:
        "SentencePiece / Unigram LM tokenizers (Kudo 2018, Taku Kudo) model text segmentation probabilistically as a Directed Acyclic Graph (DAG) lattice. Viterbi beam search finds the sequence of subwords that maximizes total sequence likelihood P(S) = prod_{t in S} P(t).",
      sections: [
        {
          heading: "Core Concept & Subword DAG Lattice",
          body: "Characters 0..N form graph vertices. Valid vocabulary tokens form directed edges (i, j) with weight -log P(t). The Viterbi algorithm computes the shortest path through the DAG.",
        },
        {
          heading: "Beam Search Pruning (B)",
          body: "To prevent memory growth when text length N is large, beam search caps the number of candidate paths at each character vertex to B, trading negligible optimality for guaranteed linear runtime.",
        },
        {
          heading: "BPE vs Unigram LM Viterbi",
          body: "Unlike BPE which applies deterministic greedy merge rules, Unigram LM Viterbi evaluates all valid segmentations probabilistically, supporting stochastic sampling (Subword Regularization) during training.",
        },
      ],
      keyTerms: [
        {
          term: "Subword Lattice",
          definition: "DAG representing all valid token segmentation paths over an input string.",
        },
        {
          term: "Viterbi Algorithm",
          definition:
            "Dynamic programming algorithm for finding the most likely sequence of hidden states.",
        },
        {
          term: "Subword Regularization",
          definition:
            "Sampling non-optimal subword segmentations from the Viterbi lattice during model training to boost robustness.",
        },
      ],
    },
    sources: [
      { type: "ml_infra", kind: "ml_infra", label: "SentencePiece & Unigram LM (Kudo ACL 2018)" },
    ],
    generateSteps: generateViterbiBeamSteps,
  };
