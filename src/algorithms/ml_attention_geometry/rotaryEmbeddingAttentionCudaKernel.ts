import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface RotaryEmbeddingAttentionCudaKernelInput {
  Br?: number;
  Bc?: number;
  d?: number;
  qPosStart?: number;
  kPosStart?: number;
  scale?: number;
  data?: number[];
  target?: number;
}

export const ROTARYEMBEDDINGATTENTIONCUDAKERNEL_CODE = `import math

def fused_rope_attention_kernel(
    q_tile: list[list[float]],  # Shape [Br, d_k] un-rotated query tile
    k_tile: list[list[float]],  # Shape [Bc, d_k] un-rotated key tile
    q_pos_start: int,
    k_pos_start: int,
    scale: float
) -> list[list[float]]:
    """
    Simulates a fused RoPE + Attention CUDA warp kernel.
    Fuses 2D complex plane RoPE rotation directly in SRAM registers
    before computing scaled dot-product attention scores S = (R_m Q) @ (R_n K)^T.
    """
    Br = len(q_tile)
    Bc = len(k_tile)
    d = len(q_tile[0])

    scores = []

    for r in range(Br):
        m = q_pos_start + r
        q_raw = q_tile[r]

        # 1. In-register RoPE transformation for query vector
        q_rot = [0.0] * d
        for i in range(0, d, 2):
            freq = 1.0 / (10000.0 ** (i / d))
            cos_val, sin_val = math.cos(m * freq), math.sin(m * freq)
            q_rot[i] = q_raw[i] * cos_val - q_raw[i+1] * sin_val
            q_rot[i+1] = q_raw[i] * sin_val + q_raw[i+1] * cos_val

        row_scores = []
        for c in range(Bc):
            n = k_pos_start + c
            k_raw = k_tile[c]

            # 2. In-register RoPE transformation for key vector
            k_rot = [0.0] * d
            for i in range(0, d, 2):
                freq = 1.0 / (10000.0 ** (i / d))
                cos_val, sin_val = math.cos(n * freq), math.sin(n * freq)
                k_rot[i] = k_raw[i] * cos_val - k_raw[i+1] * sin_val
                k_rot[i+1] = k_raw[i] * sin_val + k_raw[i+1] * cos_val

            # 3. Multiply rotated vectors: s_rc = <q_rot, k_rot> * scale
            s_rc = sum(qr * kr for qr, kr in zip(q_rot, k_rot)) * scale
            row_scores.append(s_rc)

        scores.append(row_scores)

    return scores`;

export const DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT: RotaryEmbeddingAttentionCudaKernelInput =
  {
    Br: 4,
    Bc: 4,
    d: 4,
    qPosStart: 0,
    kPosStart: 0,
    scale: 0.5,
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateRotaryEmbeddingAttentionCudaKernelSteps = (
  input: RotaryEmbeddingAttentionCudaKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const Br = Math.max(input.Br ?? 4, 4);
  const Bc = Math.max(input.Bc ?? 4, 4);
  const d = Math.max(input.d ?? 4, 4);
  const qPosStart = input.qPosStart ?? 0;
  const kPosStart = input.kPosStart ?? 0;
  const scale = input.scale ?? 0.5;

  const matrixValues: string[][] = Array.from({ length: Br }, () =>
    Array.from({ length: Bc }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: Br }, () =>
    Array.from({ length: Bc }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < Br; r++) {
      for (let c = 0; c < Bc; c++) {
        let state = matrixStates[r][c] || "default";
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Q${r}_K${c}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: Br,
      cols: Bc,
      title: `Fused RoPE & Attention CUDA Score Tile S [${Br} x ${Bc}] (d_k=${d}, scale=${scale})`,
      rowHeaders: Array.from({ length: Br }, (_, i) => `Q pos m=${qPosStart + i}`),
      colHeaders: Array.from({ length: Bc }, (_, j) => `K pos n=${kPosStart + j}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC),
      auxiliaryState: {
        customState: {
          Br,
          Bc,
          d,
          q_pos_start: qPosStart,
          k_pos_start: kPosStart,
          scale,
          active_cell:
            activeR !== undefined && activeC !== undefined ? `(${activeR}, ${activeC})` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    3,
    "Initialize Fused RoPE & Attention CUDA Kernel Simulator",
    "Configuring GPU SRAM thread tile execution: fusing RoPE rotations into dot-product loop.",
    { Br, Bc, d, qPosStart, kPosStart, scale },
  );

  addStep(
    15,
    `Get Query Tile Row Count: Br = ${Br}`,
    `Reading height of query SRAM tile (Br = ${Br}).`,
    { Br },
  );

  addStep(
    16,
    `Get Key Tile Column Count: Bc = ${Bc}`,
    `Reading width of key SRAM tile (Bc = ${Bc}).`,
    { Bc },
  );

  addStep(
    17,
    `Get Feature Head Dimension: d = ${d}`,
    `Reading head dimension d = ${d}.`,
    { d },
  );

  addStep(
    19,
    "Initialize Scores Matrix Container",
    "Allocated top-level list to store computed attention logit rows.",
    { scores: "[]" },
  );

  const mockQ = Array.from({ length: Br }, (_, r) =>
    Array.from({ length: d }, (_, kIdx) => +(0.1 + r * 0.1 + kIdx * 0.05).toFixed(2)),
  );
  const mockK = Array.from({ length: Bc }, (_, c) =>
    Array.from({ length: d }, (_, kIdx) => +(0.2 + c * 0.05 + kIdx * 0.1).toFixed(2)),
  );

  for (let r = 0; r < Br; r++) {
    const m = qPosStart + r;
    const qRaw = mockQ[r];

    addStep(
      21,
      `Begin Processing Query Tile Row r=${r} (Position m=${m})`,
      `Iterating over query tile row ${r} with absolute sequence position m=${m}.`,
      { r, m },
      r,
    );

    addStep(
      22,
      `Calculate Absolute Query Position m = q_pos_start + ${r} = ${m}`,
      `Position m=${m} determines RoPE rotation angle phase m * theta_i.`,
      { r, m },
      r,
    );

    addStep(
      23,
      `Extract Raw Un-rotated Query Vector q_raw for Row r=${r}`,
      `Fetched un-rotated query vector from SRAM tile: [${qRaw.join(", ")}].`,
      { r, qRaw: `[${qRaw.join(", ")}]` },
      r,
    );

    const qRot = [...qRaw];
    for (let i = 0; i < d; i += 2) {
      const freq = 1.0 / Math.pow(10000.0, i / d);
      const cosVal = Math.cos(m * freq);
      const sinVal = Math.sin(m * freq);
      qRot[i] = +(qRaw[i] * cosVal - qRaw[i + 1] * sinVal).toFixed(3);
      qRot[i + 1] = +(qRaw[i] * sinVal + qRaw[i + 1] * cosVal).toFixed(3);
    }

    addStep(
      26,
      `In-Register RoPE Transformation for Query Vector q_rot`,
      `Applied 2D complex plane Givens rotations: q_rot = [${qRot.join(", ")}].`,
      { r, m, qRot: `[${qRot.join(", ")}]` },
      r,
    );

    for (let i = 0; i < d; i += 2) {
      const freq = 1.0 / Math.pow(10000.0, i / d);
      addStep(
        28,
        `Query RoPE Pair (${i}, ${i + 1}): freq=${freq.toExponential(2)}, angle=${(m * freq).toFixed(3)}`,
        `Computed inverse frequency theta_${i} and rotation angle for pair (${i}, ${i + 1}).`,
        { i, freq: freq.toExponential(2), angle: +(m * freq).toFixed(3) },
        r,
      );

      addStep(
        30,
        `Rotated Query Component q_rot[${i}] = ${qRot[i]}`,
        `Applied 2D rotation matrix row 1 for query component ${i}.`,
        { i, qRot0: qRot[i] },
        r,
      );

      addStep(
        31,
        `Rotated Query Component q_rot[${i + 1}] = ${qRot[i + 1]}`,
        `Applied 2D rotation matrix row 2 for query component ${i + 1}.`,
        { i1: i + 1, qRot1: qRot[i + 1] },
        r,
      );
    }

    addStep(
      33,
      `Initialize Row Scores Container for Row r=${r}`,
      `Allocated empty list for row ${r} score outputs.`,
      { row_scores: "[]" },
      r,
    );

    for (let c = 0; c < Bc; c++) {
      const n = kPosStart + c;
      const kRaw = mockK[c];

      addStep(
        34,
        `Begin Key Tile Column c=${c} (Position n=${n}) for Query Row r=${r}`,
        `Iterating key column c=${c} at position n=${n}.`,
        { r, c, n },
        r,
        c,
      );

      addStep(
        35,
        `Calculate Absolute Key Position n = k_pos_start + ${c} = ${n}`,
        `Position n=${n} determines key RoPE rotation angle phase n * theta_i.`,
        { c, n },
        r,
        c,
      );

      addStep(
        36,
        `Extract Raw Un-rotated Key Vector k_raw for Column c=${c}`,
        `Fetched un-rotated key vector from SRAM tile: [${kRaw.join(", ")}].`,
        { c, kRaw: `[${kRaw.join(", ")}]` },
        r,
        c,
      );

      const kRot = [...kRaw];
      for (let i = 0; i < d; i += 2) {
        const freq = 1.0 / Math.pow(10000.0, i / d);
        const cosVal = Math.cos(n * freq);
        const sinVal = Math.sin(n * freq);
        kRot[i] = +(kRaw[i] * cosVal - kRaw[i + 1] * sinVal).toFixed(3);
        kRot[i + 1] = +(kRaw[i] * sinVal + kRaw[i + 1] * cosVal).toFixed(3);
      }

      addStep(
        39,
        `In-Register RoPE Transformation for Key Vector k_rot`,
        `Applied 2D complex plane Givens rotations: k_rot = [${kRot.join(", ")}].`,
        { c, n, kRot: `[${kRot.join(", ")}]` },
        r,
        c,
      );

      for (let i = 0; i < d; i += 2) {
        const freq = 1.0 / Math.pow(10000.0, i / d);
        addStep(
          41,
          `Key RoPE Pair (${i}, ${i + 1}): freq=${freq.toExponential(2)}, angle=${(n * freq).toFixed(3)}`,
          `Computed inverse frequency theta_${i} and rotation angle for key pair (${i}, ${i + 1}).`,
          { i, freq: freq.toExponential(2), angle: +(n * freq).toFixed(3) },
          r,
          c,
        );

        addStep(
          43,
          `Rotated Key Component k_rot[${i}] = ${kRot[i]}`,
          `Applied 2D rotation matrix row 1 for key component ${i}.`,
          { i, kRot0: kRot[i] },
          r,
          c,
        );

        addStep(
          44,
          `Rotated Key Component k_rot[${i + 1}] = ${kRot[i + 1]}`,
          `Applied 2D rotation matrix row 2 for key component ${i + 1}.`,
          { i1: i + 1, kRot1: kRot[i + 1] },
          r,
          c,
        );
      }

      let dot = 0.0;
      for (let i = 0; i < d; i++) {
        dot += qRot[i] * kRot[i];
      }
      const sRc = +(dot * scale).toFixed(3);

      matrixValues[r][c] = String(sRc);
      matrixStates[r][c] = "compared";

      addStep(
        47,
        `Compute Fused Attention Score: s_${r},${c} = <q_rot, k_rot> * ${scale} = ${sRc}`,
        `Calculated dot product of in-register rotated vectors scaled by ${scale} -> s_${r},${c} = ${sRc}.`,
        { r, c, sRc },
        r,
        c,
      );

      addStep(
        48,
        `Append Score s_${r},${c} = ${sRc} to Row Scores List`,
        `Stored computed attention score s_${r},${c} into row score list.`,
        { r, c, sRc },
        r,
        c,
      );
    }

    addStep(
      50,
      `Append Completed Row ${r} Scores to Scores Matrix`,
      `Stored completed row ${r} score vector into attention score tensor.`,
      { r },
      r,
    );
  }

  addStep(
    52,
    "Execution Complete",
    `Successfully computed fused RoPE attention score matrix tile S [${Br}x${Bc}] directly in GPU registers without DRAM roundtrips!`,
    { completed: true, Br, Bc, scale },
  );

  return steps;
};

const ROTARYEMBEDDINGATTENTIONCUDAKERNEL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports Python math library for trigonometric functions.",
    2: "Blank line after imports.",
    3: "Defines entry point for fused RoPE and attention CUDA kernel simulation function.",
    4: "Specifies type annotation for un-rotated query tile tensor q_tile.",
    5: "Specifies type annotation for un-rotated key tile tensor k_tile.",
    6: "Specifies type annotation for starting query token position index q_pos_start.",
    7: "Specifies type annotation for starting key token position index k_pos_start.",
    8: "Specifies type annotation for dot product scaling factor scale.",
    9: "Specifies return type annotation for attention logit score matrix.",
    10: "Docstring opening delimiter tag.",
    11: "Describes fused RoPE and attention CUDA warp kernel simulation.",
    12: "Explains in-register 2D complex plane RoPE rotation in GPU SRAM.",
    13: "Summarizes zero-DRAM scaled dot-product attention computation.",
    14: "Docstring closing tag.",
    15: "Reads row dimension size Br (query tile height).",
    16: "Reads column dimension size Bc (key tile width).",
    17: "Reads feature head dimension size d.",
    18: "Blank line after dimension extraction.",
    19: "Initializes list container for collecting attention logit matrix row scores.",
    20: "Blank line before query row loop.",
    21: "Iterates over query tile row index r from 0 to Br-1.",
    22: "Calculates absolute sequence position m = q_pos_start + r for query row.",
    23: "Extracts raw un-rotated query vector q_raw for row r.",
    24: "Blank line before query RoPE transformation.",
    25: "Comment indicating in-register RoPE transformation for query vector.",
    26: "Initializes zero-filled buffer for rotated query vector q_rot.",
    27: "Iterates over 2D coordinate pairs i in range(0, d, 2).",
    28: "Calculates inverse frequency scale freq = 1 / 10000^(i/d).",
    29: "Computes cosine and sine rotation factors for position m.",
    30: "Applies 2D Givens rotation to first coordinate component q_rot[i].",
    31: "Applies 2D Givens rotation to second coordinate component q_rot[i+1].",
    32: "Blank line before row scores initialization.",
    33: "Initializes row scores list container for current query row r.",
    34: "Iterates over key tile column index c from 0 to Bc-1.",
    35: "Calculates absolute sequence position n = k_pos_start + c for key column.",
    36: "Extracts raw un-rotated key vector k_raw for column c.",
    37: "Blank line before key RoPE transformation.",
    38: "Comment indicating in-register RoPE transformation for key vector.",
    39: "Initializes zero-filled buffer for rotated key vector k_rot.",
    40: "Iterates over 2D coordinate pairs i in range(0, d, 2).",
    41: "Calculates inverse frequency scale freq = 1 / 10000^(i/d).",
    42: "Computes cosine and sine rotation factors for position n.",
    43: "Applies 2D Givens rotation to first coordinate component k_rot[i].",
    44: "Applies 2D Givens rotation to second coordinate component k_rot[i+1].",
    45: "Blank line before score dot product.",
    46: "Comment indicating dot-product score calculation.",
    47: "Computes scaled dot-product attention score s_rc = <q_rot, k_rot> * scale.",
    48: "Appends scaled score s_rc to current row_scores list.",
    49: "Blank line after key column loop.",
    50: "Appends completed row_scores list to top-level attention scores matrix.",
    51: "Blank line after query row loop.",
    52: "Returns fused RoPE attention logit score matrix.",
  },
};

export const rotaryEmbeddingAttentionCudaKernel: AlgorithmDefinition<RotaryEmbeddingAttentionCudaKernelInput> =
  {
    id: "rotary-embedding-attention-cuda-kernel",
    title: "Fused RoPE & Attention CUDA Kernel Simulator",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "In standard deep learning frameworks, applying Rotary Position Embeddings (RoPE) as an independent PyTorch operator requires reading un-rotated $Q$ and $K$ tensors from High Bandwidth Memory (HBM), performing elementwise rotations, and writing rotated tensors back to HBM. FlashAttention and Triton eliminate this intermediate DRAM roundtrip by fusing RoPE directly into the attention tile loading loop.\n\n### Mathematical Formulation\nFused RoPE & Attention CUDA Kernel loads raw un-rotated $Q$ and $K$ tiles into GPU Shared Memory (SRAM) and applies 2D Givens rotations $\\tilde{Q}_m = R_m Q_m$ and $\\tilde{K}_n = R_n K_n$ directly inside GPU registers before invoking Tensor Core MMA (Matrix Multiply-Accumulate) instructions:\n\n$$S_{m,n} = \\frac{1}{\\sqrt{d_k}} \\langle R_m Q_m, R_n K_n \\rangle$$\n\nFor query row $r$ at position $m = q_{\\text{start}} + r$ and key column $c$ at position $n = k_{\\text{start}} + c$:\n\n$$\\tilde{q}_{2i} = q_{2i} \\cos(m\\theta_i) - q_{2i+1} \\sin(m\\theta_i)$$\n\n$$\\tilde{k}_{2i} = k_{2i} \\cos(n\\theta_i) - k_{2i+1} \\sin(n\\theta_i)$$\n\n$$S_{r,c} = \\text{scale} \\cdot \\sum_{j=0}^{d_k-1} \\tilde{q}_j \\tilde{k}_j$$\n\n### Complexity & Performance\n- **Time**: $\\mathcal{O}(B_r \\cdot B_c \\cdot d_k)$ tile computation with zero DRAM overhead for intermediate RoPE tensors.\n- **Space**: $\\mathcal{O}((B_r + B_c) \\cdot d_k)$ space in fast GPU SRAM.",
    constraints: ["1 <= Br <= 128", "1 <= Bc <= 128", "2 <= d <= 256"],
    examples: [
      {
        kind: "basic",
        title: "4x4 Tile Fused RoPE Attention Execution",
        inputDisplay: "Br = 4, Bc = 4, d = 4, scale = 0.5",
        outputDisplay: "Score Matrix S [4 x 4]",
        input: DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT,
        output: "Matrix [4 x 4]",
        explanation: "Fuses 2D complex plane RoPE rotations into SRAM attention score calculation.",
      },
    ],
    defaultInput: DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT,
    code: ROTARYEMBEDDINGATTENTIONCUDAKERNEL_CODE,
    timeComplexity: {
      best: "O(Br * Bc * d)",
      average: "O(Br * Bc * d)",
      worst: "O(Br * Bc * d)",
    },
    spaceComplexity: "O((Br + Bc) * d)",
    complexityAnalysis: {
      time: "$\\mathcal{O}(B_r \\cdot B_c \\cdot d_k)$ tile computation with zero DRAM overhead for intermediate RoPE tensors.",
      space: "$\\mathcal{O}((B_r + B_c) \\cdot d_k)$ space in fast GPU SRAM for holding Q and K tile buffers.",
    },
    topicGuide: {
      overview:
        "Fused RoPE Attention kernels (FlashAttention-2, vLLM Triton kernels) represent standard practice in modern LLM training and inference systems. By performing positional rotation in registers immediately prior to dot-product accumulation, system throughput is increased by up to 20-30%.\n\n$$S_{m,n} = \\frac{1}{\\sqrt{d_k}} \\langle R_m Q_m, R_n K_n \\rangle$$",
      sections: [
        {
          heading: "1. Core Concept & Mathematical Formulation",
          body: "For thread block processing query tile Q in R^(Br x d) at position m and key tile K in R^(Bc x d) at position n, the kernel computes S_{r,c} = scale * sum(R_m q_r . R_n k_c).",
        },
        {
          heading: "2. Systems & Memory Hierarchy Performance",
          body: "Executing RoPE in registers eliminates 2 global DRAM memory reads and 2 global DRAM memory writes per head. The arithmetic intensity of the tile loading phase increases, transforming a memory-bound operator into a compute-bound operation running on GPU Tensor Cores.",
        },
        {
          heading: "3. Implementation Nuances in Triton",
          body: "In Triton, fused RoPE is implemented via Python decorators `@triton.jit` using vector pointers `tl.load(Q_ptr + offsets)`. RoPE rotation is expressed as `q_rot = q * cos + rotate_half(q) * sin` operating over 128-bit vector registers.",
        },
      ],
      keyTerms: [
        {
          term: "Kernel Fusion",
          definition: "Combining multiple sequential tensor operators into a single GPU kernel pass to eliminate DRAM roundtrips.",
        },
        {
          term: "Register Memory",
          definition: "Ultra-fast on-chip GPU storage accessible in 1 clock cycle with zero memory bus latency.",
        },
        {
          term: "SRAM Tiling",
          definition: "Partitioning large global memory matrices into small sub-blocks loaded into shared memory.",
        },
      ],
    },
    trivia: ROTARYEMBEDDINGATTENTIONCUDAKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    generateSteps: generateRotaryEmbeddingAttentionCudaKernelSteps,
  };
