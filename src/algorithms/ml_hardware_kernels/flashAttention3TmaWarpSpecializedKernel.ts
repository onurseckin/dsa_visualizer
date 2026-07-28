import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention3TmaWarpSpecializedKernelInput {
  Q?: number[][];
  K?: number[][];
  V?: number[][];
  Br?: number;
  Bc?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE = `def flash_attention_3_hopper_tma(Q: list[list[float]], K: list[list[float]], V: list[list[float]], Br: int = 2, Bc: int = 2, scale: float = 1.0) -> list[list[float]]:
    N = len(Q)
    d = len(Q[0])
    O = [[0.0] * d for _ in range(N)]

    for i in range(0, N, Br):
        Q_sram = Q[i : i + Br]
        m_i = [-float('inf')] * Br
        l_i = [0.0] * Br
        O_acc = [[0.0] * d for _ in range(Br)]

        for j in range(0, N, Bc):
            K_sram = K[j : j + Bc]
            V_sram = V[j : j + Bc]

            for r in range(Br):
                q_vec = Q_sram[r]
                scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in K_sram]

                m_curr = max(scores)
                m_new = max(m_i[r], m_curr)
                scale_prev = math.exp(m_i[r] - m_new) if m_i[r] != -float('inf') else 0.0

                exp_scores = [math.exp(s - m_new) for s in scores]
                l_new = l_i[r] * scale_prev + sum(exp_scores)

                for col in range(d):
                    pv_sum = sum(exp_s * v_vec[col] for exp_s, v_vec in zip(exp_scores, V_sram))
                    O_acc[r][col] = O_acc[r][col] * scale_prev + pv_sum

                m_i[r] = m_new
                l_i[r] = l_new

        for r in range(Br):
            row_idx = i + r
            for col in range(d):
                O[row_idx][col] = O_acc[r][col] / l_i[r]

    return O`;

export const DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT: flashAttention3TmaWarpSpecializedKernelInput =
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

export const generateFLASHATTENTION3TMAWARPSPECIALIZEDKERNELSteps = (
  input: flashAttention3TmaWarpSpecializedKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Q = input.Q || DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT.Q!;
  const K = input.K || DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT.K!;
  const V = input.V || DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT.V!;
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
      title: `FlashAttention-3 Hopper TMA Output Matrix O (${N}x${d}, WGMMA FP8/FP16)`,
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
          Algorithm: "FlashAttention-3 Hopper TMA Kernel (Shah et al. 2024)",
          "Sequence Length N": String(N),
          "Head Dimension d": String(d),
          "SRAM Row Block Br": String(Br),
          "SRAM Col Block Bc": String(Bc),
          "Hardware Features": "TMA Asynchronous Copy, WGMMA Warp-Group GEMM",
          "FP16 FLOPS Utilization": "1.5x-2x Faster than FlashAttention-2 (850 TFLOPS H100)",
        },
      },
      variables,
    });
  };

  // Line 1: Entry
  addStep(
    1,
    "FlashAttention-3 Hopper TMA Kernel Entry",
    `Started FlashAttention-3 forward pass simulating NVIDIA Hopper H100 TMA (Tensor Memory Accelerator) and Warp-Specialization across N=${N}, d=${d}.`,
    { N, d, Br, Bc },
  );

  // Line 2: Measure N
  addStep(2, `Measure Sequence Length: N = len(Q) = ${N}`, `Sequence length N = ${N}.`, { N });

  // Line 3: Measure d
  addStep(
    3,
    `Measure Head Dimension: d = len(Q[0]) = ${d}`,
    `Head dimension d = ${d}. Scale factor 1/sqrt(d) = ${scale.toFixed(4)}.`,
    { d, scale },
  );

  // Line 4: Init O
  addStep(
    4,
    `Allocate Output Matrix O (${N}x${d}) in HBM DRAM`,
    `Zero-initialized ${N}x${d} output matrix O in HBM DRAM.`,
    { N, d },
  );

  // Outer loop over I (Line 6)
  for (let i = 0; i < N; i += Br) {
    addStep(
      6,
      `Outer Query Sequence Block Loop: Load Q_sram starting at i = ${i}`,
      `Triggered Producer Warp TMA 2D Descriptor Load for Q_sram [${i}:${i + Br}]. Zero CPU/warp overhead!`,
      { i, Br },
      -1,
      i,
    );

    const QSram = Q.slice(i, i + Br);
    addStep(
      7,
      `TMA Async Copy: Q_sram [${i}:${i + Br}] loaded into SRAM via TMA Descriptor`,
      `Asynchronously transferred Q_sram into SRAM shared memory using Hopper TMA hardware engine.`,
      { i, QSramLength: QSram.length },
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

    const OAcc: number[][] = Array.from({ length: Br }, () => new Array(d).fill(0.0));
    addStep(
      10,
      `Allocate Accumulator O_acc [${Br}x${d}] in SRAM Register File`,
      `Allocated intermediate unscaled accumulator matrix O_acc in SRAM GPU registers.`,
      { Br, d },
      -1,
      i,
    );

    // Inner loop over J (Line 12)
    for (let j = 0; j < N; j += Bc) {
      addStep(
        12,
        `Inner Key/Value Block Loop: Load K, V Blocks starting at j = ${j}`,
        `Triggered Producer Warp TMA Multicast load for K_sram [${j}:${j + Bc}] and V_sram [${j}:${j + Bc}].`,
        { j, Bc },
        -1,
        i,
        j,
      );

      const KSram = K.slice(j, j + Bc);
      addStep(
        13,
        `TMA Async Multicast: K_sram [${j}:${j + Bc}] loaded into SRAM`,
        `Loaded K_sram into GPU SRAM shared memory via TMA Multicast.`,
        { j, KSramLength: KSram.length },
        -1,
        i,
        j,
      );

      const VSram = V.slice(j, j + Bc);
      addStep(
        14,
        `TMA Async Multicast: V_sram [${j}:${j + Bc}] loaded into SRAM`,
        `Loaded V_sram into GPU SRAM shared memory via TMA Multicast.`,
        { j, VSramLength: VSram.length },
        -1,
        i,
        j,
      );

      // Loop over rows in QSram (Line 16)
      for (let r = 0; r < QSram.length; r++) {
        const rowIdx = i + r;
        const qVec = QSram[r];

        addStep(
          16,
          `Consumer Warp: Process Row r = ${r} (Global Sequence Index row_idx = ${rowIdx})`,
          `Consumer Warps execute Hopper wgmma.mma_async instructions for Q_sram[${r}] against K_sram.`,
          { r, rowIdx },
          rowIdx,
          i,
          j,
        );

        addStep(
          17,
          `Read Local Query Vector q_vec = Q_sram[${r}]`,
          `Loaded local query vector q_vec from SRAM registers.`,
          { r },
          rowIdx,
          i,
          j,
        );

        const scores = KSram.map((kVec) => {
          const dot = qVec.reduce((acc, qVal, idx) => acc + qVal * kVec[idx], 0);
          return dot * scale;
        });

        addStep(
          18,
          `Hopper WGMMA Matrix Multiply: S_row = Q_sram[${r}] * K_sram^T * scale`,
          `Evaluated Hopper Asynchronous Warp-Group GEMM score block: [${scores.map((s) => s.toFixed(4)).join(", ")}].`,
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
          22,
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
          addStep(
            27,
            `Column Loop: col = ${col} for Head Dimension d=${d}`,
            `Iterate across head dimension column ${col} for accumulation.`,
            { r, col },
            rowIdx,
            i,
            j,
          );

          const pvSum = expScores.reduce((acc, expS, kIdx) => acc + expS * VSram[kIdx][col], 0);
          addStep(
            28,
            `Compute Product Vector Sum: pv_sum = ${pvSum.toFixed(4)}`,
            `Summed exp_scores * V_sram for column ${col}: pv_sum = ${pvSum.toFixed(4)}.`,
            { r, col, pvSum },
            rowIdx,
            i,
            j,
          );

          OAcc[r][col] = OAcc[r][col] * scalePrev + pvSum;
          addStep(
            29,
            `Update Unscaled Accumulator O_acc[${r}][${col}] = ${OAcc[r][col].toFixed(4)}`,
            `Accumulated unscaled matrix product O_acc[${r}][${col}] = ${OAcc[r][col].toFixed(4)}.`,
            { r, col, o_acc: OAcc[r][col] },
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

    // Final division loop (Lines 34..37)
    addStep(
      34,
      `Final Softmax Division Loop: Rescale O_acc by 1 / l_i for Q_sram [${i}:${i + Br}]`,
      `Performing single final division by l_i across all d columns of Q_sram [${i}:${i + Br}].`,
      { i, Br },
      -1,
      i,
    );

    for (let r = 0; r < QSram.length; r++) {
      const rowIdx = i + r;
      addStep(
        35,
        `Final Division Setup for Row ${rowIdx}: row_idx = i + r`,
        `Selected global sequence row index ${rowIdx} with denominator l_i[${r}] = ${lI[r].toFixed(4)}.`,
        { rowIdx, l_i: lI[r] },
        rowIdx,
        i,
      );

      for (let col = 0; col < d; col++) {
        addStep(
          36,
          `Column Division Loop: col = ${col}`,
          `Computing final division for row ${rowIdx}, column ${col}.`,
          { rowIdx, col },
          rowIdx,
          i,
        );

        O[rowIdx][col] = OAcc[r][col] / lI[r];
        addStep(
          37,
          `Write Final Output Cell O[${rowIdx}][${col}] = ${O[rowIdx][col].toFixed(4)} to DRAM HBM via TMA`,
          `Wrote finalized attention output cell O[${rowIdx}][${col}] = ${O[rowIdx][col].toFixed(4)} into DRAM HBM via TMA 2D Store!`,
          { rowIdx, col, oFinal: O[rowIdx][col] },
          rowIdx,
          i,
        );
      }
    }
  }

  // Return step (Line 39)
  addStep(
    39,
    "Execution Complete: Return FlashAttention-3 Output Matrix O",
    `Completed FlashAttention-3 forward pass. Achieved 1.5x-2x speedup over FlashAttention-2 by exploiting NVIDIA Hopper TMA hardware engine, Warp-Specialization, and Asynchronous WGMMA Matrix Multiplication!`,
    { N, d, completed: true },
  );

  return steps;
};

const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [5, 11, 15, 19, 23, 26, 30, 33, 38],
  distractors: [
    "TMA loads require 32 threads per warp",
    "wgmma.mma_async operates on HBM DRAM",
    "FlashAttention-3 uses standard O(N^2) HBM storage",
    "scale_prev = m_curr / m_new",
  ],
  hints: [
    {
      line: 7,
      hint: "FlashAttention-3 uses TMA 2D descriptors to load Q_sram asynchronously into SRAM.",
    },
    {
      line: 18,
      hint: "Asynchronous Warp-Group GEMM math executed via wgmma.mma_async instructions.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for flash_attention_3_hopper_tma function (Shah et al. 2024).",
    2: "Measures sequence length N = len(Q).",
    3: "Measures head dimension d = len(Q[0]).",
    4: "Allocates output matrix O (N x d) filled with zeros in DRAM HBM.",
    5: "Blank line before outer query sequence block loop.",
    6: "Iterates over query tile block index i from 0 to N in steps of Br (Outer Loop over Q).",
    7: "Asynchronously loads Q_sram = Q[i : i + Br] into SRAM using NVIDIA Hopper TMA 2D descriptors.",
    8: "Allocates local max score tracker list m_i of size Br initialized to negative infinity.",
    9: "Allocates local normalizer list l_i of size Br initialized to zeros.",
    10: "Allocates local unscaled output accumulator matrix O_acc (Br x d) in GPU registers.",
    11: "Blank line before inner key/value block loop.",
    12: "Iterates over key/value tile block index j from 0 to N in steps of Bc (Inner Loop over K, V).",
    13: "Asynchronously loads K_sram = K[j : j + Bc] into SRAM using Hopper TMA Multicast.",
    14: "Asynchronously loads V_sram = V[j : j + Bc] into SRAM using Hopper TMA Multicast.",
    15: "Blank line before Q_sram row iteration.",
    16: "Iterates over local row index r from 0 to Br - 1.",
    17: "Loads local query vector q_vec = Q_sram[r].",
    18: "Calculates scaled dot-product attention score block scores = Q_sram * K_sram^T * scale via Hopper wgmma.mma_async.",
    19: "Blank line before local max calculation.",
    20: "Calculates local block max score m_curr = max(scores).",
    21: "Updates online row max score m_new = max(m_i[r], m_curr).",
    22: "Calculates previous output rescaling factor scale_prev = exp(m_prev - m_new).",
    23: "Blank line before exponentiation and accumulator updates.",
    24: "Calculates rescaled exponentiated scores exp_scores = [exp(s - m_new) for s in scores].",
    25: "Updates online unnormalized denominator l_new = l_i[r] * scale_prev + sum(exp_scores).",
    26: "Blank line before accumulator update loop.",
    27: "Iterates over head dimension column col from 0 to d - 1.",
    28: "Computes matrix multiplication sum of exp_scores * V_sram for column col.",
    29: "Rescales and updates unnormalized accumulator O_acc[r][col] = O_acc * scale_prev + pv_sum without division!",
    30: "Blank line before updating local trackers.",
    31: "Persists local row max score m_i[r] = m_new.",
    32: "Persists local row normalizer l_i[r] = l_new.",
    33: "Blank line separating inner K/V loop from final division loop.",
    34: "Iterates over local row index r from 0 to Br - 1 for final division.",
    35: "Calculates global sequence row index row_idx = i + r.",
    36: "Iterates over head dimension column col from 0 to d - 1.",
    37: "Performs single final division by l_i[r] and writes finalized attention output O[row_idx][col] to DRAM HBM via TMA 2D Store.",
    38: "Blank line separating query loop from return statement.",
    39: "Returns completed FlashAttention-3 output matrix O.",
  },
};

export const flashAttention3TmaWarpSpecializedKernel: AlgorithmDefinition<flashAttention3TmaWarpSpecializedKernelInput> =
  {
    id: "flash-attention-3-tma-warp-specialized-kernel",
    title: "FlashAttention-3 Hopper TMA Warp-Specialized Kernel",
    topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    description:
      "The FlashAttention-3 Hopper TMA Warp-Specialized Kernel implements the state-of-the-art attention kernel for **NVIDIA Hopper (H100, H200)** architecture published by **Jay Shah, Tri Dao et al. (2024)**. FlashAttention-3 exploits Hopper-native hardware primitives—specifically **TMA (Tensor Memory Accelerator)** for asynchronous 2D tensor transfers between HBM DRAM and SRAM shared memory without GPU warp thread intervention, and **Warp-Group GEMM (`wgmma.mma_async`)** for executing FP8/FP16 matrix multiplication while overlapping Producer memory loads with Consumer GEMM math.\n\n### Why It Exists\nOn NVIDIA H100 GPUs, standard CUDA warp instructions (`ldmatrix`, `mma.sync`) spend significant time waiting for shared memory barrier synchronization. FlashAttention-3 uses **Warp Specialization**: Producer Warps issue TMA asynchronous memory transfers while Consumer Warps execute `wgmma.mma_async` Tensor Core math continuously, achieving **1.5x to 2x speedups** over FlashAttention-2 (reaching up to **850 TFLOPS / 85% of H100 peak FLOPS**).\n\n### Mathematical Formulation\nFor Query block $Q_i$, Key block $K_j$, Value block $V_j$, Producer TMA transfer $\\text{TMA}_{async}$, and Hopper Warp-Group GEMM $\\text{WGMMA}_{async}$:\n\n$$1. \\quad \\text{SRAM}_{Q_i} \\xleftarrow{\\text{TMA}_{async}} \\text{HBM}(Q_i), \\quad \\text{SRAM}_{K_j} \\xleftarrow{\\text{TMA}_{multicast}} \\text{HBM}(K_j) \\quad (\\text{Zero-Warp Memory Transfer})$$\n\n$$2. \\quad S_{i,j} = \\text{WGMMA}_{async}(\\text{SRAM}_{Q_i}, \\text{SRAM}_{K_j}^T) \\cdot \\frac{1}{\\sqrt{d}} \\in \\mathbb{R}^{B_r \\times B_c}$$\n\n$$3. \\quad P_{i,j} = \\exp(S_{i,j} - m_i^{new}), \\quad \\tilde{O}_i^{new} = \\tilde{O}_i^{old} \\cdot e^{m_i^{old} - m_i^{new}} + \\text{WGMMA}_{async}(P_{i,j}, \\text{SRAM}_{V_j})$$\n\n$$4. \\quad O_i^{final} = \\frac{\\tilde{O}_i^{final}}{l_i^{final}} \\quad (\\text{Single Final Division} \\to \\text{TMA}_{store} \\text{ HBM})$$\n\n### Step-by-Step Intuition\n1. **Producer Warp TMA Issue**: Producer warps issue asynchronous 2D TMA descriptors to fetch $Q_i, K_j, V_j$ tiles directly from HBM DRAM into SRAM shared memory without warp stalling.\n2. **TMA Multicast Across Warps**: On multi-warp thread blocks, TMA multicasts $K_j, V_j$ tiles to multiple SRAM shared memory buffers simultaneously.\n3. **Consumer Warp WGMMA Math**: Consumer warp-groups execute `wgmma.mma_async` instructions, computing GEMM math in parallel while TMA loads the next tile.\n4. **Asynchronous Double-Buffering**: Ping-pong between two SRAM buffers (`buffer_0` and `buffer_1`), hiding 100% of memory latency.\n5. **FP8 Low-Precision Softmax**: Optionally computes attention scores in FP8 precision with FP32 online softmax rescaling.\n\n### Key Trade-Offs & Hardware Execution\n- **Hopper SM90 Specificity**: Requires NVIDIA Hopper (H100, H200, GH200) microarchitecture hardware support for TMA and `wgmma` assembly instructions.\n- **Overlapping Memory & Math**: Completely hides memory bandwidth latency, keeping Tensor Cores running at 85%+ theoretical peak TFLOPS.",
    constraints: ["1 <= N <= 32768", "1 <= d <= 256", "1 <= Br, Bc <= 256"],
    examples: [
      {
        kind: "basic",
        title: "4x4 FlashAttention-3 Forward Kernel (TMA + WGMMA)",
        inputDisplay: "N=4 tokens, d=2 dimensions, Tile sizes Br=2, Bc=2",
        outputDisplay: "Output Matrix O (4x2 exact attention vectors, TMA Async Copy)",
        input: DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT,
        output: "[[19.5, 29.5], [26.2, 36.2], [32.1, 42.1], [38.0, 48.0]]",
        explanation:
          "Simulates NVIDIA Hopper TMA asynchronous memory transfers and WGMMA warp-group matrix math, achieving exact attention output O.",
      },
    ],
    code: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE,
    timeComplexity: {
      best: "O(N^2 \\cdot d)",
      average: "O(N^2 \\cdot d)",
      worst: "O(N^2 \\cdot d)",
    },
    spaceComplexity: "O(N \\cdot d)",
    complexityAnalysis: {
      time: "Requires $O(N^2 \\cdot d)$ math operations, but executes 1.5x-2x faster than FlashAttention-2 by completely overlapping memory loads with Tensor Core math.",
      space: "Requires $O(N \\cdot d)$ memory space for output $O$ and local register trackers.",
    },
    topicGuide: {
      overview:
        "The FlashAttention-3 Hopper TMA Warp-Specialized Kernel implements Jay Shah & Tri Dao's 2024 H100-optimized attention kernel using TMA and WGMMA.",
      sections: [
        {
          heading: "Core Concept & Hopper SM90 Architecture",
          body: "FlashAttention-3 (Shah & Dao 2024) is designed for NVIDIA Hopper (H100), utilizing TMA (Tensor Memory Accelerator) and WGMMA (Warp-Group Matrix Multiply-Accumulate) to reach 850 TFLOPS.",
        },
        {
          heading: "Warp Specialization (Producer vs Consumer)",
          body: "Separates warps into Producer Warps issuing TMA memory loads and Consumer Warps executing WGMMA math, eliminating barrier synchronization stalls.",
        },
        {
          heading: "TMA Asynchronous 2D Transfers & Multicast",
          body: "TMA hardware engine copies 2D tiles directly between HBM DRAM and SRAM shared memory without warp CPU cycles, multicasting data across thread blocks.",
        },
        {
          heading: "Asynchronous Double-Buffering (Ping-Pong)",
          body: "Ping-ponging between SRAM buffer 0 and buffer 1 allows Tensor Cores to compute GEMM math on buffer 0 while TMA loads buffer 1, hiding 100% of memory latency.",
        },
      ],
      keyTerms: [
        {
          term: "FlashAttention-3",
          definition:
            "Hopper-optimized attention kernel achieving 850 TFLOPS using TMA and Warp-Specialization (Shah & Dao 2024).",
        },
        {
          term: "TMA (Tensor Memory Accelerator)",
          definition:
            "Hopper hardware engine executing asynchronous 2D tensor transfers between HBM DRAM and SRAM shared memory.",
        },
        {
          term: "WGMMA (Warp-Group GEMM)",
          definition:
            "Hopper assembly instruction executing 128-thread warp-group matrix multiplication asynchronously.",
        },
        {
          term: "Warp Specialization",
          definition:
            "Partitioning GPU warps into dedicated Producer (Memory) and Consumer (Math) roles to overlap execution.",
        },
      ],
    },
    trivia: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT,
    generateSteps: generateFLASHATTENTION3TMAWARPSPECIALIZEDKERNELSteps,
  };
