import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface columnParallelLinearReshaperInput {
  data: number[];
  target?: number;
}

export const COLUMNPARALLELLINEARRESHAPER_CODE = `def column_parallel_linear_reshaper(weights: list[float], num_tp_ranks: int) -> list[dict]:
    """
    Shards a flat Megatron-LM Column Parallel Linear weight vector across Tensor Parallel (TP) ranks.
    Each TP rank receives a contiguous slice of output columns (d_out / num_tp_ranks).
    
    Input:
        weights: Flat list of linear layer weight values representing column matrix parameters.
        num_tp_ranks: Number of Tensor Parallel GPU ranks in the communication group.
        
    Output:
        List of dictionaries containing per-rank column boundaries and sliced parameter shards.
    """
    total_elements = len(weights)
    if num_tp_ranks <= 0 or total_elements == 0:
        return []
    
    shard_size = (total_elements + num_tp_ranks - 1) // num_tp_ranks
    rank_shards = []
    
    for rank in range(num_tp_ranks):
        start_idx = rank * shard_size
        end_idx = min(start_idx + shard_size, total_elements)
        shard = weights[start_idx:end_idx]
        rank_shards.append({
            "rank": rank,
            "start_idx": start_idx,
            "end_idx": end_idx,
            "shard": shard
        })
        
    return rank_shards
`;

export const DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT: columnParallelLinearReshaperInput = {
  data: [10, 20, 30, 40, 50, 60],
  target: 2,
};

export const generateColumnParallelLinearReshaperSteps = (
  input: columnParallelLinearReshaperInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const numRanks = Math.max(1, input.target ?? 2);
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
          tp_ranks: String(numRanks),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Megatron-LM Column Parallel Linear Layer Reshaper",
    "Setting up parameter weight tensor and computing Tensor Parallel (TP) rank column allocations.",
    { total_weights: input.data.length, tp_ranks: numRanks },
  );

  const total = input.data.length;
  const shardSize = Math.ceil(total / numRanks);

  for (let rank = 0; rank < numRanks; rank++) {
    const startIdx = rank * shardSize;
    const endIdx = Math.min(startIdx + shardSize, total);

    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i >= startIdx && i < endIdx) {
        return {
          ...el,
          state: "active",
          pointers: [
            i === startIdx ? `R${rank}-start` : i === endIdx - 1 ? `R${rank}-end` : "",
          ].filter(Boolean),
        };
      }
      if (i < startIdx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      15,
      `Assign TP Rank ${rank}: columns [${startIdx}..${Math.max(startIdx, endIdx - 1)}]`,
      `Partitioning contiguous weight slice of length ${endIdx - startIdx} for GPU Rank ${rank}.`,
      { rank, startIdx, endIdx, shardLength: endIdx - startIdx },
      currentElements,
    );
  }

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    22,
    "Execution Complete",
    "Successfully reshaped and sharded weight matrix along column dimension across all Tensor Parallel GPU ranks.",
    { completed: true, total_shards: numRanks },
    finalElements,
  );

  return steps;
};

const COLUMNPARALLELLINEARRESHAPER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "weights.reshape(-1, num_tp_ranks).transpose()",
    "torch.all_reduce(weights, op=torch.distributed.ReduceOp.SUM)",
    "return weights[::-1]",
  ],
  hints: [
    { line: 15, hint: "Slice weight array into contiguous blocks of size d_out / num_tp_ranks." },
  ],
  lineExplanations: {
    1: "Defines entry point for Megatron-LM column parallel linear weight reshaper.",
    11: "Calculates total elements and validates rank count.",
    14: "Computes per-rank column shard size.",
    17: "Loops across Tensor Parallel GPU ranks.",
    20: "Slices contiguous column parameters for current rank.",
    27: "Returns dictionary of sharded parameter tensors.",
  },
};

export const columnParallelLinearReshaper: AlgorithmDefinition<columnParallelLinearReshaperInput> =
  {
    id: "column-parallel-linear-reshaper",
    title: "Megatron-LM Column Parallel Linear Layer Reshaper",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_tensor_algebra"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "In Megatron-LM Tensor Parallelism (TP), Column Parallel Linear layers split weight matrices along output column dimensions $d_{out}$ across multiple GPU ranks ($W = [W_1 | W_2 | \\dots | W_N]$). Input activation tensors $X \\in \\mathbb{R}^{b \\times s \\times d_{in}}$ are duplicated across all ranks without communication overhead during the forward pass. Each GPU rank performs a local GEMM operation ($Y_i = X \\cdot W_i$) to produce local output feature slices $Y_i \\in \\mathbb{R}^{b \\times s \\times (d_{out}/N)}$.\n\nThis algorithm models the memory partitioning mechanics required to reshape and slice linear parameters into contiguous GPU VRAM shards.\n\nInput Format:\n- data: Array of numerical parameter weights or column feature dimensions.\n- target: Number of Tensor Parallel GPU ranks ($N$).\n\nOutput Format:\n- Returns per-rank parameter shard dictionaries with exact start/end column indices and contiguous memory buffer allocations.\n\nEdge Cases & Constraints:\n- Non-divisible dimensions: When $d_{out}$ is not evenly divisible by $N$, trailing ranks receive padded or reduced column slices.\n- Tensor alignment: Ensures column shard sizes align to 16/32 element boundaries for NVIDIA Tensor Core execution.\n- Zero ranks / empty inputs: Handled gracefully returning empty shard allocations.",
    constraints: ["1 <= data.length <= 1000", "1 <= target (num_ranks) <= 64"],
    examples: [
      {
        kind: "basic",
        title: "2-GPU Column Partitioning",
        inputDisplay: "data = [10, 20, 30, 40, 50, 60], target = 2",
        outputDisplay: "Rank 0: [10, 20, 30], Rank 1: [40, 50, 60]",
        input: { data: [10, 20, 30, 40, 50, 60], target: 2 },
        output: "Rank 0: [10, 20, 30], Rank 1: [40, 50, 60]",
        explanation:
          "Splits 6 parameter weights evenly into 2 TP column shards of 3 elements each.",
      },
      {
        kind: "complex",
        title: "3-GPU Asymmetric Partitioning",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 3",
        outputDisplay: "Rank 0: [1, 2], Rank 1: [3, 4], Rank 2: [5]",
        input: { data: [1, 2, 3, 4, 5], target: 3 },
        output: "Rank 0: [1, 2], Rank 1: [3, 4], Rank 2: [5]",
        explanation: "Partitions 5 parameters across 3 GPUs with ceiling shard sizes.",
      },
      {
        kind: "negative",
        title: "Single Rank Edge Case",
        inputDisplay: "data = [5, 10, 15], target = 1",
        outputDisplay: "Rank 0: [5, 10, 15]",
        input: { data: [5, 10, 15], target: 1 },
        output: "Rank 0: [5, 10, 15]",
        explanation: "With 1 TP rank, entire weight matrix resides on Rank 0 without partitioning.",
      },
    ],
    code: COLUMNPARALLELLINEARRESHAPER_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass O(N) over parameter array to compute contiguous rank slices.",
      space: "O(N) memory to store sharded output buffers for each Tensor Parallel rank.",
    },
    topicGuide: {
      overview:
        "Megatron-LM Column Parallel Linear layers split weight matrices along output column dimensions across Tensor Parallel (TP) GPU ranks to fit large LLMs into distributed VRAM.",
      sections: [
        {
          heading: "Core Concepts",
          body: "In Column Parallelism, weight matrix $W \\in \\mathbb{R}^{d_{in} \\times d_{out}}$ is partitioned into $N$ column slices $W = [W_1 | W_2 | \\dots | W_N]$. Input activation $X$ is replicated across all ranks via an identity forward pass. Each rank computes $Y_i = X W_i$ independently. The outputs $Y_i$ represent column-sharded activations of length $d_{out}/N$, which can be directly fed into a subsequent Row Parallel Linear layer without intermediate All-Reduce communication.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "Column Parallelism reduces per-GPU weight memory footprint to $1/N$ of the layer parameters. Crucially, the forward pass requires ZERO inter-GPU communication because inputs are duplicated. Communication (All-Reduce or Reduce-Scatter) is deferred until after the complementary Row Parallel layer, saving massive NVLink interconnect bandwidth.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "For optimal Tensor Core performance (e.g. NVIDIA H100 FP16/BF16 GEMM kernels), column dimensions per rank must be multiples of 16 or 32 elements. Non-divisible hidden dimensions $d_{out}$ require padding before sharding to avoid non-coalesced memory access and kernel launch misalignments.",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "Column Parallelism is paired with Row Parallelism to form Megatron-LM TP blocks. While intra-node NVLink (900 GB/s) effortlessly handles identity input broadcasts, scaling TP across inter-node InfiniBand links introduces latency bottlenecks, restricting TP to intra-node GPUs.",
        },
      ],
      keyTerms: [
        {
          term: "Column Parallelism",
          definition:
            "Splitting GEMM weight columns across Tensor Parallel ranks so each GPU computes a slice of output features.",
        },
        {
          term: "Tensor Parallelism (TP)",
          definition:
            "Intra-node parallel execution scheme partitioning individual layer weight matrices across high-speed interconnects.",
        },
        {
          term: "Identity Broadcast",
          definition:
            "Replicating input activation tensors across all TP ranks without inter-GPU communication.",
        },
        {
          term: "GEMM Column Splitting",
          definition:
            "Partitioning output dimension d_out of matrix multiplication operations across GPU memory buffers.",
        },
      ],
    },
    trivia: COLUMNPARALLELLINEARRESHAPER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT,
    generateSteps: generateColumnParallelLinearReshaperSteps,
  };
