import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SingleHeadAttentionInput {
  q: number[][]; // [seq_len, d_k]
  k: number[][]; // [seq_len, d_k]
  v: number[][]; // [seq_len, d_v]
}

export const SINGLEHEADATTENTIONMAP_CODE = `import math

def single_head_attention(Q: list[list[float]], K: list[list[float]], V: list[list[float]]) -> list[list[float]]:
    # 1. Compute dot products Q * K^T
    seq_len = len(Q)
    d_k = len(Q[0])
    d_v = len(V[0])
    
    scores = [[0.0] * seq_len for _ in range(seq_len)]
    for i in range(seq_len):
        for j in range(seq_len):
            dot = 0.0
            for d in range(d_k):
                dot += Q[i][d] * K[j][d]
            scores[i][j] = dot / math.sqrt(d_k)
            
    # 2. Softmax row-wise
    attention_weights = [[0.0] * seq_len for _ in range(seq_len)]
    for i in range(seq_len):
        max_score = max(scores[i])
        exp_sum = 0.0
        for j in range(seq_len):
            attention_weights[i][j] = math.exp(scores[i][j] - max_score)
            exp_sum += attention_weights[i][j]
        for j in range(seq_len):
            attention_weights[i][j] /= exp_sum
            
    # 3. Multiply by V
    output = [[0.0] * d_v for _ in range(seq_len)]
    for i in range(seq_len):
        for j in range(d_v):
            val = 0.0
            for t in range(seq_len):
                val += attention_weights[i][t] * V[t][j]
            output[i][j] = val
            
    return output`;

export const DEFAULT_SINGLEHEADATTENTIONMAP_INPUT: SingleHeadAttentionInput = {
  q: [
    [1, 0],
    [0, 1],
  ],
  k: [
    [1, 0],
    [0, 1],
  ],
  v: [[10], [20]],
};

export const generateSingleHeadAttentionMapSteps = (
  input: SingleHeadAttentionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Q = input.q;
  const K = input.k;
  const V = input.v;
  const seq_len = Q.length;
  const d_k = Q[0].length;
  const d_v = V[0].length;

  const scores: number[][] = Array(seq_len)
    .fill(0)
    .map(() => Array(seq_len).fill(0));
  const weights: number[][] = Array(seq_len)
    .fill(0)
    .map(() => Array(seq_len).fill(0));
  const output: number[][] = Array(seq_len)
    .fill(0)
    .map(() => Array(d_v).fill(0));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    grid: GridCellNode[][],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: grid.map((row) => row.map((cell) => ({ ...cell }))),
      },
      auxiliaryState: {
        customState: {
          seq_len,
          d_k,
          d_v,
        },
      },
      variables,
    });
  };

  const createGrid = (
    matrix: number[][],
    highlightR: number = -1,
    highlightC: number = -1,
  ): GridCellNode[][] => {
    return matrix.map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";
        if (r === highlightR && c === highlightC) state = "active";
        else if (r === highlightR || c === highlightC) state = "compare";
        else if (val !== 0) state = "visited";

        return {
          row: r,
          col: c,
          state,
          distance: val, // use distance to show value
        };
      }),
    );
  };

  addStep(
    4,
    "Initialize attention map",
    "Setting up seq_len, d_k, d_v and starting computation.",
    { seq_len, d_k },
    createGrid(scores),
  );

  for (let i = 0; i < seq_len; i++) {
    for (let j = 0; j < seq_len; j++) {
      let dot = 0;
      for (let d = 0; d < d_k; d++) {
        dot += Q[i][d] * K[j][d];
      }
      scores[i][j] = Number((dot / Math.sqrt(d_k)).toFixed(4));
      addStep(
        15,
        `Compute score for query ${i} and key ${j}`,
        "Dot product of Q_i and K_j scaled by sqrt(d_k).",
        { i, j, dot, score: scores[i][j] },
        createGrid(scores, i, j),
      );
    }
  }

  for (let i = 0; i < seq_len; i++) {
    let maxScore = Math.max(...scores[i]);
    let expSum = 0;
    for (let j = 0; j < seq_len; j++) {
      weights[i][j] = Math.exp(scores[i][j] - maxScore);
      expSum += weights[i][j];
    }
    for (let j = 0; j < seq_len; j++) {
      weights[i][j] = Number((weights[i][j] / expSum).toFixed(4));
    }
    addStep(
      27,
      `Apply Softmax to row ${i}`,
      "Convert raw scores into probability distribution.",
      { i, maxScore, expSum },
      createGrid(weights, i, -1),
    );
  }

  for (let i = 0; i < seq_len; i++) {
    for (let j = 0; j < d_v; j++) {
      let val = 0;
      for (let t = 0; t < seq_len; t++) {
        val += weights[i][t] * V[t][j];
      }
      output[i][j] = Number(val.toFixed(4));
      addStep(
        38,
        `Compute output for token ${i} feature ${j}`,
        "Weighted sum of values based on attention weights.",
        { i, j, val: output[i][j] },
        createGrid(output, i, j),
      );
    }
  }

  addStep(
    40,
    "Attention Complete",
    "Final output representation computed for all tokens.",
    { done: true },
    createGrid(output),
  );

  return steps;
};

const SINGLEHEADATTENTIONMAP_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: ["attention_weights[i][j] = max(0, scores[i][j])", "dot += Q[d][i] * K[d][j]"],
  hints: [{ line: 15, hint: "Don't forget to scale by 1/sqrt(d_k)" }],
  lineExplanations: {
    14: "Dot product between query and key vectors.",
    15: "Scaling by sqrt(d_k) prevents softmax from saturating.",
    27: "Row-wise softmax normalization.",
    38: "Weighting the Value vectors by the computed attention scores.",
  },
};

export const singleHeadAttentionMap: AlgorithmDefinition<SingleHeadAttentionInput> = {
  id: "single-head-attention-map",
  title: "Single-Head Attention Map Generator",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description: "Computes Softmax(Q * K^T / sqrt(d_k)) * V for a single attention head.",
  constraints: ["1 <= seq_len <= 100", "1 <= d_k, d_v <= 64"],
  examples: [
    {
      kind: "basic",
      title: "Identity Attention",
      inputDisplay: "Q=I, K=I, V=[10, 20]",
      outputDisplay: "Output approaches V",
      input: {
        q: [
          [1, 0],
          [0, 1],
        ],
        k: [
          [1, 0],
          [0, 1],
        ],
        v: [[10], [20]],
      },
      output: "[[10], [20]] (approx)",
      explanation: "With identity Q and K, tokens attend perfectly to themselves.",
    },
    {
      kind: "complex",
      title: "Cross Token Attention",
      inputDisplay: "Q=[[1,0],[0,1]], K=[[0,1],[1,0]], V=[[10],[20]]",
      outputDisplay: "Output swaps V",
      input: {
        q: [
          [1, 0],
          [0, 1],
        ],
        k: [
          [0, 1],
          [1, 0],
        ],
        v: [[10], [20]],
      },
      output: "[[20], [10]] (approx)",
      explanation: "Query 0 matches Key 1, and Query 1 matches Key 0, effectively swapping values.",
    },
    {
      kind: "negative",
      title: "Zero Queries",
      inputDisplay: "Q=[[0,0],[0,0]], K=[[1,1],[1,1]], V=[[10],[20]]",
      outputDisplay: "Uniform Attention",
      input: {
        q: [
          [0, 0],
          [0, 0],
        ],
        k: [
          [1, 1],
          [1, 1],
        ],
        v: [[10], [20]],
      },
      output: "[[15], [15]]",
      explanation:
        "Zero queries lead to zero scores, meaning uniform softmax distribution. Output is average of all values.",
    },
  ],
  code: SINGLEHEADATTENTIONMAP_CODE,
  timeComplexity: {
    best: "O(N^2 * (d_k + d_v))",
    average: "O(N^2 * (d_k + d_v))",
    worst: "O(N^2 * (d_k + d_v))",
  },
  spaceComplexity: "O(N^2 + N * d_v)",
  complexityAnalysis: {
    time: "Requires O(N^2 * d_k) for QK^T, and O(N^2 * d_v) for Weight*V. Dominant is N^2 sequence length.",
    space: "Requires O(N^2) memory to store the attention weight matrix.",
  },
  topicGuide: {
    overview:
      "Scaled dot product attention is the core operation of Transformers, routing information based on token-to-token similarity.",
    sections: [
      {
        heading: "Query, Key, Value",
        body: "Tokens are projected into queries (what I want), keys (what I have), and values (my content).",
      },
      {
        heading: "Scaling Factor",
        body: "Division by sqrt(d_k) keeps the variance of the dot product roughly at 1, preventing softmax gradients from vanishing.",
      },
      {
        heading: "Quadratic Bottleneck",
        body: "The N^2 time and space complexity with respect to sequence length N is the primary bottleneck in scaling long-context LLMs.",
      },
    ],
    keyTerms: [
      {
        term: "Attention Map",
        definition:
          "An N x N matrix of probabilities denoting how much each token attends to every other token.",
      },
      {
        term: "Softmax",
        definition: "A normalization function mapping a real vector to a probability distribution.",
      },
    ],
  },
  trivia: SINGLEHEADATTENTIONMAP_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Attention Is All You Need" }],
  defaultInput: DEFAULT_SINGLEHEADATTENTIONMAP_INPUT,
  generateSteps: generateSingleHeadAttentionMapSteps,
};
