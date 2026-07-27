import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SingleHeadAttentionInput {
  q: number[][]; // [seq_len, d_k]
  k: number[][]; // [seq_len, d_k]
  v: number[][]; // [seq_len, d_v]
}

export const SINGLEHEADATTENTIONMAP_CODE = `
def single_head_attention(
    q: list[list[float]],  # Shape [seq_len, d_k]
    k: list[list[float]],  # Shape [seq_len, d_k]
    v: list[list[float]],  # Shape [seq_len, d_v]
    scale: float
) -> tuple[list[list[float]], list[list[float]]]:
    """
    Computes Scaled Dot-Product Attention: Output = Softmax(Q @ K.T * scale) @ V.
    Returns (attention_weights, output_matrix).
    """
    import math

    seq_len = len(q)
    d_v = len(v[0])

    # Step 1: Compute scaled dot-product logits S = Q @ K.T * scale
    scores = []
    for i in range(seq_len):
        row_scores = [sum(qi * ki for qi, ki in zip(q[i], k[j])) * scale for j in range(seq_len)]
        scores.append(row_scores)

    # Step 2: Row-wise Softmax normalization (online max subtraction for stability)
    weights = []
    for row in scores:
        max_val = max(row)
        exp_vals = [math.exp(sc - max_val) for sc in row]
        sum_exp = sum(exp_vals)
        weights.append([e / sum_exp for e in exp_vals])

    # Step 3: Weighted sum of values O = Softmax(S) @ V
    output = []
    for i in range(seq_len):
        out_row = [sum(weights[i][t] * v[t][j] for t in range(seq_len)) for j in range(d_v)]
        output.append(out_row)

    return weights, output
`;

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
          distance: val,
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
        19,
        `Compute score for query ${i} and key ${j}`,
        "Dot product of Q_i and K_j scaled by 1/sqrt(d_k).",
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
      28,
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
        34,
        `Compute output for token ${i} feature ${j}`,
        "Weighted sum of values based on attention weights.",
        { i, j, val: output[i][j] },
        createGrid(output, i, j),
      );
    }
  }

  addStep(
    36,
    "Attention Complete",
    "Final output representation computed for all tokens.",
    { done: true },
    createGrid(output),
  );

  return steps;
};

const SINGLEHEADATTENTIONMAP_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  distractors: [
    "weights[i][j] = max(0, scores[i][j])",
    "dot += Q[d][i] * K[d][j]",
    "scale = sqrt(d_k)",
  ],
  hints: [
    { line: 19, hint: "Scale dot product by 1/sqrt(d_k) to prevent softmax saturation." },
    { line: 28, hint: "Perform row-wise exponentiation and normalization for softmax." },
    { line: 34, hint: "Multiply probability weights by Value vectors." },
  ],
  lineExplanations: {
    1: "Defines Scaled Dot-Product Single-Head Attention entry point.",
    19: "Computes scaled inner product score Q_i @ K_j.T / sqrt(d_k).",
    28: "Computes row-wise Softmax probability distribution.",
    34: "Computes weighted sum of value vectors to form output representation.",
    36: "Returns attention weights matrix and final output tensor.",
  },
};

export const singleHeadAttentionMap: AlgorithmDefinition<SingleHeadAttentionInput> = {
  id: "single-head-attention-map",
  title: "Single-Head Attention Map Generator",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "Scaled Dot-Product Attention (Vaswani et al., 2017) is the core operational building block of Transformer neural networks. Given Query matrix $Q \\in \\mathbb{R}^{N \\times d_k}$, Key matrix $K \\in \\mathbb{R}^{N \\times d_k}$, and Value matrix $V \\in \\mathbb{R}^{N \\times d_v}$, single-head attention maps input sequences into contextual representations:\n$$\\text{Attention}(Q, K, V) = \\text{Softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$\n\nThe scaling factor $1/\\sqrt{d_k}$ compensates for dot-product growth under large feature dimensions $d_k$, preventing the Softmax gradient from vanishing in regions of extreme values.\n\nInput Format:\n- q: Query matrix $[N, d_k]$.\n- k: Key matrix $[N, d_k]$.\n- v: Value matrix $[N, d_v]$.\n\nOutput Format:\n- Attention probability weights matrix $P \\in [0,1]^{N \\times N}$ and final contextual output matrix $O \\in \\mathbb{R}^{N \\times d_v}$.\n\nEdge Cases & Constraints:\n- Vanishing gradients: Large $d_k$ without $1/\\sqrt{d_k}$ scaling causes dot products to push Softmax inputs into regions of tiny gradients.\n- Zero queries: Zero Query vectors result in uniform attention distribution ($1/N$).",
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
    best: "O(N^2 \\cdot d_k + N^2 \\cdot d_v)",
    average: "O(N^2 \\cdot d_k + N^2 \\cdot d_v)",
    worst: "O(N^2 \\cdot d_k + N^2 \\cdot d_v)",
  },
  spaceComplexity: "O(N^2 + N \\cdot d_v)",
  complexityAnalysis: {
    time: "Requires $O(N^2 \\cdot d_k)$ for $Q K^T$ matrix multiply and $O(N^2 \\cdot d_v)$ for $P V$ product.",
    space: "Requires $O(N^2)$ memory to store the full $N \\times N$ attention weight matrix.",
  },
  topicGuide: {
    overview:
      "Scaled Dot-Product Attention is the foundational building block of all modern Transformer architectures. By allowing every token to attend to every other token, attention captures complex long-range dependencies.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given queries $Q \\in \\mathbb{R}^{N \\times d_k}$, keys $K \\in \\mathbb{R}^{N \\times d_k}$, values $V \\in \\mathbb{R}^{N \\times d_v}$, raw logits are $S = Q K^T / \\sqrt{d_k}$. Attention weights are $P = \\text{Softmax}(S) \\in \\mathbb{R}^{N \\times N}$. Output is $O = P V \\in \\mathbb{R}^{N \\times d_v}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Standard attention materializes $S \\in \\mathbb{R}^{N \\times N}$ in GPU HBM, consuming $O(N^2)$ memory and creating a severe DRAM bandwidth bottleneck. Tiling algorithms like FlashAttention avoid materializing $S$ in DRAM by fusing matrix multiplication, online softmax, and value reduction inside fast GPU SRAM.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Softmax stabilization: subtract max logit $m_i = \\max_j S_{ij}$ before exponentiation $\\exp(S_{ij} - m_i)$ to prevent IEEE 754 floating-point overflow.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Masked attention (causal or padding masks) sets invalid positions to $-\\infty$ before Softmax, ensuring those positions receive exactly 0 attention probability weight.",
      },
    ],
    keyTerms: [
      {
        term: "Scaled Dot-Product Attention",
        definition: "The fundamental attention mechanism computing Softmax(QK^T / sqrt(d_k)) V.",
      },
      {
        term: "Temperature Scaling Factor",
        definition:
          "The factor 1/sqrt(d_k) used to maintain variance = 1 under random vector inputs.",
      },
      {
        term: "Attention Probability Weights",
        definition:
          "Row-normalized probabilities representing contextual relevance between query and key tokens.",
      },
      {
        term: "Online Softmax",
        definition:
          "Technique for updating running max and sum-exp statistics dynamically during streaming tile evaluation.",
      },
    ],
  },
  trivia: SINGLEHEADATTENTIONMAP_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Attention Is All You Need" }],
  defaultInput: DEFAULT_SINGLEHEADATTENTIONMAP_INPUT,
  generateSteps: generateSingleHeadAttentionMapSteps,
};
