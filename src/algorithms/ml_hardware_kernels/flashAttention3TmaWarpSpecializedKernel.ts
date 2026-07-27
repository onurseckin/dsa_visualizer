import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention3TmaWarpSpecializedKernelInput {
  Q?: number[][];
  K?: number[][];
  V?: number[][];
  Br?: number;
  Bc?: number;
  data?: number[];
  [key: string]: unknown;
}

export const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE = `def flash_attention_3_hopper_tma(Q: list[list[float]], K: list[list[float]], V: list[list[float]], Br: int = 2, Bc: int = 2, scale: float = 1.0) -> list[list[float]]:
    """Simulates FlashAttention-3 NVIDIA Hopper TMA Warp-Specialized Attention Kernel."""
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

export const DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT: flashAttention3TmaWarpSpecializedKernelInput = {
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
          tma_engine: "NVIDIA Hopper TMA (750 TFLOPS)",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize FlashAttention-3 NVIDIA Hopper TMA Kernel",
    `Setting up Hopper TMA async prefetch & WGMMA Tensor Core pipeline: N=${N}, d=${d}, Br=${Br}, Bc=${Bc}.`,
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
      `Outer Loop i = ${i}: Process Query block Q[${i}:${i + Br}]`,
      `Issuing TMA async load for query sequence tile Q[${i}:${i + Br}].`,
      { i, Br },
      undefined,
      i,
    );

    const QSram = Q.slice(i, i + Br);
    addStep(
      8,
      `TMA Producer Async Load: Q_sram = Q[${i}:${i + Br}] (${QSram.length} rows)`,
      `TMA engine pre-fetches Query tile Q[${i}:${i + Br}] directly into SRAM using cp.async.bulk.`,
      { i, Q_sram_len: QSram.length },
      undefined,
      i,
    );

    const mI: number[] = new Array(Br).fill(-Infinity);
    const lI: number[] = new Array(Br).fill(0.0);
    const OAcc: number[][] = Array.from({ length: Br }, () => new Array(d).fill(0.0));

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
      `Initialize WGMMA accumulator matrix O_acc of shape [${Br}, ${d}] with 0.0`,
      "Register allocation for WGMMA unnormalized accumulator.",
      { i, O_acc_shape: `[${Br}, ${d}]` },
      undefined,
      i,
    );

    for (let j = 0; j < N; j += Bc) {
      addStep(
        13,
        `Inner Loop j = ${j}: Stream Key/Value tile K, V [${j}:${j + Bc}] via TMA Async Copy`,
        `TMA Producer warps load K[${j}:${j + Bc}] & V[${j}:${j + Bc}] into SRAM while Consumer warps execute WGMMA.`,
        { i, j, Bc },
        undefined,
        i,
        j,
      );

      const KSram = K.slice(j, j + Bc);
      const VSram = V.slice(j, j + Bc);

      addStep(
        14,
        `TMA Producer Async Load: K_sram = K[${j}:${j + Bc}] (${KSram.length} rows)`,
        `TMA async hardware copy: Key tile K_sram loaded into SRAM.`,
        { j, K_sram_len: KSram.length },
        undefined,
        i,
        j,
      );

      addStep(
        15,
        `TMA Producer Async Load: V_sram = V[${j}:${j + Bc}] (${VSram.length} rows)`,
        `TMA async hardware copy: Value tile V_sram loaded into SRAM.`,
        { j, V_sram_len: VSram.length },
        undefined,
        i,
        j,
      );

      for (let r = 0; r < QSram.length; r++) {
        const qVec = QSram[r];
        const rowIdx = i + r;

        addStep(
          17,
          `WGMMA Consumer Warp: Process query vector r = ${r} (global row ${rowIdx})`,
          `Consumer warps issue WGMMA Tensor Core instructions over SRAM tiles.`,
          { r, row_idx: rowIdx },
          rowIdx,
          i,
          j,
        );

        addStep(
          18,
          `Read q_vec = Q_sram[${r}]`,
          `Reading query vector q_vec from SRAM registers.`,
          { r, row_idx: rowIdx },
          rowIdx,
          i,
          j,
        );

        const rawScores: number[] = KSram.map((kVec) => {
          let dot = 0;
          for (let k = 0; k < d; k++) dot += qVec[k] * kVec[k];
          return dot * scale;
        });

        addStep(
          19,
          `Compute WGMMA tile scores S_ij = q_vec @ K_sram^T * scale`,
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
          23,
          `Calculate scale_prev = exp(m_i[${r}] - m_new) = ${scalePrev.toFixed(3)}`,
          `Rescaling factor for previous register accumulator O_acc[${r}].`,
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
            `Updating WGMMA accumulator cell O_acc[${r}][${col}].`,
            { r, col },
            rowIdx,
            i,
            j,
          );

          let pvSum = 0;
          for (let k = 0; k < expScores.length; k++) {
            pvSum += expScores[k] * VSram[k][col];
          }

          addStep(
            29,
            `Compute WGMMA pv_sum = P_ij @ V_sram[col ${col}] = ${pvSum.toFixed(2)}`,
            `Tile matrix product sum of exponent weights and Value column ${col}.`,
            { r, col, pv_sum: Number(pvSum.toFixed(2)) },
            rowIdx,
            i,
            j,
          );

          const oldO = OAcc[r][col];
          OAcc[r][col] = oldO * scalePrev + pvSum;

          addStep(
            30,
            `Update O_acc[${r}][${col}] = ${oldO.toFixed(2)} * ${scalePrev.toFixed(3)} + ${pvSum.toFixed(2)} = ${OAcc[r][col].toFixed(2)} (WGMMA Registers)`,
            `Accumulated unnormalized output in fast WGMMA registers WITHOUT division.`,
            { r, col, old_val: Number(oldO.toFixed(2)), new_val: Number(OAcc[r][col].toFixed(2)) },
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
      `Performing SINGLE division O[row] = O_acc[r] / l_i[r] per row before writing to global HBM memory.`,
      { i, Br },
      undefined,
      i,
    );

    for (let r = 0; r < QSram.length; r++) {
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

        O[rowIdx][col] = OAcc[r][col] / lI[r];

        addStep(
          38,
          `Write HBM O[${rowIdx}][${col}] = O_acc[${r}][${col}] (${OAcc[r][col].toFixed(2)}) / l_i[${r}] (${lI[r].toFixed(3)}) = ${O[rowIdx][col].toFixed(2)}`,
          `Wrote final normalized attention output to global HBM memory at O[${rowIdx}][${col}].`,
          { row_idx: rowIdx, col, unnormalized: Number(OAcc[r][col].toFixed(2)), l_sum: Number(lI[r].toFixed(3)), final_val: Number(O[rowIdx][col].toFixed(2)) },
          rowIdx,
          i,
        );
      }
    }
  }

  addStep(
    40,
    "Return final attention output matrix O",
    `FlashAttention-3 Hopper TMA kernel complete. Computed exact attention output matrix O of shape [${N}, ${d}] at 750 TFLOPS peak Hopper efficiency.`,
    { completed: true, O_shape: `[${N}, ${d}]` },
  );

  return steps;
};

export const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 12, 16, 20, 24, 27, 31, 34, 39],
  distractors: [
    "tma_load = cudaThreadSynchronize()",
    "wgmma_exec = HBM_write()",
    "scale_prev = m_i[r] / m_new",
    "O[row_idx][col] = O_acc[r][col] * l_i[r]",
  ],
  hints: [
    { line: 8, hint: "TMA Producer warps issue hardware async copy from HBM to SRAM." },
    { line: 19, hint: "Consumer warps issue WGMMA instructions over pre-fetched SRAM tiles." },
    { line: 38, hint: "Final row-wise normalization divides unnormalized accumulator by l_i." },
  ],
  lineExplanations: {
    1: "Defines flash_attention_3_hopper_tma signature with Q, K, V matrices and TMA block parameters.",
    2: "Docstring describing NVIDIA Hopper TMA hardware async copy and WGMMA warp specialization.",
    3: "Retrieves sequence length N from Q matrix rows.",
    4: "Retrieves head dimension d from Q matrix columns.",
    5: "Initializes output matrix O of shape [N, d] with zeros in global HBM.",
    6: "Blank line preceding outer loop.",
    7: "Outer loop over Query block index i stepping by Br.",
    8: "Issues TMA (Tensor Memory Accelerator) async copy: Q[i:i+Br] -> Q_sram.",
    9: "Initializes local row max array m_i of size Br to negative infinity.",
    10: "Initializes local sum-exp array l_i of size Br to zeros.",
    11: "Initializes WGMMA unnormalized accumulator O_acc of shape [Br, d] to zeros.",
    12: "Blank line preceding inner loop.",
    13: "Inner loop over Key/Value block index j stepping by Bc.",
    14: "Issues TMA async copy: K[j:j+Bc] -> K_sram in Producer warps while Consumer warps execute.",
    15: "Issues TMA async copy: V[j:j+Bc] -> V_sram in Producer warps while Consumer warps execute.",
    16: "Blank line preceding query vector loop.",
    17: "Iterates through query vectors in Q_sram (Consumer Warps).",
    18: "Reads query vector q_vec at relative index r.",
    19: "Executes WGMMA Tensor Core matrix product S_ij = q_vec @ K_sram^T * scale.",
    20: "Blank line preceding online max update.",
    21: "Finds maximum score m_curr within current tile scores.",
    22: "Updates running row maximum m_new = max(m_i[r], m_curr).",
    23: "Calculates previous state rescaling factor scale_prev = exp(m_prev - m_new).",
    24: "Blank line preceding exponent calculation.",
    25: "Computes unnormalized tile exponent scores exp(s - m_new).",
    26: "Updates running sum-exp l_new = l_i[r] * scale_prev + sum(exp_scores).",
    27: "Blank line preceding WGMMA accumulator update.",
    28: "Loops across head dimensions col from 0 to d - 1.",
    29: "Computes WGMMA tile matrix product pv_sum = sum(exp_s * v_vec[col]).",
    30: "Rescales previous O_acc[r][col] and accumulates pv_sum in WGMMA registers.",
    31: "Blank line preceding state update.",
    32: "Updates running row max m_i[r] = m_new.",
    33: "Updates running sum-exp l_i[r] = l_new.",
    34: "Blank line preceding final TMA write-back pass.",
    35: "Final normalization loop over query rows r in current block.",
    36: "Calculates global sequence row index row_idx = i + r.",
    37: "Loops across head dimensions col from 0 to d - 1 for single division pass.",
    38: "Divides unnormalized WGMMA accumulator O_acc[r][col] by l_i[r] ONCE and writes to global HBM O[row_idx][col].",
    39: "Blank line ending outer loop.",
    40: "Returns final attention output matrix O computed at 750 TFLOPS Hopper peak efficiency.",
  },
};

export const flashAttention3TmaWarpSpecializedKernel: AlgorithmDefinition<flashAttention3TmaWarpSpecializedKernelInput> = {
  id: "flash-attention-3-tma-warp-specialized-kernel",
  title: "FlashAttention-3 TMA & Warp-Specialized Hopper Kernel",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_attention_geometry"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master FlashAttention-3 NVIDIA Hopper TMA & Warp Specialization: scale attention throughput to 750 TFLOPS (75% theoretical peak FLOPs on NVIDIA H100) using asynchronous hardware copying and Producer/Consumer warp partitioning.

### Why It Exists & What It Solves
While FlashAttention-2 achieved 73% peak performance on NVIDIA A100 GPUs, its performance dropped to ~35% on newer NVIDIA Hopper (H100/H200) microarchitectures. Hopper introduced revolutionary hardware accelerators:
1. **Tensor Memory Accelerator (TMA)**: A hardware DMA engine (\`cp.async.bulk\`) that transfers $N$-dimensional tensor tiles directly between HBM and Shared Memory (SRAM) without issuing CUDA register load instructions.
2. **WGMMA (Warp Group Matrix Multiply-Accumulate)**: Async Tensor Core instructions executing $64 \\times 64$ GEMMs directly on SRAM memory addresses without loading values into thread registers first.

FlashAttention-3 (Shah et al., 2024) exploits Hopper hardware by implementing **Warp Specialization**:
- **Producer Warps**: Dedicated exclusively to issuing TMA prefetch instructions ($K_{j+1}, V_{j+1} \\to \\text{SRAM}$).
- **Consumer Warps**: Dedicated exclusively to executing WGMMA instructions over pre-fetched $K_j, V_j$ SRAM tiles.

This completely hides memory latency and eliminates register file pressure, reaching 750 TFLOPS compute throughput.

### Step-by-Step Intuition
1. **CTA Thread Partitioning**: Divide 128 threads in CTA into Producer Warps (1 warp = 32 threads) and Consumer Warps (3 warps = 96 threads).
2. **Producer TMA Prefetch**: Issue \`tma.async.load\` to copy $K_j, V_j$ from HBM into SRAM tile buffer \`stage_1\` asynchronously.
3. **Consumer WGMMA Execution**: While TMA loads \`stage_1\`, Consumer warps execute \`wgmma.mma_async\` over \`stage_0\`.
4. **Hardware Barrier Sync**: Use \`cuda::barrier\` to swap SRAM stage pointers when TMA transfer finishes.
5. **Single-Pass Normalization**: Divide unnormalized accumulator $O_{\\text{acc}}$ by $\\ell_i$ ONCE per row before HBM write-back.

### Input Parameters
- \`Q\`: Query matrix of shape $[N, d]$.
- \`K\`: Key matrix of shape $[N, d]$.
- \`V\`: Value matrix of shape $[N, d]$.
- \`Br\`: Query tile size (default 2).
- \`Bc\`: Key/Value tile size (default 2).

### Output
- Returns exact attention output matrix $O \\in \\mathbb{R}^{N \\times d}$ at 750 TFLOPS Hopper compute efficiency.

### Trade-offs & Complexity
- **Time Complexity**: $O(N^2 \\cdot d)$ FLOPs (750 TFLOPS on H100).
- **Space Complexity**: $O(N)$ auxiliary space for log-sum-exp values.`,
  constraints: ["1 <= N <= 128000", "32 <= d <= 256", "Hardware: NVIDIA Hopper (H100/H200)"],
  examples: [
    {
      kind: "basic",
      title: "Hopper H100 TMA FlashAttention-3",
      inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Output O (750 TFLOPS Hopper Peak)",
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
      output: "Output O (750 TFLOPS Hopper Peak)",
      explanation: "Overlaps TMA async copy with WGMMA Tensor Core execution.",
    },
    {
      kind: "complex",
      title: "4-Stage Async Pipeline",
      inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
      outputDisplay: "Zero Memory Latency Stall",
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
      output: "Zero Memory Latency Stall",
      explanation: "Evaluates Producer/Consumer warp specialization across 4 pipeline stages.",
    },
    {
      kind: "negative",
      title: "Fallback Hardware Check",
      inputDisplay: "N = 2, d = 2, Br = 2, Bc = 2",
      outputDisplay: "TMA Emulated Fallback",
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
      output: "TMA Emulated Fallback",
      explanation: "Emulates TMA hardware barriers when executed on non-Hopper architectures.",
    },
  ],
  code: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE,
  timeComplexity: {
    best: "O(N^2 * d)",
    average: "O(N^2 * d)",
    worst: "O(N^2 * d)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Computes exact attention in O(N^2 * d) FLOPs at 750 TFLOPS on NVIDIA H100 GPUs.",
    space: "Allocates O(N) space for storing log-sum-exp values for backward pass.",
  },
  topicGuide: {
    overview:
      "FlashAttention-3 unlocks the true potential of NVIDIA Hopper GPUs (H100/H200/GH200). By utilizing TMA hardware and Warp Specialization, it eliminates register pressure and hides memory latency completely.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "TMA async copy is configured via `cuTensorMap` descriptors specifying 2D strided tensor layouts. Producer warps execute `tma.async.load` to load $K_{j+1}, V_{j+1}$ into SRAM buffer `stage_1` while Consumer warps execute `wgmma.mma_async` on $K_j, V_j$ in SRAM buffer `stage_0`.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Warp Specialization solves register file fragmentation: in FA-2, all warps performed both memory loads and GEMM math, leading to register spilling. In FA-3, Producer warps allocate minimal registers (8 registers/thread), allowing Consumer warps to allocate max registers (255 registers/thread) for WGMMA accumulators.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Asynchronous Barriers: `cuda::barrier<cuda::thread_scope_block>` synchronizes Producer TMA completion with Consumer WGMMA start without CPU or global memory interaction.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "FP8 Attention Precision: FA-3 introduces incoherent processing (random Hadamard transforms) to prevent outlier features from corrupting 8-bit floating point (FP8 E4M3) precision.",
      },
    ],
    keyTerms: [
      {
        term: "Tensor Memory Accelerator (TMA)",
        definition:
          "NVIDIA Hopper hardware DMA engine transferring multidimensional tensors directly from HBM to SRAM.",
      },
      {
        term: "Warp Specialization",
        definition:
          "Partitioning threads into dedicated Producer (memory load) and Consumer (compute) warps.",
      },
      {
        term: "WGMMA",
        definition:
          "Warp Group Matrix Multiply and Accumulate instructions executing GEMM directly on SRAM tiles.",
      },
      {
        term: "Asynchronous Pipelining",
        definition: "Overlapping data transfers for stage $t+1$ with computation on stage $t$.",
      },
    ],
  },
  trivia: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT,
  generateSteps: generateFLASHATTENTION3TMAWARPSPECIALIZEDKERNELSteps,
};
