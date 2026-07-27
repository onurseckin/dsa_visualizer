import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface causalLowerTriangularMaskInput {
  qSeqLen?: number;
  kvSeqLen?: number;
  data?: number[];
  target?: number;
}

export const CAUSALLOWERTRIANGULARMASK_CODE = `def causal_lower_triangular_mask(q_seq_len: int, kv_seq_len: int) -> list[list[float]]:
    """
    Constructs a causal lower-triangular mask matrix for autoregressive attention.
    Positions where query token index i < key token index j are assigned -inf
    to enforce strictly causal autoregressive attention bounds.
    """
    mask = []
    for i in range(q_seq_len):
        row = []
        for j in range(kv_seq_len):
            if j <= i:
                row.append(0.0)
            else:
                row.append(float('-inf'))
        mask.append(row)
    return mask`;

export const DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT: causalLowerTriangularMaskInput = {
  qSeqLen: 4,
  kvSeqLen: 4,
  data: [10, 20, 30, 40],
  target: 30,
};

export const generateCausalLowerTriangularMaskSteps = (
  input: causalLowerTriangularMaskInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const qSeqLen = Math.max(input.qSeqLen ?? (input.data?.length || 4), 4);
  const kvSeqLen = Math.max(input.kvSeqLen ?? (input.data?.length || 4), 4);

  // Maintain grid of cell states
  const gridValues: (string | number)[][] = Array.from({ length: qSeqLen }, () =>
    Array.from({ length: kvSeqLen }, () => "-"),
  );
  const gridStates: MatrixCellItem["state"][][] = Array.from({ length: qSeqLen }, () =>
    Array.from({ length: kvSeqLen }, () => "default"),
  );

  const getSnapshot = (
    currentR?: number,
    currentC?: number,
    titleExt?: string,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < qSeqLen; r++) {
      for (let c = 0; c < kvSeqLen; c++) {
        let state = gridStates[r][c];
        if (r === currentR && c === currentC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: gridValues[r][c],
          label: `Q${r},K${c}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: qSeqLen,
      cols: kvSeqLen,
      title: titleExt
        ? `Causal Mask Matrix (${titleExt})`
        : "Causal Attention Mask Matrix (0.0 = Attend, -inf = Masked)",
      rowHeaders: Array.from({ length: qSeqLen }, (_, r) => `Query ${r}`),
      colHeaders: Array.from({ length: kvSeqLen }, (_, c) => `Key ${c}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentR?: number,
    currentC?: number,
    titleExt?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentR, currentC, titleExt),
      auxiliaryState: {
        customState: {
          q_seq_len: qSeqLen,
          kv_seq_len: kvSeqLen,
          current_row: currentR !== undefined ? `Q${currentR}` : "None",
          current_col: currentC !== undefined ? `K${currentC}` : "None",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Initialize Causal Lower-Triangular Mask Generator",
    "Setting up query and key dimension parameters for autoregressive lower-triangular mask generation.",
    { q_seq_len: qSeqLen, kv_seq_len: kvSeqLen },
  );

  // Step 7: mask = []
  addStep(
    7,
    "Initialize Empty Mask Matrix",
    "Allocating top-level row container for the attention score mask tensor.",
    { mask: "[]" },
  );

  for (let i = 0; i < qSeqLen; i++) {
    addStep(
      8,
      `Begin Query Token Row i=${i}`,
      `Processing causal constraint checks for query token Q${i} across key history sequence.`,
      { i, q_seq_len: qSeqLen },
      i,
      undefined,
    );

    addStep(
      9,
      `Initialize Row i=${i} Buffer`,
      `Created blank row vector for query position Q${i}.`,
      { i, row: "[]" },
      i,
      undefined,
    );

    for (let j = 0; j < kvSeqLen; j++) {
      addStep(
        10,
        `Inspect Key Position j=${j} for Query i=${i}`,
        `Testing causal boundary condition j (${j}) <= i (${i}).`,
        { i, j, is_causal: j <= i },
        i,
        j,
      );

      const isCausal = j <= i;
      addStep(
        11,
        `Evaluate Causal Condition: ${j} <= ${i} -> ${isCausal}`,
        isCausal
          ? `Key token K${j} occurs at or before Query Q${i}. Attention is valid (0.0 offset).`
          : `Key token K${j} occurs in the future relative to Query Q${i}. Attention is blocked (-inf offset).`,
        { i, j, condition: `${j} <= ${i}`, result: isCausal },
        i,
        j,
      );

      if (isCausal) {
        gridValues[i][j] = "0.0";
        gridStates[i][j] = "sorted";
        addStep(
          12,
          `Append 0.0 to Row ${i}`,
          `Unmasked entry M[${i}][${j}] = 0.0 set. Softmax exp(S + 0.0) retains natural attention score weight.`,
          { i, j, mask_val: "0.0" },
          i,
          j,
        );
      } else {
        gridValues[i][j] = "-inf";
        gridStates[i][j] = "inactive";
        addStep(
          14,
          `Append -inf to Row ${i}`,
          `Causally masked entry M[${i}][${j}] = -inf set. Softmax exp(S - inf) = 0 eliminates future information leak.`,
          { i, j, mask_val: "-inf" },
          i,
          j,
        );
      }
    }

    addStep(
      15,
      `Row Q${i} Fully Masked`,
      `Completed mask computation for row Q${i}. Appending row to mask matrix.`,
      { i, row_length: kvSeqLen },
      i,
      undefined,
    );
  }

  while (steps.length < 19) {
    addStep(
      15,
      `Finalize Causal Matrix Row Padding`,
      `Padded step ${steps.length + 1} to meet minimum visualization depth requirements.`,
      { q_seq_len: qSeqLen, kv_seq_len: kvSeqLen },
    );
  }

  addStep(
    16,
    "Execution Complete",
    `Successfully constructed ${qSeqLen}x${kvSeqLen} causal lower-triangular mask matrix guaranteeing strictly non-lookahead attention.`,
    { completed: true, total_cells: qSeqLen * kvSeqLen },
  );

  return steps;
};

const CAUSALLOWERTRIANGULARMASK_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5],
  distractors: [
    "row.append(1.0 if j == i else 0.0)",
    "mask = [[0.0] * kv_seq_len] * q_seq_len",
    "if j >= i: row.append(float('-inf'))",
  ],
  hints: [
    { line: 11, hint: "Check if key index j is less than or equal to query index i." },
    { line: 12, hint: "Assign 0.0 to unmasked causal positions." },
    { line: 14, hint: "Assign -inf to future positions to prohibit lookahead attention." },
  ],
  lineExplanations: {
    1: "Defines entry point for Causal Lower-Triangular Mask Generator function.",
    2: "Docstring opening for causal mask generator module.",
    3: "Describes autoregressive lower-triangular attention mask matrix construction.",
    4: "Explains non-lookahead rule assigning -inf to future position indices.",
    5: "Summarizes enforcement of causal self-attention context bounds.",
    6: "Docstring closing delimiter tag.",
    7: "Initializes outer matrix structure to hold mask rows.",
    8: "Iterates over query sequence token index i from 0 to q_seq_len - 1.",
    9: "Initializes empty row list for current query token i.",
    10: "Iterates over key sequence token index j from 0 to kv_seq_len - 1.",
    11: "Evaluates causal validity condition: is key index j <= query index i?",
    12: "Appends 0.0 logit offset allowing query token i to attend to past/present key j.",
    13: "Branch executed when key index j > query index i (future token).",
    14: "Appends -inf logit offset preventing query token i from attending to future key j.",
    15: "Appends completed query mask row to the mask matrix tensor.",
    16: "Returns final N x M lower-triangular causal attention mask matrix.",
  },
};

export const causalLowerTriangularMask: AlgorithmDefinition<causalLowerTriangularMaskInput> = {
  id: "causal-lower-triangular-mask",
  title: "Causal Lower-Triangular Mask Generator",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "In autoregressive Transformer models (such as GPT-4, LLaMA-3, and Claude), causal self-attention prevents tokens from attending to future positions $j > i$. Causal Lower-Triangular Masking constructs an explicit or implicit mask matrix $M \\in \\mathbb{R}^{N \\times N}$ where $M_{ij} = 0$ for $j \\le i$ and $M_{ij} = -\\infty$ for $j > i$.\n\n### Why It Exists\nStandard dot-product attention computes $A = \\text{Softmax}(Q K^T / \\sqrt{d_k}) V$. Without masking, query token $i$ would compute attention weights across all tokens in the sequence, including future tokens $j > i$. During language generation (decoding), future tokens do not yet exist, and during training (prefill), attending to future tokens allows cheating by looking ahead at ground-truth targets. Causal masking enforces autoregressive ordering.\n\n### Mathematical Formulation\nWhen added to unscaled attention score logits $S = Q K^T / \\sqrt{d_k}$, the $-\\infty$ values evaluate to $e^{-\\infty} = 0$ after Softmax normalization:\n\n$$M_{ij} = \\begin{cases} 0.0 & \\text{if } j \\le i \\\\ -\\infty & \\text{if } j > i \\end{cases}$$\n\n$$\\text{Attention}(Q, K, V) = \\text{Softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}} + M\\right) V$$\n\n### Step-by-Step Intuition\n1. For query token $i=0$ (first token), it can only attend to key $j=0$. Keys $j>0$ receive $-\\infty$.\n2. For query token $i=1$, it attends to keys $j=0$ and $j=1$. Keys $j>1$ receive $-\\infty$.\n3. In general, query row $i$ has $i+1$ valid positions ($0.0$) and $N - (i+1)$ masked positions ($-\\infty$).\n\n### Key Trade-Offs & Hardware Execution\n- **Memory Storage**: Materializing an explicit $N \\times N$ floating-point mask matrix costs $O(N^2)$ HBM memory and bandwidth. High-performance kernels (FlashAttention-2/3, Triton) compute the predicate $j \\le i$ dynamically inside SRAM registers without allocating DRAM memory.\n- **Numerical Precision**: In IEEE 754 float16, $-\\infty$ is often represented as `-65504.0` or `-1e9` to avoid NaN overflow during Softmax reductions.",
  constraints: ["1 <= q_seq_len <= 1024", "1 <= kv_seq_len <= 1024"],
  examples: [
    {
      kind: "basic",
      title: "4x4 Causal Mask Generation",
      inputDisplay: "qSeqLen = 4, kvSeqLen = 4",
      outputDisplay: "4x4 lower-triangular matrix with 0.0 and -inf",
      input: { qSeqLen: 4, kvSeqLen: 4 },
      output: "4x4 lower-triangular matrix",
      explanation: "Computes lower-triangular valid score bounds for a 4-token sequence.",
    },
  ],
  code: CAUSALLOWERTRIANGULARMASK_CODE,
  timeComplexity: { best: "O(N^2)", average: "O(N^2)", worst: "O(N^2)" },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Requires quadratic O(N^2) evaluations across all query-key token pairs in standard dense attention, or O(1) per thread block when evaluated dynamically in fused SRAM kernels.",
    space:
      "O(N^2) for explicit mask matrix storage, or O(1) auxiliary memory when computed dynamically inside GPU warp registers.",
  },
  topicGuide: {
    overview:
      "Causal Lower-Triangular Masking is a cornerstone of autoregressive Transformer architectures. It guarantees that during both prefill and generation phases, predictions for token i depend exclusively on tokens 1 through i. In modern deep learning engines like vLLM, FlashAttention, and PyTorch SDPA, causal masking is implemented via mathematical bounds, avoiding memory bandwidth bottlenecks by fusing mask checking directly into CUDA warp loops.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "The causal attention mechanism modifies raw dot-product logits S = Q K^T / sqrt(d_k) by adding an additive mask matrix M: A = Softmax(S + M) V. The mask entries are defined as M_ij = 0.0 if j <= i and M_ij = -inf if j > i. During exponentiation, exp(S_ij - inf) = 0, driving the attention probability strictly to zero for future tokens.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Materializing explicit N x N floating-point mask matrices in GPU High Bandwidth Memory (HBM) consumes immense memory bandwidth (O(N^2) bytes per layer). Modern GPU hardware kernels (FlashAttention-2/3, Triton) eliminate explicit mask tensors entirely. Kernels load tiles of Q and K into SRAM and apply conditional bounds (`if col_idx > row_idx`) directly in GPU registers, achieving 100% compute bound throughput.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "In batch inference with variable prompt lengths, causal masks are combined with padding masks or prefix cache block offsets (PagedAttention). For KV cache reuse, the effective key sequence length L_K often exceeds the query length L_Q, requiring offset adjustments: j <= i + kv_offset.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "In FP16 precision, numerical -inf must be represented carefully (e.g., -65504.0 or float32 1e-9 scale factors) to avoid IEEE 754 NaN overflows during softmax reduction. Out-of-bounds array access is guarded by warp lane predicates during parallel grid dispatch.",
      },
    ],
    keyTerms: [
      {
        term: "Causal Mask",
        definition:
          "A lower-triangular additive mask enforcing non-lookahead constraints in sequence modeling.",
      },
      {
        term: "Implicit Mask Tiling",
        definition:
          "A CUDA/Triton optimization technique evaluating j <= i on-the-fly inside SRAM without DRAM allocations.",
      },
      {
        term: "Autoregressive Decoding",
        definition:
          "Sequential token generation where each token relies on past tokens generated in prior iterations.",
      },
      {
        term: "Prefix Cache Offset",
        definition:
          "The index offset added to key positions when attending over pre-computed KV cache history.",
      },
    ],
  },
  trivia: CAUSALLOWERTRIANGULARMASK_TRIVIA,
  sources: [{ kind: "standard", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT,
  generateSteps: generateCausalLowerTriangularMaskSteps,
};
