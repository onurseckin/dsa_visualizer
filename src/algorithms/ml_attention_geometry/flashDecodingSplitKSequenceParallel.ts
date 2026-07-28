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
    import math

    num_splits = len(k_tiles)
    partial_outputs = []
    partial_maxes = []
    partial_lses = []

    for s in range(num_splits):
        k_chunk = k_tiles[s]
        v_chunk = v_tiles[s]
        scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in k_chunk]
        m_s = max(scores)
        exp_scores = [math.exp(sc - m_s) for sc in scores]
        l_s = sum(exp_scores)

        dim = len(v_chunk[0])
        o_s = [0.0] * dim
        for w, v_vec in zip(exp_scores, v_chunk):
            for d in range(dim):
                o_s[d] += w * v_vec[d]

        partial_outputs.append(o_s)
        partial_maxes.append(m_s)
        partial_lses.append(l_s)

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
    scale: Math.SQRT1_2,
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateFlashDecodingSplitKSequenceParallelSteps = (
  input: flashDecodingSplitKSequenceParallelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const qVec = input.qVec ?? [0.5, 0.8];
  const numSplits = Math.max(input.numSplits ?? 4, 1);
  const tokensPerSplit = Math.max(input.tokensPerSplit ?? 2, 1);
  const scale = input.scale ?? Math.SQRT1_2;
  const dim = qVec.length;

  // Generate deterministic K and V tiles for simulation
  const kTiles: number[][][] = [];
  const vTiles: number[][][] = [];
  for (let s = 0; s < numSplits; s++) {
    const kChunk: number[][] = [];
    const vChunk: number[][] = [];
    for (let t = 0; t < tokensPerSplit; t++) {
      kChunk.push([
        +(0.5 + s * 0.1 + t * 0.05).toFixed(3),
        +(0.4 + s * 0.05 + t * 0.08).toFixed(3),
      ]);
      vChunk.push([+(0.4 + s * 0.1 - t * 0.05).toFixed(3), +(0.8 - s * 0.05 + t * 0.1).toFixed(3)]);
    }
    kTiles.push(kChunk);
    vTiles.push(vChunk);
  }

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

  // Line 1: Function declaration
  addStep(
    1,
    "Initialize Flash-Decoding Split-K Parallel Engine",
    "Configuring sequence-parallel split-K grid for decoding query vector Q against distributed KV tiles.",
    { num_splits: numSplits, q_dim: dim, scale },
  );

  // Line 2: Import math
  addStep(
    2,
    "Import Math Module",
    "Loading mathematical primitives for online log-sum-exp exponential scaling.",
    { import: "math" },
  );

  // Line 4: num_splits = len(k_tiles)
  addStep(
    4,
    "Partition KV Cache into Split-K Blocks",
    `Divided long KV context sequence into ${numSplits} parallel split-K chunks for GPU SM execution.`,
    { num_splits: numSplits },
  );

  // Lines 5-7: Initialize partial buffers
  addStep(
    5,
    "Initialize Partial Output & Statistic Buffers",
    "Created workspace buffers for intermediate split results (partial maxes m_s, LSE sums l_s, partial vectors O_s).",
    { partial_outputs: "[]", partial_maxes: "[]", partial_lses: "[]" },
  );

  const partialMaxes: number[] = [];
  const partialLses: number[] = [];
  const partialOutputs: number[][] = [];

  // Phase 1: Parallel Split-K Computation
  for (let s = 0; s < numSplits; s++) {
    // Line 9: for s in range(num_splits):
    addStep(
      9,
      `Begin Split-K Tile s=${s} Execution`,
      `Dispatching thread block for Split-K tile chunk ${s}.`,
      { s, num_splits: numSplits },
      s,
      undefined,
    );

    // Line 10: k_chunk = k_tiles[s]
    const kChunk = kTiles[s];
    addStep(
      10,
      `Load Key Chunk for Split ${s}`,
      `Fetching Key vectors K_tile[${s}] from GPU High Bandwidth Memory into SRAM registers.`,
      { s, tokens_in_chunk: kChunk.length },
      s,
      0,
    );

    // Line 11: v_chunk = v_tiles[s]
    const vChunk = vTiles[s];
    addStep(
      11,
      `Load Value Chunk for Split ${s}`,
      `Fetching Value vectors V_tile[${s}] into tile registers.`,
      { s, tokens_in_chunk: vChunk.length },
      s,
      1,
    );

    // Line 12: scores calculation
    const scores = kChunk.map((kVec) => {
      let dot = 0;
      for (let d = 0; d < dim; d++) {
        dot += qVec[d] * kVec[d];
      }
      return +(dot * scale).toFixed(3);
    });

    addStep(
      12,
      `Compute Scaled Dot Products Q @ K^T (Split ${s})`,
      `Calculated scaled attention logits scores=[${scores.join(", ")}].`,
      { s, scores: `[${scores.join(", ")}]` },
      s,
      0,
    );

    // Line 13: m_s = max(scores)
    const m_s = +Math.max(...scores).toFixed(3);
    partialMaxes.push(m_s);
    matrixValues[s][0] = String(m_s);
    matrixStates[s][0] = "sorted";

    addStep(
      13,
      `Find Local Max m_${s} = ${m_s}`,
      `Determined local max logit m_${s}=${m_s} to enforce online numerical stability.`,
      { s, m_s },
      s,
      0,
    );

    // Line 14: exp_scores = [math.exp(sc - m_s) for sc in scores]
    const expScores = scores.map((sc) => +Math.exp(sc - m_s).toFixed(3));
    addStep(
      14,
      `Compute Unnormalized Exponents (Split ${s})`,
      `Computed exp(score - m_${s}): exp_scores=[${expScores.join(", ")}].`,
      { s, exp_scores: `[${expScores.join(", ")}]` },
      s,
      1,
    );

    // Line 15: l_s = sum(exp_scores)
    const l_s = +expScores.reduce((acc, v) => acc + v, 0).toFixed(3);
    partialLses.push(l_s);
    matrixValues[s][1] = String(l_s);
    matrixStates[s][1] = "sorted";

    addStep(
      15,
      `Sum Local Log-Sum-Exp Denominator l_${s} = ${l_s}`,
      `Summed local exponential weights l_${s}=${l_s}.`,
      { s, l_s },
      s,
      1,
    );

    // Line 17: dim = len(v_chunk[0])
    addStep(
      17,
      `Get Value Vector Dimension (dim=${dim})`,
      "Identified output head dimension for partial vector accumulation.",
      { dim },
      s,
      2,
    );

    // Line 18: o_s = [0.0] * dim
    const o_s = [0.0, 0.0];
    addStep(
      18,
      `Initialize Partial Vector O_${s} = [0.0, 0.0]`,
      `Created blank accumulator for split ${s} partial output.`,
      { s, o_s: "[0.0, 0.0]" },
      s,
      2,
    );

    // Lines 19-21: weighted accumulation
    for (let t = 0; t < vChunk.length; t++) {
      for (let d = 0; d < dim; d++) {
        o_s[d] += expScores[t] * vChunk[t][d];
      }
    }
    o_s[0] = +o_s[0].toFixed(3);
    o_s[1] = +o_s[1].toFixed(3);

    addStep(
      19,
      `Accumulate Weighted Values across Tokens (Split ${s})`,
      `Multiplying exp_scores by Value vectors and summing across chunk tokens.`,
      { s, exp_scores: `[${expScores.join(", ")}]` },
      s,
      2,
    );

    // Lines 23-25: append to partial lists
    partialOutputs.push(o_s);
    matrixValues[s][2] = String(o_s[0]);
    matrixValues[s][3] = String(o_s[1]);
    matrixStates[s][2] = "active";
    matrixStates[s][3] = "active";

    addStep(
      23,
      `Store Partial Output O_${s} = [${o_s.join(", ")}] & Statistics`,
      `Stored split ${s} partial output vector into temporary workspace buffer.`,
      { s, o_0: o_s[0], o_1: o_s[1], m_s, l_s },
      s,
      2,
    );
  }

  // Phase 2 Reduction
  // Line 27: global_max = max(partial_maxes)
  const globalMax = +Math.max(...partialMaxes).toFixed(3);
  matrixValues[numSplits][0] = String(globalMax);
  matrixStates[numSplits][0] = "pivot";

  addStep(
    27,
    `Global Max Reduction across Split-K Blocks: m_global = ${globalMax}`,
    `Found global maximum logit m_global=${globalMax} across all ${numSplits} split blocks.`,
    { globalMax },
    numSplits,
    0,
  );

  // Line 28: global_lse = sum(l_s * math.exp(m_s - global_max))
  let globalLseUnfixed = 0;
  for (let s = 0; s < numSplits; s++) {
    globalLseUnfixed += partialLses[s] * Math.exp(partialMaxes[s] - globalMax);
  }
  const globalLse = +globalLseUnfixed.toFixed(3);
  matrixValues[numSplits][1] = String(globalLse);
  matrixStates[numSplits][1] = "pivot";

  addStep(
    28,
    `Global Log-Sum-Exp Reduction: LSE_global = ${globalLse}`,
    `Rescaled and summed local l_s denominators to compute global softmax denominator.`,
    { globalLse },
    numSplits,
    1,
  );

  // Line 30: dim = len(partial_outputs[0])
  addStep(
    30,
    `Retrieve Vector Dimension (dim=${dim})`,
    "Determining vector size for final rescaled output allocation.",
    { dim },
    numSplits,
    2,
  );

  // Line 31: final_output = [0.0] * dim
  const finalOut = [0.0, 0.0];
  addStep(
    31,
    "Initialize Global Output Accumulator final_output = [0.0, 0.0]",
    "Created zero-filled vector for final reduced output.",
    { final_output: "[0.0, 0.0]" },
    numSplits,
    2,
  );

  // Lines 32-35: Loop over partial outputs and rescale
  for (let s = 0; s < numSplits; s++) {
    const rescale = Math.exp(partialMaxes[s] - globalMax) / globalLse;
    finalOut[0] += rescale * partialOutputs[s][0];
    finalOut[1] += rescale * partialOutputs[s][1];

    // Line 33: rescale = math.exp(m_s - global_max) / global_lse
    addStep(
      33,
      `Rescale Split ${s} Partial Output (Weight = ${rescale.toFixed(3)})`,
      `Applying log-sum-exp weight adjustment exp(m_${s} - m_global) / LSE_global to split ${s}.`,
      { s, rescale: +rescale.toFixed(3) },
      s,
      2,
    );

    // Line 35: final_output[d] += rescale * o_s[d]
    addStep(
      35,
      `Accumulate Rescaled Vector O_${s} into Final Output`,
      `Added rescaled partial output slice for split ${s} to final global output tensor.`,
      { s, current_out_0: +finalOut[0].toFixed(3), current_out_1: +finalOut[1].toFixed(3) },
      numSplits,
      2,
    );
  }

  finalOut[0] = +finalOut[0].toFixed(3);
  finalOut[1] = +finalOut[1].toFixed(3);

  matrixValues[numSplits][2] = String(finalOut[0]);
  matrixValues[numSplits][3] = String(finalOut[1]);
  matrixStates[numSplits][2] = "sorted";
  matrixStates[numSplits][3] = "sorted";

  // Line 37: return final_output
  addStep(
    37,
    "Execution Complete",
    `Flash-Decoding split-K parallel attention finished. Global output vector O = [${finalOut.join(", ")}].`,
    { completed: true, final_out: `[${finalOut.join(", ")}]` },
    numSplits,
    2,
  );

  return steps;
};

const FLASHDECODINGSPLITKSEQUENCEPARALLEL_TRIVIA: TriviaMeta = {
  skipLines: [3, 8, 16, 22, 26, 29, 36],
  distractors: [
    "final_output = sum(partial_outputs) / len(partial_outputs)",
    "rescale = math.exp(global_max - m_s)",
    "global_lse = max(partial_lses)",
  ],
  hints: [
    { line: 12, hint: "Compute scaled dot products Q @ K^T for current split tile." },
    { line: 13, hint: "Track local maximum m_s to ensure online numerical stability." },
    { line: 27, hint: "Compute global max across all split-K thread blocks." },
    { line: 33, hint: "Rescale partial output vectors using global log-sum-exp denominator." },
  ],
  lineExplanations: {
    1: "Defines entry point for Flash-Decoding split-K sequence parallel attention simulation.",
    2: "Imports Python math library for exponential function calculation.",
    3: "Empty line separator.",
    4: "Determines total number of split-K tile blocks from input KV tiles.",
    5: "Initializes accumulator list for partial output vectors O_s.",
    6: "Initializes accumulator list for local maximum scalar values m_s.",
    7: "Initializes accumulator list for local log-sum-exp values l_s.",
    8: "Empty line separator.",
    9: "Iterates over each split-K index s from 0 to num_splits - 1.",
    10: "Extracts key token vector chunk K_tiles[s] for current tile block.",
    11: "Extracts value token vector chunk V_tiles[s] for current tile block.",
    12: "Computes scaled dot products Q @ K^T * scale for all key vectors in chunk.",
    13: "Finds local maximum logit m_s in current split chunk for numerical stability.",
    14: "Computes unnormalized exponential weights exp(score - m_s) for current tile.",
    15: "Sums exponential weights to obtain local log-sum-exp denominator l_s.",
    16: "Empty line separator.",
    17: "Retrieves head embedding dimension size from value chunk vector.",
    18: "Initializes zero-filled partial output vector o_s of head dimension size.",
    19: "Iterates over exponential weights and corresponding value vectors in chunk.",
    20: "Loops over vector dimension indices d from 0 to dim - 1.",
    21: "Accumulates weighted value token dimensions into partial output o_s.",
    22: "Empty line separator.",
    23: "Appends partial output vector o_s to top-level list.",
    24: "Appends local maximum m_s scalar to top-level max list.",
    25: "Appends local denominator l_s to top-level LSE list.",
    26: "Empty line separator.",
    27: "Finds global maximum logit global_max across all partial maxes.",
    28: "Computes rescaled global log-sum-exp denominator global_lse across split blocks.",
    29: "Empty line separator.",
    30: "Retrieves vector dimension size from first partial output vector.",
    31: "Initializes zero-filled global final output vector of size dim.",
    32: "Iterates over partial output vectors and their corresponding local maxes.",
    33: "Computes global rescale weight math.exp(m_s - global_max) / global_lse.",
    34: "Loops over vector dimension indices d from 0 to dim - 1.",
    35: "Accumulates rescaled partial output vector entries into final output.",
    36: "Empty line separator.",
    37: "Returns final rescaled output vector after global log-sum-exp reduction.",
  },
};

export const flashDecodingSplitKSequenceParallel: AlgorithmDefinition<flashDecodingSplitKSequenceParallelInput> =
  {
    id: "flash-decoding-split-k-sequence-parallel",
    title: "Flash-Decoding Split-K Sequence Parallel Attention",
    topicIds: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Hard",
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
        explanation:
          "Splits 8-token KV context across 4 parallel thread blocks with log-sum-exp reduction.",
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
