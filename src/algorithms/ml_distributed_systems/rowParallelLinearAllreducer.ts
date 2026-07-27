import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rowParallelLinearAllreducerInput {
  data: number[];
  target?: number;
}

export const ROWPARALLELLINEARALLREDUCER_CODE = `def row_parallel_linear_allreduce(partial_activations, tp_size):
    """
    Simulates Tensor Parallel (TP) Row-Parallel Linear layer forward execution.
    
    In Megatron-LM row-parallel linear layers, the weight matrix W is split along its rows:
    Y_i = X_i @ W_i on GPU i.
    The final layer output requires an All-Reduce sum across all TP ranks: Y = sum(Y_i).

    Args:
        partial_activations: List of partial output sums computed on each TP rank
        tp_size: Tensor Parallelism world size

    Returns:
        Array of reduced output values synchronized across all TP ranks.
    """
    if tp_size <= 1 or not partial_activations:
        return list(partial_activations)

    total_reduced = sum(partial_activations)
    return [total_reduced] * len(partial_activations)
`;

export const DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT: rowParallelLinearAllreducerInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRowParallelLinearAllreducerSteps = (
  input: rowParallelLinearAllreducerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `tp-rank-${idx}`,
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

  const tpSize = input.data.length;
  addStep(
    1,
    "Initialize Megatron-LM Row Parallel Linear All-Reduce Engine",
    "Setting up TP ranks, partial activation vectors Y_i, and All-Reduce sum barriers.",
    { tp_size: tpSize, target: input.target ?? 0 },
  );

  let accumulatedSum = 0;
  input.data.forEach((val, idx) => {
    accumulatedSum += val;
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`TP_${idx}`],
        };
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      18,
      `Process TP Rank ${idx} Partial Result: Y_${idx} = ${val}`,
      `Accumulating partial activation Y_${idx} into row-parallel linear output sum buffer.`,
      { idx, val, accumulated_sum: accumulatedSum, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    value: accumulatedSum,
    state: "sorted" as const,
  }));

  addStep(
    19,
    "Execution Complete",
    `All-Reduce sum complete. Final output activation across all TP ranks = ${accumulatedSum}.`,
    { completed: true, total_reduced: accumulatedSum },
    finalElements,
  );

  return steps;
};

const ROWPARALLELLINEARALLREDUCER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "total_reduced = partial_activations[0] * tp_size",
    "return [x / tp_size for x in partial_activations]",
    "return partial_activations[::-1]",
  ],
  hints: [
    { line: 18, hint: "Row-parallel linear layers sum partial GEMM results via All-Reduce." },
  ],
  lineExplanations: {
    1: "Defines function entry point for row_parallel_linear_allreduce.",
    16: "Checks for single rank (TP=1) where no communication is required.",
    18: "Sums partial activations across all Tensor Parallel ranks.",
    19: "Broadcasts reduced sum across all TP ranks.",
  },
};

export const rowParallelLinearAllreducer: AlgorithmDefinition<rowParallelLinearAllreducerInput> = {
  id: "row-parallel-linear-allreducer",
  title: "Megatron-LM Row Parallel Linear All-Reduce Engine",
  category: "ml_distributed_systems",
  categories: ["ml_distributed_systems", "ml_tensor_algebra"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 11,
  mlInfraCategory: "ml_distributed_systems",
  description:
    "Simulates Megatron-LM Tensor Parallelism (TP) Row-Parallel Linear layer forward execution and All-Reduce communication.\n\nIn Large Language Model (LLM) Transformer architectures, Megatron-LM splits linear projection matrices across $N_{\\text{TP}}$ GPUs to fit massive weight tensors into VRAM and parallelize matrix multiplication:\n\n1. Column-Parallel Linear Layer ($h \\to 4h$):\n   The weight matrix $W$ is split along its columns: $W = [W_1 | W_2 | \\dots | W_k]$. Each rank computes $Y_i = X @ W_i$ independently without inter-GPU communication.\n\n2. Row-Parallel Linear Layer ($4h \\to h$):\n   The weight matrix $W$ is split along its rows: $W = [W_1^T, W_2^T, \\dots, W_k^T]^T$. Input $X$ is split along the hidden dimension into $[X_1 | X_2 | \\dots | X_k]$. Each rank computes local matrix product $Y_i = X_i @ W_i$.\n\n3. All-Reduce Sum Reduction:\n   Because $Y = X @ W = \\sum_{i=1}^{k} (X_i @ W_i) = \\sum Y_i$, an All-Reduce sum operation is performed across the $N_{\\text{TP}}$ ranks to synchronize the output activation tensor $Y$.\n\nBy pairing Column-Parallel and Row-Parallel linear layers in Transformer MLPs and Attention projections, Megatron-LM reduces communication overhead from 4 All-Reduces per Transformer block to just 2 All-Reduces (1 in Attention, 1 in MLP).\n\nInput Format:\n- data: Array of partial output scalar values or tensor magnitudes computed by each TP rank.\n- target: Optional target search value.\n\nOutput Format:\n- Returns synchronized reduced array where each TP rank holds the sum of all partial activations.\n\nEdge Cases & Constraints:\n- Single TP Rank ($N_{\\text{TP}}=1$): Communication is completely skipped.\n- Interconnect Saturation: High TP sizes ($N_{\\text{TP}} > 8$) cross intra-node NVLink bounds and incur heavy inter-node InfiniBand latency penalties.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "4-Rank TP Row-Parallel Reduction",
      inputDisplay: "partial_activations = [10, 20, 30, 40], target = 30",
      outputDisplay: "All-Reduced Output = [100, 100, 100, 100]",
      input: { data: [10, 20, 30, 40], target: 30 },
      output: "[100, 100, 100, 100]",
      explanation: "Each TP rank computes partial output Y_i; All-Reduce sums 10+20+30+40 = 100.",
    },
    {
      kind: "complex",
      title: "5-Rank Tensor Parallel MLP Layer",
      inputDisplay: "partial_activations = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "All-Reduced Output = [15, 15, 15, 15, 15]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[15, 15, 15, 15, 15]",
      explanation: "Sums 5 partial activation chunks across TP ranks.",
    },
    {
      kind: "negative",
      title: "TP=1 (No Communication)",
      inputDisplay: "partial_activations = [5], target = 5",
      outputDisplay: "All-Reduced Output = [5]",
      input: { data: [5], target: 5 },
      output: "[5]",
      explanation: "Single rank execution requires zero communication.",
    },
  ],
  code: ROWPARALLELLINEARALLREDUCER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across TP rank partial activations for sum reduction.",
    space: "O(N) memory allocation for the output activation vector.",
  },
  topicGuide: {
    overview:
      "Megatron-LM Row Parallel Linear All-Reduce Engine illustrates the key collective communication step in Tensor Parallelism (TP) for scale-out Large Language Model training and inference (GPT-4, LLaMA-3, Megatron-Deepspeed).",
    sections: [
      {
        heading: "Overview & Megatron Tensor Parallelism",
        body: "Large transformer models contain linear projections (e.g. MLP gate/up/down projections, Attention QKV/Output projections) whose weight matrices exceed single-GPU memory limits. Megatron-LM partitions matrix multiplication across GPUs along column and row dimensions, requiring minimal collective communication barriers.",
      },
      {
        heading: "Core Concept: Column vs Row Parallelism",
        body: "In a Transformer MLP block:\n- First Layer (Column Parallel): $H = \\text{GeLU}(X @ W_{\\text{gate}})$. Weights are split column-wise; output is concatenated without communication.\n- Second Layer (Row Parallel): $Y = H @ W_{\\text{down}}$. Input $H$ and weight $W_{\\text{down}}$ are split along the hidden dimension. Each GPU computes partial sum $Y_i = H_i @ W_{\\text{down}, i}$. An All-Reduce sum ($Y = \\sum Y_i$) produces the exact output.",
      },
      {
        heading: "Systems & Interconnect Bandwidth Impact",
        body: "Because Row-Parallel linear layers execute an All-Reduce on every forward step, Tensor Parallelism is strictly restricted to ultra-high-bandwidth intra-node NVLink interconnects (900 GB/s on NVIDIA H100 NVSwitch). Running TP across PCIe or inter-node InfiniBand networks introduces severe communication latency bottlenecks that degrade GPU compute utilization.",
      },
      {
        heading: "Implementation Nuances & Kernel Fusion",
        body: "Modern LLM engines (vLLM, TensorRT-LLM) fuse the All-Reduce operation with residual addition and LayerNorm/RMSNorm kernels. Custom CUDA kernels perform NVLink shared memory direct reads (IPC pointers) to reduce activation memory copies and eliminate PyTorch Python overhead.",
      },
    ],
    keyTerms: [
      {
        term: "Tensor Parallelism (TP)",
        definition:
          "Intra-layer model parallelism technique that partitions matrix multiplications across multiple GPUs within a single transformer layer.",
      },
      {
        term: "Row-Parallel Linear",
        definition:
          "Linear layer decomposition where weight matrix rows are split across GPUs, producing partial output sums that require an All-Reduce.",
      },
      {
        term: "Column-Parallel Linear",
        definition:
          "Linear layer decomposition where weight matrix columns are split across GPUs, producing column-partitioned outputs without communication.",
      },
      {
        term: "Megatron-LM",
        definition:
          "NVIDIA's framework for training large language models at scale using 3D Parallelism (Tensor, Pipeline, and Data Parallelism).",
      },
    ],
  },
  trivia: ROWPARALLELLINEARALLREDUCER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
  defaultInput: DEFAULT_ROWPARALLELLINEARALLREDUCER_INPUT,
  generateSteps: generateRowParallelLinearAllreducerSteps,
};
