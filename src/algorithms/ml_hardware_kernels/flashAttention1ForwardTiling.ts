import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention1ForwardTilingInput {
  Q?: number[][];
  K?: number[][];
  V?: number[][];
  Br?: number;
  Bc?: number;
  data?: number[];
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

  const createMatrixSnapshot = (
    activeRow?: number,
    activeTileJ?: number,
    activeTileI?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < N; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < d; c++) {
        const val = Number(O[r][c].toFixed(2));
        let state: MatrixCellItem["state"] = "default";
        if (activeRow === r) {
          state = "active";
        } else if (activeTileI !== undefined && r >= activeTileI && r < activeTileI + Br) {
          state = "compare";
        } else if (m[r] > -Infinity) {
          state = "sorted";
        }

        rowItems.push({
          row: r,
          col: c,
          val,
          label: `O[${r}][${c}]=${val}`,
          state,
        });
      }
      grid.push(rowItems);
    }
    return grid;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeTileJ?: number,
    activeTileI?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        matrix: createMatrixSnapshot(activeRow, activeTileJ, activeTileI),
      },
      auxiliaryState: {
        customState: customState ?? {
          Br: String(Br),
          Bc: String(Bc),
          scale: scale.toFixed(3),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize FlashAttention-1 SRAM Tiled Forward Kernel",
    `Configuring SRAM tiling: N=${N}, d=${d}, tile sizes Br=${Br}, Bc=${Bc}, scale=${scale.toFixed(3)}.`,
    { N, d, Br, Bc },
  );

  addStep(
    3,
    `Read N = len(Q) = ${N}`,
    `Storing sequence length N=${N} for block partitioning.`,
    { N },
  );

  addStep(
    4,
    `Read d = len(Q[0]) = ${d}`,
    `Storing head dimension d=${d}.`,
    { d },
  );

  addStep(
    6,
    `Initialize Output accumulator matrix O of shape [${N}, ${d}] with zeros`,
    "Allocating output tensor O in SRAM registers.",
    { O_shape: `[${N}, ${d}]` },
  );

  addStep(
    7,
    `Initialize log-sum-exp sum array lse of size ${N} with zeros`,
    "Allocating lse denominator array in SRAM.",
    { lse_len: N },
  );

  addStep(
    8,
    `Initialize running maximum array m of size ${N} with -inf`,
    "Allocating online row max tracker initialized to negative infinity.",
    { m_len: N },
  );

  for (let j = 0; j < N; j += Bc) {
    addStep(
      10,
      `Outer loop j = ${j}: load K, V block [${j}..${Math.min(j + Bc, N) - 1}] into SRAM`,
      `Loading Key tile K[${j}:${j + Bc}] and Value tile V[${j}:${j + Bc}] into fast GPU SRAM.`,
      { j, Bc },
      undefined,
      j,
    );

    const KBlock = K.slice(j, j + Bc);
    const VBlock = V.slice(j, j + Bc);

    addStep(
      11,
      `Load K_block = K[${j}:${j + Bc}] (${KBlock.length} rows)`,
      `SRAM read: Key tile K_block loaded.`,
      { j, K_block_len: KBlock.length },
      undefined,
      j,
    );

    addStep(
      12,
      `Load V_block = V[${j}:${j + Bc}] (${VBlock.length} rows)`,
      `SRAM read: Value tile V_block loaded.`,
      { j, V_block_len: VBlock.length },
      undefined,
      j,
    );

    for (let i = 0; i < N; i += Br) {
      addStep(
        14,
        `Inner loop i = ${i}: load Q block [${i}..${Math.min(i + Br, N) - 1}] into SRAM`,
        `Loading Query tile Q[${i}:${i + Br}] into fast GPU SRAM.`,
        { i, j, Br },
        undefined,
        j,
        i,
      );

      const QBlock = Q.slice(i, i + Br);
      addStep(
        15,
        `Load Q_block = Q[${i}:${i + Br}] (${QBlock.length} rows)`,
        `SRAM read: Query tile Q_block loaded.`,
        { i, Q_block_len: QBlock.length },
        undefined,
        j,
        i,
      );

      for (let r = 0; r < QBlock.length; r++) {
        const qVec = QBlock[r];
        const rowIdx = i + r;

        addStep(
          18,
          `Process query vector at row_idx = i + r = ${i} + ${r} = ${rowIdx}`,
          `Calculating attention scores for query row ${rowIdx} against K_block tile.`,
          { row_idx: rowIdx, r, i },
          rowIdx,
          j,
          i,
        );

        const rawScores: number[] = KBlock.map((kVec) => {
          let dot = 0;
          for (let k = 0; k < d; k++) dot += qVec[k] * kVec[k];
          return dot * scale;
        });

        addStep(
          19,
          `Compute S_ij scores = Q[${rowIdx}] @ K[${j}:${j + Bc}]^T * scale`,
          `Tile attention scores: [${rawScores.map((s) => s.toFixed(2)).join(", ")}].`,
          { row_idx: rowIdx, scores: JSON.stringify(rawScores.map((s) => Number(s.toFixed(2)))) },
          rowIdx,
          j,
          i,
        );

        const mCurr = Math.max(...rawScores);
        addStep(
          21,
          `Compute local tile max m_curr = ${mCurr.toFixed(2)}`,
          `Tile maximum score for numerical stability.`,
          { row_idx: rowIdx, m_curr: Number(mCurr.toFixed(2)) },
          rowIdx,
          j,
          i,
        );

        const mPrev = m[rowIdx];
        const mNew = Math.max(mPrev, mCurr);
        addStep(
          22,
          `Update running row max m_new = max(m_prev=${mPrev === -Infinity ? "-inf" : mPrev.toFixed(2)}, m_curr=${mCurr.toFixed(2)}) = ${mNew.toFixed(2)}`,
          `Updated online row maximum to ${mNew.toFixed(2)}.`,
          { row_idx: rowIdx, m_prev: mPrev === -Infinity ? "-inf" : Number(mPrev.toFixed(2)), m_new: Number(mNew.toFixed(2)) },
          rowIdx,
          j,
          i,
        );

        const expScores = rawScores.map((s) => Math.exp(s - mNew));
        addStep(
          24,
          `Compute tile exp_scores = exp(S_ij - m_new)`,
          `Unnormalized softmax exponents: [${expScores.map((e) => e.toFixed(3)).join(", ")}].`,
          { row_idx: rowIdx, exp_scores: JSON.stringify(expScores.map((e) => Number(e.toFixed(3)))) },
          rowIdx,
          j,
          i,
        );

        const scalePrev = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);
        const tileExpSum = expScores.reduce((a, b) => a + b, 0);
        const lNew = lse[rowIdx] * scalePrev + tileExpSum;

        addStep(
          25,
          `Update running sum-exp l_new = l_prev * exp(m_prev - m_new) + sum(exp_scores) = ${lNew.toFixed(3)}`,
          `Updated online softmax denominator sum l_new to ${lNew.toFixed(3)}.`,
          { row_idx: rowIdx, l_prev: Number(lse[rowIdx].toFixed(3)), l_new: Number(lNew.toFixed(3)) },
          rowIdx,
          j,
          i,
        );

        addStep(
          27,
          `Calculate output scale factor scale_prev = exp(m_prev - m_new) = ${scalePrev.toFixed(3)}`,
          `Rescaling factor for previously accumulated O[${rowIdx}] output vector.`,
          { row_idx: rowIdx, scale_prev: Number(scalePrev.toFixed(3)) },
          rowIdx,
          j,
          i,
        );

        for (let col = 0; col < d; col++) {
          addStep(
            28,
            `Loop dimension col = ${col}/${d - 1} for row ${rowIdx}`,
            `Updating accumulator cell O[${rowIdx}][${col}].`,
            { row_idx: rowIdx, col },
            rowIdx,
            j,
            i,
          );

          let pvCol = 0;
          for (let k = 0; k < expScores.length; k++) {
            pvCol += expScores[k] * VBlock[k][col];
          }

          addStep(
            29,
            `Compute pv_col = P_ij @ V_j[col ${col}] = ${pvCol.toFixed(2)}`,
            `Matrix product of tile exponent weights and Value tile column ${col}.`,
            { row_idx: rowIdx, col, pv_col: Number(pvCol.toFixed(2)) },
            rowIdx,
            j,
            i,
          );

          const oldO = O[rowIdx][col];
          const unnormalizedNewO = oldO * lse[rowIdx] * scalePrev + pvCol;
          O[rowIdx][col] = unnormalizedNewO / lNew;

          addStep(
            30,
            `Update O[${rowIdx}][${col}] = (${oldO.toFixed(2)} * scale_prev + ${pvCol.toFixed(2)}) / ${lNew.toFixed(3)} = ${O[rowIdx][col].toFixed(2)}`,
            `Rescaled and accumulated output value at O[${rowIdx}][${col}].`,
            { row_idx: rowIdx, col, old_val: Number(oldO.toFixed(2)), new_val: Number(O[rowIdx][col].toFixed(2)) },
            rowIdx,
            j,
            i,
          );
        }

        m[rowIdx] = mNew;
        addStep(
          32,
          `Store m[${rowIdx}] = ${mNew.toFixed(2)}`,
          `Cached running maximum for row ${rowIdx}.`,
          { row_idx: rowIdx, m_val: Number(mNew.toFixed(2)) },
          rowIdx,
          j,
          i,
        );

        lse[rowIdx] = lNew;
        addStep(
          33,
          `Store lse[${rowIdx}] = ${lNew.toFixed(3)}`,
          `Cached running log-sum-exp sum for row ${rowIdx}.`,
          { row_idx: rowIdx, lse_val: Number(lNew.toFixed(3)) },
          rowIdx,
          j,
          i,
        );
      }
    }
  }

  addStep(
    35,
    "Return final attention output matrix O",
    `FlashAttention-1 forward kernel complete. Computed exact attention output O of shape [${N}, ${d}] in SRAM without materializing $N \\times N$ HBM matrices.`,
    { completed: true, O_shape: `[${N}, ${d}]` },
  );

  return steps;
};

export const FLASHATTENTION1FORWARDTILING_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 9, 13, 16, 20, 23, 26, 31, 34],
  distractors: [
    "m_new = m[row_idx] + m_curr",
    "scale_prev = math.exp(m_new - m[row_idx])",
    "O[row_idx][col] = O[row_idx][col] + pv_col",
    "l_new = lse[row_idx] + sum(exp_scores)",
  ],
  hints: [
    { line: 22, hint: "Compute running maximum m_new = max(m_prev, max(scores))." },
    { line: 25, hint: "Rescale previous log-sum-exp l_prev by exp(m_prev - m_new)." },
    { line: 30, hint: "Rescale accumulated output O_prev by exp(m_prev - m_new) before adding new tile values." },
  ],
  lineExplanations: {
    1: "Defines flash_attention_1_forward signature with Q, K, V matrices and SRAM tile sizes Br, Bc.",
    2: "Docstring describing FlashAttention-1 forward algorithm with SRAM tiling and online softmax.",
    3: "Retrieves sequence length N from Q matrix rows.",
    4: "Retrieves head dimension d from Q matrix columns.",
    5: "Blank line preceding matrix initialization.",
    6: "Initializes output matrix O of shape [N, d] with zeros in SRAM accumulator.",
    7: "Initializes log-sum-exp denominator array lse of length N with zeros.",
    8: "Initializes row maximum array m of length N with negative infinity.",
    9: "Blank line preceding outer loop.",
    10: "Outer loop over key/value block index j stepping by Bc.",
    11: "Loads Key tile K_block of shape [Bc, d] into fast SRAM.",
    12: "Loads Value tile V_block of shape [Bc, d] into fast SRAM.",
    13: "Blank line preceding inner loop.",
    14: "Inner loop over query block index i stepping by Br.",
    15: "Loads Query tile Q_block of shape [Br, d] into fast SRAM.",
    16: "Blank line preceding row loop.",
    17: "Iterates over query vectors in Q_block.",
    18: "Calculates global sequence row index row_idx = i + r.",
    19: "Computes scaled dot-product attention scores S_ij = Q_i @ K_j.T * scale.",
    20: "Blank line preceding online max update.",
    21: "Finds maximum score m_curr within current tile scores.",
    22: "Updates running row maximum m_new = max(m_prev, m_curr) for numerical stability.",
    23: "Blank line preceding exponent sum update.",
    24: "Computes unnormalized tile exponent scores exp(s - m_new).",
    25: "Rescales previous sum-exp lse by exp(m_prev - m_new) and adds new tile exponent sum.",
    26: "Blank line preceding output accumulator update.",
    27: "Calculates rescaling factor scale_prev = exp(m_prev - m_new) for previous output state.",
    28: "Loops across head dimensions col from 0 to d - 1.",
    29: "Computes tile matrix-vector product sum(exp_s * v_vec[col]).",
    30: "Rescales previous O[row_idx][col] and accumulates new tile contribution divided by l_new.",
    31: "Blank line preceding state update.",
    32: "Updates running row maximum m[row_idx] = m_new.",
    33: "Updates running log-sum-exp sum lse[row_idx] = l_new.",
    34: "Blank line ending loop blocks.",
    35: "Returns final attention output matrix O computed entirely via SRAM tiling.",
  },
};

export const flashAttention1ForwardTiling: AlgorithmDefinition<flashAttention1ForwardTilingInput> = {
  id: "flash-attention-1-forward-tiling",
  title: "FlashAttention-1 SRAM Tiled Forward Kernel",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_attention_geometry"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master FlashAttention-1 SRAM Tiled Forward Pass: eliminate $O(N^2)$ HBM memory accesses using online softmax and GPU SRAM block tiling.

### Why It Exists & What It Solves
Standard scaled dot-product attention ($S = Q K^T / \\sqrt{d}, P = \\text{Softmax}(S), O = P V$) requires materializing large $N \\times N$ attention score and probability matrices in High Bandwidth Memory (HBM). For sequence lengths $N = 32{,}000$ or $128{,}000$, storing $N \\times N$ floats requires gigabytes or terabytes of HBM, creating a severe memory bandwidth bottleneck ($O(N^2)$ HBM reads/writes).

FlashAttention-1 (Dao et al., NeurIPS 2022) restructures attention to be **IO-aware**. It partitions $Q, K, V$ into blocks of size $B_r \\times d$ and $B_c \\times d$ small enough to fit inside fast GPU SRAM (~20 TB/s bandwidth vs ~2 TB/s HBM bandwidth). Using **online softmax**, it incrementally computes partial attention scores $S_{ij}$, updates running maximum $m_i$ and log-sum-exp sum $\\ell_i$, and rescales the running output accumulator $O_i$ directly in SRAM registers:
$$O_i^{\\text{new}} = \\frac{O_i^{\\text{old}} \\cdot \\ell_i^{\\text{old}} e^{m_i^{\\text{old}} - m_i^{\\text{new}}} + P_{ij} V_j}{\\ell_i^{\\text{new}}}$$

This reduces HBM memory accesses from $O(N^2 d)$ down to $O(N^2 d^2 / M)$ (where $M$ is SRAM size), accelerating Transformer training and inference by $2\\times$-$4\\times$ without any approximation.

### Step-by-Step Intuition
1. **SRAM Block Partitioning**: Divide $Q$ into $\\lceil N / B_r \\rceil$ row blocks and $K, V$ into $\\lceil N / B_c \\rceil$ column blocks.
2. **Outer Loop over $K_j, V_j$**: Load Key block $K_j$ and Value block $V_j$ into fast GPU SRAM.
3. **Inner Loop over $Q_i$**: Load Query block $Q_i$ into SRAM.
4. **Online Softmax Update**:
   - Compute tile scores $S_{ij} = Q_i K_j^T / \\sqrt{d}$.
   - Update running maximum: $m_i^{\\text{new}} = \\max(m_i^{\\text{old}}, \\text{rowmax}(S_{ij}))$.
   - Rescale previous sum-exp and add tile exponents: $\\ell_i^{\\text{new}} = \\ell_i^{\\text{old}} e^{m_i^{\\text{old}} - m_i^{\\text{new}}} + \\text{rowsum}(e^{S_{ij} - m_i^{\\text{new}}})$.
   - Rescale output accumulator: $O_i^{\\text{new}} = \\frac{O_i^{\\text{old}} \\cdot \\ell_i^{\\text{old}} e^{m_i^{\\text{old}} - m_i^{\\text{new}}} + e^{S_{ij} - m_i^{\\text{new}}} V_j}{\\ell_i^{\\text{new}}}$.

### Input Parameters
- \`Q\`: Query matrix of shape $[N, d]$.
- \`K\`: Key matrix of shape $[N, d]$.
- \`V\`: Value matrix of shape $[N, d]$.
- \`Br\`: Row tile block size (default 2).
- \`Bc\`: Column tile block size (default 2).

### Output
- Returns exact attention output matrix $O \\in \\mathbb{R}^{N \\times d}$ computed entirely via SRAM tiling.

### Trade-offs & Complexity
- **Time Complexity**: $O(N^2 \\cdot d)$ FLOPs (identical arithmetic operations to standard attention).
- **Space Complexity**: $O(N)$ auxiliary memory to store running max $m_i$ and sum-exp $\\ell_i$ vectors, bypassing $O(N^2)$ DRAM allocations.`,
  constraints: ["1 <= N <= 128000", "32 <= d <= 256", "Br, Bc = SRAM tile sizes"],
  examples: [
    {
      kind: "basic",
      title: "Standard SRAM Tiled Forward",
      inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Output O computed in SRAM tiles",
      input: {
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
      },
      output: "Exact attention O without HBM N^2 storage",
      explanation: "Computes exact attention tile by tile using online softmax rescaling.",
    },
    {
      kind: "complex",
      title: "4-Tile SRAM Stream Test",
      inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Zero HBM intermediate write",
      input: {
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
      },
      output: "Zero HBM intermediate write",
      explanation: "Evaluates online softmax updates across 4 consecutive tile pairs.",
    },
    {
      kind: "negative",
      title: "Single Tile Fallback",
      inputDisplay: "N = 2, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Single Tile Executed",
      input: {
        Q: [
          [1.0, 0.0],
          [0.0, 1.0],
        ],
        K: [
          [1.0, 0.0],
          [0.0, 1.0],
        ],
        V: [
          [10.0, 20.0],
          [30.0, 40.0],
        ],
        Br: 2,
        Bc: 2,
      },
      output: "Single Tile Executed",
      explanation: "When sequence length equals block size, tiles execute in single SRAM pass.",
    },
  ],
  code: FLASHATTENTION1FORWARDTILING_CODE,
  timeComplexity: {
    best: "O(N^2 * d)",
    average: "O(N^2 * d)",
    worst: "O(N^2 * d)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Computes exact attention in O(N^2 * d) FLOPs, identically to standard attention, but with 2x-4x faster wall-clock time due to IO efficiency.",
    space: "Requires O(N) auxiliary memory to store running max m_i and sum-exp l_i vectors, bypassing O(N^2) DRAM allocations.",
  },
  topicGuide: {
    overview:
      "FlashAttention-1 is one of the most influential machine learning systems papers of the decade. By restructuring attention around GPU SRAM cache hierarchy, it demonstrated that memory IO complexity is as important as FLOP complexity.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let $Q_i \\in \\mathbb{R}^{B_r \\times d}$ and $K_j, V_j \\in \\mathbb{R}^{B_c \\times d}$. For each block pair $(i, j)$, $S_{ij} = Q_i K_j^T / \\sqrt{d}$. Local max $\\tilde{m}_{ij} = \\text{rowmax}(S_{ij})$, updated max $m_i^{\\text{new}} = \\max(m_i^{\\text{old}}, \\tilde{m}_{ij})$, local sum $\\tilde{\\ell}_{ij} = \\text{rowsum}(e^{S_{ij} - m_i^{\\text{new}}})$. Updated sum $\\ell_i^{\\text{new}} = \\ell_i^{\\text{old}} e^{m_i^{\\text{old}} - m_i^{\\text{new}}} + \\tilde{\\ell}_{ij}$. Output update $O_i^{\\text{new}} = \\text{diag}(e^{m_i^{\\text{old}} - m_i^{\\text{new}}}) O_i^{\\text{old}} + e^{S_{ij} - m_i^{\\text{new}}} V_j$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "GPU Memory Hierarchy: HBM (1.5 - 3.0 TB/s) vs SRAM (19 - 33 TB/s). Standard attention is memory-bound due to writing/reading $S$ and $P$ to HBM ($O(N^2)$ transfers). FlashAttention tiles computations into SRAM, keeping arithmetic intensity high ($O(d)$ FLOPs/byte).",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "FlashAttention-1 uses an outer loop over key/value blocks $j$ and an inner loop over query blocks $i$. This order ensures key/value blocks loaded into shared memory are reused across all query blocks.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Numerical stability: Initializing $m_i = -\\infty$ and $\\ell_i = 0$ handles cold starts. Final division by $\\ell_i$ occurs once at the end of the loop per row block.",
      },
    ],
    keyTerms: [
      {
        term: "FlashAttention",
        definition:
          "An IO-aware exact attention algorithm that tiles computation into GPU SRAM to avoid DRAM reads/writes.",
      },
      {
        term: "Online Softmax",
        definition:
          "A technique computing Softmax progressively over stream blocks using running max and sum-exp statistics.",
      },
      {
        term: "GPU SRAM (Shared Memory)",
        definition: "Ultra-fast on-chip GPU memory cache with ~20 TB/s bandwidth.",
      },
      {
        term: "IO-Awareness",
        definition:
          "Designing algorithms to optimize data movements between different memory levels (HBM vs SRAM).",
      },
    ],
  },
  trivia: FLASHATTENTION1FORWARDTILING_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT,
  generateSteps: generateFLASHATTENTION1FORWARDTILINGSteps,
};
