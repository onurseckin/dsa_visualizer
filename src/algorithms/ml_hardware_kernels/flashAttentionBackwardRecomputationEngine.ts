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
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE = `def flash_attention_backward_recompute(Q: list[list[float]], K: list[list[float]], V: list[list[float]], O: list[list[float]], dO: list[list[float]], L: list[float], scale: float = 1.0) -> tuple[list[list[float]], list[list[float]], list[list[float]]]:
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

export const DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT: flashAttentionBackwardRecomputationEngineInput =
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
    data: [1, 0, 0, 1],
    target: 0,
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

  const getSnapshot = (activeI: number = -1, _activeJ: number = -1) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < d; c++) {
        const val = dQ[r][c];
        const isCurrent = r === activeI;

        cells.push({
          row: r,
          col: c,
          value: val.toFixed(4),
          label: `dQ[${r},${c}]`,
          state: isCurrent ? "active" : val !== 0 ? "sorted" : "default",
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
      title: `FlashAttention Backward Query Gradient dQ (${N}x${d})`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeI: number = -1,
    activeJ: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeI, activeJ),
      auxiliaryState: {
        customState: {
          Algorithm: "FlashAttention Backward Recomputation Engine (Dao et al. 2022)",
          "Sequence Length N": String(N),
          "Head Dimension d": String(d),
          "Memory Saved": "90%+ VRAM Saved by On-The-Fly Score Recomputation",
          "Softmax Derivative D_i": "D_i = sum(dO_i * O_i) per row",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "FlashAttention Backward Recomputation Engine Entry",
    `Started FlashAttention backward pass across N=${N} sequence tokens, recomputing attention matrix S_ij on-the-fly without saving N x N activations!`,
    { N, d },
  );

  // Step 2: Measure N & d (2, 3)
  addStep(2, `Measure Sequence Length: N = len(Q) = ${N}`, `Sequence length N = ${N}.`, { N });

  addStep(
    3,
    `Measure Head Dimension: d = len(Q[0]) = ${d}`,
    `Head dimension d = ${d}. Scale factor 1/sqrt(d) = ${scale.toFixed(4)}.`,
    { d, scale },
  );

  // Step 3: Init dQ, dK, dV (5..7)
  addStep(
    5,
    `Allocate Query Gradient Matrix dQ (${N}x${d})`,
    `Zero-initialized ${N}x${d} gradient accumulator dQ.`,
    { N, d },
  );

  addStep(
    6,
    `Allocate Key Gradient Matrix dK (${N}x${d})`,
    `Zero-initialized ${N}x${d} gradient accumulator dK.`,
    { N, d },
  );

  addStep(
    7,
    `Allocate Value Gradient Matrix dV (${N}x${d})`,
    `Zero-initialized ${N}x${d} gradient accumulator dV.`,
    { N, d },
  );

  // Step 4: Precompute D (9)
  const D = O.map((oRow, i) => oRow.reduce((acc, oVal, col) => acc + dO[i][col] * oVal, 0));
  addStep(
    9,
    "Precompute Softmax Backward Constant Vector D = sum(dO * O)",
    `Precomputed row-wise dot products D_i = sum(dO_i * O_i): [${D.map((v) => v.toFixed(4)).join(", ")}].`,
    { D: JSON.stringify(D.map((v) => v.toFixed(4))) },
  );

  // Loop over i and j (11..24)
  for (let i = 0; i < N; i++) {
    addStep(
      11,
      `Outer Query Row Loop: Row i = ${i} of ${N - 1}`,
      `Computing backward gradients for Query token i = ${i}.`,
      { i },
      i,
    );

    for (let j = 0; j < N; j++) {
      addStep(
        12,
        `Inner Key/Value Row Loop: Row j = ${j} of ${N - 1}`,
        `Recomputing attention score s_${i}${j} on-the-fly for Query ${i} and Key ${j}.`,
        { i, j },
        i,
        j,
      );

      const sIJ = Q[i].reduce((acc, qVal, col) => acc + qVal * K[j][col], 0) * scale;
      addStep(
        13,
        `Recompute Attention Score: s_${i}${j} = Q[${i}] * K[${j}]^T * scale = ${sIJ.toFixed(4)}`,
        `Recomputed unnormalized attention score s_${i}${j} = ${sIJ.toFixed(4)} on-the-fly from Q and K. Zero HBM storage required!`,
        { i, j, sIJ },
        i,
        j,
      );

      const pIJ = Math.exp(sIJ - L[i]);
      addStep(
        14,
        `Recompute Softmax Probability: p_${i}${j} = exp(s_${i}${j} - L[${i}]) = ${pIJ.toFixed(4)}`,
        `Recomputed softmax probability p_${i}${j} = ${pIJ.toFixed(4)} using stored logsumexp L[${i}] = ${L[i].toFixed(4)}.`,
        { i, j, pIJ },
        i,
        j,
      );

      for (let col = 0; col < d; col++) {
        dV[j][col] += pIJ * dO[i][col];
        addStep(
          17,
          `Accumulate Value Gradient: dV[${j}][${col}] += p_${i}${j} * dO[${i}][${col}] -> ${dV[j][col].toFixed(4)}`,
          `Accumulated Value gradient dV[${j}][${col}] = ${dV[j][col].toFixed(4)}.`,
          { j, col, dV_cell: dV[j][col] },
          i,
          j,
        );
      }

      const dpIJ = dO[i].reduce((acc, doVal, col) => acc + doVal * V[j][col], 0);
      addStep(
        19,
        `Compute Probability Gradient: dp_${i}${j} = dO[${i}] * V[${j}] = ${dpIJ.toFixed(4)}`,
        `Evaluated gradient of loss w.r.t attention probability: dp_${i}${j} = ${dpIJ.toFixed(4)}.`,
        { i, j, dpIJ },
        i,
        j,
      );

      const dsIJ = pIJ * (dpIJ - D[i]);
      addStep(
        20,
        `Compute Score Gradient: ds_${i}${j} = p_${i}${j} * (dp_${i}${j} - D[${i}]) = ${dsIJ.toFixed(4)}`,
        `Evaluated gradient w.r.t unnormalized attention score ds_${i}${j} = ${dsIJ.toFixed(4)}.`,
        { i, j, dsIJ },
        i,
        j,
      );

      for (let col = 0; col < d; col++) {
        dQ[i][col] += scale * dsIJ * K[j][col];
        addStep(
          23,
          `Accumulate Query Gradient: dQ[${i}][${col}] += scale * ds * K[${j}][${col}] -> ${dQ[i][col].toFixed(4)}`,
          `Accumulated Query gradient dQ[${i}][${col}] = ${dQ[i][col].toFixed(4)}.`,
          { i, col, dQ_cell: dQ[i][col] },
          i,
          j,
        );

        dK[j][col] += scale * dsIJ * Q[i][col];
        addStep(
          24,
          `Accumulate Key Gradient: dK[${j}][${col}] += scale * ds * Q[${i}][${col}] -> ${dK[j][col].toFixed(4)}`,
          `Accumulated Key gradient dK[${j}][${col}] = ${dK[j][col].toFixed(4)}.`,
          { j, col, dK_cell: dK[j][col] },
          i,
          j,
        );
      }
    }
  }

  // Return step (26)
  addStep(
    26,
    "Execution Complete: Return (dQ, dK, dV) Gradients",
    "Completed FlashAttention backward pass recomputation. Computed exact Query, Key, and Value gradients (dQ, dK, dV) with zero intermediate N x N attention matrix materialization!",
    { N, d, completed: true },
  );

  return steps;
};

const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [4, 8, 10, 15, 18, 21, 25],
  distractors: [
    "S = Q @ K.T saved in DRAM for backward pass",
    "ds_ij = p_ij * dp_ij",
    "D_i = sum(O_i)",
    "dQ = dO @ V.T",
  ],
  hints: [
    { line: 9, hint: "Precomputed softmax backward term: D_i = sum(dO_i * O_i)." },
    { line: 20, hint: "Score gradient formula: ds_ij = p_ij * (dp_ij - D_i)." },
  ],
  lineExplanations: {
    1: "Defines entry point for flash_attention_backward_recompute function.",
    2: "Measures sequence length N = len(Q).",
    3: "Measures head dimension d = len(Q[0]).",
    4: "Blank line before allocating gradient buffers.",
    5: "Allocates Query gradient matrix dQ (N x d) filled with zeros.",
    6: "Allocates Key gradient matrix dK (N x d) filled with zeros.",
    7: "Allocates Value gradient matrix dV (N x d) filled with zeros.",
    8: "Blank line before precomputing D vector.",
    9: "Precomputes softmax backward constant vector D_i = sum(dO_i * O_i) across sequence length N.",
    10: "Blank line before query loop.",
    11: "Iterates over query token row index i from 0 to N - 1.",
    12: "Iterates over key/value token column index j from 0 to N - 1.",
    13: "Recomputes unnormalized attention score s_ij = Q[i] * K[j]^T * scale on-the-fly from Q and K.",
    14: "Recomputes softmax probability p_ij = exp(s_ij - L[i]) using stored logsumexp L[i].",
    15: "Blank line before Value gradient accumulation loop.",
    16: "Iterates over head dimension column col from 0 to d - 1.",
    17: "Accumulates Value gradient dV[j][col] += p_ij * dO[i][col].",
    18: "Blank line before score gradient computation.",
    19: "Calculates probability gradient dp_ij = sum(dO_i * V_j).",
    20: "Calculates unnormalized score gradient ds_ij = p_ij * (dp_ij - D[i]).",
    21: "Blank line before Query & Key gradient accumulation loop.",
    22: "Iterates over head dimension column col from 0 to d - 1.",
    23: "Accumulates Query gradient dQ[i][col] += scale * ds_ij * K[j][col].",
    24: "Accumulates Key gradient dK[j][col] += scale * ds_ij * Q[i][col].",
    25: "Blank line separating loops from return statement.",
    26: "Returns tuple of (dQ, dK, dV) gradient matrices.",
  },
};

export const flashAttentionBackwardRecomputationEngine: AlgorithmDefinition<flashAttentionBackwardRecomputationEngineInput> =
  {
    id: "flash-attention-backward-recomputation-engine",
    title: "FlashAttention Backward Recomputation Engine",
    topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    description:
      "The FlashAttention Backward Recomputation Engine implements the backward pass algorithm for FlashAttention (Tri Dao et al. 2022). Standard PyTorch attention backpropagation requires storing the $N \\times N$ attention activation matrix $S$ and softmax probability matrix $P$ during the forward pass to compute gradients $\\frac{\\partial L}{\\partial Q}, \\frac{\\partial L}{\\partial K}, \\frac{\\partial L}{\\partial V}$. FlashAttention **discards** $S$ and $P$ during forward pass, storing only the $O(N)$ row logsumexp vector $L$. During backward pass, FlashAttention recomputes $S_{i,j}$ and $P_{i,j}$ **on-the-fly** from $Q, K$ and $L$, reducing VRAM memory consumption by **90%+**.\n\n### Why It Exists\nIn deep transformer training (GPT-4, LLaMA-3), forward activations consume 80%+ of total GPU VRAM. Storing $N \\times N$ attention probabilities for 32 layers across 32 heads causes Out-Of-Memory (OOM) crashes. Recomputing attention scores on-the-fly trades cheap SRAM compute FLOPs for precious HBM DRAM bandwidth, enabling training with **10x larger batch sizes** and **32k+ sequence lengths**.\n\n### Mathematical Formulation\nGiven output gradient $dO \\in \\mathbb{R}^{N \\times d}$, stored forward logsumexp $L_i = \\ln \\sum_j e^{s_{i,j}}$, and $D_i = \\sum_{c=1}^d dO_{i,c} \\cdot O_{i,c}$:\n\n$$1. \\quad s_{i,j} = \\frac{Q_i K_j^T}{\\sqrt{d}}, \\quad p_{i,j} = \\exp(s_{i,j} - L_i) \\quad (\\text{On-the-fly Recomputation})$$\n\n$$2. \\quad dV_j += p_{i,j} \\cdot dO_i \\quad (\\text{Value Gradient Accumulation})$$\n\n$$3. \\quad dp_{i,j} = dO_i V_j^T, \\quad ds_{i,j} = p_{i,j} \\left( dp_{i,j} - D_i \\right) \\quad (\\text{Softmax Backward Derivative})$$\n\n$$4. \\quad dQ_i += \\frac{1}{\\sqrt{d}} ds_{i,j} K_j, \\quad dK_j += \\frac{1}{\\sqrt{d}} ds_{i,j} Q_i \\quad (\\text{Query and Key Gradient Accumulation})$$\n\n### Step-by-Step Intuition\n1. **Precompute Constant $D_i$**: Compute row-wise dot product $D_i = \\sum_c dO_{i,c} \\cdot O_{i,c}$. This scalar represents the softmax normalization constant gradient.\n2. **Tiled Forward Score Recomputation**: Load $Q_i, K_j$ into SRAM shared memory and recompute $s_{i,j} = \\frac{Q_i K_j^T}{\\sqrt{d}}$ and $p_{i,j} = e^{s_{i,j} - L_i}$.\n3. **Accumulate $dV$**: Compute $dV_j += p_{i,j} \\cdot dO_i$.\n4. **Softmax Derivative $ds_{i,j}$**: Compute $dp_{i,j} = dO_i V_j^T$, and scale by $ds_{i,j} = p_{i,j} (dp_{i,j} - D_i)$.\n5. **Accumulate $dQ$ and $dK$**: Accumulate $dQ_i += \\frac{1}{\\sqrt{d}} ds_{i,j} K_j$ and $dK_j += \\frac{1}{\\sqrt{d}} ds_{i,j} Q_i$.\n\n### Key Trade-Offs & Hardware Execution\n- **Compute vs Memory Swap**: Recomputing $s_{i,j}$ adds 1.5x FLOP math overhead during backward pass, but eliminates 90% of DRAM memory accesses, resulting in a **net 2x wall-clock speedup** on A100/H100 GPUs.\n- **Exact Numerical Match**: Produces bit-exact gradient values identical to standard PyTorch `torch.autograd` attention backprop.",
    constraints: ["1 <= N <= 8192", "1 <= d <= 128", "Q, K, V, O, dO dimensions must match N x d"],
    examples: [
      {
        kind: "basic",
        title: "4x4 FlashAttention Backward Pass Recomputation",
        inputDisplay: "4 tokens, d=2 dimensions, Q, K, V, O, dO, and L vector",
        outputDisplay: "Gradients (dQ, dK, dV) computed with zero N x N storage",
        input: DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT,
        output: "([dQ], [dK], [dV])",
        explanation:
          "Recomputes attention scores s_ij on-the-fly from Q, K, and L, evaluating exact dQ, dK, dV gradients without saving N x N activations.",
      },
    ],
    code: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE,
    timeComplexity: {
      best: "O(N^2 \\cdot d)",
      average: "O(N^2 \\cdot d)",
      worst: "O(N^2 \\cdot d)",
    },
    spaceComplexity: "O(N \\cdot d)",
    complexityAnalysis: {
      time: "Requires $O(N^2 \\cdot d)$ math operations to recompute $s_{i,j}$ and evaluate $dQ, dK, dV$ gradients.",
      space:
        "Requires $O(N \\cdot d)$ memory space for output gradients $dQ, dK, dV$, eliminating $O(N^2)$ activation memory.",
    },
    topicGuide: {
      overview:
        "The FlashAttention Backward Recomputation Engine computes exact Q, K, V gradients by recomputing attention scores on-the-fly from stored row logsumexp L.",
      sections: [
        {
          heading: "Core Concept & Activation Recomputation",
          body: "FlashAttention discards intermediate N x N attention activations during forward pass, storing only O(N) row logsumexp values L_i. During backward pass, s_ij and p_ij are recomputed on-the-fly from Q, K, and L.",
        },
        {
          heading: "Softmax Backward Derivative & Constant D_i",
          body: "Softmax backward pass requires precomputing constant D_i = sum(dO_i * O_i). Score gradient ds_ij = p_ij * (dp_ij - D_i) encapsulates softmax derivative chain rule.",
        },
        {
          heading: "Compute FLOPs vs VRAM Memory Trade-off",
          body: "Recomputing s_ij adds 1.5x FLOP math overhead in backward pass, but reduces VRAM consumption by 90%+, preventing GPU Out-Of-Memory (OOM) crashes in long-context LLM training.",
        },
        {
          heading: "Exact Numerical Gradient Fidelity",
          body: "On-the-fly recomputation yields bit-exact gradient values identical to standard PyTorch autograd, ensuring full convergence stability.",
        },
      ],
      keyTerms: [
        {
          term: "Backward Recomputation",
          definition:
            "Re-evaluating forward activations on-the-fly during backpropagation to save VRAM memory.",
        },
        {
          term: "Logsumexp Vector (L_i)",
          definition:
            "O(N) vector stored during forward pass containing row softmax normalization denominators.",
        },
        {
          term: "Softmax Constant (D_i)",
          definition:
            "Precomputed row dot product D_i = sum(dO_i * O_i) used in softmax backpropagation.",
        },
        {
          term: "Activation Memory Saving",
          definition:
            "Reducing peak GPU memory footprint by discarding intermediate attention matrices.",
        },
      ],
    },
    trivia: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT,
    generateSteps: generateFLASHATTENTIONBACKWARDRECOMPUTATIONENGINESteps,
  };
