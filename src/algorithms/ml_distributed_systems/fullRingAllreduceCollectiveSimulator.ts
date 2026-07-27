import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fullRingAllreduceCollectiveSimulatorInput {
  data: number[];
  target?: number;
}

export const FULLRINGALLREDUCECOLLECTIVESIMULATOR_CODE = `def full_ring_allreduce_collective_simulator(ring_ranks: list[int], parameter_shards: list[list[float]]) -> list[list[float]]:
    """
    Simulates complete 2*(N-1) step Ring-AllReduce collective communication algorithm across GPU ranks.
    Phase 1: Scatter-Reduce (N-1 steps) - accumulates gradient tensor chunks ring-wise.
    Phase 2: All-Gather (N-1 steps) - redistributes fully reduced chunks so every rank holds the total sum.

    Input:
        ring_ranks: List of GPU rank IDs forming the logical ring topology.
        parameter_shards: List of tensor chunk lists for each GPU rank.

    Output:
        List of fully synchronized and reduced parameter tensor lists for each GPU rank.
    """
    num_nodes = len(ring_ranks)
    if num_nodes == 0 or not parameter_shards:
        return []

    shard_buffers = [list(shard) for shard in parameter_shards]

    # Phase 1: Scatter-Reduce across circular ring topology (N-1 steps)
    for step in range(num_nodes - 1):
        temp_buffers = [list(b) for b in shard_buffers]
        for rank in range(num_nodes):
            send_idx = (rank - step) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] += temp_buffers[rank][send_idx]

    # Phase 2: AllGather across circular ring topology (N-1 steps)
    for step in range(num_nodes - 1):
        temp_buffers = [list(b) for b in shard_buffers]
        for rank in range(num_nodes):
            send_idx = (rank - step + 1) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] = temp_buffers[rank][send_idx]

    return shard_buffers
`;

export const DEFAULT_FULLRINGALLREDUCECOLLECTIVESIMULATOR_INPUT: fullRingAllreduceCollectiveSimulatorInput =
  {
    data: [10, 20, 30, 40],
    target: 4,
  };

export const generateFullRingAllreduceCollectiveSimulatorSteps = (
  input: fullRingAllreduceCollectiveSimulatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const numNodes = Math.max(2, input.target ?? input.data.length);
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
          shards: `[${input.data.join(", ")}]`,
          ringNodes: String(numNodes),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Full Ring-AllReduce Collective Communication Simulator",
    `Setting up logical ring topology across ${numNodes} GPU ranks and initializing tensor chunks.`,
    { num_nodes: numNodes, tensor_chunks: input.data.length },
  );

  // Phase 1: Scatter-Reduce (N-1 steps)
  for (let step = 0; step < numNodes - 1; step++) {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      const activeRank = (i + step) % numNodes;
      return {
        ...el,
        state: "active",
        pointers: [`Step-${step + 1}`, `Rank-${activeRank}`],
      };
    });

    addStep(
      20,
      `Phase 1 (Scatter-Reduce) Step ${step + 1}/${numNodes - 1}: Rotating & Accumulating Chunks`,
      `Each rank sends chunk (rank - ${step}) to neighbor rank (rank + 1) % ${numNodes} and sums values.`,
      { phase: 1, step: step + 1, total_steps: numNodes - 1 },
      currentElements,
    );
  }

  // Phase 2: All-Gather (N-1 steps)
  for (let step = 0; step < numNodes - 1; step++) {
    const currentElements: ArrayElement[] = elements.map((el) => {
      return {
        ...el,
        state: "compare",
        pointers: [`Phase2-Step-${step + 1}`],
      };
    });

    addStep(
      28,
      `Phase 2 (All-Gather) Step ${step + 1}/${numNodes - 1}: Broadcasting Reduced Chunks`,
      `Each rank forwards fully reduced chunk (rank - ${step} + 1) around the ring network.`,
      { phase: 2, step: step + 1, total_steps: numNodes - 1 },
      currentElements,
    );
  }

  const finalSum = input.data.reduce((a, b) => a + b, 0);
  const finalElements: ArrayElement[] = input.data.map((_, idx) => ({
    id: `el-${idx}`,
    value: finalSum,
    state: "sorted",
    pointers: [`AllReduced=${finalSum}`],
  }));

  addStep(
    32,
    "Execution Complete",
    `Successfully completed 2*(${numNodes}-1) = ${2 * (numNodes - 1)} Ring-AllReduce steps. All ${numNodes} ranks hold the identical reduced sum (${finalSum}).`,
    { completed: true, total_ring_steps: 2 * (numNodes - 1), final_reduced_sum: finalSum },
    finalElements,
  );

  return steps;
};

const FULLRINGALLREDUCECOLLECTIVESIMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "torch.distributed.all_reduce(tensor, op=torch.distributed.ReduceOp.PRODUCT)",
    "shard_buffers.reverse()",
    "return parameter_shards[::-1]",
  ],
  hints: [
    {
      line: 20,
      hint: "Scatter-Reduce takes N-1 steps to accumulate partial sums around the ring.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Full Ring-AllReduce collective communication simulator.",
    15: "Validates non-empty rank and parameter shard buffers.",
    19: "Phase 1: Executes N-1 Scatter-Reduce steps accumulating partial gradient sums.",
    24: "Sends chunk to downstream ring neighbor rank (rank + 1) % N.",
    27: "Phase 2: Executes N-1 All-Gather steps broadcasting fully reduced chunks.",
    32: "Returns fully reduced and synchronized parameter tensor shards across all ranks.",
  },
};

export const fullRingAllreduceCollectiveSimulator: AlgorithmDefinition<fullRingAllreduceCollectiveSimulatorInput> =
  {
    id: "full-ring-allreduce-collective-simulator",
    title: "Full Ring-AllReduce Collective Communication Simulator",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Ring-AllReduce is the foundational collective algorithm used by NCCL and PyTorch Distributed Data Parallel (DDP) to synchronize gradients across $N$ GPU workers during distributed training.\n\nThe algorithm splits a tensor of size $S$ into $N$ equal chunks and executes in two distinct phases of $N-1$ steps each:\n1. Phase 1 (Scatter-Reduce): Each rank sends a chunk to its downstream neighbor $(r+1)\\%N$ and receives from $(r-1)\\%N$, accumulating sums. After $N-1$ steps, each rank holds the fully reduced sum of 1 chunk.\n2. Phase 2 (All-Gather): Ranks broadcast their fully reduced chunks around the ring for another $N-1$ steps until every rank holds the complete reduced tensor.\n\nInput Format:\n- data: Array of numerical tensor chunk values across GPU ranks.\n- target: Number of GPU ranks forming the circular ring topology ($N$).\n\nOutput Format:\n- Returns synchronized per-rank tensor buffers containing the global element-wise reduction sum.\n\nEdge Cases & Constraints:\n- Bandwidth Optimality: Total data sent per GPU is $2 \\frac{N-1}{N} S$ bytes, independent of rank count $N$ as $N \\to \\infty$.\n- Asymmetric Interconnects: Slow ring links (e.g. cross-socket PCIe instead of NVLink) bottleneck the entire ring throughput.\n- Numerical stability: Maintains floating-point precision during sequential ring accumulation.",
    constraints: ["2 <= target (num_nodes) <= 128", "1 <= data.length <= 1000"],
    examples: [
      {
        kind: "basic",
        title: "4-GPU Ring-AllReduce Reduction",
        inputDisplay: "data = [10, 20, 30, 40], target = 4",
        outputDisplay: "All Ranks Reduced Tensor: [100, 100, 100, 100]",
        input: { data: [10, 20, 30, 40], target: 4 },
        output: "All Ranks Reduced Tensor: [100, 100, 100, 100]",
        explanation:
          "Executes 2*(4-1) = 6 ring steps (3 Scatter-Reduce + 3 All-Gather) to synchronize global sum (100).",
      },
      {
        kind: "complex",
        title: "2-GPU Ring Reduction",
        inputDisplay: "data = [5, 15], target = 2",
        outputDisplay: "All Ranks Reduced Tensor: [20, 20]",
        input: { data: [5, 15], target: 2 },
        output: "All Ranks Reduced Tensor: [20, 20]",
        explanation: "Executes 2*(2-1) = 2 steps (1 Scatter-Reduce + 1 All-Gather) across 2 GPUs.",
      },
      {
        kind: "negative",
        title: "Single Element Array",
        inputDisplay: "data = [42], target = 2",
        outputDisplay: "All Ranks Reduced Tensor: [42, 42]",
        input: { data: [42], target: 2 },
        output: "All Ranks Reduced Tensor: [42, 42]",
        explanation: "Reduces single element payload across 2 ranks cleanly.",
      },
    ],
    code: FULLRINGALLREDUCECOLLECTIVESIMULATOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N * S) time complexity where N is number of ring steps 2*(num_nodes - 1) and S is tensor size.",
      space: "O(N * S) memory buffer to maintain per-rank ring payload states.",
    },
    topicGuide: {
      overview:
        "Ring-AllReduce synchronizes gradient tensors across N GPUs in 2*(N-1) ring communication steps, achieving near-optimal bandwidth utilization independent of cluster size.",
      sections: [
        {
          heading: "Core Concepts",
          body: "Ring-AllReduce avoids centralized parameter server bottlenecks by organizing GPUs into a logical circular ring. The input tensor is split into $N$ equal blocks. In Phase 1 (Scatter-Reduce), blocks circulate for $N-1$ steps, accumulating element-wise sums so that each GPU ends with 1 fully reduced block. In Phase 2 (All-Gather), the fully reduced blocks circulate for another $N-1$ steps so all GPUs receive the complete global reduction.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "Total data transferred per GPU is $2 \\frac{N-1}{N} S$ bytes. For large $N$, this approaches $2S$ bytes—meaning every GPU transfers only twice the tensor size regardless of whether there are 8 GPUs or 1,024 GPUs! This makes Ring-AllReduce bandwidth-optimal for massive distributed Deep Learning workloads.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Ring execution speed is strictly bound by the slowest interconnect link in the ring (Straggler problem). In heterogeneous networks (e.g. 6 GPUs connected via NVLink and 2 via PCIe), standard Ring-AllReduce degrades to PCIe speed. Modern NCCL mitigates this by forming multi-ring or tree topologies.",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "While Ring-AllReduce maximizes bandwidth utilization, its latency scales linearly $O(N)$ with step count $2(N-1)$. For small tensors (e.g. $<256$ KB), NCCL switches to Double Binary Trees to achieve $O(\\log N)$ latency at the cost of slightly lower link efficiency.",
        },
      ],
      keyTerms: [
        {
          term: "Ring-AllReduce",
          definition:
            "A bandwidth-optimal collective communication algorithm partitioning tensors into N chunks across a circular ring topology.",
        },
        {
          term: "Scatter-Reduce",
          definition:
            "The first phase of Ring-AllReduce (N-1 steps) where partial tensor sums are accumulated along the ring.",
        },
        {
          term: "All-Gather",
          definition:
            "The second phase of Ring-AllReduce (N-1 steps) where fully reduced chunks are broadcast to all GPU ranks.",
        },
        {
          term: "Full-Duplex Ring",
          definition:
            "Interconnect configuration allowing GPUs to simultaneously send data to rank r+1 while receiving from rank r-1.",
        },
      ],
    },
    trivia: FULLRINGALLREDUCECOLLECTIVESIMULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_FULLRINGALLREDUCECOLLECTIVESIMULATOR_INPUT,
    generateSteps: generateFullRingAllreduceCollectiveSimulatorSteps,
  };
