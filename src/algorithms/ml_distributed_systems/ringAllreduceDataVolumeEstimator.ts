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
    11,
    `Compute Total Tensor Payload total_tensor_bytes = ${(totalTensorBytes / 1e6).toFixed(1)} MB`,
    `Summing partition sizes across ${N} tensor blocks.`,
    { total_tensor_bytes: totalTensorBytes },
    [...elements],
  );

  addStep(
    12,
    "Check Number of GPUs Guard (num_gpus <= 1)",
    `Validating world size ${N} > 1. Inter-GPU communication is required.`,
    { num_gpus: N, is_single_gpu: false },
    [...elements],
  );

  const chunkSize = totalTensorBytes / N;
  addStep(
    20,
    `Compute Chunk Size Per GPU chunk_size = ${(chunkSize / 1e6).toFixed(2)} MB`,
    `Partitioning total payload into ${N} equal ring chunks: ${(totalTensorBytes / 1e6).toFixed(1)} MB / ${N} = ${(chunkSize / 1e6).toFixed(2)} MB.`,
    { num_gpus: N, total_tensor_bytes: totalTensorBytes, chunk_size: chunkSize },
    [...elements],
  );

  const scatterReduceBytes = (N - 1) * chunkSize;
  addStep(
    21,
    `Compute Scatter-Reduce Transfer Volume per GPU = ${(scatterReduceBytes / 1e6).toFixed(2)} MB`,
    `Phase 1 (Scatter-Reduce): (${N} - 1) * ${(chunkSize / 1e6).toFixed(2)} MB = ${(scatterReduceBytes / 1e6).toFixed(2)} MB sent per GPU.`,
    { num_gpus: N, chunk_size: chunkSize, scatter_reduce_bytes: scatterReduceBytes },
    [...elements],
  );

  const allgatherBytes = (N - 1) * chunkSize;
  addStep(
    22,
    `Compute All-Gather Transfer Volume per GPU = ${(allgatherBytes / 1e6).toFixed(2)} MB`,
    `Phase 2 (All-Gather): (${N} - 1) * ${(chunkSize / 1e6).toFixed(2)} MB = ${(allgatherBytes / 1e6).toFixed(2)} MB sent per GPU.`,
    { num_gpus: N, chunk_size: chunkSize, allgather_bytes: allgatherBytes },
    [...elements],
  );

  const perGpuTransferred = scatterReduceBytes + allgatherBytes;
  addStep(
    23,
    `Compute Total Transferred Volume per GPU = ${(perGpuTransferred / 1e6).toFixed(2)} MB`,
    `Sum of Scatter-Reduce + All-Gather per GPU: 2 * (${N}-1)/${N} * ${(totalTensorBytes / 1e6).toFixed(1)} MB = ${(perGpuTransferred / 1e6).toFixed(2)} MB.`,
    { scatter_reduce_bytes: scatterReduceBytes, allgather_bytes: allgatherBytes, per_gpu_transferred: perGpuTransferred },
    [...elements],
  );

  const totalNetworkTransferred = N * perGpuTransferred;
  addStep(
    24,
    `Compute Total Network Traffic Across Ring = ${(totalNetworkTransferred / 1e6).toFixed(2)} MB`,
    `Cluster-wide traffic: ${N} GPUs * ${(perGpuTransferred / 1e6).toFixed(2)} MB = ${(totalNetworkTransferred / 1e6).toFixed(2)} MB total network traffic.`,
    { num_gpus: N, per_gpu_transferred: perGpuTransferred, total_network_transferred: totalNetworkTransferred },
    [...elements],
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? ("active" as const) : ("compare" as const),
          pointers: [`GPU_${idx}`, `Transferred: ${(perGpuTransferred / 1e6).toFixed(1)}MB`],
        };
      if (i < idx) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      24,
      `Evaluate GPU Rank ${idx} Shard Traffic (Payload ${val} MB)`,
      `GPU ${idx} sends ${(perGpuTransferred / 1e6).toFixed(2)} MB total over $2(${N}-1)$ ring transfer steps.`,
      { idx, shard_size: val, per_gpu_transferred: perGpuTransferred, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    pointers: ["Ring Complete"],
  }));

  addStep(
    26,
    "Construct Output Metrics Dictionary",
    "Assembling Ring-AllReduce communication volume summary payload.",
    { total_network_transferred: totalNetworkTransferred },
    finalElements,
  );

  addStep(
    27,
    `Set scatter_reduce_bytes = ${(scatterReduceBytes / 1e6).toFixed(2)} MB`,
    "Assigning Scatter-Reduce per-GPU volume metric.",
    { scatter_reduce_bytes: scatterReduceBytes },
    finalElements,
  );

  addStep(
    28,
    `Set allgather_bytes = ${(allgatherBytes / 1e6).toFixed(2)} MB`,
    "Assigning All-Gather per-GPU volume metric.",
    { allgather_bytes: allgatherBytes },
    finalElements,
  );

  addStep(
    29,
    `Set per_gpu_transferred = ${(perGpuTransferred / 1e6).toFixed(2)} MB`,
    "Assigning total per-GPU volume metric.",
    { per_gpu_transferred: perGpuTransferred },
    finalElements,
  );

  addStep(
    30,
    `Set total_network_transferred = ${(totalNetworkTransferred / 1e6).toFixed(2)} MB`,
    "Assigning aggregate cluster network traffic volume metric.",
    { total_network_transferred: totalNetworkTransferred },
    finalElements,
  );

  addStep(
    31,
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
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 19, 25],
  distractors: [
    "total_network_transferred = total_tensor_bytes * num_gpus",
    "per_gpu_transferred = total_tensor_bytes * 2",
    "scatter_reduce_bytes = total_tensor_bytes / (num_gpus - 1)",
    "per_gpu_transferred = scatter_reduce_bytes * num_gpus",
  ],
  hints: [
    { line: 20, hint: "Chunk size per GPU = total_tensor_bytes / num_gpus." },
    { line: 21, hint: "Scatter-Reduce transfers (num_gpus - 1) * chunk_size bytes per GPU." },
    { line: 22, hint: "All-Gather transfers (num_gpus - 1) * chunk_size bytes per GPU." },
    { line: 23, hint: "Total per GPU transferred = scatter_reduce_bytes + allgather_bytes = 2 * (N-1)/N * S." },
  ],
  lineExplanations: {
    1: "Function signature for estimate_ring_allreduce_volume taking tensor_sizes list and num_gpus.",
    2: "Docstring start describing Ring-AllReduce network data volume calculation.",
    3: "Describes per-GPU network communication volume estimation.",
    4: "Blank line in docstring.",
    5: "Describes total model payload size S bytes and N GPUs.",
    6: "Explains Scatter-Reduce phase transfer volume: (N-1)/N * S bytes.",
    7: "Explains All-Gather phase transfer volume: (N-1)/N * S bytes.",
    8: "Explains total per-rank transferred volume: 2 * (N-1)/N * S bytes.",
    9: "Explains total cluster network traffic: 2 * (N-1) * S bytes.",
    10: "Docstring close.",
    11: "Calculates total_tensor_bytes by summing tensor_sizes list.",
    12: "Checks guard condition for single GPU or empty world size (num_gpus <= 1).",
    13: "Opens return dictionary for zero communication edge case.",
    14: "Sets scatter_reduce_bytes to 0.0.",
    15: "Sets allgather_bytes to 0.0.",
    16: "Sets per_gpu_transferred to 0.0.",
    17: "Sets total_network_transferred to 0.0.",
    18: "Closes zero-communication return dictionary payload.",
    19: "Blank line before ring bandwidth calculations.",
    20: "Calculates chunk_size by dividing total_tensor_bytes by num_gpus.",
    21: "Calculates scatter_reduce_bytes = (num_gpus - 1) * chunk_size.",
    22: "Calculates allgather_bytes = (num_gpus - 1) * chunk_size.",
    23: "Calculates per_gpu_transferred by summing scatter_reduce_bytes and allgather_bytes.",
    24: "Calculates total_network_transferred = num_gpus * per_gpu_transferred.",
    25: "Blank line before returning output payload.",
    26: "Opens return dictionary payload.",
    27: "Sets scatter_reduce_bytes field in return dictionary.",
    28: "Sets allgather_bytes field in return dictionary.",
    29: "Sets per_gpu_transferred field in return dictionary.",
    30: "Sets total_network_transferred field in return dictionary.",
    31: "Closes return dictionary payload and returns result.",
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
