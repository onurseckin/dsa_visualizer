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
    N = len(text)
    dp = [float('inf')] * (N + 1)
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

  const getDpSnapshots = (activeI?: number, activeJ?: number, backtrackPath?: number[]) => {
    return Array.from({ length: N + 1 }, (_, idx) => {
      let state: ElementState = "default";
      if (backtrackPath && backtrackPath.includes(idx)) {
        state = "sorted";
      } else if (idx === activeJ) {
        state = "compare";
      } else if (idx === activeI) {
        state = "active";
      } else if (activeI !== undefined && idx < activeI) {
        state = "visited";
      }

      const pointers: string[] = [];
      if (idx === activeI) pointers.push(`i=${idx}`);
      if (idx === activeJ) pointers.push(`j=${idx}`);

      return {
        id: `dp-${idx}`,
        value: dp[idx] === Infinity ? "∞" : dp[idx].toFixed(2),
        label: idx === 0 ? "pos 0" : `pos ${idx} ('${text[idx - 1]}')`,
        state,
        pointers,
      };
    });
  };

  // Step 0: Initialization
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Initialize Viterbi DP table and backtracking pointers",
      why: `Base state dp[0] = 0.0 (start of string "${text}"). dp[1..${N}] set to infinity. DP table tracks the minimum total negative log-likelihood cost to reach each prefix boundary index.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: getDpSnapshots(0),
    },
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        length: String(N),
        dpTable: dp.map((v, i) => `dp[${i}]=${v === Infinity ? "∞" : v.toFixed(1)}`).join(", "),
        vocabularySize: String(Object.keys(tokenCosts).length),
      },
    },
    variables: { N, "dp[0]": 0.0 },
  });

  for (let i = 0; i < N; i++) {
    if (dp[i] === Infinity) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Skip unreachable position i = ${i}`,
          why: `dp[${i}] is infinity, meaning position ${i} cannot be reached by any valid sequence of subwords.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: getDpSnapshots(i),
        },
        auxiliaryState: {
          customState: {
            currentPos: String(i),
            status: "Unreachable",
          },
        },
        variables: { i, "dp[i]": "Infinity" },
      });
      continue;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Scan subword extensions from position i = ${i} (prefix "${text.slice(0, i)}")`,
        why: `Starting state cost dp[${i}] = ${dp[i].toFixed(2)}. Examining candidate subword tokens text[${i}..j] starting with character '${text[i]}'.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: getDpSnapshots(i),
      },
      auxiliaryState: {
        customState: {
          currentPos: String(i),
          char: `'${text[i]}'`,
          currentCost: dp[i].toFixed(2),
        },
      },
      variables: { i, "dp[i]": dp[i] },
    });

    for (let j = i + 1; j <= N; j++) {
      const sub = text.slice(i, j);
      if (sub in tokenCosts) {
        const cost = tokenCosts[sub];
        const newCost = dp[i] + cost;
        const isBetter = newCost < dp[j];

        if (isBetter) {
          dp[j] = newCost;
          parent[j] = { prev: i, tok: sub };

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 19,
            explanation: {
              what: `Relax lattice edge: token "${sub}" from index ${i} to ${j}`,
              why: `Found valid vocabulary token "${sub}" with cost ${cost.toFixed(2)}. New candidate cost dp[${i}] + cost = ${dp[i].toFixed(2)} + ${cost.toFixed(2)} = ${newCost.toFixed(2)} < previous dp[${j}] (${dp[j] === newCost ? "new min" : dp[j].toFixed(2)}). Updated dp[${j}].`,
            },
            primarySnapshot: {
              kind: "array",
              elements: getDpSnapshots(i, j),
            },
            auxiliaryState: {
              customState: {
                subword: `"${sub}"`,
                tokenCost: cost.toFixed(2),
                edge: `${i} -> ${j}`,
                updatedDpJ: newCost.toFixed(2),
              },
            },
            variables: { i, j, token: sub, tokenCost: cost, "dp[j]": newCost },
          });
        }
      }
    }
  }

  // Backtracking phase
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Begin Viterbi path backtracking from position N = ${N}`,
      why: `Finished DP forward pass. Minimum total cost to segment entire string "${text}" is dp[${N}] = ${dp[N].toFixed(2)}. Backtracking optimal token sequence using parent pointers.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: getDpSnapshots(undefined, undefined, [N]),
    },
    auxiliaryState: {
      customState: {
        totalCost: dp[N].toFixed(2),
        backtrackPos: String(N),
      },
    },
    variables: { curr: N, minCost: dp[N] },
  });

  let curr = N;
  const tokens: string[] = [];
  const backtrackPath: number[] = [N];

  while (curr > 0) {
    const { prev, tok } = parent[curr];
    tokens.push(tok);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 25,
      explanation: {
        what: `Backtrack token "${tok}" (spans indices ${prev} to ${curr})`,
        why: `Parent pointer at index ${curr} indicates token "${tok}" originating from index ${prev}. Adding "${tok}" to path and moving current position to ${prev}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: getDpSnapshots(undefined, curr, backtrackPath),
      },
      auxiliaryState: {
        customState: {
          tokenExtracted: `"${tok}"`,
          fromPos: String(prev),
          toPos: String(curr),
          pathSoFar: tokens
            .slice()
            .reverse()
            .map((t) => `"${t}"`)
            .join(" + "),
        },
      },
      variables: { curr, prev, token: tok },
    });

    curr = prev;
    backtrackPath.push(curr);
  }

  tokens.reverse();

  // Final Step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 30,
    explanation: {
      what: `Viterbi subword segmentation complete: [${tokens.map((t) => `"${t}"`).join(", ")}]`,
      why: `Globally optimal subword segmentation path: ${tokens.map((t) => `"${t}"`).join(" + ")} with total minimum negative log-likelihood cost ${dp[N].toFixed(2)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: getDpSnapshots(undefined, undefined, backtrackPath),
    },
    auxiliaryState: {
      customState: {
        optimalSegmentation: tokens.map((t) => `"${t}"`).join(" + "),
        minTotalCost: dp[N].toFixed(2),
        tokenCount: String(tokens.length),
        status: "Completed",
      },
    },
    variables: { optimalTokens: tokens, optimalCost: dp[N] },
  });

  return steps;
};

export const viterbiLatticeSubwordSegmenter: AlgorithmDefinition<ViterbiLatticeSubwordSegmenterInput> =
  {
    id: "viterbi-lattice-subword-segmenter",
    title: "Viterbi Subword Lattice Segmenter (Unigram LM)",
    topicIds: ["ml_tokenization", "dp_1d"],
    difficulty: "Hard",
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
