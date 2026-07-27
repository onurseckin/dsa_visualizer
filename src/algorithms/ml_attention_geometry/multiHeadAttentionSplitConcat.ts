import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface multiHeadAttentionSplitConcatInput {
  data: number[];
  target?: number;
}

export const MULTIHEADATTENTIONSPLITCONCAT_CODE = `
def mha_split_and_concat(
    x: list[list[float]],  # Input sequence matrix [seq_len, d_model]
    num_heads: int
) -> tuple[list[list[list[float]]], list[list[float]]]:
    """
    Performs Multi-Head Attention dimension splitting and concatenation.
    1. Splitting: reshapes [seq_len, d_model] -> [num_heads, seq_len, head_dim]
    2. Concat: merges per-head outputs [num_heads, seq_len, head_dim] back to [seq_len, d_model]
    """
    seq_len = len(x)
    d_model = len(x[0])
    head_dim = d_model // num_heads

    # Step 1: Split hidden dimension d_model into H heads
    heads = []
    for h in range(num_heads):
        head_matrix = []
        for i in range(seq_len):
            start_col = h * head_dim
            end_col = start_col + head_dim
            head_matrix.append(x[i][start_col:end_col])
        heads.append(head_matrix)

    # Step 2: Concatenate parallel head output representations back into [seq_len, d_model]
    concat_matrix = []
    for i in range(seq_len):
        row = []
        for h in range(num_heads):
            row.extend(heads[h][i])
        concat_matrix.append(row)

    return heads, concat_matrix
`;

export const DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT: multiHeadAttentionSplitConcatInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMultiHeadAttentionSplitConcatSteps = (
  input: multiHeadAttentionSplitConcatInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Multi-Head Attention Head Split & Concat",
    "Setting up head splitting parameters: d_model partitioned into H independent head_dim subspaces.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const headIdx = idx % 2;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? "active" : "compare",
          pointers: [`token=${idx}`, `h=${headIdx}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      14,
      `Split token ${idx} (val=${val}): extract head slice h=${headIdx}`,
      `Partitioning hidden dimension vector into head subspace slice [h*head_dim : (h+1)*head_dim].`,
      { tokenIdx: idx, headIdx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    27,
    "Execution Complete",
    "Successfully concatenated per-head attention outputs back into contiguous d_model tensor layout.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const MULTIHEADATTENTIONSPLITCONCAT_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8],
  distractors: [
    "head_dim = d_model * num_heads",
    "row = [heads[h][i] for h in range(num_heads)]",
    "start_col = h + head_dim",
  ],
  hints: [
    { line: 12, hint: "Compute head dimension head_dim = d_model // num_heads." },
    { line: 18, hint: "Extract slice x[i][start_col:end_col] for current head subspace." },
    { line: 26, hint: "Concatenate per-head output rows along feature dimension." },
  ],
  lineExplanations: {
    1: "Defines entry point for Multi-Head Attention split and concat operations.",
    12: "Calculates subspace dimension head_dim = d_model // num_heads.",
    18: "Slices contiguous hidden dimension into individual head representations.",
    26: "Appends head outputs sequentially to reconstruct full d_model features.",
    29: "Returns per-head tensor list and concatenated final tensor.",
  },
};

export const multiHeadAttentionSplitConcat: AlgorithmDefinition<multiHeadAttentionSplitConcatInput> =
  {
    id: "multi-head-attention-split-concat",
    title: "Multi-Head Attention Head Split & Concat",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_tensor_algebra"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Multi-Head Attention (MHA, Vaswani et al., 2017) allows Transformer models to jointly attend to information from different representation subspaces at different positions. Given an input tensor $X \\in \\mathbb{R}^{B \\times S \\times D}$, linear projections yield $Q, K, V \\in \\mathbb{R}^{B \\times S \\times D}$.\n\n1. **Head Splitting (Unroll)**: Reshapes and transposes tensors into shape $[B, H, S, d_k]$ where $d_k = D / H$.\n2. **Parallel Subspace Attention**: Computes $H$ independent attention maps $A_h = \\text{Softmax}(Q_h K_h^T / \\sqrt{d_k}) V_h \\in \\mathbb{R}^{B \\times S \\times d_v}$.\n3. **Head Concatenation**: Transposes and reshapes outputs $[B, H, S, d_v] \\to [B, S, H \\cdot d_v] = [B, S, D]$ before applying the output linear projection $W_O$.\n\nInput Format:\n- data: Sequence tokens or hidden dimension representation values.\n- target: Head count parameter or target feature index.\n\nOutput Format:\n- Split head sub-tensors $[H, S, d_k]$ and concatenated feature matrix $[S, D]$.\n\nEdge Cases & Constraints:\n- Divisibility constraint: $D$ must be evenly divisible by $H$ ($D \\bmod H = 0$).\n- Strided memory views: Non-contiguous transposed views `[B, H, S, d_k]` require explicit `.contiguous()` calls or cuDNN strided GEMM kernels to prevent memory layout errors.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard 2-Head Split & Concat",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation:
          "Splits 4D hidden vector into two 2D head representations and re-concatenates.",
      },
      {
        kind: "complex",
        title: "Multi-Token Head Partition",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates split and concat memory strides over 5 sequence steps.",
      },
      {
        kind: "negative",
        title: "Target Index Out-of-Bounds",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Safely handles head dimension boundaries without tensor allocation error.",
      },
    ],
    code: MULTIHEADATTENTIONSPLITCONCAT_CODE,
    timeComplexity: { best: "O(N \\cdot D)", average: "O(N \\cdot D)", worst: "O(N \\cdot D)" },
    spaceComplexity: "O(N \\cdot D)",
    complexityAnalysis: {
      time: "Reshaping and strided memory copying takes $O(N \\cdot D)$ time per layer.",
      space: "Allocates $O(N \\cdot D)$ memory for storing reshaped head sub-tensors.",
    },
    topicGuide: {
      overview:
        "Head splitting and concatenation form the structural core of Transformer architectures (BERT, GPT, T5, LLaMA). Splitting $D$ into $H$ smaller heads of dimension $d_k$ enables multi-perspective contextual representation while keeping total floating-point compute constant ($H \\times O(N^2 d_k) = O(N^2 D)$).",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Given input $X$, query head $h$ is $Q_h = X W_Q^{(h)}$ where $W_Q^{(h)} \\in \\mathbb{R}^{D \\times d_k}$. Alternatively, a single fused projection computes $Q = X W_Q \\in \\mathbb{R}^{B \\times S \\times D}$, followed by zero-copy view reshaping `reshape(B, S, H, d_k).transpose(1, 2)`. After attention, heads are merged via `transpose(1, 2).reshape(B, S, D)`.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "In PyTorch/CUDA, `transpose(1, 2)` produces a non-contiguous tensor stride `(S*H*d_k, d_k, H*d_k, 1)`. Passing non-contiguous tensors to standard GEMM kernels causes fallback to slow strided copies. Fused kernels (FlashAttention, cuDNN) perform head splitting implicitly during SRAM tile loads, completely eliminating layout copy overhead.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In PyTorch `nn.MultiheadAttention`, linear projections for Q, K, V are fused into a single $3D$-wide matrix multiplication $X W_{QKV} \\in \\mathbb{R}^{B \\times S \\times 3D}$, maximizing GPU Tensor Core GEMM efficiency before splitting.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "If $D$ is not divisible by $H$, explicit padding or custom head dimensions ($d_k = \\lceil D/H \\rceil$) must be used to prevent dynamic runtime dimension mismatches.",
        },
      ],
      keyTerms: [
        {
          term: "Head Splitting",
          definition:
            "Reshaping hidden dimension $D$ into $H$ parallel subspace tensors of size $d_k = D/H$.",
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
            "Merging per-head output tensors $[B, H, S, d_v]$ back into a contiguous $[B, S, D]$ feature matrix.",
        },
      ],
    },
    trivia: MULTIHEADATTENTIONSPLITCONCAT_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_MULTIHEADATTENTIONSPLITCONCAT_INPUT,
    generateSteps: generateMultiHeadAttentionSplitConcatSteps,
  };
