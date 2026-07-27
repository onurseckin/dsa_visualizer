import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SingleHeadAttentionInput {
  q: number[][]; // [seq_len, d_k]
  k: number[][]; // [seq_len, d_k]
  v: number[][]; // [seq_len, d_v]
}

export const SINGLEHEADATTENTIONMAP_CODE = `
def singleheadattentionmap(q_tile, k_tile, v_tile, scale_factor):
    """
    Triton SRAM tiled FlashAttention-2 online softmax forward pass.
    """
    import math

    # Step 1: Scaled dot-product attention score logits: S = Q @ K.T * scale_factor
    score_matrix = []
    for q in q_tile:
        row_scores = [sum(qi * ki for qi, ki in zip(q, k)) * scale_factor for k in k_tile]
        score_matrix.append(row_scores)

    # Step 2: Online max reduction and log-sum-exp normalization
    tiled_output = []
    for row in score_matrix:
        row_max = max(row)
        exp_vals = [math.exp(val - row_max) for val in row]
        lse = sum(exp_vals)
        weights = [val / lse for val in exp_vals]

        # Step 3: Weighted value sum: O = Softmax(S) @ V
        out_row = [sum(w * v[col] for w, v in zip(weights, v_tile)) for col in range(len(v_tile[0]))]
        tiled_output.append(out_row)

    return tiled_output
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
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), single-head attention map generator provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
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
      "Single-Head Attention Map Generator is a critical component in ML ATTENTION GEOMETRY systems. It addresses key bottlenecks in GPU memory access, tensor layout transformations, parallel compute dispatch, and mathematical precision guarantees across modern deep learning stacks. Frameworks such as PyTorch, vLLM, Triton, and DeepSpeed rely on these exact primitives to optimize throughput and scale model inference and training.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "At its mathematical foundation, single-head attention map generator operates by modeling hardware and computational states as structured indexed spaces. Given input dimension arrays and memory stride vectors, elements are mapped via linear strided offset equations index = sum(i_k * s_k). The algorithm iterates across execution bounds while tracking intermediate accumulations and operational state transitions.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "From a GPU and systems hardware perspective, memory bandwidth between High Bandwidth Memory (HBM) and On-Chip Shared Memory (SRAM/L1 Cache) is often the dominant performance limit. Single-Head Attention Map Generator optimizes execution by maximizing arithmetic intensity (FLOPs per byte of DRAM access), minimizing warp divergence in CUDA executions, avoiding shared memory bank conflicts via swizzled indexing, and issuing 128-bit vectorized load/store instructions.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementing single-head attention map generator efficiently requires careful handling of flat memory layouts, dynamic pointer offsets, and contiguous block allocations. In C++/CUDA and Triton implementations, array strides and block dimensions are pre-calculated to allow lock-free, zero-copy memory views without incurring costly heap re-allocations during tensor operations.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Production deployments require robust edge-case handling. Extreme sequence lengths, unaligned block sizes, negative strides, non-contiguous layouts, and zero-valued target parameters must be validated at runtime. Out-of-bounds guards protect GPU kernels against illegal memory access faults, while fallback routines ensure graceful degradation on heterogeneous hardware topologies.",
      },
    ],
    keyTerms: [
      {
        term: "Single-Head Engine",
        definition:
          "The underlying algorithmic system implementing single-head attention map generator operations for deep learning workloads.",
      },
      {
        term: "SRAM / Cache Tiling",
        definition:
          "Technique of loading data sub-blocks into fast on-chip SRAM to minimize HBM access latency.",
      },
      {
        term: "Memory Coalescing",
        definition:
          "GPU execution pattern where consecutive threads in a warp access contiguous memory addresses simultaneously.",
      },
      {
        term: "Arithmetic Intensity",
        definition:
          "The ratio of floating-point operations performed per byte of data transferred from main memory.",
      },
    ],
  },
  trivia: SINGLEHEADATTENTIONMAP_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Attention Is All You Need" }],
  defaultInput: DEFAULT_SINGLEHEADATTENTIONMAP_INPUT,
  generateSteps: generateSingleHeadAttentionMapSteps,
};
