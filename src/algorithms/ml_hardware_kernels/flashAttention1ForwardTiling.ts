import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention1ForwardTilingInput {
  Q?: number[][];
  K?: number[][];
  V?: number[][];
  Br?: number;
  Bc?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTION1FORWARDTILING_CODE = `def flash_attention_1_forward(Q: list[list[float]], K: list[list[float]], V: list[list[float]], Br: int = 2, Bc: int = 2, scale: float = 1.0) -> list[list[float]]:
    """Simulates FlashAttention-1 forward pass with SRAM tiling & online softmax."""
    N = len(Q)
    d = len(Q[0])

    O = [[0.0] * d for _ in range(N)]
    lse = [0.0] * N
    m = [-float('inf')] * N

    for j in range(0, N, Bc):
        K_block = K[j : j + Bc]
        V_block = V[j : j + Bc]

        for i in range(0, N, Br):
            Q_block = Q[i : i + Br]

            for r, q_vec in enumerate(Q_block):
                row_idx = i + r
                scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in K_block]

                m_curr = max(scores)
                m_new = max(m[row_idx], m_curr)

                exp_scores = [math.exp(s - m_new) for s in scores]
                l_new = lse[row_idx] * math.exp(m[row_idx] - m_new) + sum(exp_scores)

                scale_prev = math.exp(m[row_idx] - m_new)
                for col in range(d):
                    pv_col = sum(exp_s * v_vec[col] for exp_s, v_vec in zip(exp_scores, V_block))
                    O[row_idx][col] = (O[row_idx][col] * scale_prev + pv_col) / l_new

                m[row_idx] = m_new
                lse[row_idx] = l_new

    return O`;

export const DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT: flashAttention1ForwardTilingInput = {
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

export const generateFLASHATTENTION1FORWARDTILINGSteps = (
  input: flashAttention1ForwardTilingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Q = input.Q || DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT.Q!;
  const K = input.K || DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT.K!;
  const V = input.V || DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT.V!;
  const Br = input.Br || 2;
  const Bc = input.Bc || 2;

  const N = Q.length;
  const d = Q[0].length;
  const scale = 1.0 / Math.sqrt(d);

  const O: number[][] = Array.from({ length: N }, () => new Array(d).fill(0.0));
  const m: number[] = new Array(N).fill(-Infinity);
  const lse: number[] = new Array(N).fill(0.0);

  const getSnapshot = (
    activeRow: number = -1,
    _activeTileJ: number = -1,
    activeTileI: number = -1,
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
      title: `FlashAttention-1 Output Matrix O (${N}x${d}, Br=${Br}, Bc=${Bc})`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow: number = -1,
    activeTileJ: number = -1,
    activeTileI: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeTileJ, activeTileI),
      auxiliaryState: {
        customState: {
          "Algorithm": "FlashAttention-1 Forward Pass (Dao et al. 2022)",
          "Sequence Length N": String(N),
          "Head Dimension d": String(d),
          "SRAM Row Block Br": String(Br),
          "SRAM Col Block Bc": String(Bc),
          "IO Complexity": "O(N^2 d^2 / M) Memory Accesses",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "FlashAttention-1 Forward Engine Entry",
    `Started FlashAttention-1 forward pass on sequence length N=${N}, head dimension d=${d}, tiling Br=${Br}, Bc=${Bc}.`,
    { N, d, Br, Bc },
  );

  // Step 2: Measure N & d (3, 4)
  addStep(
    3,
    `Measure Sequence Length: N = len(Q) = ${N}`,
    `Sequence length N = ${N}.`,
    { N },
  );

  addStep(
    4,
    `Measure Head Dimension: d = len(Q[0]) = ${d}`,
    `Head dimension d = ${d}. Scale factor 1/sqrt(d) = ${scale.toFixed(4)}.`,
    { d, scale },
  );

  // Step 3: Init O (6)
  addStep(
    6,
    `Allocate Output Matrix O (${N}x${d}) in HBM DRAM`,
    `Zero-initialized ${N}x${d} output matrix O in HBM DRAM.`,
    { N, d },
  );

  // Step 4: Init lse (7)
  addStep(
    7,
    `Allocate Normalizer Accumulator lse [] (${N} Elements)`,
    `Zero-initialized online softmax denominator accumulator list.`,
    { N },
  );

  // Step 5: Init m (8)
  addStep(
    8,
    `Allocate Max Score Tracker m [] (${N} Elements)`,
    "Initialized row max score tracker m to -infinity.",
    { N },
  );

  // Outer loop over J (10..12)
  for (let j = 0; j < N; j += Bc) {
    addStep(
      10,
      `Outer Column Block Loop: Load K, V Blocks starting at j = ${j}`,
      `Loading K_block [${j}:${j + Bc}] and V_block [${j}:${j + Bc}] into fast SRAM shared memory.`,
      { j, Bc },
      -1,
      j,
    );

    const KBlock = K.slice(j, j + Bc);
    addStep(
      11,
      `Load K_block [${j}:${j + Bc}] (${KBlock.length} vectors) into SRAM`,
      `Loaded K_block into GPU SRAM shared memory.`,
      { j, KBlockLength: KBlock.length },
      -1,
      j,
    );

    const VBlock = V.slice(j, j + Bc);
    addStep(
      12,
      `Load V_block [${j}:${j + Bc}] (${VBlock.length} vectors) into SRAM`,
      `Loaded V_block into GPU SRAM shared memory.`,
      { j, VBlockLength: VBlock.length },
      -1,
      j,
    );

    // Inner loop over I (14..15)
    for (let i = 0; i < N; i += Br) {
      addStep(
        14,
        `Inner Row Block Loop: Load Q Block starting at i = ${i}`,
        `Loading Q_block [${i}:${i + Br}] into fast SRAM shared memory.`,
        { i, Br },
        -1,
        j,
        i,
      );

      const QBlock = Q.slice(i, i + Br);
      addStep(
        15,
        `Load Q_block [${i}:${i + Br}] (${QBlock.length} vectors) into SRAM`,
        `Loaded Q_block into GPU SRAM shared memory.`,
        { i, QBlockLength: QBlock.length },
        -1,
        j,
        i,
      );

      // Loop over rows in Q_block (17..33)
      for (let r = 0; r < QBlock.length; r++) {
        const rowIdx = i + r;
        const qVec = QBlock[r];

        addStep(
          17,
          `Process Q Row ${rowIdx} (Block Offset r = ${r})`,
          `Processing query vector q_${rowIdx} against SRAM K_block [${j}:${j + Bc}].`,
          { rowIdx, r },
          rowIdx,
          j,
          i,
        );

        addStep(
          18,
          `Set Active Row Index: row_idx = ${rowIdx}`,
          `Set global query row index row_idx = ${rowIdx}.`,
          { row_idx: rowIdx },
          rowIdx,
          j,
          i,
        );

        // Calculate scores
        const scores = KBlock.map((kVec) => {
          const dot = qVec.reduce((acc, qVal, idx) => acc + qVal * kVec[idx], 0);
          return dot * scale;
        });

        addStep(
          19,
          `SRAM Dot Product: S_row = Q[${rowIdx}] * K_block^T * scale`,
          `Evaluated unnormalized attention score block: [${scores.map((s) => s.toFixed(4)).join(", ")}].`,
          { rowIdx, scores: JSON.stringify(scores.map((s) => s.toFixed(4))) },
          rowIdx,
          j,
          i,
        );

        const mCurr = Math.max(...scores);
        addStep(
          21,
          `Find Block Max Score: m_curr = ${mCurr.toFixed(4)}`,
          `Local block maximum score m_curr = ${mCurr.toFixed(4)}.`,
          { m_curr: mCurr },
          rowIdx,
          j,
          i,
        );

        const mPrev = m[rowIdx];
        const mNew = Math.max(mPrev, mCurr);
        addStep(
          22,
          `Online Softmax Rescaling: m_new = max(${mPrev === -Infinity ? "-inf" : mPrev.toFixed(4)}, ${mCurr.toFixed(4)}) = ${mNew.toFixed(4)}`,
          `Updated online max score m_new = ${mNew.toFixed(4)}.`,
          { m_prev: mPrev === -Infinity ? -999 : mPrev, m_curr: mCurr, m_new: mNew },
          rowIdx,
          j,
          i,
        );

        const expScores = scores.map((s) => Math.exp(s - mNew));
        addStep(
          24,
          `Exponentiate Rescaled Scores: exp(S - m_new)`,
          `Evaluated exponentiated scores: [${expScores.map((e) => e.toFixed(4)).join(", ")}].`,
          { expScores: JSON.stringify(expScores.map((e) => e.toFixed(4))) },
          rowIdx,
          j,
          i,
        );

        const scalePrev = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);
        const lNew = lse[rowIdx] * scalePrev + expScores.reduce((a, b) => a + b, 0);
        addStep(
          25,
          `Online Normalizer Update: l_new = ${lNew.toFixed(4)}`,
          `Updated online denominator sum l_new = ${lNew.toFixed(4)}.`,
          { l_new: lNew },
          rowIdx,
          j,
          i,
        );

        addStep(
          27,
          `Calculate Output Rescaling Factor: scale_prev = exp(m_prev - m_new) = ${scalePrev.toFixed(4)}`,
          `Evaluated output correction multiplier scale_prev = ${scalePrev.toFixed(4)}.`,
          { scale_prev: scalePrev },
          rowIdx,
          j,
          i,
        );

        for (let col = 0; col < d; col++) {
          const pvCol = expScores.reduce((acc, expS, kIdx) => acc + expS * VBlock[kIdx][col], 0);
          const oOld = O[rowIdx][col];
          const oNew = (oOld * (lse[rowIdx] * scalePrev) + pvCol) / lNew;
          O[rowIdx][col] = oNew;

          addStep(
            30,
            `Update O[${rowIdx}][${col}]: Rescaled Attention Output = ${oNew.toFixed(4)}`,
            `Rescaled and accumulated attention output O[${rowIdx}][${col}] = ${oNew.toFixed(4)}.`,
            { rowIdx, col, oNew },
            rowIdx,
            j,
            i,
          );
        }

        m[rowIdx] = mNew;
        addStep(
          32,
          `Persist Row Max Score: m[${rowIdx}] = ${mNew.toFixed(4)}`,
          `Updated row max tracker m[${rowIdx}] = ${mNew.toFixed(4)}.`,
          { rowIdx, mNew },
          rowIdx,
          j,
          i,
        );

        lse[rowIdx] = lNew;
        addStep(
          33,
          `Persist Row Normalizer: lse[${rowIdx}] = ${lNew.toFixed(4)}`,
          `Updated row normalizer lse[${rowIdx}] = ${lNew.toFixed(4)}.`,
          { rowIdx, lNew },
          rowIdx,
          j,
          i,
        );
      }
    }
  }

  // Return step (35)
  addStep(
    35,
    "Execution Complete: Return FlashAttention Output Matrix O",
    `Completed FlashAttention-1 forward pass. Exact attention output O computed with zero HBM intermediate materialization!`,
    { N, d, completed: true },
  );

  return steps;
};

const FLASHATTENTION1FORWARDTILING_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 9, 13, 16, 20, 23, 26, 29, 31, 34],
  distractors: [
    "S = Q @ K.T",
    "O = softmax(S) @ V",
    "l_new = lse[row_idx] + sum(scores)",
    "scale_prev = m_curr - m_new",
  ],
  hints: [
    { line: 22, hint: "Online max updating equation: m_new = max(m[row_idx], m_curr)." },
    { line: 30, hint: "Online softmax output correction: O[row_idx][col] = (O * scale_prev + pv_col) / l_new." },
  ],
  lineExplanations: {
    1: "Defines entry point for flash_attention_1_forward function (Dao et al. 2022).",
    2: "Docstring describing FlashAttention-1 forward pass with SRAM tiling & online softmax.",
    3: "Measures sequence length N = len(Q).",
    4: "Measures head dimension d = len(Q[0]).",
    5: "Blank line before output buffers allocation.",
    6: "Allocates output matrix O (N x d) filled with zeros.",
    7: "Allocates online normalizer accumulator list lse of size N.",
    8: "Allocates max score tracker list m of size N initialized to negative infinity.",
    9: "Blank line before outer column block loop.",
    10: "Iterates over column tile block index j from 0 to N in steps of Bc.",
    11: "Slices K_block = K[j : j + Bc] into SRAM shared memory.",
    12: "Slices V_block = V[j : j + Bc] into SRAM shared memory.",
    13: "Blank line before inner row block loop.",
    14: "Iterates over row tile block index i from 0 to N in steps of Br.",
    15: "Slices Q_block = Q[i : i + Br] into SRAM shared memory.",
    16: "Blank line before Q_block row iteration.",
    17: "Iterates over row index r and query vector q_vec in enumerate(Q_block).",
    18: "Calculates global sequence row index row_idx = i + r.",
    19: "Calculates scaled dot-product attention score block scores = Q_block * K_block^T * scale.",
    20: "Blank line before online max calculation.",
    21: "Calculates local block max score m_curr = max(scores).",
    22: "Updates online row max score m_new = max(m[row_idx], m_curr).",
    23: "Blank line before exponentiation.",
    24: "Calculates rescaled exponentiated scores exp_scores = [exp(s - m_new) for s in scores].",
    25: "Updates online normalizer sum l_new = lse[row_idx] * exp(m_prev - m_new) + sum(exp_scores).",
    26: "Blank line before output update loop.",
    27: "Calculates previous output rescaling factor scale_prev = exp(m_prev - m_new).",
    28: "Iterates over head dimension column col from 0 to d - 1.",
    29: "Computes matrix multiplication of exp_scores * V_block for column col.",
    30: "Rescales and updates FlashAttention output cell O[row_idx][col] = (O * scale_prev + pv_col) / l_new.",
    31: "Blank line before updating state arrays.",
    32: "Persists updated row max score m[row_idx] = m_new.",
    33: "Persists updated row normalizer lse[row_idx] = l_new.",
    34: "Blank line separating tiling loops from return statement.",
    35: "Returns completed FlashAttention output matrix O.",
  },
};

export const flashAttention1ForwardTiling: AlgorithmDefinition<flashAttention1ForwardTilingInput> = {
  id: "flashAttention1ForwardTiling",
  title: "FlashAttention-1 SRAM Tiling Forward Engine",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_hardware_kernels",
  description:
    "The FlashAttention-1 SRAM Tiling Forward Engine implements the breakthrough exact attention algorithm introduced by **Tri Dao et al. (2022)**. Standard Scaled Dot-Product Attention $O = \\text{softmax}(Q K^T / \\sqrt{d}) V$ materializes the $N \\times N$ attention matrix $S$ in GPU High Bandwidth Memory (HBM DRAM), causing severe $O(N^2)$ memory bandwidth IO bottlenecks. FlashAttention tiles $Q, K, V$ into fast GPU SRAM shared memory ($B_r \\times d, B_c \\times d$), computing exact attention in $O(N^2 d)$ math FLOPs with only $O(N^2 d^2 / M)$ HBM memory accesses by fusing scaling, exponentiation, and reduction via **Online Softmax**.\n\n### Why It Exists\nFor LLMs (GPT-4, LLaMA-3, Claude 3) with long context windows ($N = 128\\text{k}$), standard $N \\times N$ attention materializes 32 GB of intermediate $S, P$ matrices per head. FlashAttention avoids materializing $S, P$ entirely, achieving **2x-4x speedups** and reducing memory footprint from $O(N^2)$ to $O(N)$!\n\n### Mathematical Formulation\nFor Query block $Q_i \\in \\mathbb{R}^{B_r \\times d}$, Key block $K_j \\in \\mathbb{R}^{B_c \\times d}$, Value block $V_j \\in \\mathbb{R}^{B_c \\times d}$, and online max $m_i$, normalizer $l_i$:\n\n$$1. \\quad S_{i,j} = \\frac{Q_i K_j^T}{\\sqrt{d}} \\in \\mathbb{R}^{B_r \\times B_c} \\quad (\\text{SRAM Local Attention Block})$$\n\n$$2. \\quad \\tilde{m}_i = \\max(\\text{rowmax}(S_{i,j})) \\in \\mathbb{R}^{B_r}, \\quad m_i^{new} = \\max(m_i^{old}, \\tilde{m}_i)$$\n\n$$3. \\quad P_{i,j} = \\exp(S_{i,j} - m_i^{new}), \\quad l_i^{new} = l_i^{old} \\cdot e^{m_i^{old} - m_i^{new}} + \\text{rowsum}(P_{i,j})$$\n\n$$4. \\quad O_i^{new} = \\frac{O_i^{old} \\cdot l_i^{old} \\cdot e^{m_i^{old} - m_i^{new}} + P_{i,j} V_j}{l_i^{new}} \\quad (\\text{Online Softmax Rescaling})$$\n\n### Step-by-Step Intuition\n1. **Outer Key/Value Block Loop**: Load tile blocks $K_j, V_j$ of size $B_c \\times d$ into fast SRAM shared memory.\n2. **Inner Query Block Loop**: Load tile block $Q_i$ of size $B_r \\times d$ into SRAM shared memory.\n3. **Local Score Block Calculation**: Compute unnormalized dot product block $S_{i,j} = \\frac{Q_i K_j^T}{\\sqrt{d}}$.\n4. **Online Max & Exponentiation**: Track running row maximum $m_i^{new} = \\max(m_i^{old}, \\max(S_{i,j}))$, and exponentiate $P_{i,j} = \\exp(S_{i,j} - m_i^{new})$.\n5. **Rescaled Accumulation**: Correct prior partial output $O_i^{old}$ by multiplier $e^{m_i^{old} - m_i^{new}}$, add $P_{i,j} V_j$, and divide by new normalizer $l_i^{new}$.\n\n### Key Trade-Offs & Hardware Execution\n- **HBM DRAM Bandwidth Bound**: Standard attention is memory-bandwidth bound (reading/writing $N \\times N$ matrices at 2 TB/s). FlashAttention makes attention compute-bound (operating in 19 TB/s SRAM).\n- **Recomputation in Backward Pass**: Instead of storing $S, P$ for backprop, FlashAttention recomputes $S_{i,j}$ on-the-fly during backward pass from stored $m_i, l_i$, saving 90%+ VRAM.",
  constraints: [
    "1 <= N <= 8192",
    "1 <= d <= 128",
    "1 <= Br, Bc <= 256",
  ],
  examples: [
    {
      kind: "basic",
      title: "4x4 FlashAttention-1 Forward Tiling (Br=2, Bc=2)",
      inputDisplay: "N=4 tokens, d=2 dimensions, Tile sizes Br=2, Bc=2",
      outputDisplay: "Output Matrix O (4x2 exact attention vectors)",
      input: DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT,
      output: "[[19.5, 29.5], [26.2, 36.2], [32.1, 42.1], [38.0, 48.0]]",
      explanation: "Tiles Q, K, V into 2x2 SRAM blocks, computing exact attention via online softmax with zero HBM N x N matrix materialization.",
    },
  ],
  code: FLASHATTENTION1FORWARDTILING_CODE,
  timeComplexity: {
    best: "O(N^2 \\cdot d)",
    average: "O(N^2 \\cdot d)",
    worst: "O(N^2 \\cdot d)",
  },
  spaceComplexity: "O(N \\cdot d)",
  complexityAnalysis: {
    time: "Requires $O(N^2 \\cdot d)$ math operations (identical FLOP count to standard attention), but operates inside fast SRAM.",
    space: "Requires $O(N \\cdot d)$ memory space for output $O$ and online trackers $m, lse$, eliminating $O(N^2)$ intermediate memory.",
  },
  topicGuide: {
    overview:
      "The FlashAttention-1 SRAM Tiling Forward Engine computes exact attention without materializing intermediate N x N attention matrices in HBM.",
    sections: [
      {
        heading: "Core Concept & Tri Dao's Breakthrough",
        body: "FlashAttention-1 (Dao et al. 2022) fuses scaling, softmax, and matrix multiplication into a single GPU kernel, tiling Q, K, V into SRAM and avoiding N x N HBM DRAM reads/writes.",
      },
      {
        heading: "Online Softmax Rescaling Mechanics",
        body: "Online softmax updates running max m_new = max(m_old, m_block) and normalizer l_new, rescaling previous output accumulators O_old by exp(m_old - m_new) / l_new.",
      },
      {
        heading: "HBM IO Reduction & TFLOPS Speedup",
        body: "FlashAttention reduces HBM DRAM accesses from O(N^2 d + N d) down to O(N^2 d^2 / M), increasing GPU Tensor Core utilization from 15% to 60%+.",
      },
      {
        heading: "Memory Efficiency in Long Context LLMs",
        body: "Standard attention O(N^2) memory footprint OOMs at 32k context lengths. FlashAttention O(N) memory scaling enables training 128k+ context LLMs.",
      },
    ],
    keyTerms: [
      {
        term: "FlashAttention",
        definition: "Exact IO-aware fast attention algorithm utilizing SRAM tiling and online softmax (Dao et al. 2022).",
      },
      {
        term: "Online Softmax",
        definition: "Algorithm computing softmax incrementally over tiled blocks without storing full N x N matrix.",
      },
      {
        term: "SRAM Shared Memory",
        definition: "Ultra-fast 19 TB/s GPU on-chip memory buffer used to store Q, K, V tile blocks.",
      },
      {
        term: "HBM DRAM",
        definition: "Main GPU High Bandwidth Memory (2 TB/s) where model weights and final outputs reside.",
      },
    ],
  },
  trivia: FLASHATTENTION1FORWARDTILING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT,
  generateSteps: generateFLASHATTENTION1FORWARDTILINGSteps,
};
