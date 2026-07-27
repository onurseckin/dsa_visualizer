import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ringAllgatherVectorReconstructorInput {
  data: number[];
  target?: number;
}

export const RINGALLGATHERVECTORRECONSTRUCTOR_CODE = `def ring_allgather_vector_reconstructor(local_shards: list[list[float]]) -> list[list[float]]:
    """
    Reconstructs a full contiguous parameter vector from distributed per-rank shards via Ring All-Gather collective communication.
    Simulates N-1 ring shift steps broadcasting local shards across all GPU ranks so every GPU holds the complete reconstructed tensor.

    Input:
        local_shards: List of tensor parameter shard arrays for each GPU rank.

    Output:
        List of fully reconstructed global parameter tensor arrays for each GPU rank.
    """
    num_ranks = len(local_shards)
    if num_ranks == 0:
        return []

    # Initialize each rank's memory buffer with its own local shard
    rank_buffers = []
    for rank in range(num_ranks):
        buf = [None] * num_ranks
        buf[rank] = list(local_shards[rank])
        rank_buffers.append(buf)

    # Execute N-1 Ring All-Gather steps
    for step in range(num_ranks - 1):
        for rank in range(num_ranks):
            send_chunk_idx = (rank - step) % num_ranks
            recv_rank = (rank + 1) % num_ranks
            rank_buffers[recv_rank][send_chunk_idx] = list(rank_buffers[rank][send_chunk_idx])

    # Flatten reconstructed vector for each rank
    reconstructed = []
    for rank in range(num_ranks):
        full_vector = []
        for chunk in rank_buffers[rank]:
            if chunk:
                full_vector.extend(chunk)
        reconstructed.append(full_vector)

    return reconstructed
`;

export const DEFAULT_RINGALLGATHERVECTORRECONSTRUCTOR_INPUT: ringAllgatherVectorReconstructorInput =
  {
    data: [10, 20, 30, 40],
    target: 4,
  };

export const generateRingAllgatherVectorReconstructorSteps = (
  input: ringAllgatherVectorReconstructorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const numRanks = Math.max(2, input.target ?? input.data.length);
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
          localShards: `[${input.data.join(", ")}]`,
          numRanks: String(numRanks),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Ring All-Gather Phase Vector Reconstructor",
    `Setting up distributed per-rank shards across ${numRanks} GPU ranks for Ring All-Gather vector reconstruction.`,
    { num_ranks: numRanks, shard_count: input.data.length },
  );

  for (let step = 0; step < numRanks - 1; step++) {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      const activeRank = (i + step) % numRanks;
      return {
        ...el,
        state: "active",
        pointers: [`Step-${step + 1}`, `Rank-${activeRank}`],
      };
    });

    addStep(
      21,
      `Ring Shift Step ${step + 1}/${numRanks - 1}: Rotating Shard (${step}) to Rank (rank+1)%${numRanks}`,
      `Each GPU rank transmits its locally held shard chunk to its downstream neighbor rank around the circular ring topology.`,
      { step: step + 1, total_steps: numRanks - 1 },
      currentElements,
    );
  }

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
    pointers: ["Reconstructed"],
  }));

  addStep(
    28,
    "Execution Complete",
    `Successfully completed ${numRanks - 1} Ring All-Gather steps. Full vector of ${input.data.length} elements is fully reconstructed on all ${numRanks} GPU ranks.`,
    { completed: true, total_steps: numRanks - 1, reconstructed_size: input.data.length },
    finalElements,
  );

  return steps;
};

const RINGALLGATHERVECTORRECONSTRUCTOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  distractors: [
    "torch.distributed.all_reduce(shard, op=torch.distributed.ReduceOp.SUM)",
    "rank_buffers.clear()",
    "return local_shards[::-1]",
  ],
  hints: [
    {
      line: 21,
      hint: "All-Gather takes N-1 ring shift steps to copy each GPU's shard to all other N-1 ranks.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Ring All-Gather vector reconstructor.",
    13: "Validates non-empty rank shard list.",
    16: "Initializes per-rank memory buffers with local shard data.",
    20: "Loops through N-1 Ring All-Gather shift steps.",
    22: "Transfers shard chunk to downstream neighbor rank (rank + 1) % N.",
    28: "Flattens and returns reconstructed global parameter vector for all ranks.",
  },
};

export const ringAllgatherVectorReconstructor: AlgorithmDefinition<ringAllgatherVectorReconstructorInput> =
  {
    id: "ring-allgather-vector-reconstructor",
    title: "Ring All-Gather Phase Vector Reconstructor",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_tensor_algebra"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Ring All-Gather is a core collective communication primitive used in distributed Deep Learning frameworks (e.g. PyTorch FSDP, DeepSpeed ZeRO-3, and Megatron-LM Tensor Parallelism) to reconstruct a full global tensor from sharded per-rank slices.\n\nIn ZeRO-3 parameter sharding, model weights are split across $N$ GPUs to save VRAM. Before executing forward or backward passes on a layer, each GPU invokes Ring All-Gather across $N-1$ communication steps to dynamically reconstruct the full weight tensor in local VRAM.\n\nInput Format:\n- data: Array of numerical tensor shard values distributed across GPU ranks.\n- target: Number of GPU ranks participating in the ring ($N$).\n\nOutput Format:\n- Returns per-rank reconstructed full global parameter vectors containing concatenated shards in sequential order.\n\nEdge Cases & Constraints:\n- Bandwidth Consumption: Each GPU transfers $\\frac{N-1}{N} S$ bytes during All-Gather, where $S$ is full tensor byte size.\n- Dynamic Memory Release: ZeRO-3 immediately frees un-sharded parameter memory after layer GEMM computation to keep VRAM usage low.\n- Tensor Alignment: Shard lengths must be consistent across ranks or padded to prevent memory stride mismatches.",
    constraints: ["2 <= target (num_ranks) <= 128", "1 <= data.length <= 1000"],
    examples: [
      {
        kind: "basic",
        title: "4-GPU Ring All-Gather Reconstruction",
        inputDisplay: "data = [10, 20, 30, 40], target = 4",
        outputDisplay: "Reconstructed Full Tensor: [10, 20, 30, 40] on all 4 Ranks",
        input: { data: [10, 20, 30, 40], target: 4 },
        output: "Reconstructed Full Tensor: [10, 20, 30, 40] on all 4 Ranks",
        explanation:
          "Executes 3 Ring All-Gather shift steps to gather all 4 shards onto every GPU rank.",
      },
      {
        kind: "complex",
        title: "2-GPU Vector Reconstruction",
        inputDisplay: "data = [100, 200], target = 2",
        outputDisplay: "Reconstructed Full Tensor: [100, 200] on both Ranks",
        input: { data: [100, 200], target: 2 },
        output: "Reconstructed Full Tensor: [100, 200] on both Ranks",
        explanation: "Executes 1 ring shift step to swap shards between 2 GPUs.",
      },
      {
        kind: "negative",
        title: "Single Element Shard",
        inputDisplay: "data = [7], target = 2",
        outputDisplay: "Reconstructed Tensor: [7] on all Ranks",
        input: { data: [7], target: 2 },
        output: "Reconstructed Tensor: [7] on all Ranks",
        explanation: "Reconstructs single element tensor cleanly across ring ranks.",
      },
    ],
    code: RINGALLGATHERVECTORRECONSTRUCTOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N * S) time complexity where N is rank count (N-1 steps) and S is tensor shard size.",
      space:
        "O(N * S) memory buffer to maintain reconstructed tensor allocations across GPU ranks.",
    },
    topicGuide: {
      overview:
        "Ring All-Gather collects distributed tensor shards from all N GPU ranks across N-1 ring shift steps, reconstructing the full global parameter vector on every rank.",
      sections: [
        {
          heading: "Core Concepts",
          body: "In ZeRO-3 (Fully Sharded Data Parallel), model parameters are sharded across $N$ GPUs during optimizer updates. When executing a forward pass on layer $l$, each GPU rank broadcasts its sharded slice to its downstream neighbor rank. Over $N-1$ ring shift steps, all $N$ parameter shards circulate through all GPUs, enabling each rank to assemble the full weight matrix $W_l$.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "Ring All-Gather transmits $\\frac{N-1}{N} S$ bytes per GPU. Overlapping All-Gather communications with matrix multiplication execution (using dual CUDA streams) hides up to 90% of collective communication latency behind GPU computation time.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Immediately after the GEMM forward/backward pass finishes, ZeRO-3 executes `tensor.storage().resize_(0)` to discard the reconstructed full weight matrix, keeping peak VRAM memory footprint bounded to $1/N$ of static model parameters.",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "When operating within an NVLink node (900 GB/s), All-Gather completes in microseconds. Across inter-node InfiniBand links (50 GB/s), All-Gather can become a communication bottleneck, requiring hierarchical (intra-node NVLink + inter-node IB) All-Gather algorithms.",
        },
      ],
      keyTerms: [
        {
          term: "Ring All-Gather",
          definition:
            "Collective algorithm gathering tensor shards from all N ranks into a full reconstructed tensor on every rank.",
        },
        {
          term: "ZeRO-3 Parameter Fetching",
          definition:
            "Dynamically executing All-Gather to reconstruct layer weights right before forward/backward pass execution.",
        },
        {
          term: "Ring Shift Step",
          definition:
            "Cyclic transfer of tensor chunks between adjacent GPU ranks in circular ring order.",
        },
        {
          term: "Dynamic Memory Release",
          definition:
            "Freeing reconstructed full parameters immediately after GEMM computation to conserve GPU VRAM.",
        },
      ],
    },
    trivia: RINGALLGATHERVECTORRECONSTRUCTOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_RINGALLGATHERVECTORRECONSTRUCTOR_INPUT,
    generateSteps: generateRingAllgatherVectorReconstructorSteps,
  };
