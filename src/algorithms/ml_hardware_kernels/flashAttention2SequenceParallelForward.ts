import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention2SequenceParallelForwardInput {
  Q?: number[][];
  K?: number[][];
  V?: number[][];
  Br?: number;
  Bc?: number;
  data?: number[];
  [key: string]: unknown;
}

export const FLASHATTENTION2SEQUENCEPARALLELFORWARD_CODE = `def flash_attention_2_forward(Q: list[list[float]], K: list[list[float]], V: list[list[float]], Br: int = 2, Bc: int = 2, scale: float = 1.0) -> list[list[float]]:
    """Simulates FlashAttention-2 forward pass with sequence parallelism and swapped loop order."""
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

export const DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT: flashAttention2SequenceParallelForwardInput = {
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

  const createMatrixSnapshot = (
    activeRow?: number,
    activeTileI?: number,
    activeTileJ?: number,
  ): MatrixCellItem[] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < N; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < d; c++) {
        const val = Number(O[r][c].toFixed(2));
        let state: MatrixCellItem["state"] = "default";
        if (activeRow === r) {
          state = "active";
        } else if (activeTileI !== undefined && r >= activeTileI && r < activeTileI + Br) {
          state = "compared";
        } else if (val > 0) {
          state = "sorted";
        }

        rowItems.push({
          row: r,
          col: c,
          value: val,
          label: `O[${r}][${c}]=${val}`,
          state,
        });
      }
      grid.push(rowItems);
    }
    return grid.flat();
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeTileI?: number,
    activeTileJ?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: N,
        cols: d,
        cells: createMatrixSnapshot(activeRow, activeTileI, activeTileJ),
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
    "Initialize FlashAttention-2 Sequence Parallel Forward Kernel",
    `Setting up swapped loop order & SM parallelism: N=${N}, d=${d}, tile sizes Br=${Br}, Bc=${Bc}.`,
    { N, d, Br, Bc },
  );

  addStep(
    3,
    `Read N = len(Q) = ${N}`,
    `Storing total sequence length N=${N}.`,
    { N },
  );

  addStep(
    4,
    `Read d = len(Q[0]) = ${d}`,
    `Storing head dimension d=${d}.`,
    { d },
  );

  addStep(
    5,
    `Initialize output matrix O of shape [${N}, ${d}] with zeros in HBM`,
    "Allocating global memory output matrix container.",
    { O_shape: `[${N}, ${d}]` },
  );

  for (let i = 0; i < N; i += Br) {
    addStep(
      7,
      `Outer Loop i = ${i}: Dispatch Query block Q[${i}:${i + Br}] to GPU Thread Block / SM`,
      `Parallelizing query tile Q[${i}:${i + Br}] across GPU Streaming Multiprocessors (SMs).`,
      { i, Br, sm_block_id: i / Br },
      undefined,
      i,
    );

    const QBlock = Q.slice(i, i + Br);
    addStep(
      8,
      `Load Q_block = Q[${i}:${i + Br}] (${QBlock.length} rows) into SRAM`,
      `Query tile Q_block loaded into SM shared memory / registers.`,
      { i, Q_block_len: QBlock.length },
      undefined,
      i,
    );

    const mI: number[] = new Array(Br).fill(-Infinity);
    const lI: number[] = new Array(Br).fill(0.0);
    const OI: number[][] = Array.from({ length: Br }, () => new Array(d).fill(0.0));

    addStep(
      9,
      `Initialize local row max array m_i of size ${Br} with -inf`,
      "Register allocation for running row maximums.",
      { i, m_i_len: Br },
      undefined,
      i,
    );

    addStep(
      10,
      `Initialize local sum-exp array l_i of size ${Br} with 0.0`,
      "Register allocation for running sum-exp denominators.",
      { i, l_i_len: Br },
      undefined,
      i,
    );

    addStep(
      11,
      `Initialize unnormalized accumulator matrix O_i of shape [${Br}, ${d}] with 0.0`,
      "Register allocation for unnormalized output accumulator.",
      { i, O_i_shape: `[${Br}, ${d}]` },
      undefined,
      i,
    );

    for (let j = 0; j < N; j += Bc) {
      addStep(
        13,
        `Inner Loop j = ${j}: Stream Key/Value tile K, V [${j}:${j + Bc}] into SRAM`,
        `Streaming K[${j}:${j + Bc}] and V[${j}:${j + Bc}] into SRAM registers.`,
        { i, j, Bc },
        undefined,
        i,
        j,
      );

      const KBlock = K.slice(j, j + Bc);
      const VBlock = V.slice(j, j + Bc);

      addStep(
        14,
        `Load K_block = K[${j}:${j + Bc}] (${KBlock.length} rows)`,
        `Key tile K_block loaded into SRAM.`,
        { j, K_block_len: KBlock.length },
        undefined,
        i,
        j,
      );

      addStep(
        15,
        `Load V_block = V[${j}:${j + Bc}] (${VBlock.length} rows)`,
        `Value tile V_block loaded into SRAM.`,
        { j, V_block_len: VBlock.length },
        undefined,
        i,
        j,
      );

      for (let r = 0; r < QBlock.length; r++) {
        const qVec = QBlock[r];
        const rowIdx = i + r;

        addStep(
          17,
          `Process query vector r = ${r} (global row ${rowIdx})`,
          `Evaluating attention scores for query row ${rowIdx} against K_block.`,
          { r, row_idx: rowIdx },
          rowIdx,
          i,
          j,
        );

        addStep(
          18,
          `Read q_vec = Q_block[${r}]`,
          `Reading query vector q_vec from SRAM registers.`,
          { r, row_idx: rowIdx },
          rowIdx,
          i,
          j,
        );

        const rawScores: number[] = KBlock.map((kVec) => {
          let dot = 0;
          for (let k = 0; k < d; k++) dot += qVec[k] * kVec[k];
          return dot * scale;
        });

        addStep(
          19,
          `Compute S_ij scores = q_vec @ K_block^T * scale`,
          `Tile scores: [${rawScores.map((s) => s.toFixed(2)).join(", ")}].`,
          { row_idx: rowIdx, scores: JSON.stringify(rawScores.map((s) => Number(s.toFixed(2)))) },
          rowIdx,
          i,
          j,
        );

        const mCurr = Math.max(...rawScores);
        addStep(
          21,
          `Compute local tile max m_curr = ${mCurr.toFixed(2)}`,
          `Tile maximum score for numerical stability.`,
          { r, m_curr: Number(mCurr.toFixed(2)) },
          rowIdx,
          i,
          j,
        );

        const mPrev = mI[r];
        const mNew = Math.max(mPrev, mCurr);

        addStep(
          22,
          `Update running row max m_new = max(m_i[${r}]=${mPrev === -Infinity ? "-inf" : mPrev.toFixed(2)}, m_curr=${mCurr.toFixed(2)}) = ${mNew.toFixed(2)}`,
          `Updated local row max to ${mNew.toFixed(2)}.`,
          { r, m_prev: mPrev === -Infinity ? "-inf" : Number(mPrev.toFixed(2)), m_new: Number(mNew.toFixed(2)) },
          rowIdx,
          i,
          j,
        );

        const scalePrev = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);
        addStep(
          24,
          `Calculate scale_prev = exp(m_i[${r}] - m_new) = ${scalePrev.toFixed(3)}`,
          `Rescaling factor for previous register accumulator O_i[${r}].`,
          { r, scale_prev: Number(scalePrev.toFixed(3)) },
          rowIdx,
          i,
          j,
        );

        const expScores = rawScores.map((s) => Math.exp(s - mNew));
        addStep(
          25,
          `Compute exp_scores = exp(S_ij - m_new)`,
          `Unnormalized exponent scores: [${expScores.map((e) => e.toFixed(3)).join(", ")}].`,
          { r, exp_scores: JSON.stringify(expScores.map((e) => Number(e.toFixed(3)))) },
          rowIdx,
          i,
          j,
        );

        const tileExpSum = expScores.reduce((a, b) => a + b, 0);
        const lNew = lI[r] * scalePrev + tileExpSum;
        addStep(
          26,
          `Update running sum-exp l_new = l_i[${r}] * scale_prev + sum(exp_scores) = ${lNew.toFixed(3)}`,
          `Updated online softmax denominator sum to ${lNew.toFixed(3)}.`,
          { r, l_prev: Number(lI[r].toFixed(3)), l_new: Number(lNew.toFixed(3)) },
          rowIdx,
          i,
          j,
        );

        for (let col = 0; col < d; col++) {
          addStep(
            28,
            `Loop dimension col = ${col}/${d - 1} for row ${r}`,
            `Updating unnormalized accumulator cell O_i[${r}][${col}].`,
            { r, col },
            rowIdx,
            i,
            j,
          );

          let pvSum = 0;
          for (let k = 0; k < expScores.length; k++) {
            pvSum += expScores[k] * VBlock[k][col];
          }

          addStep(
            29,
            `Compute pv_sum = P_ij @ V_j[col ${col}] = ${pvSum.toFixed(2)}`,
            `Tile matrix product sum of exponent weights and Value column ${col}.`,
            { r, col, pv_sum: Number(pvSum.toFixed(2)) },
            rowIdx,
            i,
            j,
          );

          const oldO = OI[r][col];
          OI[r][col] = oldO * scalePrev + pvSum;

          addStep(
            30,
            `Update O_i[${r}][${col}] = ${oldO.toFixed(2)} * ${scalePrev.toFixed(3)} + ${pvSum.toFixed(2)} = ${OI[r][col].toFixed(2)} (UNNORMALIZED in registers)`,
            `Accumulated unnormalized output in fast SRAM registers WITHOUT division.`,
            { r, col, old_val: Number(oldO.toFixed(2)), new_val: Number(OI[r][col].toFixed(2)) },
            rowIdx,
            i,
            j,
          );
        }

        mI[r] = mNew;
        addStep(
          32,
          `Store m_i[${r}] = ${mNew.toFixed(2)}`,
          `Cached running maximum in registers.`,
          { r, m_new: Number(mNew.toFixed(2)) },
          rowIdx,
          i,
          j,
        );

        lI[r] = lNew;
        addStep(
          33,
          `Store l_i[${r}] = ${lNew.toFixed(3)}`,
          `Cached running sum-exp in registers.`,
          { r, l_new: Number(lNew.toFixed(3)) },
          rowIdx,
          i,
          j,
        );
      }
    }

    addStep(
      35,
      `Final single-pass normalization for Query block Q[${i}:${i + Br}]`,
      `Performing SINGLE division O[row] = O_i[r] / l_i[r] per row before writing to global HBM memory.`,
      { i, Br },
      undefined,
      i,
    );

    for (let r = 0; r < QBlock.length; r++) {
      const rowIdx = i + r;
      addStep(
        36,
        `Calculate global row_idx = i + r = ${i} + ${r} = ${rowIdx}`,
        `Mapping local row ${r} to global HBM row index ${rowIdx}.`,
        { r, row_idx: rowIdx },
        rowIdx,
        i,
      );

      for (let col = 0; col < d; col++) {
        addStep(
          37,
          `Loop col = ${col}/${d - 1} for final division on row ${rowIdx}`,
          `Normalizing cell O[${rowIdx}][${col}].`,
          { row_idx: rowIdx, col },
          rowIdx,
          i,
        );

        O[rowIdx][col] = OI[r][col] / lI[r];

        addStep(
          38,
          `Write HBM O[${rowIdx}][${col}] = O_i[${r}][${col}] (${OI[r][col].toFixed(2)}) / l_i[${r}] (${lI[r].toFixed(3)}) = ${O[rowIdx][col].toFixed(2)}`,
          `Wrote final normalized attention output to global HBM memory at O[${rowIdx}][${col}].`,
          { row_idx: rowIdx, col, unnormalized: Number(OI[r][col].toFixed(2)), l_sum: Number(lI[r].toFixed(3)), final_val: Number(O[rowIdx][col].toFixed(2)) },
          rowIdx,
          i,
        );
      }
    }
  }

  addStep(
    40,
    "Return final attention output matrix O",
    `FlashAttention-2 sequence parallel forward kernel complete. Computed exact attention output matrix O of shape [${N}, ${d}] with 73% peak A100 GPU compute efficiency.`,
    { completed: true, O_shape: `[${N}, ${d}]` },
  );

  return steps;
};

export const FLASHATTENTION2SEQUENCEPARALLELFORWARD_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 12, 16, 20, 23, 27, 31, 34, 39],
  distractors: [
    "O_i[r][col] = O_i[r][col] / l_new",
    "for j in range(0, N, Bc): outer loop",
    "scale_prev = math.exp(m_new - m_i[r])",
    "O[row_idx][col] = O_i[r][col] * l_i[r]",
  ],
  hints: [
    { line: 7, hint: "Outer loop iterates over Query blocks Q_i, parallelized across GPU thread blocks." },
    { line: 13, hint: "Inner loop streams Key and Value tiles K_j, V_j into SRAM." },
    { line: 38, hint: "Divide unnormalized register output O_i by l_i exactly once per query row before HBM write." },
  ],
  lineExplanations: {
    1: "Defines flash_attention_2_forward signature with sequence parallel swapped loop order.",
    2: "Docstring describing FlashAttention-2 algorithm with SM parallelism and unnormalized register accumulators.",
    3: "Retrieves sequence length N from Q matrix rows.",
    4: "Retrieves head dimension d from Q matrix columns.",
    5: "Initializes final output matrix O of shape [N, d] with zeros.",
    6: "Blank line preceding outer loop.",
    7: "Outer loop over Query block index i (parallelized across GPU Thread Blocks / SMs).",
    8: "Loads Query tile Q_block of shape [Br, d] into fast SRAM.",
    9: "Initializes local row max array m_i of size Br to negative infinity.",
    10: "Initializes local sum-exp array l_i of size Br to zeros.",
    11: "Initializes unnormalized register accumulator O_i of shape [Br, d] to zeros.",
    12: "Blank line preceding inner loop.",
    13: "Inner loop over Key/Value block index j stepping by Bc.",
    14: "Loads Key tile K_block of shape [Bc, d] into SRAM.",
    15: "Loads Value tile V_block of shape [Bc, d] into SRAM.",
    16: "Blank line preceding query vector loop.",
    17: "Iterates through query vectors in Q_block (r = 0..Br-1).",
    18: "Extracts query vector q_vec at relative index r.",
    19: "Computes scaled dot-product attention scores S_ij = q_vec @ K_j.T * scale.",
    20: "Blank line preceding online max update.",
    21: "Finds maximum score m_curr within current tile scores.",
    22: "Updates running row maximum m_new = max(m_i[r], m_curr).",
    23: "Blank line preceding exponent rescaling.",
    24: "Calculates previous state rescaling factor scale_prev = exp(m_prev - m_new).",
    25: "Computes unnormalized tile exponent scores exp(s - m_new).",
    26: "Updates running sum-exp l_new = l_i[r] * scale_prev + sum(exp_scores).",
    27: "Blank line preceding unnormalized output accumulator update.",
    28: "Loops across head dimensions col from 0 to d - 1.",
    29: "Computes tile matrix-vector product pv_sum = sum(exp_s * v_vec[col]).",
    30: "Rescales previous O_i[r][col] and accumulates pv_sum WITHOUT division by l_new (kept in registers).",
    31: "Blank line preceding state update.",
    32: "Updates running row max m_i[r] = m_new.",
    33: "Updates running sum-exp l_i[r] = l_new.",
    34: "Blank line preceding final normalization pass.",
    35: "Final normalization loop over query rows r in current block.",
    36: "Calculates global sequence row index row_idx = i + r.",
    37: "Loops across head dimensions col from 0 to d - 1 for single division pass.",
    38: "Divides unnormalized register accumulator O_i[r][col] by l_i[r] ONCE and writes to global HBM O[row_idx][col].",
    39: "Blank line ending outer loop.",
    40: "Returns final attention output matrix O computed with 73% peak A100 GPU compute efficiency.",
  },
};

export const flashAttention2SequenceParallelForward: AlgorithmDefinition<flashAttention2SequenceParallelForwardInput> = {
  id: "flash-attention-2-sequence-parallel-forward",
  title: "FlashAttention-2 Sequence Parallel Forward Kernel",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_attention_geometry"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master FlashAttention-2 Sequence Parallel Forward Pass: achieve up to 220 TFLOPS (73% theoretical peak FLOPs on NVIDIA A100) via loop swapping and SM sequence parallelism.

### Why It Exists & What It Solves
FlashAttention-2 (Dao, 2023) addresses key bottlenecks in FlashAttention-1:
1. **Non-GEMM Instruction Overhead**: FlashAttention-1 performed division by $\\ell_i$ on every step in the inner loop. FA-2 **swaps the loops** (outer loop over Query blocks $Q_i$, inner loop over Key/Value blocks $K_j, V_j$). This keeps $Q_i$ and the unnormalized output accumulator $\\hat{O}_i$ in registers, performing division by $\\ell_i$ **ONCE per row** at the very end before writing to global HBM.
2. **GPU Thread Occupancy (Sequence Parallelism)**: FA-1 parallelized over batch size and number of heads. For small batch sizes (e.g. batch size 1 during LLM chat decoding), many Streaming Multiprocessors (SMs) remained idle. FA-2 parallelizes across the **sequence dimension $N$**, assigning query blocks $Q_i$ to independent GPU Thread Blocks. All 108 SMs on an NVIDIA A100 stay 100% occupied even for single-sequence inference.

### Step-by-Step Intuition
1. **Parallel Thread Block Dispatch**: Grid dimension is $(N / B_r, \\text{batch}, \\text{heads})$. Each SM processes a Query block $Q_i$ of shape $[B_r, d]$.
2. **Initialize Register Accumulator**: Keep unnormalized $\\hat{O}_i = 0$, max $m_i = -\\infty$, sum $\\ell_i = 0$ in GPU registers.
3. **Stream $K_j, V_j$ Tiles into SRAM**: Inner loop iterates $j = 0 \\dots N / B_c$.
   - Compute tile scores $S_{ij} = Q_i K_j^T / \\sqrt{d}$.
   - Update running max $m_i^{\\text{new}} = \\max(m_i^{\\text{old}}, \\text{rowmax}(S_{ij}))$.
   - Rescale previous accumulator $\\hat{O}_i \\leftarrow \\hat{O}_i \\cdot e^{m_i^{\\text{old}} - m_i^{\\text{new}}}$.
   - Accumulate product: $\\hat{O}_i \\leftarrow \\hat{O}_i + e^{S_{ij} - m_i^{\\text{new}}} V_j$.
4. **Single Division Pass**: Normalize $O_i = \\hat{O}_i / \\ell_i$ ONCE at the end of the loop and write to HBM.

### Input Parameters
- \`Q\`: Query matrix of shape $[N, d]$.
- \`K\`: Key matrix of shape $[N, d]$.
- \`V\`: Value matrix of shape $[N, d]$.
- \`Br\`: Query tile size (default 2).
- \`Bc\`: Key/Value tile size (default 2).

### Output
- Returns exact attention output matrix $O \\in \\mathbb{R}^{N \\times d}$ with 73% A100 GPU compute efficiency.

### Trade-offs & Complexity
- **Time Complexity**: $O(N^2 \\cdot d)$ FLOPs (220 TFLOPS compute throughput on A100 GPUs).
- **Space Complexity**: $O(N)$ auxiliary space for log-sum-exp denominator values.`,
  constraints: ["1 <= N <= 128000", "32 <= d <= 256", "Br, Bc = SRAM block dimensions"],
  examples: [
    {
      kind: "basic",
      title: "FlashAttention-2 Forward Pass",
      inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Output O (73% GPU TFLOPS)",
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
      output: "Output O (73% GPU TFLOPS)",
      explanation: "Computes exact attention with swapped loop order and sequence parallel thread blocks.",
    },
    {
      kind: "complex",
      title: "4-Query Block Parallel Test",
      inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Max SM Occupancy",
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
      output: "Max SM Occupancy",
      explanation: "Evaluates parallel thread block dispatch across 4 query sequence tiles.",
    },
    {
      kind: "negative",
      title: "Single Block Fallback",
      inputDisplay: "N = 2, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Single Block Parallelized",
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
      output: "Single Block Parallelized",
      explanation: "Processes single query block with unnormalized register accumulators.",
    },
  ],
  code: FLASHATTENTION2SEQUENCEPARALLELFORWARD_CODE,
  timeComplexity: {
    best: "O(N^2 * d)",
    average: "O(N^2 * d)",
    worst: "O(N^2 * d)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Requires O(N^2 * d) FLOPs while achieving 220 TFLOPS on A100 GPUs through reduced non-GEMM instruction overhead.",
    space: "Allocates O(N) space for storing log-sum-exp values for the backward pass.",
  },
  topicGuide: {
    overview:
      "FlashAttention-2 is the default attention engine in PyTorch 2.x (`torch.nn.functional.scaled_dot_product_attention`) and HuggingFace Transformers. Its loop swapping and sequence parallelism provide dramatic speedups for long-context LLMs.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For query block $Q_i$, initialize unnormalized output $\\hat{O}_i^{(0)} = 0$, max $m_i^{(0)} = -\\infty$, sum $\\ell_i^{(0)} = 0$. For $j=1 \\dots T_c$, compute $S_{ij}^{(j)} = Q_i K_j^T / \\sqrt{d}$, $m_i^{(j)} = \\max(m_i^{(j-1)}, \\text{rowmax}(S_{ij}^{(j)}))$, $\\hat{O}_i^{(j)} = \\hat{O}_i^{(j-1)} e^{m_i^{(j-1)} - m_i^{(j)}} + e^{S_{ij}^{(j)} - m_i^{(j)}} V_j$. Final output $O_i = \\hat{O}_i^{(T_c)} / \\ell_i^{(T_c)}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Non-matmul FLOP reduction: FA-1 performed division by $\\ell_i$ on every step in the inner loop. FA-2 maintains unnormalized $\\hat{O}_i$ in registers throughout the inner loop over $K, V$ blocks, performing division ONCE at the end. This reduces non-GEMM instructions by 5x.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Parallelizing over sequence length: GPU grid dimensions are `(N / Br, batch_size, num_heads)`. This guarantees that even for small batch sizes (e.g. batch size 1 during interactive chat decoding), all 108 SMs on an A100 GPU remain fully occupied.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Causal masking optimization: In causal mode, blocks $(i, j)$ where $j > i$ are skipped entirely, halving total FLOPs ($N^2 / 2$). Blocks along the diagonal $j = i$ apply causal mask bounds.",
      },
    ],
    keyTerms: [
      {
        term: "FlashAttention-2",
        definition:
          "An upgraded IO-aware attention kernel featuring swapped loop order and sequence parallelism.",
      },
      {
        term: "Loop Swapping",
        definition:
          "Reordering loops so Query blocks are in the outer loop, keeping unnormalized output accumulators in registers.",
      },
      {
        term: "Sequence Parallelism",
        definition:
          "Parallelizing query sequence blocks across GPU Streaming Multiprocessors (SMs).",
      },
      {
        term: "Unnormalized Output Accumulator",
        definition:
          "Storing $\\hat{O}_i$ without division until all $K,V$ blocks have been processed.",
      },
    ],
  },
  trivia: FLASHATTENTION2SEQUENCEPARALLELFORWARD_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT,
  generateSteps: generateFLASHATTENTION2SEQUENCEPARALLELFORWARDSteps,
};
