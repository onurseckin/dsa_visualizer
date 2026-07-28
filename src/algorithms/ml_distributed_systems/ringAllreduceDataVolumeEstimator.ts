import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ringAllreduceDataVolumeEstimatorInput {
  data: number[];
  target?: number;
}

export const RINGALLREDUCEDATAVOLUMEESTIMATOR_CODE = `def estimate_ring_allreduce_volume(tensor_sizes, num_gpus):
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
    data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
    target: 50,
  };

export const generateRingAllreduceDataVolumeEstimatorSteps = (
  input: ringAllreduceDataVolumeEstimatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const N = input.data.length;
  const totalTensorBytes = input.data.reduce((sum, val) => sum + val, 0) * 1_000_000;

  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `gpu-${idx}`,
    value: val,
    label: `GPU ${idx}`,
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
          num_gpus: String(N),
          total_tensor_bytes: (totalTensorBytes / 1e6).toFixed(1) + " MB",
          data: `[${input.data.join(", ")}]`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Ring-AllReduce Total Data Volume Estimator",
    `Configuring network volume analysis for total payload ${(totalTensorBytes / 1e6).toFixed(1)} MB across ${N} GPUs.`,
    { num_gpus: N, total_tensor_bytes: totalTensorBytes },
    [...elements],
  );

  addStep(
    2,
    `Compute Total Tensor Payload total_tensor_bytes = ${(totalTensorBytes / 1e6).toFixed(1)} MB`,
    `Summing partition sizes across ${N} tensor blocks: ${(totalTensorBytes / 1e6).toFixed(1)} MB total.`,
    { total_tensor_bytes: totalTensorBytes },
    elements.map((el) => ({ ...el, state: "active" as const })),
  );

  if (N <= 1) {
    addStep(
      3,
      "Check Number of GPUs Guard (num_gpus <= 1)",
      `World size ${N} <= 1: Single GPU detected, no inter-GPU network communication is required.`,
      { num_gpus: N, is_single_gpu: true },
      elements.map((el) => ({ ...el, state: "active" as const })),
    );

    addStep(
      4,
      "Return Zero Network Communication Metrics",
      "Single GPU execution requires zero inter-GPU network transfer bytes.",
      {
        scatter_reduce_bytes: 0,
        allgather_bytes: 0,
        per_gpu_transferred: 0,
        total_network_transferred: 0,
      },
      elements.map((el) => ({ ...el, state: "sorted" as const, pointers: ["Transferred: 0 MB"] })),
    );

    return steps;
  }

  addStep(
    3,
    "Check Number of GPUs Guard (num_gpus <= 1)",
    `Validating world size ${N} > 1. Inter-GPU ring communication is required.`,
    { num_gpus: N, is_single_gpu: false },
    [...elements],
  );

  const chunkSize = totalTensorBytes / N;
  addStep(
    11,
    `Compute Chunk Size Per GPU chunk_size = ${(chunkSize / 1e6).toFixed(2)} MB`,
    `Partitioning total payload into ${N} equal ring chunks: ${(totalTensorBytes / 1e6).toFixed(1)} MB / ${N} = ${(chunkSize / 1e6).toFixed(2)} MB per chunk.`,
    { num_gpus: N, total_tensor_bytes: totalTensorBytes, chunk_size: chunkSize },
    elements.map((el) => ({
      ...el,
      state: "active" as const,
      pointers: [`Chunk: ${(chunkSize / 1e6).toFixed(2)} MB`],
    })),
  );

  const scatterReduceBytes = (N - 1) * chunkSize;
  addStep(
    12,
    `Compute Scatter-Reduce Transfer Volume per GPU = ${(scatterReduceBytes / 1e6).toFixed(2)} MB`,
    `Phase 1 (Scatter-Reduce): Each GPU sends (${N} - 1) chunks of ${(chunkSize / 1e6).toFixed(2)} MB = ${(scatterReduceBytes / 1e6).toFixed(2)} MB over ${N - 1} ring steps.`,
    { num_gpus: N, chunk_size: chunkSize, scatter_reduce_bytes: scatterReduceBytes },
    elements.map((el) => ({
      ...el,
      state: "compare" as const,
      pointers: [`Scatter-Reduce: ${(scatterReduceBytes / 1e6).toFixed(2)} MB`],
    })),
  );

  const allgatherBytes = (N - 1) * chunkSize;
  addStep(
    13,
    `Compute All-Gather Transfer Volume per GPU = ${(allgatherBytes / 1e6).toFixed(2)} MB`,
    `Phase 2 (All-Gather): Each GPU sends (${N} - 1) chunks of ${(chunkSize / 1e6).toFixed(2)} MB = ${(allgatherBytes / 1e6).toFixed(2)} MB over ${N - 1} ring steps.`,
    { num_gpus: N, chunk_size: chunkSize, allgather_bytes: allgatherBytes },
    elements.map((el) => ({
      ...el,
      state: "swap" as const,
      pointers: [`All-Gather: ${(allgatherBytes / 1e6).toFixed(2)} MB`],
    })),
  );

  const perGpuTransferred = scatterReduceBytes + allgatherBytes;
  addStep(
    14,
    `Compute Total Transferred Volume per GPU = ${(perGpuTransferred / 1e6).toFixed(2)} MB`,
    `Sum of Scatter-Reduce + All-Gather per GPU: 2 * (${N}-1)/${N} * ${(totalTensorBytes / 1e6).toFixed(1)} MB = ${(perGpuTransferred / 1e6).toFixed(2)} MB.`,
    {
      scatter_reduce_bytes: scatterReduceBytes,
      allgather_bytes: allgatherBytes,
      per_gpu_transferred: perGpuTransferred,
    },
    elements.map((el) => ({
      ...el,
      state: "active" as const,
      pointers: [`Per GPU: ${(perGpuTransferred / 1e6).toFixed(2)} MB`],
    })),
  );

  const totalNetworkTransferred = N * perGpuTransferred;
  addStep(
    15,
    `Compute Total Network Traffic Across Ring = ${(totalNetworkTransferred / 1e6).toFixed(2)} MB`,
    `Cluster-wide traffic across all ${N} GPUs: ${N} GPUs * ${(perGpuTransferred / 1e6).toFixed(2)} MB = ${(totalNetworkTransferred / 1e6).toFixed(2)} MB total network traffic.`,
    {
      num_gpus: N,
      per_gpu_transferred: perGpuTransferred,
      total_network_transferred: totalNetworkTransferred,
    },
    elements.map((el) => ({
      ...el,
      state: "visited" as const,
      pointers: [`Cluster Vol: ${(totalNetworkTransferred / 1e6).toFixed(2)} MB`],
    })),
  );

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    pointers: [`Per GPU: ${(perGpuTransferred / 1e6).toFixed(2)} MB`],
  }));

  addStep(
    17,
    "Return Ring-AllReduce Data Volume Estimation",
    `Completed estimation for ${N} GPUs. Per-GPU transferred: ${(perGpuTransferred / 1e6).toFixed(2)} MB; Cluster total: ${(totalNetworkTransferred / 1e6).toFixed(2)} MB.`,
    {
      completed: true,
      scatter_reduce_bytes: scatterReduceBytes,
      allgather_bytes: allgatherBytes,
      per_gpu_transferred: perGpuTransferred,
      total_network_transferred: totalNetworkTransferred,
    },
    finalElements,
  );

  return steps;
};

const RINGALLREDUCEDATAVOLUMEESTIMATOR_TRIVIA: TriviaMeta = {
  skipLines: [4, 5, 6, 7, 8, 9, 10, 16, 17, 18, 19, 20, 21, 22],
  distractors: [
    "total_network_transferred = total_tensor_bytes * num_gpus",
    "per_gpu_transferred = total_tensor_bytes * 2",
    "scatter_reduce_bytes = total_tensor_bytes / (num_gpus - 1)",
    "per_gpu_transferred = scatter_reduce_bytes * num_gpus",
  ],
  hints: [
    { line: 11, hint: "Chunk size per GPU = total_tensor_bytes / num_gpus." },
    { line: 12, hint: "Scatter-Reduce transfers (num_gpus - 1) * chunk_size bytes per GPU." },
    { line: 13, hint: "All-Gather transfers (num_gpus - 1) * chunk_size bytes per GPU." },
    {
      line: 14,
      hint: "Total per GPU transferred = scatter_reduce_bytes + allgather_bytes = 2 * (N-1)/N * S.",
    },
  ],
  lineExplanations: {
    1: "Function signature for estimate_ring_allreduce_volume taking tensor_sizes list and num_gpus.",
    2: "Calculates total_tensor_bytes by summing tensor_sizes list.",
    3: "Checks guard condition for single GPU or empty world size (num_gpus <= 1).",
    4: "Opens return dictionary for zero communication edge case.",
    5: "Sets scatter_reduce_bytes to 0.0.",
    6: "Sets allgather_bytes to 0.0.",
    7: "Sets per_gpu_transferred to 0.0.",
    8: "Sets total_network_transferred to 0.0.",
    9: "Closes zero-communication return dictionary payload.",
    10: "Blank line before ring bandwidth calculations.",
    11: "Calculates chunk_size by dividing total_tensor_bytes by num_gpus.",
    12: "Calculates scatter_reduce_bytes = (num_gpus - 1) * chunk_size.",
    13: "Calculates allgather_bytes = (num_gpus - 1) * chunk_size.",
    14: "Calculates per_gpu_transferred by summing scatter_reduce_bytes and allgather_bytes.",
    15: "Calculates total_network_transferred = num_gpus * per_gpu_transferred.",
    16: "Blank line before returning output payload.",
    17: "Opens return dictionary payload.",
    18: "Sets scatter_reduce_bytes field in return dictionary.",
    19: "Sets allgather_bytes field in return dictionary.",
    20: "Sets per_gpu_transferred field in return dictionary.",
    21: "Sets total_network_transferred field in return dictionary.",
    22: "Closes return dictionary payload and returns result.",
  },
};

export const ringAllreduceDataVolumeEstimator: AlgorithmDefinition<ringAllreduceDataVolumeEstimatorInput> =
  {
    id: "ring-allreduce-data-volume-estimator",
    title: "Ring-AllReduce Total Data Volume Estimator",
    topicIds: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Easy",
    description:
      "Calculates the exact per-GPU and aggregate cluster network communication volume transferred during a standard Ring-AllReduce collective operation (as implemented in NCCL, Gloo, and Horovod).\n\n### Mathematical Formulation & Asymptotics\nIn a Ring-AllReduce over $N$ ranks with a model payload or gradient tensor of total size $S$ bytes:\n1. The tensor is split into $N$ equal chunks of size $\\frac{S}{N}$.\n2. **Scatter-Reduce Phase**: Executes $N-1$ logical ring transfer steps. In each step, every rank sends one chunk of size $\\frac{S}{N}$ to its successor and receives one chunk from its predecessor, accumulating partial gradients element-wise. Volume per rank:\n$$V_{\\text{Scatter-Reduce}} = \\left(\\frac{N-1}{N}\\right) S \\text{ bytes}$$\n3. **All-Gather Phase**: Executes $N-1$ logical ring transfer steps to share the fully reduced chunks across all ranks. Volume per rank:\n$$V_{\\text{All-Gather}} = \\left(\\frac{N-1}{N}\\right) S \\text{ bytes}$$\n\nTotal network bytes transferred per GPU rank is:\n$$V_{\\text{GPU}} = V_{\\text{Scatter-Reduce}} + V_{\\text{All-Gather}} = 2 \\cdot \\left(\\frac{N-1}{N}\\right) S \\text{ bytes}$$\nTotal network bytes transferred cluster-wide is:\n$$V_{\\text{Cluster}} = N \\cdot V_{\\text{GPU}} = 2 \\cdot (N-1) S \\text{ bytes}$$\n\nNotice that as $N$ grows large ($N \\to \\infty$):\n$$\\lim_{N \\to \\infty} V_{\\text{GPU}} = 2S$$\nThis property makes the communication footprint per GPU virtually independent of the number of ranks $N$, enabling Ring-AllReduce to scale efficiently to hundreds of GPUs.\n\nInput Format:\n- `data`: Array of tensor partition sizes or chunk memory values in MB/GB.\n- `target`: Optional target rank or partition marker.\n\nOutput Format:\n- Returns detailed dictionary containing per-GPU transferred volume, phase-specific bytes, and total cluster communication footprint.\n\nEdge Cases & Constraints:\n- Single GPU ($N=1$): Transferred volume is strictly 0 bytes.\n- Uneven padding: Tensors non-divisible by $N$ require tail padding to avoid unaligned chunk splits.\n- Bandwidth saturation: Maximum ring throughput is bounded by the slowest interconnect link in the ring cycle.",
    constraints: ["1 <= data.length <= 1000", "0 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 GPUs Ring Volume Estimation",
        inputDisplay: "16 data blocks, target = 50",
        outputDisplay: "Per GPU Transferred: 2 * (15/16) * S",
        input: DEFAULT_RINGALLREDUCEDATAVOLUMEESTIMATOR_INPUT,
        output: "Per GPU and cluster total volumes returned",
        explanation: "Evaluates Ring-AllReduce data volume across 16 ranks.",
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
          body: "In Data Parallel (DP) model training, every GPU maintains a replica of the model parameters and computes gradients on distinct micro-batches. Before the optimizer step, all GPUs must average their local gradients to synchronize model weights. Naive Parameter Server architectures suffer from $\\mathcal{O}(N)$ network bottlenecks at the parameter server node. Ring-AllReduce achieves optimal bandwidth utilization by partitioning the tensor into $N$ equal chunks and ring-pipelining transfers.",
        },
        {
          heading: "Core Concepts & Bandwidth Derivation",
          body: "For a tensor of total size $S$ bytes across $N$ GPUs:\n- In Scatter-Reduce, each rank sends a chunk of size $S/N$ to its neighbor in each of the $N-1$ steps. Total data sent per rank = $\\frac{N-1}{N} S$.\n- In All-Gather, each rank sends a fully reduced chunk of size $S/N$ to its neighbor in each of the $N-1$ steps. Total data sent per rank = $\\frac{N-1}{N} S$.\nSumming both phases yields $V_{\\text{GPU}} = 2 \\frac{N-1}{N} S$. As $N \\to \\infty$, the total data transferred per GPU asymptotically approaches $2S$, regardless of cluster size!",
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
