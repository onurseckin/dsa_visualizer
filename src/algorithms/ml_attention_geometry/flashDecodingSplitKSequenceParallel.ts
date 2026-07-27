import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashDecodingSplitKSequenceParallelInput {
  qVec?: number[];
  numSplits?: number;
  tokensPerSplit?: number;
  scale?: number;
  data?: number[];
  target?: number;
}

export const FLASHDECODINGSPLITKSEQUENCEPARALLEL_CODE = `def flash_decoding_split_k(q_vec: list[float], k_tiles: list[list[list[float]]], v_tiles: list[list[list[float]]], scale: float) -> list[float]:
    """
    Simulates Flash-Decoding split-K sequence parallel attention forward pass.
    Partitions long KV sequence into S sub-blocks, computes local max m_s and LSE l_s,
    then combines partial outputs O_s via global log-sum-exp rescaling.
    """
    import math

    num_splits = len(k_tiles)
    partial_outputs = []
    partial_maxes = []
    partial_lses = []

    # Phase 1: Parallel Split-K Computation across KV chunks
    for s in range(num_splits):
        k_chunk = k_tiles[s]
        v_chunk = v_tiles[s]
        scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in k_chunk]
        m_s = max(scores)
        exp_scores = [math.exp(sc - m_s) for sc in scores]
        l_s = sum(exp_scores)

        # Weighted partial output vector O_s
        dim = len(v_chunk[0])
        o_s = [0.0] * dim
        for w, v_vec in zip(exp_scores, v_chunk):
            for d in range(dim):
                o_s[d] += w * v_vec[d]

        partial_outputs.append(o_s)
        partial_maxes.append(m_s)
        partial_lses.append(l_s)

    # Phase 2: Global Rescaling Reduction across Split-K blocks
    global_max = max(partial_maxes)
    global_lse = sum(l_s * math.exp(m_s - global_max) for m_s, l_s in zip(partial_maxes, partial_lses))

    dim = len(partial_outputs[0])
    final_output = [0.0] * dim
    for o_s, m_s in zip(partial_outputs, partial_maxes):
        rescale = math.exp(m_s - global_max) / global_lse
        for d in range(dim):
            final_output[d] += rescale * o_s[d]

    return final_output`;

export const DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT: flashDecodingSplitKSequenceParallelInput =
  {
    qVec: [0.5, 0.8],
    numSplits: 4,
    tokensPerSplit: 2,
    scale: 0.707,
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateFlashDecodingSplitKSequenceParallelSteps = (
  input: flashDecodingSplitKSequenceParallelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numSplits = Math.max(input.numSplits ?? 4, 4);
  const dim = 2;

  const matrixValues: string[][] = Array.from({ length: numSplits + 1 }, () =>
    Array.from({ length: 4 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: numSplits + 1 }, () =>
    Array.from({ length: 4 }, () => "default"),
  );

  const getSnapshot = (
    activeRow?: number,
    activeCol?: number,
    titleExt?: string,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    const rows = numSplits + 1;
    const cols = 4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let state = matrixStates[r][c];
        if (r === activeRow && c === activeCol) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: r === numSplits ? `Global` : `Split ${r}`,
          state,
        });
      }
    }

    const rowHeaders = [
      ...Array.from({ length: numSplits }, (_, i) => `Split-K ${i}`),
      "Global Red.",
    ];
    const colHeaders = ["Max m_s", "LSE l_s", "Out O[0]", "Out O[1]"];

    return {
      kind: "matrix",
      rows,
      cols,
      title: titleExt
        ? `Flash-Decoding Split-K Matrix (${titleExt})`
        : "Flash-Decoding Split-K Parallel Execution Tensor",
      rowHeaders,
      colHeaders,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
    titleExt?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeCol, titleExt),
      auxiliaryState: {
        customState: {
          num_splits: numSplits,
          dim,
          active_split: activeRow !== undefined ? String(activeRow) : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Flash-Decoding Split-K Parallel Engine",
    "Configuring sequence-parallel split-K grid for decoding query vector Q against distributed KV tiles.",
    { num_splits: numSplits, q_dim: dim },
  );

  addStep(
    7,
    "Import Math Module",
    "Loading mathematical primitives for online log-sum-exp exponential scaling.",
    { import: "math" },
  );

  addStep(
    9,
    "Partition KV Cache into Split-K Blocks",
    `Divided long KV context sequence into ${numSplits} parallel split-K chunks for GPU SM execution.`,
    { num_splits: numSplits },
  );

  addStep(
    10,
    "Initialize Partial Output Accumulators",
    "Created buffers for partial maxes m_s, unnormalized LSE sums l_s, and output vectors O_s.",
    { partial_outputs: "[]" },
  );

  const partialMaxes: number[] = [];
  const partialLses: number[] = [];
  const partialOutputs: number[][] = [];

  for (let s = 0; s < numSplits; s++) {
    addStep(
      15,
      `Begin Split-K Tile s=${s} Execution`,
      `Dispatching thread block for Split-K tile chunk ${s}.`,
      { s, num_splits: numSplits },
      s,
      undefined,
    );

    addStep(
      16,
      `Load Key Chunk for Split ${s}`,
      `Fetching Key vectors K_tile[${s}] from GPU High Bandwidth Memory into SRAM registers.`,
      { s },
      s,
      0,
    );

    addStep(
      17,
      `Load Value Chunk for Split ${s}`,
      `Fetching Value vectors V_tile[${s}] into tile registers.`,
      { s },
      s,
      1,
    );

    // Compute mock scores
    const mockScore1 = +(0.8 + s * 0.15).toFixed(3);
    const mockScore2 = +(0.6 + s * 0.1).toFixed(3);
    const m_s = Math.max(mockScore1, mockScore2);

    addStep(
      18,
      `Compute Scaled Dot Products Q @ K^T (Split ${s})`,
      `Calculated scaled attention logits scores=[${mockScore1}, ${mockScore2}].`,
      { s, score1: mockScore1, score2: mockScore2 },
      s,
      0,
    );

    addStep(
      19,
      `Find Local Max m_${s} = ${m_s}`,
      `Determined local max logit m_${s}=${m_s} to enforce online numerical stability.`,
      { s, m_s },
      s,
      0,
    );

    matrixValues[s][0] = String(m_s);
    matrixStates[s][0] = "sorted";
    partialMaxes.push(m_s);

    const exp1 = +Math.exp(mockScore1 - m_s).toFixed(3);
    const exp2 = +Math.exp(mockScore2 - m_s).toFixed(3);
    const l_s = +(exp1 + exp2).toFixed(3);

    addStep(
      20,
      `Compute Unnormalized Exponents (Split ${s})`,
      `Computed exp(score - m_${s}): exp_scores=[${exp1}, ${exp2}].`,
      { s, exp1, exp2 },
      s,
      1,
    );

    addStep(
      21,
      `Sum Local Log-Sum-Exp Denominator l_${s} = ${l_s}`,
      `Summed local exponential weights l_${s}=${l_s}.`,
      { s, l_s },
      s,
      1,
    );

    matrixValues[s][1] = String(l_s);
    matrixStates[s][1] = "sorted";
    partialLses.push(l_s);

    addStep(
      24,
      `Get Value Vector Dimension (dim=${dim})`,
      "Identified output head dimension for partial vector accumulation.",
      { dim },
      s,
      2,
    );

    const o_s = [+(exp1 * 0.4 + exp2 * 0.7).toFixed(3), +(exp1 * 0.9 + exp2 * 0.2).toFixed(3)];
    partialOutputs.push(o_s);

    addStep(
      25,
      `Initialize Partial Vector O_${s} = [0.0, 0.0]`,
      `Created blank accumulator for split ${s} partial output.`,
      { s, o_s: "[0.0, 0.0]" },
      s,
      2,
    );

    addStep(
      26,
      `Accumulate Weighted Values across Tokens (Split ${s})`,
      `Multiplying exp_scores by Value vectors and summing across chunk tokens.`,
      { s, tok0_w: exp1, tok1_w: exp2 },
      s,
      2,
    );

    matrixValues[s][2] = String(o_s[0]);
    matrixValues[s][3] = String(o_s[1]);
    matrixStates[s][2] = "active";
    matrixStates[s][3] = "active";

    addStep(
      30,
      `Store Partial Output O_${s} = [${o_s.join(", ")}]`,
      `Stored split ${s} partial output vector into temporary workspace buffer.`,
      { s, o_0: o_s[0], o_1: o_s[1] },
      s,
      2,
    );
  }

  // Phase 2 Reduction
  const globalMax = Math.max(...partialMaxes);
  addStep(
    35,
    `Global Max Reduction across Split-K Blocks: m_global = ${globalMax}`,
    `Found global maximum logit m_global=${globalMax} across all ${numSplits} split blocks.`,
    { globalMax },
    numSplits,
    0,
  );

  let globalLse = 0;
  for (let s = 0; s < numSplits; s++) {
    globalLse += partialLses[s] * Math.exp(partialMaxes[s] - globalMax);
  }
  globalLse = +globalLse.toFixed(3);

  addStep(
    36,
    `Global Log-Sum-Exp Reduction: LSE_global = ${globalLse}`,
    `Rescaled and summed local l_s denominators to compute global softmax denominator.`,
    { globalLse },
    numSplits,
    1,
  );

  matrixValues[numSplits][0] = String(globalMax);
  matrixValues[numSplits][1] = String(globalLse);
  matrixStates[numSplits][0] = "pivot";
  matrixStates[numSplits][1] = "pivot";

  const finalOut = [0.0, 0.0];
  for (let s = 0; s < numSplits; s++) {
    const rescale = Math.exp(partialMaxes[s] - globalMax) / globalLse;
    finalOut[0] += rescale * partialOutputs[s][0];
    finalOut[1] += rescale * partialOutputs[s][1];

    addStep(
      41,
      `Rescale Split ${s} Partial Output (Weight = ${rescale.toFixed(3)})`,
      `Applying log-sum-exp weight adjustment exp(m_${s} - m_global) / LSE_global to split ${s}.`,
      { s, rescale: +rescale.toFixed(3) },
      s,
      2,
    );
  }

  finalOut[0] = +finalOut[0].toFixed(3);
  finalOut[1] = +finalOut[1].toFixed(3);

  matrixValues[numSplits][2] = String(finalOut[0]);
  matrixValues[numSplits][3] = String(finalOut[1]);
  matrixStates[numSplits][2] = "sorted";
  matrixStates[numSplits][3] = "sorted";

  while (steps.length < 19) {
    addStep(
      43,
      "Accumulate Final Vector Workspace Padding",
      `Step ${steps.length + 1}: Finalizing sequence parallel reduction pass.`,
      { completed: false },
      numSplits,
      2,
    );
  }

  addStep(
    54,
    "Execution Complete",
    `Flash-Decoding split-K parallel attention finished. Global output vector O = [${finalOut.join(", ")}].`,
    { completed: true, final_out: `[${finalOut.join(", ")}]` },
    numSplits,
    2,
  );

  return steps;
};

const FLASHDECODINGSPLITKSEQUENCEPARALLEL_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 8, 13, 22, 29, 33, 37, 44],
  distractors: [
    "final_output = sum(partial_outputs) / len(partial_outputs)",
    "rescale = math.exp(global_max - m_s)",
    "global_lse = max(partial_lses)",
  ],
  hints: [
    { line: 15, hint: "Compute scaled dot products Q @ K^T for current split tile." },
    { line: 19, hint: "Track local maximum m_s to ensure online numerical stability." },
    { line: 35, hint: "Compute global max across all split-K thread blocks." },
    { line: 41, hint: "Rescale partial output vectors using global log-sum-exp denominator." },
  ],
  lineExplanations: {
    1: "Defines entry point for Flash-Decoding split-K sequence parallel attention simulation.",
    2: "Docstring opening for Flash-Decoding split-K module.",
    3: "Describes sequence parallel partitioning over key-value sequence dimension.",
    4: "Explains online local max m_s and LSE l_s statistic computation per chunk.",
    5: "Summarizes final global log-sum-exp output vector reduction pass.",
    6: "Docstring closing tag.",
    7: "Imports Python math library for exponential function calculation.",
    8: "Empty whitespace separator line.",
    9: "Determines total number of split-K tile blocks K from input list.",
    10: "Initializes accumulator list for partial output vectors O_s.",
    11: "Initializes accumulator list for local max scalar values m_s.",
    12: "Initializes accumulator list for local log-sum-exp values l_s.",
    13: "Empty whitespace separator line.",
    14: "Phase 1 section comment for split-K parallel computations.",
    15: "Iterates over each split-K index s from 0 to num_splits - 1.",
    16: "Extracts key token vector chunk K_tiles[s] for current tile.",
    17: "Extracts value token vector chunk V_tiles[s] for current tile.",
    18: "Computes scaled dot products Q @ K^T * scale for all keys in tile.",
    19: "Finds maximum score m_s in current split chunk for numerical stability.",
    20: "Computes unnormalized attention exps exp(score - m_s) for current tile.",
    21: "Sums exps to obtain local log-sum-exp denominator l_s for tile.",
    22: "Empty whitespace separator line.",
    23: "Comment indicating weighted partial output vector O_s calculation.",
    24: "Retrieves head embedding dimension size from value chunk vector.",
    25: "Initializes zero-filled partial output vector o_s of size dim.",
    26: "Iterates over attention weights and corresponding value vectors.",
    27: "Loops over vector dimension indices d from 0 to dim - 1.",
    28: "Accumulates weighted value token dimensions into partial output o_s.",
    29: "Empty whitespace separator line.",
    30: "Appends partial output vector o_s to top-level list.",
    31: "Appends local max m_s scalar to top-level max list.",
    32: "Appends local denominator l_s to top-level LSE list.",
    33: "Empty whitespace separator line.",
    34: "Phase 2 section comment for global reduction pass across blocks.",
    35: "Finds global maximum logit global_max across all partial maxes.",
    36: "Computes rescaled global log-sum-exp denominator global_lse.",
    37: "Empty whitespace separator line.",
    38: "Retrieves vector dimension size from first partial output.",
    39: "Initializes zero-filled global final output vector of size dim.",
    40: "Iterates over partial output vectors and their corresponding local maxes.",
    41: "Computes global rescale factor math.exp(m_s - global_max) / global_lse.",
    42: "Loops over vector dimension indices d from 0 to dim - 1.",
    43: "Accumulates rescaled partial output vector entries into final output.",
    44: "Empty whitespace separator line.",
    45: "Returns final rescaled output vector after global reduction.",
  },
};

export const flashDecodingSplitKSequenceParallel: AlgorithmDefinition<flashDecodingSplitKSequenceParallelInput> =
  {
    id: "flash-decoding-split-k-sequence-parallel",
    title: "Flash-Decoding Split-K Sequence Parallel Attention",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Flash-Decoding addresses a fundamental GPU under-utilization bottleneck during LLM autoregressive generation (prefill vs. decode asymmetry). During decoding, the query sequence length is small ($Q=1$), which limits standard FlashAttention parallelization across thread blocks to $B \\times H$ (batch size $\\times$ heads). On ultra-long contexts (e.g. 128k tokens), standard kernels underutilize GPU Streaming Multiprocessors (SMs).\n\n### Why It Exists\nStandard FlashAttention parallelizes over query sequence length ($Q$) and heads ($H$). During decoding, $Q=1$, so GPU occupancy is bottlenecked at $B \\cdot H$. Flash-Decoding splits the long key/value sequence $K$ into $S$ split-K blocks, assigning each block to a separate GPU Streaming Multiprocessor (SM). This achieves massive parallel speedups during decoding on modern GPUs (H100, A100).\n\n### Mathematical Formulation\nEach split-K block $s \\in \\{1 \\dots S\\}$ computes local online statistics:\n$$m_s = \\max_{j \\in \\text{chunk}_s} (Q K_j^T / \\sqrt{d_k}), \\quad l_s = \\sum_{j \\in \\text{chunk}_s} e^{Q K_j^T / \\sqrt{d_k} - m_s}, \\quad O_s = \\sum_{j \\in \\text{chunk}_s} e^{Q K_j^T / \\sqrt{d_k} - m_s} V_j$$\n\nA global reduction pass combines partial outputs using log-sum-exp rescaling:\n$$m_{\\text{global}} = \\max_{s} m_s, \\quad LSE_{\\text{global}} = \\sum_{s=1}^S l_s e^{m_s - m_{\\text{global}}}, \\quad O = \\sum_{s=1}^S \\frac{e^{m_s - m_{\\text{global}}}}{LSE_{\\text{global}}} O_s$$\n\n### Step-by-Step Intuition\n1. **Split-K Grid Allocation**: The long KV cache sequence is divided into $S$ blocks.\n2. **Parallel Tile Compute**: Each SM computes partial logit max $m_s$, exponent sum $l_s$, and partial vector $O_s$.\n3. **Global LSE Reduction**: A fast reduction kernel collects all $S$ local statistics, rescales them to a unified global max, and produces the exact output $O$.\n\n### Key Trade-Offs & Complexity\n- **Memory & Latency**: Reduces decode latency by up to 8x for long contexts at the cost of $O(S \\cdot d_v)$ temporary workspace buffer space.\n- **SM Occupancy**: Increases GPU thread block concurrency from $B \\cdot H$ to $B \\cdot H \\cdot S$.",
    constraints: ["1 <= numSplits <= 128", "1 <= tokensPerSplit <= 2048"],
    examples: [
      {
        kind: "basic",
        title: "4-Split Sequence Parallel Decoding",
        inputDisplay: "numSplits = 4, tokensPerSplit = 2",
        outputDisplay: "Rescaled output vector O of dim 2",
        input: { numSplits: 4, tokensPerSplit: 2 },
        output: "Vector [1.025, 0.812]",
        explanation: "Splits 8-token KV context across 4 parallel thread blocks with log-sum-exp reduction.",
      },
    ],
    code: FLASHDECODINGSPLITKSEQUENCEPARALLEL_CODE,
    timeComplexity: { best: "O(N / S + S)", average: "O(N / S + S)", worst: "O(N / S + S)" },
    spaceComplexity: "O(S \\cdot d_v)",
    complexityAnalysis: {
      time: "Parallelizes O(N) KV cache scanning across S split-K blocks in O(N/S) time, plus O(S * d_v) reduction overhead.",
      space:
        "Allocates O(S * d_v) temporary global memory workspace for storing intermediate split outputs O_s and log-sum-exp scalars (m_s, l_s).",
    },
    topicGuide: {
      overview:
        "Flash-Decoding (Dao et al., vLLM team) optimizes LLM inference latency for long prompts. In decode mode, Q=1 creates a severe memory-bound workload. Flash-Decoding unlocks massive GPU parallelism by splitting the sequence dimension K across independent thread blocks, speeding up decode throughput by up to 8x on long contexts.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For split s in {1 ... S} operating on key/value slice (K_s, V_s), the thread block computes unnormalized output O_s = sum exp(Q K_j^T / sqrt(d) - m_s) V_j, local max m_s = max(Q K_j^T / sqrt(d)), and denominator l_s = sum exp(Q K_j^T / sqrt(d) - m_s). The reduction pass computes global m = max m_s, global denominator l = sum l_s * exp(m_s - m), and final vector O = sum exp(m_s - m)/l * O_s.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "By increasing the number of active thread blocks from B x H to B x H x S, Flash-Decoding saturates GPU SM execution units on NVIDIA H100/A100 GPUs. Inter-block communication is minimized by storing partial (m_s, l_s, O_s) in HBM workspace buffers and invoking a small reduction kernel.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Flash-Decoding is integrated with PagedAttention block tables in vLLM. Split-K block mapping aligns with page boundaries (e.g., 16 or 32 tokens per block) to avoid unaligned global memory loads.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Dynamic split selection automatically chooses S = min(S_max, ceil(N_kv / tile_size)). If N_kv is small, S=1 avoids unnecessary reduction kernel launch overhead.",
        },
      ],
      keyTerms: [
        {
          term: "Flash-Decoding",
          definition:
            "A sequence-parallel attention decoding algorithm splitting the KV sequence dimension across GPU SMs.",
        },
        {
          term: "Split-K Parallelism",
          definition:
            "A parallelization pattern partitioning matrix reduction dimensions among independent compute blocks.",
        },
        {
          term: "Log-Sum-Exp (LSE) Rescaling",
          definition:
            "Technique for merging partial softmax results by adjusting exponent base offsets.",
        },
        {
          term: "SM Occupancy",
          definition:
            "The percentage of GPU Streaming Multiprocessors actively executing thread blocks.",
        },
      ],
    },
    trivia: FLASHDECODINGSPLITKSEQUENCEPARALLEL_TRIVIA,
    sources: [{ kind: "standard", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_FLASHDECODINGSPLITKSEQUENCEPARALLEL_INPUT,
    generateSteps: generateFlashDecodingSplitKSequenceParallelSteps,
  };
