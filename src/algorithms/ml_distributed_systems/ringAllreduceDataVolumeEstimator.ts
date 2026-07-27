import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ringAllreduceDataVolumeEstimatorInput {
  data: number[];
  target?: number;
}

export const RINGALLREDUCEDATAVOLUMEESTIMATOR_CODE = `def estimate_ring_allreduce_volume(tensor_sizes, num_gpus):
    """
    Estimates total network communication volume per GPU during Ring-AllReduce collective operation.
    
    For N GPUs and total model payload size S bytes:
    - Scatter-Reduce phase transfers (N-1)/N * S bytes per rank.
    - All-Gather phase transfers (N-1)/N * S bytes per rank.
    - Total data transferred per rank = 2 * (N-1)/N * S bytes.
    - Total network traffic across entire ring = 2 * (N-1) * S bytes.
    """
    total_tensor_bytes = sum(tensor_sizes)
    if num_gpus <= 1:
        return {
            "scatter_reduce_bytes": 0.0,
            "allgather_bytes": 0.0,
            "per_gpu_transferred": 0.0,
            "total_network_transferred": 0.0
        }

    chunk_size = total_tensor_bytes / num_gpus
    scatter_reduce_bytes = (num_gpus - 1) * chunk_size
    allgather_bytes = (num_gpus - 1) * chunk_size
    per_gpu_transferred = scatter_reduce_bytes + allgather_bytes
    total_network_transferred = num_gpus * per_gpu_transferred

    return {
        "scatter_reduce_bytes": scatter_reduce_bytes,
        "allgather_bytes": allgather_bytes,
        "per_gpu_transferred": per_gpu_transferred,
        "total_network_transferred": total_network_transferred
    }
`;

export const DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT: ringAllreduceDataVolumeEstimatorInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateRingAllreduceDataVolumeEstimatorSteps = (
  input: ringAllreduceDataVolumeEstimatorInput,
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
    "Initialize Ring-AllReduce Total Data Volume Estimator",
    "Setting up tensor shard array, ring topology sizes, and volume formulas.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      14,
      `Evaluate shard block ${idx}: size = ${val} MB`,
      `Calculating per-rank Scatter-Reduce and All-Gather transfer traffic for block ${idx}.`,
      { idx, shard_size: val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    23,
    "Execution Complete",
    "Successfully computed total Ring-AllReduce communication volume across all ring nodes.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const RINGALLREDUCEDATAVOLUMEESTIMATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "total_network_transferred = total_tensor_bytes * num_gpus",
    "per_gpu_transferred = total_tensor_bytes * 2",
    "scatter_reduce_bytes = total_tensor_bytes / (num_gpus - 1)",
  ],
  hints: [
    { line: 18, hint: "Each rank transfers (N-1)/N * S in Scatter-Reduce and All-Gather phases." },
  ],
  lineExplanations: {
    1: "Defines entry point for estimate_ring_allreduce_volume.",
    13: "Checks if world size is 1 (no communication required).",
    18: "Computes payload chunk size per ring rank (S / N).",
    21: "Summing Scatter-Reduce and All-Gather gives total volume per GPU: 2 * (N-1)/N * S.",
  },
};

export const ringAllreduceDataVolumeEstimator: AlgorithmDefinition<ringAllreduceDataVolumeEstimatorInput> =
  {
    id: "ring-allreduce-data-volume-estimator",
    title: "Ring-AllReduce Total Data Volume Estimator",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Calculates the exact per-GPU and aggregate cluster network communication volume transferred during a standard Ring-AllReduce collective operation (as implemented in NCCL, Gloo, and Horovod).\n\nIn a Ring-AllReduce over $N$ ranks with a model payload or gradient tensor of total size $S$ bytes:\n1. The tensor is split into $N$ equal chunks of size $S/N$.\n2. Scatter-Reduce Phase: Executes $N-1$ logical ring transfer steps. In each step, every rank sends one chunk to its successor and receives one chunk from its predecessor, accumulating partial gradients element-wise. Volume per rank = $\\frac{N-1}{N} S$.\n3. All-Gather Phase: Executes $N-1$ logical ring transfer steps to share the fully reduced chunks across all ranks. Volume per rank = $\\frac{N-1}{N} S$.\n\nTotal network bytes transferred per rank: $V_{\\text{GPU}} = 2 \\cdot \\frac{N-1}{N} \\cdot S$.\nTotal network bytes transferred cluster-wide: $V_{\\text{Cluster}} = 2 \\cdot (N-1) \\cdot S$.\n\nNotice that as $N$ grows large, $V_{\\text{GPU}} \\to 2S$, making the communication footprint per GPU virtually independent of the number of ranks $N$! This property enables Ring-AllReduce to scale efficiently to hundreds of GPUs.\n\nInput Format:\n- data: Array of tensor partition sizes or chunk memory values in MB/GB.\n- target: Optional target rank or partition marker.\n\nOutput Format:\n- Returns detailed dictionary containing per-GPU transferred volume, phase-specific bytes, and total cluster communication footprint.\n\nEdge Cases & Constraints:\n- Single GPU ($N=1$): Transferred volume is strictly 0 bytes.\n- Uneven padding: Tensors non-divisible by $N$ require tail padding to avoid unaligned chunk splits.\n- Bandwidth saturation: Maximum ring throughput is bounded by the slowest interconnect link in the ring cycle.",
    constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard 4-GPU Ring",
        inputDisplay: "tensor_sizes = [10, 20, 30, 40] (total 100 MB), target = 30",
        outputDisplay: "Per GPU Transferred = 150 MB, Total Network = 600 MB",
        input: { data: [10, 20, 30, 40], target: 30 },
        output: "Per GPU: 150 MB, Total: 600 MB",
        explanation: "With S=100MB and N=4 GPUs, each GPU sends 2 * (3/4) * 100 = 150 MB.",
      },
      {
        kind: "complex",
        title: "Large 8-GPU Cluster Shard",
        inputDisplay: "tensor_sizes = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "Per GPU Transferred = 22.5 MB",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "Per GPU: 22.5 MB",
        explanation: "Evaluates volume scaling for N=5 ranks and S=15MB.",
      },
      {
        kind: "negative",
        title: "Single Node Edge Case",
        inputDisplay: "tensor_sizes = [50], target = 50",
        outputDisplay: "Per GPU Transferred = 0 MB",
        input: { data: [50], target: 50 },
        output: "Per GPU: 0 MB",
        explanation: "Single rank requires zero inter-GPU network transfers.",
      },
    ],
    code: RINGALLREDUCEDATAVOLUMEESTIMATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) direct closed-form formula evaluation.",
      space: "O(1) scalar auxiliary memory for transfer accounting.",
    },
    topicGuide: {
      overview:
        "Ring-AllReduce is the foundational collective communication algorithm powering distributed deep learning frameworks like PyTorch DDP and NVIDIA NCCL. By arranging participating GPUs into a logical unidirectional ring, it splits large gradient payloads into chunks and pipelines their transmission, avoiding central server bandwidth bottlenecks.",
      sections: [
        {
          heading: "Overview & Problem Context",
          body: "In Data Parallel (DP) model training, every GPU maintains a replica of the model parameters and computes gradients on distinct micro-batches. Before the optimizer step, all GPUs must average their local gradients to synchronize model weights. Naive Parameter Server architectures suffer from $O(N)$ network bottlenecks at the parameter server node. Ring-AllReduce achieves optimal bandwidth utilization by partitioning the tensor into $N$ equal chunks and ring-pipelining transfers.",
        },
        {
          heading: "Core Concepts & Bandwidth Derivation",
          body: "For a tensor of total size $S$ bytes across $N$ GPUs:\n- In Scatter-Reduce, each rank sends a chunk of size $S/N$ to its neighbor in each of the $N-1$ steps. Total data sent per rank = $(N-1)/N \\cdot S$.\n- In All-Gather, each rank sends a fully reduced chunk of size $S/N$ to its neighbor in each of the $N-1$ steps. Total data sent per rank = $(N-1)/N \\cdot S$.\nSumming both phases yields $V_{\\text{GPU}} = 2 \\frac{N-1}{N} S$. As $N \\to \\infty$, the total data transferred per GPU asymptotically approaches $2S$, regardless of cluster size!",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "From a systems perspective, Ring-AllReduce achieves theoretical peak efficiency because every link in the ring topology transfers data simultaneously. However, because the algorithm is synchronous and ring-structured, the overall transfer rate is throttled by the slowest link in the ring (e.g. an inter-node PCIe/InfiniBand bottleneck mixed with intra-node NVLink links). Modern collective communication libraries like NCCL construct ring paths that carefully group high-speed intra-node connections before crossing inter-node boundaries.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "When implementing Ring-AllReduce in hardware kernels:\n- Tensors must be divisible by $N$; otherwise, padding bytes must be appended before chunking.\n- Multi-ring algorithms (e.g., 2D Ring or Tree-Ring hybrids) are preferred on extremely large clusters ($N > 256$) to lower communication latency ($2(N-1)$ latency steps vs $2\\log_2 N$ steps for trees).\n- Gradient accumulation buffers are kept in FP32 to prevent float16 precision underflow during intermediate ring additions.",
        },
      ],
      keyTerms: [
        {
          term: "Ring-AllReduce",
          definition:
            "A distributed collective communication algorithm that computes element-wise reductions across $N$ nodes arranged in a ring without central bottlenecks.",
        },
        {
          term: "Scatter-Reduce",
          definition:
            "The first phase of Ring-AllReduce where partial sums are accumulated across $N-1$ ring steps, leaving each GPU with one fully reduced tensor chunk.",
        },
        {
          term: "All-Gather",
          definition:
            "The second phase of Ring-AllReduce where fully reduced tensor chunks are shared across all ranks over $N-1$ ring steps.",
        },
        {
          term: "Bisection Bandwidth",
          definition:
            "The minimum bandwidth between two equal halves of a network topology, which limits collective communication throughput.",
        },
      ],
    },
    trivia: RINGALLREDUCEDATAVOLUMEESTIMATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT,
    generateSteps: generateRingAllreduceDataVolumeEstimatorSteps,
  };
