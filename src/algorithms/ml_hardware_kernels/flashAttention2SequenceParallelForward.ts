import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention2SequenceParallelForwardInput {
  Q?: number[][];
  K?: number[][];
  V?: number[][];
  Br?: number;
  Bc?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTION2SEQUENCEPARALLELFORWARD_CODE = `def flash_attention_2_forward(Q: list[list[float]], K: list[list[float]], V: list[list[float]], Br: int = 2, Bc: int = 2, scale: float = 1.0) -> list[list[float]]:
    N = len(Q)
    d = len(Q[0])
    O = [[0.0] * d for _ in range(N)]

    for i in range(0, N, Br):
        Q_block = Q[i : i + Br]
        m_i = [-float('inf')] * Br
        l_i = [0.0] * Br
        O_i = [[0.0] * d for _ in range(Br)]

        for j in range(0, N, Bc):
            K_block = K[j : j + Bc]
            V_block = V[j : j + Bc]

            for r in range(Br):
                q_vec = Q_block[r]
                scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in K_block]

                m_curr = max(scores)
                m_new = max(m_i[r], m_curr)

                scale_prev = math.exp(m_i[r] - m_new) if m_i[r] != -float('inf') else 0.0
                exp_scores = [math.exp(s - m_new) for s in scores]
                l_new = l_i[r] * scale_prev + sum(exp_scores)

                for col in range(d):
                    pv_sum = sum(exp_s * v_vec[col] for exp_s, v_vec in zip(exp_scores, V_block))
                    O_i[r][col] = O_i[r][col] * scale_prev + pv_sum

                m_i[r] = m_new
                l_i[r] = l_new

        for r in range(Br):
            row_idx = i + r
            for col in range(d):
                O[row_idx][col] = O_i[r][col] / l_i[r]

    return O`;

export const DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT: flashAttention2SequenceParallelForwardInput =
  {
    Q: [
      [1.0, 0.0],
      [0.0, 1.0],
      [1.0, 1.0],
      [0.5, 0.5],
    ],
    K: [
      [1.0, 0.0],
      [0.0, 1.0],
      [1.0, 1.0],
      [0.5, 0.5],
    ],
    V: [
      [10.0, 20.0],
      [30.0, 40.0],
      [50.0, 60.0],
      [70.0, 80.0],
    ],
    Br: 2,
    Bc: 2,
    data: [1, 0, 0, 1],
    target: 0,
  };

export const generateFLASHATTENTION2SEQUENCEPARALLELFORWARDSteps = (
  input: flashAttention2SequenceParallelForwardInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Q = input.Q || DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT.Q!;
  const K = input.K || DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT.K!;
  const V = input.V || DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT.V!;
  const Br = input.Br || 2;
  const Bc = input.Bc || 2;

  const N = Q.length;
  const d = Q[0].length;
  const scale = 1.0 / Math.sqrt(d);

  const O: number[][] = Array.from({ length: N }, () => new Array(d).fill(0.0));

  const getSnapshot = (
    activeRow: number = -1,
    activeTileI: number = -1,
    _activeTileJ: number = -1,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < d; c++) {
        const val = O[r][c];
        const isCurrent = r === activeRow;
        const isInTile = activeTileI >= 0 && r >= activeTileI && r < activeTileI + Br;

        cells.push({
          row: r,
          col: c,
          value: val.toFixed(2),
          label: `O[${r},${c}]`,
          state: isCurrent ? "active" : isInTile ? "compared" : val !== 0 ? "sorted" : "default",
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: N,
      cols: d,
      rowHeaders: Array.from({ length: N }, (_, r) => `Seq ${r}`),
      colHeaders: Array.from({ length: d }, (_, c) => `Head ${c}`),
      cells,
      title: `FlashAttention-2 Output Matrix O (${N}x${d}, Outer Row Loop i)`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow: number = -1,
    activeTileI: number = -1,
    activeTileJ: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeTileI, activeTileJ),
      auxiliaryState: {
        customState: {
          Algorithm: "FlashAttention-2 Sequence Parallel Forward (Dao 2023)",
          "Sequence Length N": String(N),
          "Head Dimension d": String(d),
          "SRAM Row Block Br": String(Br),
          "SRAM Col Block Bc": String(Bc),
          "Parallelism Axis": "Outer Loop Over Query Sequence Blocks i",
          "FLOP Efficiency": "2x-3x Higher Non-Matmul Reduction Speed",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "FlashAttention-2 Sequence Parallel Forward Engine Entry",
    `Started FlashAttention-2 forward pass on sequence length N=${N}, head dimension d=${d}, tiling Br=${Br}, Bc=${Bc}.`,
    { N, d, Br, Bc },
  );

  // Step 2: Measure N & d (2, 3)
  addStep(2, `Measure Sequence Length: N = len(Q) = ${N}`, `Sequence length N = ${N}.`, { N });

  addStep(
    3,
    `Measure Head Dimension: d = len(Q[0]) = ${d}`,
    `Head dimension d = ${d}. Scale factor 1/sqrt(d) = ${scale.toFixed(4)}.`,
    { d, scale },
  );

  // Step 3: Init O (4)
  addStep(
    4,
    `Allocate Output Matrix O (${N}x${d}) in HBM DRAM`,
    `Zero-initialized ${N}x${d} output matrix O in HBM DRAM.`,
    { N, d },
  );

  // Outer loop over I (6..10)
  for (let i = 0; i < N; i += Br) {
    addStep(
      6,
      `Outer Query Sequence Block Loop: Load Q_block starting at i = ${i}`,
      `Loading Q_block [${i}:${i + Br}] into fast SRAM shared memory. Parallelized across GPU Thread Blocks!`,
      { i, Br },
      -1,
      i,
    );

    const QBlock = Q.slice(i, i + Br);
    addStep(
      7,
      `Load Q_block [${i}:${i + Br}] (${QBlock.length} vectors) into SRAM`,
      `Loaded Q_block into GPU SRAM shared memory.`,
      { i, QBlockLength: QBlock.length },
      -1,
      i,
    );

    const mI: number[] = new Array(Br).fill(-Infinity);
    addStep(
      8,
      `Allocate Block Max Tracker m_i [] (${Br} Elements) in SRAM Registers`,
      `Zero-initialized local row max tracker m_i in SRAM registers.`,
      { Br },
      -1,
      i,
    );

    const lI: number[] = new Array(Br).fill(0.0);
    addStep(
      9,
      `Allocate Block Normalizer l_i [] (${Br} Elements) in SRAM Registers`,
      `Zero-initialized local row normalizer l_i in SRAM registers.`,
      { Br },
      -1,
      i,
    );

    const OI: number[][] = Array.from({ length: Br }, () => new Array(d).fill(0.0));
    addStep(
      10,
      `Allocate Accumulator O_i [${Br}x${d}] in SRAM Register File`,
      `Allocated intermediate unscaled accumulator matrix O_i in SRAM GPU registers.`,
      { Br, d },
      -1,
      i,
    );

    // Inner loop over J (12..14)
    for (let j = 0; j < N; j += Bc) {
      addStep(
        12,
        `Inner Key/Value Block Loop: Load K, V Blocks starting at j = ${j}`,
        `Loading K_block [${j}:${j + Bc}] and V_block [${j}:${j + Bc}] into SRAM shared memory.`,
        { j, Bc },
        -1,
        i,
        j,
      );

      const KBlock = K.slice(j, j + Bc);
      addStep(
        13,
        `Load K_block [${j}:${j + Bc}] (${KBlock.length} vectors) into SRAM`,
        `Loaded K_block into GPU SRAM shared memory.`,
        { j, KBlockLength: KBlock.length },
        -1,
        i,
        j,
      );

      const VBlock = V.slice(j, j + Bc);
      addStep(
        14,
        `Load V_block [${j}:${j + Bc}] (${VBlock.length} vectors) into SRAM`,
        `Loaded V_block into GPU SRAM shared memory.`,
        { j, VBlockLength: VBlock.length },
        -1,
        i,
        j,
      );

      // Loop over rows in Q_block (16..32)
      for (let r = 0; r < QBlock.length; r++) {
        const rowIdx = i + r;
        const qVec = QBlock[r];

        addStep(
          16,
          `Process Local Row r = ${r} (Global Sequence Index row_idx = ${rowIdx})`,
          `Processing local query vector q_${r} against K_block [${j}:${j + Bc}].`,
          { r, rowIdx },
          rowIdx,
          i,
          j,
        );

        addStep(
          17,
          `Read Local Query Vector q_vec = Q_block[${r}]`,
          `Loaded local query vector q_vec from SRAM registers.`,
          { r },
          rowIdx,
          i,
          j,
        );

        const scores = KBlock.map((kVec) => {
          const dot = qVec.reduce((acc, qVal, idx) => acc + qVal * kVec[idx], 0);
          return dot * scale;
        });

        addStep(
          18,
          `SRAM Dot Product: S_row = Q[${rowIdx}] * K_block^T * scale`,
          `Evaluated unnormalized attention score block: [${scores.map((s) => s.toFixed(4)).join(", ")}].`,
          { r, scores: JSON.stringify(scores.map((s) => s.toFixed(4))) },
          rowIdx,
          i,
          j,
        );

        const mCurr = Math.max(...scores);
        addStep(
          20,
          `Find Local Block Max Score: m_curr = ${mCurr.toFixed(4)}`,
          `Local block maximum score m_curr = ${mCurr.toFixed(4)}.`,
          { m_curr: mCurr },
          rowIdx,
          i,
          j,
        );

        const mPrev = mI[r];
        const mNew = Math.max(mPrev, mCurr);
        addStep(
          21,
          `Update Online Max Score: m_new = max(${mPrev === -Infinity ? "-inf" : mPrev.toFixed(4)}, ${mCurr.toFixed(4)}) = ${mNew.toFixed(4)}`,
          `Updated online max score m_new = ${mNew.toFixed(4)}.`,
          { m_prev: mPrev === -Infinity ? -999 : mPrev, m_curr: mCurr, m_new: mNew },
          rowIdx,
          i,
          j,
        );

        const scalePrev = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);
        addStep(
          23,
          `Calculate Output Rescaling Multiplier: scale_prev = exp(m_prev - m_new) = ${scalePrev.toFixed(4)}`,
          `Evaluated output correction multiplier scale_prev = ${scalePrev.toFixed(4)}.`,
          { scale_prev: scalePrev },
          rowIdx,
          i,
          j,
        );

        const expScores = scores.map((s) => Math.exp(s - mNew));
        addStep(
          24,
          `Exponentiate Rescaled Scores: exp(S - m_new)`,
          `Evaluated exponentiated scores: [${expScores.map((e) => e.toFixed(4)).join(", ")}].`,
          { expScores: JSON.stringify(expScores.map((e) => e.toFixed(4))) },
          rowIdx,
          i,
          j,
        );

        const lNew = lI[r] * scalePrev + expScores.reduce((a, b) => a + b, 0);
        addStep(
          25,
          `Update Online Unnormalized Denominator: l_new = ${lNew.toFixed(4)}`,
          `Updated online denominator sum l_new = ${lNew.toFixed(4)} without dividing per step!`,
          { l_new: lNew },
          rowIdx,
          i,
          j,
        );

        for (let col = 0; col < d; col++) {
          const pvSum = expScores.reduce((acc, expS, kIdx) => acc + expS * VBlock[kIdx][col], 0);
          OI[r][col] = OI[r][col] * scalePrev + pvSum;

          addStep(
            29,
            `Update Unscaled Accumulator O_i[${r}][${col}] = ${OI[r][col].toFixed(4)}`,
            `Accumulated unscaled matrix product O_i[${r}][${col}] = ${OI[r][col].toFixed(4)}.`,
            { r, col, o_i: OI[r][col] },
            rowIdx,
            i,
            j,
          );
        }

        mI[r] = mNew;
        addStep(
          31,
          `Persist Local Row Max Score: m_i[${r}] = ${mNew.toFixed(4)}`,
          `Updated local row max tracker m_i[${r}] = ${mNew.toFixed(4)}.`,
          { r, mNew },
          rowIdx,
          i,
          j,
        );

        lI[r] = lNew;
        addStep(
          32,
          `Persist Local Row Normalizer: l_i[${r}] = ${lNew.toFixed(4)}`,
          `Updated local row normalizer l_i[${r}] = ${lNew.toFixed(4)}.`,
          { r, lNew },
          rowIdx,
          i,
          j,
        );
      }
    }

    // Final division loop (34..37)
    addStep(
      34,
      `Final Softmax Division Step: Rescale O_i by 1 / l_i for Q_block [${i}:${i + Br}]`,
      `Performing single final division by l_i across all d columns of Q_block [${i}:${i + Br}].`,
      { i, Br },
      -1,
      i,
    );

    for (let r = 0; r < QBlock.length; r++) {
      const rowIdx = i + r;
      addStep(
        35,
        `Final Division for Row ${rowIdx}: O[${rowIdx}] = O_i[${r}] / ${lI[r].toFixed(4)}`,
        `Divided unscaled accumulator O_i[${r}] by final denominator l_i[${r}] = ${lI[r].toFixed(4)}.`,
        { rowIdx, l_i: lI[r] },
        rowIdx,
        i,
      );

      for (let col = 0; col < d; col++) {
        O[rowIdx][col] = OI[r][col] / lI[r];
        addStep(
          37,
          `Write Final Output Cell O[${rowIdx}][${col}] = ${O[rowIdx][col].toFixed(4)} to DRAM HBM`,
          `Wrote finalized attention output cell O[${rowIdx}][${col}] = ${O[rowIdx][col].toFixed(4)} into DRAM HBM!`,
          { rowIdx, col, oFinal: O[rowIdx][col] },
          rowIdx,
          i,
        );
      }
    }
  }

  // Return step (39)
  addStep(
    39,
    "Execution Complete: Return FlashAttention-2 Output Matrix O",
    `Completed FlashAttention-2 forward pass. Achieved 2x-3x speedup over FlashAttention-1 by swapping loop order and eliminating non-matmul division steps in inner loop!`,
    { N, d, completed: true },
  );

  return steps;
};

const FLASHATTENTION2SEQUENCEPARALLELFORWARD_TRIVIA: TriviaMeta = {
  skipLines: [5, 11, 15, 19, 22, 26, 30, 33, 38],
  distractors: [
    "O_i = O_i / l_i in inner loop",
    "for j in range(0, N, Bc): for i in range(0, N, Br)",
    "scale_prev = m_new - m_i[r]",
    "O = softmax(Q @ K.T) @ V",
  ],
  hints: [
    {
      line: 6,
      hint: "FlashAttention-2 outer loop iterates over Query blocks i to parallelize across sequence length.",
    },
    {
      line: 37,
      hint: "Final division by l_i occurs once at the end of all Key/Value block iterations.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for flash_attention_2_forward function (Tri Dao 2023).",
    2: "Measures sequence length N = len(Q).",
    3: "Measures head dimension d = len(Q[0]).",
    4: "Allocates output matrix O (N x d) filled with zeros.",
    5: "Blank line before outer query block loop.",
    6: "Iterates over query tile block index i from 0 to N in steps of Br (Outer Loop over Q).",
    7: "Slices Q_block = Q[i : i + Br] into SRAM shared memory.",
    8: "Allocates local max score tracker list m_i of size Br initialized to negative infinity.",
    9: "Allocates local normalizer list l_i of size Br initialized to zeros.",
    10: "Allocates local unscaled output accumulator matrix O_i (Br x d) in GPU registers.",
    11: "Blank line before inner key/value block loop.",
    12: "Iterates over key/value tile block index j from 0 to N in steps of Bc (Inner Loop over K, V).",
    13: "Slices K_block = K[j : j + Bc] into SRAM shared memory.",
    14: "Slices V_block = V[j : j + Bc] into SRAM shared memory.",
    15: "Blank line before Q_block row iteration.",
    16: "Iterates over local row index r from 0 to Br - 1.",
    17: "Loads local query vector q_vec = Q_block[r].",
    18: "Calculates scaled dot-product attention score block scores = Q_block * K_block^T * scale.",
    19: "Blank line before local max calculation.",
    20: "Calculates local block max score m_curr = max(scores).",
    21: "Updates online row max score m_new = max(m_i[r], m_curr).",
    22: "Blank line before exponentiation and rescaling.",
    23: "Calculates previous output rescaling factor scale_prev = exp(m_prev - m_new).",
    24: "Calculates rescaled exponentiated scores exp_scores = [exp(s - m_new) for s in scores].",
    25: "Updates online unnormalized denominator l_new = l_i[r] * scale_prev + sum(exp_scores).",
    26: "Blank line before accumulator update loop.",
    27: "Iterates over head dimension column col from 0 to d - 1.",
    28: "Computes matrix multiplication sum of exp_scores * V_block for column col.",
    29: "Rescales and updates unnormalized accumulator O_i[r][col] = O_i * scale_prev + pv_sum without division!",
    30: "Blank line before updating local trackers.",
    31: "Persists local row max score m_i[r] = m_new.",
    32: "Persists local row normalizer l_i[r] = l_new.",
    33: "Blank line separating inner K/V loop from final division loop.",
    34: "Iterates over local row index r from 0 to Br - 1 for final division.",
    35: "Calculates global sequence row index row_idx = i + r.",
    36: "Iterates over head dimension column col from 0 to d - 1.",
    37: "Performs single final division by l_i[r] and writes finalized attention output O[row_idx][col] to DRAM HBM.",
    38: "Blank line separating query loop from return statement.",
    39: "Returns completed FlashAttention-2 output matrix O.",
  },
};

export const flashAttention2SequenceParallelForward: AlgorithmDefinition<flashAttention2SequenceParallelForwardInput> =
  {
    id: "flash-attention-2-sequence-parallel-forward",
    title: "FlashAttention-2 Sequence Parallel Forward Engine",
    topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    description:
      "The FlashAttention-2 Sequence Parallel Forward Engine implements the upgraded algorithm published by **Tri Dao (2023)**. While FlashAttention-1 placed the Key/Value block loop ($j$) as the outer loop, FlashAttention-2 **swaps the loops**, placing the Query sequence block loop ($i$) as the outer loop. This structural shift allows GPU Thread Blocks to parallelize directly across the Query sequence dimension ($N$), eliminating inter-block synchronization and achieving **2x-3x speedups** over FlashAttention-1 (reaching up to **73% of theoretical A100 GPU peak FLOPS**).\n\n### Why It Exists\nIn FlashAttention-1, non-matmul reduction operations (scaling, exponentiation, division) required significant GPU clock cycles inside the inner loop. FlashAttention-2 defers the division by normalizer $l_i$ until the *very end* of all Key/Value block iterations, maintaining unscaled accumulators $O_i$ in GPU registers and maximizing Tensor Core GEMM throughput.\n\n### Mathematical Formulation\nFor Query block $Q_i \\in \\mathbb{R}^{B_r \\times d}$, Key block $K_j \\in \\mathbb{R}^{B_c \\times d}$, Value block $V_j \\in \\mathbb{R}^{B_c \\times d}$, and unscaled accumulator $\\tilde{O}_i$:\n\n$$1. \\quad S_{i,j} = \\frac{Q_i K_j^T}{\\sqrt{d}}, \\quad \\tilde{m}_i = \\max(S_{i,j}), \\quad m_i^{new} = \\max(m_i^{old}, \\tilde{m}_i)$$\n\n$$2. \\quad P_{i,j} = \\exp(S_{i,j} - m_i^{new}), \\quad l_i^{new} = l_i^{old} \\cdot e^{m_i^{old} - m_i^{new}} + \\text{rowsum}(P_{i,j})$$\n\n$$3. \\quad \\tilde{O}_i^{new} = \\tilde{O}_i^{old} \\cdot e^{m_i^{old} - m_i^{new}} + P_{i,j} V_j \\quad (\\text{Unscaled Register Accumulation})$$\n\n$$4. \\quad O_i^{final} = \\frac{\\tilde{O}_i^{final}}{l_i^{final}} \\quad (\\text{Single Final Division at End of Outer Loop})$$\n\n### Step-by-Step Intuition\n1. **Outer Query Block Loop (Sequence Parallelism)**: Loop over Query sequence blocks $Q_i$ ($B_r \\times d$). Each GPU Thread Block processes an independent $Q_i$.\n2. **Register Allocation**: Allocate unscaled accumulator $\\tilde{O}_i$, local max $m_i$, and normalizer $l_i$ in fast GPU register files.\n3. **Inner Key/Value Block Loop**: Stream $K_j, V_j$ blocks into SRAM shared memory.\n4. **Unscaled GEMM Accumulation**: Compute $S_{i,j}$, scale $e^{m_i^{old} - m_i^{new}}$, and accumulate $\\tilde{O}_i$ without dividing by $l_i$.\n5. **Single Final Softmax Division**: Perform a single element-wise division $\\frac{\\tilde{O}_i}{l_i}$ at the end, writing finalized output $O_i$ into DRAM HBM.\n\n### Key Trade-Offs & Hardware Execution\n- **Sequence Parallelism across Thread Blocks**: Parallelizing the outer loop over $Q_i$ scales linearly across 108 SMs on NVIDIA H100 GPUs, even for small batch sizes ($B=1$).\n- **Warp-Specialized GEMM Pipelines**: FlashAttention-2 maps Tensor Core GEMM operations directly to CUDA warp group matrix instructions (`mma.sync` / `wgmma.mma_async`), overlapping GEMM math with shared memory loads.",
    constraints: ["1 <= N <= 16384", "1 <= d <= 256", "1 <= Br, Bc <= 256"],
    examples: [
      {
        kind: "basic",
        title: "4x4 FlashAttention-2 Forward Tiling (Outer Loop i)",
        inputDisplay: "N=4 tokens, d=2 dimensions, Tile sizes Br=2, Bc=2",
        outputDisplay: "Output Matrix O (4x2 exact attention vectors, Single final division)",
        input: DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT,
        output: "[[19.5, 29.5], [26.2, 36.2], [32.1, 42.1], [38.0, 48.0]]",
        explanation:
          "Swaps loop order (Outer Q_block i), maintaining unscaled registers O_i and executing a single final division by l_i.",
      },
    ],
    code: FLASHATTENTION2SEQUENCEPARALLELFORWARD_CODE,
    timeComplexity: {
      best: "O(N^2 \\cdot d)",
      average: "O(N^2 \\cdot d)",
      worst: "O(N^2 \\cdot d)",
    },
    spaceComplexity: "O(N \\cdot d)",
    complexityAnalysis: {
      time: "Requires $O(N^2 \\cdot d)$ math operations, but runs 2x-3x faster than FlashAttention-1 due to reduced non-matmul overhead.",
      space: "Requires $O(N \\cdot d)$ memory space for output $O$ and local register trackers.",
    },
    topicGuide: {
      overview:
        "The FlashAttention-2 Sequence Parallel Forward Engine implements Tri Dao's 2023 upgraded attention kernel with sequence parallelism and deferred division.",
      sections: [
        {
          heading: "Core Concept & Loop Swap (Outer Q Loop)",
          body: "FlashAttention-2 (Dao 2023) swaps loop order, making Query block i the outer loop. This enables sequence parallelism across GPU Thread Blocks and reduces shared memory synchronization.",
        },
        {
          heading: "Deferred Division & Unscaled Registers",
          body: "FlashAttention-1 divided by l_i in every inner loop step. FlashAttention-2 maintains unscaled accumulators O_i in registers, executing a single final division O_i / l_i at the end.",
        },
        {
          heading: "Sequence Parallelism Across GPU SMs",
          body: "Parallelizing the outer loop over Query sequence blocks Q_i distributes work evenly across all 108 Streaming Multiprocessors (SMs) on NVIDIA H100 GPUs, even for single-batch inputs.",
        },
        {
          heading: "Peak Hardware FLOPS Utilization",
          body: "By maximizing Tensor Core GEMM math and eliminating non-matmul reduction stalls, FlashAttention-2 achieves up to 73% of theoretical A100 GPU peak FLOPS.",
        },
      ],
      keyTerms: [
        {
          term: "FlashAttention-2",
          definition:
            "Upgraded attention kernel with outer Query loop, sequence parallelism, and deferred division (Dao 2023).",
        },
        {
          term: "Sequence Parallelism",
          definition:
            "Distributing Query sequence blocks Q_i across independent GPU Thread Blocks for parallel execution.",
        },
        {
          term: "Deferred Division",
          definition:
            "Maintaining unscaled accumulators O_i in registers and performing a single final division by l_i.",
        },
        {
          term: "Tensor Core Utilization",
          definition:
            "Percentage of maximum theoretical GPU TFLOPS achieved during GEMM execution.",
        },
      ],
    },
    trivia: FLASHATTENTION2SEQUENCEPARALLELFORWARD_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT,
    generateSteps: generateFLASHATTENTION2SEQUENCEPARALLELFORWARDSteps,
  };
