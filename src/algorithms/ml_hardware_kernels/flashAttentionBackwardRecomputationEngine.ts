import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttentionBackwardRecomputationEngineInput {
  Q?: number[][];
  K?: number[][];
  V?: number[][];
  O?: number[][];
  dO?: number[][];
  L?: number[];
  data?: number[];
  [key: string]: unknown;
}

export const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE = `def flash_attention_backward_recompute(Q: list[list[float]], K: list[list[float]], V: list[list[float]], O: list[list[float]], dO: list[list[float]], L: list[float], scale: float = 1.0) -> tuple[list[list[float]], list[list[float]], list[list[float]]]:
    """Simulates FlashAttention backward pass with on-the-fly attention score recomputation."""
    N = len(Q)
    d = len(Q[0])

    dQ = [[0.0] * d for _ in range(N)]
    dK = [[0.0] * d for _ in range(N)]
    dV = [[0.0] * d for _ in range(N)]

    D = [sum(do * o for do, o in zip(dO[i], O[i])) for i in range(N)]

    for i in range(N):
        for j in range(N):
            s_ij = sum(q * k for q, k in zip(Q[i], K[j])) * scale
            p_ij = math.exp(s_ij - L[i])

            for col in range(d):
                dV[j][col] += p_ij * dO[i][col]

            dp_ij = sum(do * v for do, v in zip(dO[i], V[j]))
            ds_ij = p_ij * (dp_ij - D[i])

            for col in range(d):
                dQ[i][col] += scale * ds_ij * K[j][col]
                dK[j][col] += scale * ds_ij * Q[i][col]

    return dQ, dK, dV`;

export const DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT: flashAttentionBackwardRecomputationEngineInput = {
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
  O: [
    [10.0, 20.0],
    [30.0, 40.0],
    [40.0, 50.0],
    [35.0, 45.0],
  ],
  dO: [
    [0.1, 0.2],
    [0.3, 0.4],
    [0.1, 0.1],
    [0.2, 0.2],
  ],
  L: [2.3, 3.7, 4.1, 3.8],
};

export const generateFLASHATTENTIONBACKWARDRECOMPUTATIONENGINESteps = (
  input: flashAttentionBackwardRecomputationEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Q = input.Q || DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT.Q!;
  const K = input.K || DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT.K!;
  const V = input.V || DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT.V!;
  const O = input.O || DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT.O!;
  const dO = input.dO || DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT.dO!;
  const L = input.L || DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT.L!;

  const N = Q.length;
  const d = Q[0].length;
  const scale = 1.0 / Math.sqrt(d);

  const dQ: number[][] = Array.from({ length: N }, () => new Array(d).fill(0.0));
  const dK: number[][] = Array.from({ length: N }, () => new Array(d).fill(0.0));
  const dV: number[][] = Array.from({ length: N }, () => new Array(d).fill(0.0));

  const createMatrixSnapshot = (
    activeI?: number,
    activeJ?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < N; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < d; c++) {
        const val = Number(dQ[r][c].toFixed(3));
        let state: MatrixCellItem["state"] = "default";
        if (activeI === r) {
          state = "active";
        } else if (activeJ === r) {
          state = "compared";
        } else if (val !== 0) {
          state = "sorted";
        }

        rowItems.push({
          row: r,
          col: c,
          value: val,
          label: `dQ[${r}][${c}]=${val}`,
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
    activeI?: number,
    activeJ?: number,
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
        cells: createMatrixSnapshot(activeI, activeJ),
      },
      auxiliaryState: {
        customState: customState ?? {
          recomputation: "on-the-fly SRAM registers",
          scale: scale.toFixed(3),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize FlashAttention Backward Recomputation Engine",
    `Setting up backward pass: N=${N}, d=${d}, scale=${scale.toFixed(3)}. Reading saved log-sum-exp vector L.`,
    { N, d, scale },
  );

  addStep(
    3,
    `Read N = len(Q) = ${N}`,
    `Storing sequence length N=${N}.`,
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
    `Initialize Query gradient matrix dQ of shape [${N}, ${d}] with 0.0`,
    "Allocating dQ gradient accumulator matrix.",
    { dQ_shape: `[${N}, ${d}]` },
  );

  addStep(
    7,
    `Initialize Key gradient matrix dK of shape [${N}, ${d}] with 0.0`,
    "Allocating dK gradient accumulator matrix.",
    { dK_shape: `[${N}, ${d}]` },
  );

  addStep(
    8,
    `Initialize Value gradient matrix dV of shape [${N}, ${d}] with 0.0`,
    "Allocating dV gradient accumulator matrix.",
    { dV_shape: `[${N}, ${d}]` },
  );

  const D: number[] = new Array(N).fill(0);
  for (let r = 0; r < N; r++) {
    let dot = 0;
    for (let c = 0; c < d; c++) {
      dot += dO[r][c] * O[r][c];
    }
    D[r] = dot;
  }

  addStep(
    10,
    `Compute Softmax backward row scalar D = sum(dO * O) across ${N} rows`,
    `Row scalar reduction values: [${D.map((v) => v.toFixed(3)).join(", ")}].`,
    { D_values: JSON.stringify(D.map((v) => Number(v.toFixed(3)))) },
  );

  for (let i = 0; i < N; i++) {
    addStep(
      12,
      `Outer Loop i = ${i}/${N - 1}: Process Query row Q[${i}]`,
      `Backpropagating gradients for Query row ${i}.`,
      { i },
      i,
    );

    for (let j = 0; j < N; j++) {
      addStep(
        13,
        `Inner Loop j = ${j}/${N - 1}: Process Key/Value row K[${j}], V[${j}]`,
        `Recomputing attention score P[${i}][${j}] between query ${i} and key ${j}.`,
        { i, j },
        i,
        j,
      );

      let dotQK = 0;
      for (let k = 0; k < d; k++) dotQK += Q[i][k] * K[j][k];
      const sIJ = dotQK * scale;

      addStep(
        14,
        `Recompute raw score s_ij = Q[${i}] @ K[${j}]^T * scale = ${sIJ.toFixed(3)}`,
        `On-the-fly recomputation of score s_${i}${j} in SRAM registers without DRAM access.`,
        { i, j, s_ij: Number(sIJ.toFixed(3)) },
        i,
        j,
      );

      const pIJ = Math.exp(sIJ - L[i]);
      addStep(
        15,
        `Recompute probability p_ij = exp(s_ij - L[${i}]) = exp(${sIJ.toFixed(3)} - ${L[i].toFixed(2)}) = ${pIJ.toFixed(4)}`,
        `Recomputed exact attention probability p_${i}${j} in SRAM.`,
        { i, j, s_ij: Number(sIJ.toFixed(3)), L_i: Number(L[i].toFixed(2)), p_ij: Number(pIJ.toFixed(4)) },
        i,
        j,
      );

      for (let col = 0; col < d; col++) {
        addStep(
          17,
          `Loop col = ${col}/${d - 1} for dV[${j}] gradient accumulation`,
          `Updating Value gradient cell dV[${j}][${col}].`,
          { i, j, col },
          i,
          j,
        );

        const dVInc = pIJ * dO[i][col];
        dV[j][col] += dVInc;

        addStep(
          18,
          `Accumulate dV[${j}][${col}] += p_ij * dO[${i}][${col}] -> +${dVInc.toFixed(3)} = ${dV[j][col].toFixed(3)}`,
          `Value matrix gradient accumulated for cell (${j}, ${col}).`,
          { j, col, inc: Number(dVInc.toFixed(3)), dV_val: Number(dV[j][col].toFixed(3)) },
          i,
          j,
        );
      }

      let dpIJ = 0;
      for (let k = 0; k < d; k++) dpIJ += dO[i][k] * V[j][k];

      addStep(
        20,
        `Compute dp_ij = dO[${i}] @ V[${j}]^T = ${dpIJ.toFixed(3)}`,
        `Product of output gradient dO[${i}] and Value vector V[${j}].`,
        { i, j, dp_ij: Number(dpIJ.toFixed(3)) },
        i,
        j,
      );

      const dsIJ = pIJ * (dpIJ - D[i]);
      addStep(
        21,
        `Compute Softmax logit gradient ds_ij = p_ij * (dp_ij - D[${i}]) = ${pIJ.toFixed(4)} * (${dpIJ.toFixed(3)} - ${D[i].toFixed(3)}) = ${dsIJ.toFixed(4)}`,
        `Logit score gradient ds_${i}${j} calculated for backpropagation.`,
        { i, j, p_ij: Number(pIJ.toFixed(4)), dp_ij: Number(dpIJ.toFixed(3)), D_i: Number(D[i].toFixed(3)), ds_ij: Number(dsIJ.toFixed(4)) },
        i,
        j,
      );

      for (let col = 0; col < d; col++) {
        addStep(
          23,
          `Loop col = ${col}/${d - 1} for dQ[${i}] and dK[${j}] accumulation`,
          `Updating Query gradient cell dQ[${i}][${col}] and Key gradient cell dK[${j}][${col}].`,
          { i, j, col },
          i,
          j,
        );

        const dQInc = scale * dsIJ * K[j][col];
        dQ[i][col] += dQInc;

        addStep(
          24,
          `Accumulate dQ[${i}][${col}] += scale * ds_ij * K[${j}][${col}] -> +${dQInc.toFixed(4)} = ${dQ[i][col].toFixed(3)}`,
          `Query matrix gradient accumulated for cell (${i}, ${col}).`,
          { i, col, inc: Number(dQInc.toFixed(4)), dQ_val: Number(dQ[i][col].toFixed(3)) },
          i,
          j,
        );

        const dKInc = scale * dsIJ * Q[i][col];
        dK[j][col] += dKInc;

        addStep(
          25,
          `Accumulate dK[${j}][${col}] += scale * ds_ij * Q[${i}][${col}] -> +${dKInc.toFixed(4)} = ${dK[j][col].toFixed(3)}`,
          `Key matrix gradient accumulated for cell (${j}, ${col}).`,
          { j, col, inc: Number(dKInc.toFixed(4)), dK_val: Number(dK[j][col].toFixed(3)) },
          i,
          j,
        );
      }
    }
  }

  addStep(
    27,
    "Return gradient matrices (dQ, dK, dV)",
    `FlashAttention backward pass complete. Successfully computed exact gradients dQ, dK, dV of shape [${N}, ${d}] with zero $O(N^2)$ DRAM activation memory storage.`,
    { completed: true, dQ_shape: `[${N}, ${d}]`, dK_shape: `[${N}, ${d}]`, dV_shape: `[${N}, ${d}]` },
  );

  return steps;
};

export const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 9, 11, 16, 19, 22, 26],
  distractors: [
    "p_ij = math.exp(s_ij)",
    "ds_ij = dp_ij - D[i]",
    "dQ[i][col] = ds_ij * V[j][col]",
    "D[i] = sum(O[i])",
  ],
  hints: [
    { line: 10, hint: "Compute Softmax backward row scalar D_i = sum(dO_i * O_i)." },
    { line: 15, hint: "Recompute exact Softmax probability P_ij = exp(S_ij - L_i) in SRAM registers." },
    { line: 21, hint: "Calculate logit gradient dS_ij = P_ij * (dP_ij - D_i)." },
  ],
  lineExplanations: {
    1: "Defines flash_attention_backward_recompute signature with Q, K, V, O, dO tensors and L vector.",
    2: "Docstring describing FlashAttention backward recomputation engine.",
    3: "Retrieves sequence length N from Q matrix rows.",
    4: "Retrieves head dimension d from Q matrix columns.",
    5: "Blank line preceding gradient tensor allocation.",
    6: "Initializes Query gradient matrix dQ of shape [N, d] with zeros.",
    7: "Initializes Key gradient matrix dK of shape [N, d] with zeros.",
    8: "Initializes Value gradient matrix dV of shape [N, d] with zeros.",
    9: "Blank line preceding row scalar reduction D.",
    10: "Computes Softmax backward row scalar D_i = sum(dO_i * O_i) for each row i.",
    11: "Blank line preceding outer loop over i.",
    12: "Outer loop over Query row index i from 0 to N - 1.",
    13: "Inner loop over Key/Value row index j from 0 to N - 1.",
    14: "Recomputes raw attention score s_ij = Q[i] @ K[j]^T * scale in SRAM registers.",
    15: "Recomputes exact attention probability p_ij = exp(s_ij - L[i]) in SRAM registers.",
    16: "Blank line preceding Value gradient update.",
    17: "Loops across head dimensions col from 0 to d - 1 for dV accumulation.",
    18: "Accumulates Value gradient dV[j][col] += p_ij * dO[i][col].",
    19: "Blank line preceding Softmax gradient calculation.",
    20: "Computes output-value dot product dp_ij = dO[i] @ V[j]^T.",
    21: "Calculates Softmax logit gradient ds_ij = p_ij * (dp_ij - D[i]).",
    22: "Blank line preceding dQ and dK gradient updates.",
    23: "Loops across head dimensions col from 0 to d - 1 for dQ and dK accumulation.",
    24: "Accumulates Query gradient dQ[i][col] += scale * ds_ij * K[j][col].",
    25: "Accumulates Key gradient dK[j][col] += scale * ds_ij * Q[i][col].",
    26: "Blank line ending loops.",
    27: "Returns computed gradient matrices (dQ, dK, dV) without materializing N x N HBM attention matrix.",
  },
};

export const flashAttentionBackwardRecomputationEngine: AlgorithmDefinition<flashAttentionBackwardRecomputationEngineInput> = {
  id: "flash-attention-backward-recomputation-engine",
  title: "FlashAttention Backward Recomputation Engine",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_autograd_dags"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master FlashAttention Backward Pass Recomputation: eliminate $O(N^2)$ activation memory allocations during LLM training by recomputing attention probabilities $P_{ij}$ on-the-fly in SRAM registers.

### Why It Exists & What It Solves
In standard PyTorch autograd, training LLMs requires saving all intermediate forward activations—including the $N \\times N$ attention weight matrix $P = \\text{Softmax}(Q K^T / \\sqrt{d})$—in GPU High Bandwidth Memory (HBM) during the forward pass to evaluate backward gradients $dQ, dK, dV$. For long contexts ($N = 32{,}000$ or $128{,}000$), saving $P$ requires tens or hundreds of gigabytes of DRAM memory per GPU, causing out-of-memory (OOM) crashes.

FlashAttention Backward Recomputation Engine eliminates the $O(N^2)$ activation memory bottleneck. During the forward pass, it saves ONLY the $O(N)$ log-sum-exp vector $L_i = m_i + \\ln \\ell_i$. During the backward pass, tiles of $Q, K, V$ are re-loaded into fast SRAM, and attention probabilities are **recomputed on-the-fly** in SRAM registers:
$$P_{ij} = \\exp\\left(\\frac{Q_i K_j^T}{\\sqrt{d}} - L_i\\right)$$

The exact gradients are then calculated via the Softmax derivative:
$$dS_{ij} = P_{ij} \\left(dP_{ij} - D_i\\right), \\quad \\text{where } D_i = \\sum_{c} dO_{i,c} \\cdot O_{i,c}$$

This trades cheap FLOPs (re-evaluating $P_{ij}$ in fast SRAM) for expensive DRAM memory reads, achieving a 2.5x speedup and enabling training of 100k+ token context windows on standard GPU clusters.

### Step-by-Step Intuition
1. **Pre-compute Row Scalar $D_i$**: Compute $D_i = \\sum_c dO_{i,c} \\cdot O_{i,c}$ for each row $i=0 \\dots N-1$.
2. **Recompute Softmax Probabilities**: In SRAM registers, compute $s_{ij} = Q_i K_j^T / \\sqrt{d}$ and $P_{ij} = \\exp(s_{ij} - L_i)$.
3. **Accumulate Value Gradient $dV$**: $dV_j += P_{ij} dO_i$.
4. **Compute Softmax Logit Gradient $dS_{ij}$**:
   - $dP_{ij} = dO_i V_j^T$.
   - $dS_{ij} = P_{ij} (dP_{ij} - D_i)$.
5. **Accumulate Query & Key Gradients $dQ, dK$**:
   - $dQ_i += \\frac{1}{\\sqrt{d}} dS_{ij} K_j$.
   - $dK_j += \\frac{1}{\\sqrt{d}} dS_{ij} Q_i$.

### Input Parameters
- \`Q\`: Query matrix $[N, d]$.
- \`K\`: Key matrix $[N, d]$.
- \`V\`: Value matrix $[N, d]$.
- \`O\`: Forward output matrix $[N, d]$.
- \`dO\`: Output gradient matrix $[N, d]$.
- \`L\`: Log-sum-exp vector of length $N$.

### Output
- Returns gradient matrices $dQ, dK, dV \\in \\mathbb{R}^{N \\times d}$ computed with zero $O(N^2)$ DRAM activation storage.

### Trade-offs & Complexity
- **Time Complexity**: $O(N^2 \\cdot d)$ FLOPs for recomputing attention scores and gradients in SRAM.
- **Space Complexity**: Saves $O(N^2)$ HBM memory by storing only $O(N)$ log-sum-exp vector $L_i$.`,
  constraints: ["1 <= N <= 128000", "32 <= d <= 256"],
  examples: [
    {
      kind: "basic",
      title: "Backward Recomputation Pass",
      inputDisplay: "Q, K, V, O, dO, L (N=4, d=2)",
      outputDisplay: "Gradients dQ, dK, dV computed via SRAM recomputation",
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
        O: [
          [10.0, 20.0],
          [30.0, 40.0],
          [40.0, 50.0],
          [35.0, 45.0],
        ],
        dO: [
          [0.1, 0.2],
          [0.3, 0.4],
          [0.1, 0.1],
          [0.2, 0.2],
        ],
        L: [2.3, 3.7, 4.1, 3.8],
      },
      output: "Gradients dQ, dK, dV computed",
      explanation: "Recomputes P_ij in registers to evaluate gradients without N^2 DRAM activation memory.",
    },
    {
      kind: "complex",
      title: "4-Tile Gradient Accumulation",
      inputDisplay: "N = 4, d = 2",
      outputDisplay: "Exact Gradient Accumulation",
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
        O: [
          [10.0, 20.0],
          [30.0, 40.0],
          [40.0, 50.0],
          [35.0, 45.0],
        ],
        dO: [
          [0.1, 0.2],
          [0.3, 0.4],
          [0.1, 0.1],
          [0.2, 0.2],
        ],
        L: [2.3, 3.7, 4.1, 3.8],
      },
      output: "Exact Gradient Accumulation",
      explanation: "Evaluates gradient accumulation across 4 sequence blocks.",
    },
    {
      kind: "negative",
      title: "Single Tile Check",
      inputDisplay: "N = 1, d = 2",
      outputDisplay: "Single Tile Recomputed",
      input: {
        Q: [[1.0, 0.0]],
        K: [[1.0, 0.0]],
        V: [[10.0, 20.0]],
        O: [[10.0, 20.0]],
        dO: [[0.1, 0.2]],
        L: [2.3],
      },
      output: "Single Tile Recomputed",
      explanation: "Computes single tile gradients using saved scalar L_i.",
    },
  ],
  code: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE,
  timeComplexity: {
    best: "O(N^2 * d)",
    average: "O(N^2 * d)",
    worst: "O(N^2 * d)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Requires O(N^2 * d) FLOPs for recomputing attention scores and gradients in SRAM.",
    space: "Saves O(N^2) HBM memory by storing only O(N) log-sum-exp vector L_i.",
  },
  topicGuide: {
    overview:
      "Backward recomputation is the key to training ultra-long context LLMs (128k+ tokens) on finite GPU memory. Trading cheap FLOPs for expensive DRAM memory reads enables massive batch sizes.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given output gradient $dO$, value gradient is $dV_j = \\sum_i P_{ij} dO_i$. Softmax gradient: $dP_{ij} = dO_i V_j^T$. Scalar reduction $D_i = \\sum_c dO_{i,c} O_{i,c}$. Score logit gradient $dS_{ij} = P_{ij} (dP_{ij} - D_i)$. Query gradient $dQ_i = \\frac{1}{\\sqrt{d}} \\sum_j dS_{ij} K_j$. Key gradient $dK_j = \\frac{1}{\\sqrt{d}} \\sum_i dS_{ij} Q_i$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Recomputation vs Memory Bandwidth: Recomputing $P_{ij}$ in SRAM adds ~15% extra FLOPs, but avoids reading $N \\times N$ floating-point attention matrices from HBM, yielding a net 2.5x speedup for the backward pass.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "The scalar $D_i = \\sum_c dO_{i,c} O_{i,c}$ is pre-computed in a separate fast vector kernel before the main tile loop, allowing $dS_{ij}$ to be computed directly in warp registers.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Dropout masking in backward pass: If dropout is enabled in forward pass, the pseudo-random seed and offset are saved to regenerate identical dropout bitmasks in SRAM during backward recomputation.",
      },
    ],
    keyTerms: [
      {
        term: "Activation Recomputation",
        definition:
          "Re-evaluating forward activation tensors on-the-fly during the backward pass to save memory.",
      },
      {
        term: "Log-Sum-Exp Vector L_i",
        definition:
          "The $O(N)$ scalar vector $L_i = m_i + \\ln \\ell_i$ saved during forward pass for exact Softmax reconstruction.",
      },
      {
        term: "Softmax Backward Derivative",
        definition:
          "The formula $dS_{ij} = P_{ij} (dP_{ij} - \\text{rowsum}(dO_i \\cdot O_i))$ for backpropagating through Softmax.",
      },
      {
        term: "DRAM Memory Wall",
        definition:
          "Performance bottleneck caused by slow HBM read/write bandwidth relative to fast GPU Tensor Cores.",
      },
    ],
  },
  trivia: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT,
  generateSteps: generateFLASHATTENTIONBACKWARDRECOMPUTATIONENGINESteps,
};
