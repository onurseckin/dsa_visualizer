import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface ViterbiLatticeSubwordSegmenterInput {
  text: string;
  tokenCosts: Record<string, number>;
}

export const DEFAULT_VITERBI_SUBWORD_INPUT: ViterbiLatticeSubwordSegmenterInput = {
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
};

export const VITERBI_SUBWORD_SEGMENTER_CODE = `import math

def viterbi_subword_segmenter(text: str, token_costs: dict[str, float]) -> tuple[list[str], float]:
    """
    Viterbi Subword Lattice Segmenter (Unigram LM / SentencePiece).
    Executes dynamic programming (Viterbi) over subword candidate DAG lattice to find
    the globally optimal token segmentation path minimizing total negative log-likelihood cost.
    """
    N = len(text)
    # dp[i] stores min_cost to segment text[0..i]
    dp = [float('inf')] * (N + 1)
    # parent[i] stores (prev_idx, token_str)
    parent = [(-1, "")] * (N + 1)

    dp[0] = 0.0

    for i in range(N):
        if dp[i] == float('inf'):
            continue

        for j in range(i + 1, N + 1):
            sub = text[i:j]
            if sub in token_costs:
                cost = token_costs[sub]
                if dp[i] + cost < dp[j]:
                    dp[j] = dp[i] + cost
                    parent[j] = (i, sub)

    # Backtrack optimal segmentation path
    curr = N
    tokens = []
    while curr > 0:
        prev_i, tok = parent[curr]
        tokens.append(tok)
        curr = prev_i

    tokens.reverse()
    return tokens, dp[N]`;

export const generateViterbiSubwordSteps = (
  input: ViterbiLatticeSubwordSegmenterInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, tokenCosts } = input;
  let stepIndex = 0;

  const N = text.length;
  const dp: number[] = new Array(N + 1).fill(Infinity);
  const parent: { prev: number; tok: string }[] = Array.from({ length: N + 1 }, () => ({
    prev: -1,
    tok: "",
  }));

  dp[0] = 0.0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Viterbi Subword Lattice Segmenter",
      why: `Constructing DAG lattice for text "${text}" (length N = ${N}) with ${Object.keys(tokenCosts).length} vocabulary token costs.`,
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
        dp: `dp[0]=0.0, dp[1..${N}]=inf`,
        status: "Initialized",
      },
    },
    variables: { N, initialCost: 0.0 },
  });

  for (let i = 0; i < N; i++) {
    if (dp[i] === Infinity) continue;

    for (let j = i + 1; j <= N; j++) {
      const sub = text.substring(i, j);
      if (sub in tokenCosts) {
        const cost = tokenCosts[sub];
        if (dp[i] + cost < dp[j]) {
          dp[j] = dp[i] + cost;
          parent[j] = { prev: i, tok: sub };
        }
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Viterbi DP Relaxation at Position i = ${i} ('${text[i]}')`,
        why: `Relaxed outgoing lattice edges from index ${i}. Minimum cost to reach index ${i + 1} (dp[${i + 1}]) = ${dp[i + 1].toFixed(2)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: text.split("").map((ch, idx) => ({
          id: `c-${idx}`,
          value: idx,
          label: `'${ch}' (dp=${dp[idx + 1] === Infinity ? "inf" : dp[idx + 1].toFixed(1)})`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`dp[${i}] = ${dp[i].toFixed(2)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentPos: String(i),
          char: `'${text[i]}'`,
          dpValues: dp
            .map((v, idx) => `dp[${idx}]:${v === Infinity ? "inf" : v.toFixed(1)}`)
            .join(", "),
        },
      },
      variables: { i, dpI: dp[i] },
    });
  }

  // Backtrack
  let curr = N;
  const tokens: string[] = [];
  while (curr > 0) {
    const { prev, tok } = parent[curr];
    tokens.push(tok);
    curr = prev;
  }
  tokens.reverse();

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 29,
    explanation: {
      what: `Viterbi Lattice Segmentation Complete: [${tokens.map((t) => `"${t}"`).join(", ")}]`,
      why: `Globally optimal segmentation path: [${tokens.join(
        " + ",
      )}] with minimum total negative log-likelihood cost ${dp[N].toFixed(2)}.`,
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
        optimalTokens: tokens.map((t) => `"${t}"`).join(" + "),
        minTotalCost: dp[N].toFixed(2),
        status: "Completed",
      },
    },
    variables: { optimalCost: dp[N], complete: true },
  });

  return steps;
};

export const viterbiLatticeSubwordSegmenter: AlgorithmDefinition<ViterbiLatticeSubwordSegmenterInput> =
  {
    id: "viterbiLatticeSubwordSegmenter",
    title: "Viterbi Subword Lattice Segmenter (Unigram LM)",
    category: "ml_tokenization",
    categories: ["ml_tokenization", "dp_1d"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tokenization",
    description:
      "Dynamic programming Viterbi algorithm for subword DAG lattice segmentation (Unigram LM / SentencePiece). Computes the shortest path through all valid token segmentation edges, finding the globally optimal subword sequence that minimizes total negative log-likelihood cost -log P(S).\n\nInput Format:\n- text: Input text string of length N.\n- tokenCosts: Dictionary mapping candidate subword tokens to log-probability costs.\n\nOutput Format:\n- Returns tuple (optimalTokenList, totalMinCost).\n\nEdge Cases & Constraints:\n- Guaranteed O(N * L_max) runtime using DP tabular relaxation.",
    constraints: ["tokenCosts must contain fallback character entries for all text characters."],
    examples: [
      {
        kind: "basic",
        title: "Optimal Viterbi Segmentation for 'unwanted'",
        inputDisplay: "text = 'unwanted', 12 token costs",
        outputDisplay: "Optimal Tokens: ['un', 'want', 'ed'] (Min Cost 3.50)",
        input: DEFAULT_VITERBI_SUBWORD_INPUT,
        output: "['un', 'want', 'ed']",
        explanation:
          "Viterbi DP guarantees global minimum cost 3.50 over alternative segmentations.",
      },
      {
        kind: "complex",
        title: "Single Large Subword Match ('unwanted')",
        inputDisplay: "Cost for 'unwanted' reduced to 0.5",
        outputDisplay: "Optimal Token: ['unwanted'] (Cost 0.50)",
        input: {
          text: "unwanted",
          tokenCosts: { ...DEFAULT_VITERBI_SUBWORD_INPUT.tokenCosts, unwanted: 0.5 },
        },
        output: "['unwanted']",
        explanation: "Single token 'unwanted' has lowest total cost 0.50.",
      },
      {
        kind: "negative",
        title: "Single Character Fallback",
        inputDisplay: "text = 'hi', costs = {'h': 1.0, 'i': 1.0}",
        outputDisplay: "Optimal Tokens: ['h', 'i']",
        input: {
          text: "hi",
          tokenCosts: { h: 1.0, i: 1.0 },
        },
        output: "['h', 'i']",
        explanation: "Segments into individual characters when no subwords exist.",
      },
    ],
    defaultInput: DEFAULT_VITERBI_SUBWORD_INPUT,
    code: VITERBI_SUBWORD_SEGMENTER_CODE,
    timeComplexity: {
      best: "O(N * L_max)",
      average: "O(N * L_max)",
      worst: "O(N * L_max)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N * L_max) DP dynamic programming relaxation time.",
      space: "O(N) auxiliary space for DP table and backtracking pointers.",
    },
    topicGuide: {
      overview:
        "The Viterbi algorithm (Andrew Viterbi, 1967) for subword lattices is the cornerstone of SentencePiece / Unigram LM tokenization. By modeling text segmentation as a shortest-path problem on a Directed Acyclic Graph (DAG), Viterbi guarantees global optimality.",
      sections: [
        {
          heading: "Core Concept & DP State Formulation",
          body: "Let dp[j] be the minimum negative log-likelihood cost to segment prefix text[0..j]. The DP recurrence relation is dp[j] = min_{0 <= i < j, text[i..j] in V} (dp[i] - log P(text[i..j])).",
        },
        {
          heading: "Backtracking Optimal Path",
          body: "A parent array parent[j] stores the best predecessor index i and token string text[i..j], enabling O(N) path reconstruction after reaching dp[N].",
        },
        {
          heading: "Guaranteed Global Optimality vs Greedy BPE",
          body: "Greedy algorithms (like BPE or WordPiece) can get trapped in sub-optimal local choices. Viterbi DP guarantees finding the exact global maximum likelihood segmentation.",
        },
      ],
      keyTerms: [
        {
          term: "Viterbi Algorithm",
          definition: "Dynamic programming shortest-path algorithm over sequence lattices.",
        },
        {
          term: "DAG Lattice",
          definition:
            "Directed Acyclic Graph where vertices represent character positions and edges represent subword tokens.",
        },
        {
          term: "Negative Log-Likelihood Cost",
          definition:
            "Cost metric defined as -log P(token), turning probability multiplication into additive addition.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "SentencePiece Viterbi Lattice (Kudo ACL 2018)",
      },
    ],
    generateSteps: generateViterbiSubwordSteps,
  };
