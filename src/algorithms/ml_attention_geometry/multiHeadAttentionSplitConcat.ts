import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface multiHeadAttentionSplitConcatInput {
  seqLen?: number;
  dModel?: number;
  numHeads?: number;
  data?: number[];
  target?: number;
}

export const MULTIHEADATTENTIONSPLITCONCAT_CODE = `def mha_split_and_concat(
    x: list[list[float]],
    num_heads: int
) -> tuple[list[list[list[float]]], list[list[float]]]:
    seq_len = len(x)
    d_model = len(x[0])
    head_dim = d_model // num_heads

    heads = []
    for h in range(num_heads):
        head_matrix = []
        for i in range(seq_len):
            start_col = h * head_dim
            end_col = start_col + head_dim
            head_matrix.append(x[i][start_col:end_col])
        heads.append(head_matrix)

    concat_matrix = []
    for i in range(seq_len):
        row = []
        for h in range(num_heads):
            row.extend(heads[h][i])
        concat_matrix.append(row)

    return heads, concat_matrix`;

export const DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT: multiHeadAttentionSplitConcatInput = {
  seqLen: 4,
  dModel: 4,
  numHeads: 2,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMultiHeadAttentionSplitConcatSteps = (
  input: multiHeadAttentionSplitConcatInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const seqLen = Math.max(input.seqLen ?? 4, 4);
  const dModel = Math.max(input.dModel ?? 4, 4);
  const numHeads = Math.max(input.numHeads ?? 2, 2);
  const headDim = Math.floor(dModel / numHeads);

  const matrixValues: string[][] = Array.from({ length: seqLen }, () =>
    Array.from({ length: dModel }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: seqLen }, () =>
    Array.from({ length: dModel }, () => "default"),
  );

  // Fill initial input values into matrix before steps start
  for (let r = 0; r < seqLen; r++) {
    for (let c = 0; c < dModel; c++) {
      matrixValues[r][c] = `${+(0.1 + r * 0.2 + c * 0.15).toFixed(2)}`;
    }
  }

  const getSnapshot = (
    activeR?: number,
    activeC?: number,
    titleExt?: string,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < seqLen; r++) {
      for (let c = 0; c < dModel; c++) {
        let state = matrixStates[r][c];
        if (r === activeR && activeC !== undefined) {
          if (c === activeC) {
            state = "active";
          }
        } else if (activeR !== undefined && activeC === undefined && r === activeR) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `T${r},D${c}`,
          state,
        });
      }
    }

    const rowHeaders = Array.from({ length: seqLen }, (_, i) => `Token ${i}`);
    const colHeaders = Array.from({ length: dModel }, (_, c) => {
      const h = Math.floor(c / headDim);
      const f = c % headDim;
      return `H${h}-F${f}`;
    });

    return {
      kind: "matrix",
      rows: seqLen,
      cols: dModel,
      title: titleExt
        ? `MHA Split & Concat Tensor (${titleExt})`
        : `MHA Hidden Matrix (seq_len=${seqLen}, d_model=${dModel}, num_heads=${numHeads}, head_dim=${headDim})`,
      rowHeaders,
      colHeaders,
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
    titleExt?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC, titleExt),
      auxiliaryState: {
        customState: {
          seq_len: seqLen,
          d_model: dModel,
          num_heads: numHeads,
          head_dim: headDim,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Multi-Head Attention Head Split & Concat",
    "Setting up head splitting parameters: d_model partitioned into H independent head_dim subspaces.",
    { seqLen, dModel, numHeads },
  );

  addStep(
    5,
    `Get Sequence Length (seq_len=${seqLen})`,
    "Reading sequence length dimension size from input tensor.",
    { seqLen },
  );

  addStep(
    6,
    `Get Model Feature Dimension (d_model=${dModel})`,
    "Reading total hidden embedding dimension d_model.",
    { dModel },
  );

  addStep(
    7,
    `Calculate Head Subspace Dimension (head_dim = d_model // num_heads = ${headDim})`,
    `Integer division ${dModel} // ${numHeads} = ${headDim}. Each head operates on a ${headDim}-dimensional subspace.`,
    { head_dim: headDim },
  );

  addStep(
    9,
    "Initialize Head Subspaces List",
    "Created top-level container to hold partitioned per-head matrix representations.",
    { heads: "[]" },
  );

  // Phase 1: Splitting
  for (let h = 0; h < numHeads; h++) {
    const startCol = h * headDim;
    const endCol = startCol + headDim;

    addStep(
      10,
      `Begin Split for Head h=${h}`,
      `Extracting subspace features for Head ${h} across columns [${startCol}:${endCol}].`,
      { h, startCol, endCol },
      undefined,
      startCol,
    );

    addStep(
      11,
      `Initialize Head Matrix ${h}`,
      `Created blank matrix for Head ${h}.`,
      { h },
      undefined,
      startCol,
    );

    for (let i = 0; i < seqLen; i++) {
      addStep(
        12,
        `Process Token i=${i} for Head h=${h}`,
        `Slicing token ${i} hidden vector at columns [${startCol}:${endCol}].`,
        { h, i, startCol, endCol },
        i,
        startCol,
      );

      addStep(
        13,
        `Calculate Start Column: start_col = h * head_dim = ${startCol}`,
        `Start index for head ${h} subspace.`,
        { h, startCol },
        i,
        startCol,
      );

      addStep(
        14,
        `Calculate End Column: end_col = start_col + head_dim = ${endCol}`,
        `End index boundary for head ${h} subspace slice.`,
        { h, endCol },
        i,
        endCol - 1,
      );

      for (let c = startCol; c < endCol; c++) {
        matrixStates[i][c] = "compared";
      }

      addStep(
        15,
        `Extract Feature Slice x[${i}][${startCol}:${endCol}] for Head ${h}`,
        `Extracted ${headDim} features for token ${i} into Head ${h} matrix.`,
        { h, i, slice: `x[${i}][${startCol}:${endCol}]` },
        i,
        startCol,
      );
    }

    addStep(
      16,
      `Append Head ${h} Matrix to Partitioned Heads`,
      `Head ${h} subspace matrix created (shape [${seqLen}, ${headDim}]).`,
      { h, head_shape: `[${seqLen}, ${headDim}]` },
    );
  }

  // Phase 2: Concatenation
  addStep(
    18,
    "Initialize Concatenated Matrix",
    "Allocated outer container for re-merging per-head output vectors into [seq_len, d_model].",
    { concat_matrix: "[]" },
  );

  for (let i = 0; i < seqLen; i++) {
    addStep(
      19,
      `Begin Concatenation for Token i=${i}`,
      `Combining head outputs for token ${i} back into full feature vector.`,
      { i },
      i,
    );

    addStep(
      20,
      `Initialize Row ${i} Buffer`,
      `Created blank feature list for token ${i}.`,
      { i, row: "[]" },
      i,
    );

    for (let h = 0; h < numHeads; h++) {
      const startCol = h * headDim;
      const endCol = startCol + headDim;

      addStep(
        21,
        `Extend Token ${i} Row with Head ${h} Subspace Vector`,
        `Extending token ${i} feature row with Head ${h} slice [${startCol}:${endCol}].`,
        { i, h, startCol, endCol },
        i,
        startCol,
      );

      for (let c = startCol; c < endCol; c++) {
        matrixStates[i][c] = "sorted";
      }

      addStep(
        22,
        `Appended Head ${h} Features to Token ${i} Row`,
        `Token ${i} now has ${endCol} concatenated features.`,
        { i, h, current_features: endCol },
        i,
        endCol - 1,
      );
    }

    addStep(
      23,
      `Push Concatenated Row ${i} to Result Tensor`,
      `Token ${i} feature row concatenated (size ${dModel}).`,
      { i, d_model: dModel },
      i,
    );
  }

  // Final all-sorted visualization state
  for (let r = 0; r < seqLen; r++) {
    for (let c = 0; c < dModel; c++) {
      matrixStates[r][c] = "sorted";
    }
  }

  addStep(
    25,
    "Execution Complete",
    `Successfully split [${seqLen}, ${dModel}] into ${numHeads} heads of dimension ${headDim} and re-concatenated back into [${seqLen}, ${dModel}].`,
    { completed: true, seqLen, dModel, numHeads },
    undefined,
    undefined,
    "Complete",
  );

  return steps;
};

const MULTIHEADATTENTIONSPLITCONCAT_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 8, 17, 24],
  distractors: [
    "head_dim = d_model * num_heads",
    "row = [heads[h][i] for h in range(num_heads)]",
    "start_col = h + head_dim",
  ],
  hints: [
    { line: 7, hint: "Compute head dimension head_dim = d_model // num_heads." },
    { line: 15, hint: "Extract slice x[i][start_col:end_col] for current head subspace." },
    { line: 22, hint: "Concatenate per-head output rows along feature dimension." },
  ],
  lineExplanations: {
    1: "Defines entry point for Multi-Head Attention split and concat operations.",
    2: "Specifies input sequence matrix type annotation.",
    3: "Specifies number of attention heads num_heads parameter.",
    4: "Specifies return tuple type for split head matrices and concatenated result matrix.",
    5: "Reads sequence length dimension size from input matrix x.",
    6: "Reads total hidden model dimension d_model from input row length.",
    7: "Calculates per-head subspace dimension head_dim = d_model // num_heads.",
    8: "Empty whitespace line.",
    9: "Initializes list container to store partitioned head matrices.",
    10: "Iterates over each head index h from 0 to num_heads - 1.",
    11: "Initializes empty matrix container for current head h.",
    12: "Iterates over sequence position index i from 0 to seq_len - 1.",
    13: "Computes start column index start_col = h * head_dim.",
    14: "Computes end column index end_col = start_col + head_dim.",
    15: "Slices contiguous hidden features x[i][start_col:end_col] into head matrix.",
    16: "Appends completed head h matrix to heads container.",
    17: "Empty whitespace line.",
    18: "Initializes container for concatenated result tensor.",
    19: "Iterates over sequence position index i from 0 to seq_len - 1.",
    20: "Initializes empty row list buffer for token i.",
    21: "Iterates over each head index h from 0 to num_heads - 1.",
    22: "Extends row list with features from head h at token position i.",
    23: "Appends completed concatenated row to result matrix.",
    24: "Empty whitespace line.",
    25: "Returns tuple of split per-head matrices and concatenated final matrix.",
  },
};

export const multiHeadAttentionSplitConcat: AlgorithmDefinition<multiHeadAttentionSplitConcatInput> =
  {
    id: "multi-head-attention-split-concat",
    title: "Multi-Head Attention Head Split & Concat",
    topicIds: ["ml_attention_geometry", "ml_tensor_algebra"],
    difficulty: "Easy",
    description:
      "Multi-Head Attention (MHA, Vaswani et al., 2017) allows Transformer models to jointly attend to information from different representation subspaces at different positions. Given an input tensor $X \\in \\mathbb{R}^{B \\times S \\times D}$, linear projections yield $Q, K, V \\in \\mathbb{R}^{B \\times S \\times D}$.\n\n### Why It Exists\nStandard single-head attention averages attention across all features, masking distinct spatial or semantic relationships. Multi-Head Attention splits the hidden dimension $D$ into $H$ independent heads of size $d_k = D / H$. Each head learns specialized relationships (e.g. syntactic agreement vs semantic reference) in parallel.\n\n### Mathematical Formulation\n1. **Subspace Splitting**: For head $h \\in \\{0 \\dots H-1\\}$:\n   $$Q_h = Q[:, start:end], \\quad K_h = K[:, start:end], \\quad V_h = V[:, start:end]$$\n   where $start = h \\cdot d_k$ and $end = (h+1) \\cdot d_k$.\n2. **Parallel Subspace Attention**:\n   $$\\text{Head}_h = \\text{Softmax}\\left(\\frac{Q_h K_h^T}{\\sqrt{d_k}}\\right) V_h$$\n3. **Concatenation & Output Projection**:\n   $$\\text{MHA}(Q, K, V) = \\text{Concat}(\\text{Head}_0, \\dots, \\text{Head}_{H-1}) W_O$$\n\n### Step-by-Step Intuition\n1. **Calculate Subspace Size**: Compute $d_k = D / H$.\n2. **Extract Head Slices**: Slice input features into $H$ head matrices of shape $[S, d_k]$.\n3. **Re-concatenate**: Merge head outputs back into $[S, D]$ before passing to linear projection $W_O$.\n\n### Key Trade-Offs & Complexity\n- **FLOP Equivalence**: Splitting $D$ into $H$ heads keeps total attention FLOPs constant ($H \\times O(S^2 d_k) = O(S^2 D)$).\n- **Memory Layout**: Requires strided view operations (`transpose(1, 2)`) which require contiguous copies unless fused in CUDA kernels.",
    constraints: ["1 <= dModel <= 2048", "1 <= numHeads <= 64"],
    examples: [
      {
        kind: "basic",
        title: "4x4 Matrix Split into 2 Heads",
        inputDisplay: "seqLen = 4, dModel = 4, numHeads = 2",
        outputDisplay: "2 Head matrices [4, 2] and Concatenated [4, 4]",
        input: { seqLen: 4, dModel: 4, numHeads: 2 },
        output: "Matrix [4, 4]",
        explanation: "Splits 4-dim feature vector into 2 heads of dim 2 and re-concatenates.",
      },
    ],
    code: MULTIHEADATTENTIONSPLITCONCAT_CODE,
    timeComplexity: { best: "O(N * D)", average: "O(N * D)", worst: "O(N * D)" },
    spaceComplexity: "O(N * D)",
    complexityAnalysis: {
      time: "Reshaping and strided memory copying takes O(N * D) time per layer.",
      space: "Allocates O(N * D) memory for storing reshaped head sub-tensors.",
    },
    topicGuide: {
      overview:
        "Head splitting and concatenation form the structural core of Transformer architectures (BERT, GPT, T5, LLaMA). Splitting D into H smaller heads of dimension d_k enables multi-perspective contextual representation while keeping total floating-point compute constant (H * O(N^2 d_k) = O(N^2 D)).",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Given input X, query head h is Q_h = X W_Q^(h) where W_Q^(h) is in R^(D x d_k). Alternatively, a single fused projection computes Q = X W_Q in R^(B x S x D), followed by zero-copy view reshaping reshape(B, S, H, d_k).transpose(1, 2). After attention, heads are merged via transpose(1, 2).reshape(B, S, D).",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "In PyTorch/CUDA, transpose(1, 2) produces a non-contiguous tensor stride (S*H*d_k, d_k, H*d_k, 1). Passing non-contiguous tensors to standard GEMM kernels causes fallback to slow strided copies. Fused kernels (FlashAttention, cuDNN) perform head splitting implicitly during SRAM tile loads, completely eliminating layout copy overhead.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In PyTorch nn.MultiheadAttention, linear projections for Q, K, V are fused into a single 3D-wide matrix multiplication X W_QKV in R^(B x S x 3D), maximizing GPU Tensor Core GEMM efficiency before splitting.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "If D is not divisible by H, explicit padding or custom head dimensions (d_k = ceil(D/H)) must be used to prevent dynamic runtime dimension mismatches.",
        },
      ],
      keyTerms: [
        {
          term: "Head Splitting",
          definition:
            "Reshaping hidden dimension D into H parallel subspace tensors of size d_k = D/H.",
        },
        {
          term: "Fused QKV Projection",
          definition:
            "Computing Q, K, and V projections in a single matrix multiplication to maximize GEMM throughput.",
        },
        {
          term: "Tensor Contiguity",
          definition:
            "A memory property where elements adjacent in logical tensor dimensions are stored adjacent in physical DRAM.",
        },
        {
          term: "Head Concatenation",
          definition:
            "Merging per-head output tensors [B, H, S, d_v] back into a contiguous [B, S, D] feature matrix.",
        },
      ],
    },
    trivia: MULTIHEADATTENTIONSPLITCONCAT_TRIVIA,
    sources: [{ kind: "standard", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT,
    generateSteps: generateMultiHeadAttentionSplitConcatSteps,
  };
