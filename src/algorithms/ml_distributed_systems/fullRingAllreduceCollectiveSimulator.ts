import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
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
  const numNodes = Math.max(2, input.target ?? input.data.length ?? 4);

  // Initialize per-rank parameter shards
  const shardBuffers: number[][] = [];
  for (let r = 0; r < numNodes; r++) {
    const rankData: number[] = [];
    for (let c = 0; c < numNodes; c++) {
      const base = input.data[c % input.data.length] ?? (c + 1) * 10;
      rankData.push(base * (r + 1));
    }
    shardBuffers.push(rankData);
  }

  const buildMatrixCells = (
    activeRank?: number,
    activeChunk?: number,
    phase?: 1 | 2,
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numNodes; r++) {
      for (let c = 0; c < numNodes; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (r === activeRank && c === activeChunk) {
          state = "active";
        } else if (phase === 2) {
          state = "sorted";
        } else if (phase === 1 && r === activeRank) {
          state = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: shardBuffers[r][c],
          label: `R${r}-C${c}`,
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRank?: number,
    activeChunk?: number,
    phase?: 1 | 2,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numNodes,
        cols: numNodes,
        rowHeaders: Array.from({ length: numNodes }, (_, r) => `GPU Rank ${r}`),
        colHeaders: Array.from({ length: numNodes }, (_, c) => `Chunk ${c}`),
        cells: buildMatrixCells(activeRank, activeChunk, phase),
      },
      auxiliaryState: {
        customState: {
          numNodes: String(numNodes),
          ringPhase: phase ? (phase === 1 ? "Scatter-Reduce" : "All-Gather") : "Init",
          totalRingSteps: String(2 * (numNodes - 1)),
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Enter full_ring_allreduce_collective_simulator",
    `Initializing 2*(N-1) Ring-AllReduce collective simulator for ${numNodes} GPU ranks in logical ring.`,
    { num_nodes: numNodes, total_chunks: numNodes },
  );

  // Step 2: num_nodes
  addStep(
    14,
    "Compute Number of Nodes in Ring Topology",
    `Calculated num_nodes = len(ring_ranks) = ${numNodes}.`,
    { num_nodes: numNodes },
  );

  // Step 3: Input check
  addStep(
    15,
    "Validate Ring Ranks & Parameter Shards",
    `Checking if num_nodes (${numNodes}) == 0 or parameter_shards is empty. Validation passed.`,
    { num_nodes: numNodes, valid: true },
  );

  // Step 4: Shard buffers setup
  addStep(
    18,
    "Initialize Shard Buffer References",
    "Created mutable shard_buffers array copying initial tensor chunk states for each GPU rank.",
    { num_nodes: numNodes },
  );

  // Phase 1: Scatter-Reduce (N-1 steps)
  addStep(
    20,
    "Phase 1: Begin Scatter-Reduce (N-1 Steps)",
    `Starting Phase 1 Scatter-Reduce loop for ${numNodes - 1} ring communication passes. Accumulating partial sums around the ring.`,
    { phase: 1, total_pass_steps: numNodes - 1 },
    undefined,
    undefined,
    1,
  );

  for (let step = 0; step < numNodes - 1; step++) {
    addStep(
      21,
      `Scatter-Reduce Step ${step + 1}/${numNodes - 1}: Loop Entry`,
      `Executing Scatter-Reduce pass step = ${step}.`,
      { phase: 1, step: step + 1, total_steps: numNodes - 1 },
      undefined,
      undefined,
      1,
    );

    const tempBuffers = shardBuffers.map((b) => [...b]);
    addStep(
      22,
      `Scatter-Reduce Step ${step + 1}: Snapshot Temp Buffers`,
      "Created snapshot copy temp_buffers to ensure synchronous full-duplex ring transfer.",
      { phase: 1, step: step + 1 },
      undefined,
      undefined,
      1,
    );

    for (let rank = 0; rank < numNodes; rank++) {
      const sendIdx = (rank - step + numNodes * 10) % numNodes;
      const recvRank = (rank + 1) % numNodes;

      addStep(
        24,
        `Scatter-Reduce Step ${step + 1}, Rank ${rank}: Calculate Send Chunk Index`,
        `send_idx = (${rank} - ${step}) % ${numNodes} = Chunk ${sendIdx}.`,
        { rank, send_idx: sendIdx, step: step + 1 },
        rank,
        sendIdx,
        1,
      );

      addStep(
        25,
        `Scatter-Reduce Step ${step + 1}, Rank ${rank}: Calculate Recv Neighbor Rank`,
        `recv_rank = (${rank} + 1) % ${numNodes} = Rank ${recvRank}.`,
        { rank, recv_rank: recvRank, step: step + 1 },
        rank,
        sendIdx,
        1,
      );

      shardBuffers[recvRank][sendIdx] += tempBuffers[rank][sendIdx];
      addStep(
        26,
        `Scatter-Reduce Step ${step + 1}: Rank ${rank} -> Rank ${recvRank} Chunk ${sendIdx} Accumulation`,
        `Rank ${recvRank} received Chunk ${sendIdx} value ${tempBuffers[rank][sendIdx]} from Rank ${rank}. Updated buffer sum = ${shardBuffers[recvRank][sendIdx]}.`,
        { rank, recv_rank: recvRank, send_idx: sendIdx, added_value: tempBuffers[rank][sendIdx] },
        recvRank,
        sendIdx,
        1,
      );
    }
  }

  // Phase 2: All-Gather (N-1 steps)
  addStep(
    28,
    "Phase 2: Begin All-Gather (N-1 Steps)",
    `Scatter-Reduce complete. Starting Phase 2 All-Gather loop for ${numNodes - 1} steps to broadcast fully reduced chunks.`,
    { phase: 2, total_pass_steps: numNodes - 1 },
    undefined,
    undefined,
    2,
  );

  for (let step = 0; step < numNodes - 1; step++) {
    addStep(
      29,
      `All-Gather Step ${step + 1}/${numNodes - 1}: Loop Entry`,
      `Executing All-Gather pass step = ${step}.`,
      { phase: 2, step: step + 1, total_steps: numNodes - 1 },
      undefined,
      undefined,
      2,
    );

    const tempBuffers = shardBuffers.map((b) => [...b]);
    addStep(
      30,
      `All-Gather Step ${step + 1}: Snapshot Temp Buffers`,
      "Created snapshot temp_buffers for synchronous chunk broadcast.",
      { phase: 2, step: step + 1 },
      undefined,
      undefined,
      2,
    );

    for (let rank = 0; rank < numNodes; rank++) {
      const sendIdx = (rank - step + 1 + numNodes * 10) % numNodes;
      const recvRank = (rank + 1) % numNodes;

      addStep(
        32,
        `All-Gather Step ${step + 1}, Rank ${rank}: Calculate Send Chunk Index`,
        `send_idx = (${rank} - ${step} + 1) % ${numNodes} = Chunk ${sendIdx}.`,
        { rank, send_idx: sendIdx, step: step + 1 },
        rank,
        sendIdx,
        2,
      );

      addStep(
        33,
        `All-Gather Step ${step + 1}, Rank ${rank}: Calculate Recv Neighbor Rank`,
        `recv_rank = (${rank} + 1) % ${numNodes} = Rank ${recvRank}.`,
        { rank, recv_rank: recvRank, step: step + 1 },
        rank,
        sendIdx,
        2,
      );

      shardBuffers[recvRank][sendIdx] = tempBuffers[rank][sendIdx];
      addStep(
        34,
        `All-Gather Step ${step + 1}: Rank ${rank} -> Rank ${recvRank} Broadcast Chunk ${sendIdx}`,
        `Rank ${recvRank} copied fully reduced Chunk ${sendIdx} value (${shardBuffers[recvRank][sendIdx]}) from Rank ${rank}.`,
        { rank, recv_rank: recvRank, send_idx: sendIdx, value: shardBuffers[recvRank][sendIdx] },
        recvRank,
        sendIdx,
        2,
      );
    }
  }

  // Return step
  addStep(
    36,
    "Return Fully Reduced & Synchronized Shard Buffers",
    `Completed all 2*(${numNodes}-1) = ${2 * (numNodes - 1)} Ring-AllReduce steps. All ${numNodes} GPU ranks hold identical reduced tensor chunks!`,
    { completed: true, total_ring_steps: 2 * (numNodes - 1) },
    undefined,
    undefined,
    2,
  );

  return steps;
};

const FULLRINGALLREDUCECOLLECTIVESIMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  distractors: [
    "torch.distributed.all_reduce(tensor, op=torch.distributed.ReduceOp.PRODUCT)",
    "shard_buffers.reverse()",
    "return parameter_shards[::-1]",
  ],
  hints: [
    {
      line: 21,
      hint: "Scatter-Reduce takes N-1 steps to accumulate partial sums around the ring.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for full 2*(N-1) Ring-AllReduce collective simulator function.",
    2: "Starts docstring documenting function architecture.",
    3: "Describes complete 2*(N-1) step Ring-AllReduce algorithm execution.",
    4: "Details Phase 1 Scatter-Reduce (N-1 steps) accumulating gradient tensor chunks.",
    5: "Details Phase 2 All-Gather (N-1 steps) redistributing fully reduced chunks.",
    6: "Blank line in docstring.",
    7: "Docstring section header for input arguments.",
    8: "Docstring describing ring_ranks list of GPU rank IDs.",
    9: "Docstring describing parameter_shards tensor chunk lists.",
    10: "Blank line in docstring.",
    11: "Docstring section header for return value.",
    12: "Docstring describing return format of fully reduced per-rank tensor lists.",
    13: "Closes docstring block.",
    14: "Calculates total number of nodes in the logical ring topology.",
    15: "Validates non-empty node count and parameter shards.",
    16: "Returns empty list immediately if input arguments are invalid.",
    17: "Blank line before buffer initialization.",
    18: "Creates shallow copy lists of parameter shards for each GPU rank.",
    19: "Blank line before Phase 1 Scatter-Reduce loop.",
    20: "Comment documenting Phase 1 Scatter-Reduce (N-1 steps) ring accumulation.",
    21: "Outer loop executing N-1 Scatter-Reduce communication steps.",
    22: "Creates snapshot copy temp_buffers for synchronous ring transfers.",
    23: "Inner loop iterating through each GPU rank 0 to N-1.",
    24: "Calculates send chunk index (rank - step) % num_nodes.",
    25: "Calculates downstream receiving neighbor rank (rank + 1) % num_nodes.",
    26: "Accumulates chunk value into receiving neighbor's shard buffer.",
    27: "Blank line before Phase 2 All-Gather loop.",
    28: "Comment documenting Phase 2 All-Gather (N-1 steps) chunk broadcast.",
    29: "Outer loop executing N-1 All-Gather communication steps.",
    30: "Creates snapshot copy temp_buffers for synchronous ring broadcasting.",
    31: "Inner loop iterating through each GPU rank 0 to N-1.",
    32: "Calculates send chunk index (rank - step + 1) % num_nodes for reduced chunks.",
    33: "Calculates downstream receiving neighbor rank (rank + 1) % num_nodes.",
    34: "Overwrites receiving neighbor's chunk buffer with fully reduced chunk value.",
    35: "Blank line before function return statement.",
    36: "Returns final synchronized and fully reduced parameter shard buffers.",
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
      "Ring-AllReduce is the foundational collective communication algorithm used by NCCL and PyTorch Distributed Data Parallel (DDP) to synchronize gradient tensors across $N$ GPU worker nodes.\n\n### Why It Exists & Problem Solved\nNaively synchronizing gradients via a centralized Parameter Server creates a network bottleneck at the central server ($O(N \\cdot S)$ volume), causing severe scaling bottlenecks as cluster size increases. Ring-AllReduce arranges GPUs into a logical circular ring where each GPU sends data to $(r+1)\\%N$ and receives from $(r-1)\\%N$. Every GPU transfers exactly $2 \\frac{N-1}{N} S$ bytes total—which approaches $2S$ bytes independent of GPU count $N$ as $N \\to \\infty$!\n\n### Step-by-Step Intuition\n1. **Tensor Partitioning**: The parameter tensor of size $S$ is split into $N$ equal chunks on each GPU.\n2. **Phase 1: Scatter-Reduce ($N-1$ steps)**: In each step, GPU $r$ sends chunk $(r-step)\\%N$ to GPU $(r+1)\\%N$. The receiver adds the incoming chunk to its local chunk. After $N-1$ steps, each GPU holds the fully reduced sum of exactly 1 chunk!\n3. **Phase 2: All-Gather ($N-1$ steps)**: In each step, GPU $r$ sends its fully reduced chunk around the ring. Receivers overwrite their local chunk with the reduced chunk. After $N-1$ steps, all GPUs hold the complete reduced tensor!\n\n### Trade-offs & Complexity\n- **Time Complexity**: $O(N)$ communication steps ($2(N-1)$ total steps).\n- **Bandwidth Optimal**: Data transferred per GPU is $2 \\frac{N-1}{N} S \\approx 2S$ bytes.\n- **Straggler Vulnerability**: Ring throughput is bottlenecked by the slowest link in the ring (e.g. a PCIe link mixed with NVLinks).",
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
          heading: "Why It Exists & Problem Solved",
          body: "Ring-AllReduce avoids centralized parameter server bottlenecks by organizing GPUs into a logical circular ring. The input tensor is split into N equal blocks. In Phase 1 (Scatter-Reduce), blocks circulate for N-1 steps accumulating element-wise sums so that each GPU ends with 1 fully reduced block. In Phase 2 (All-Gather), the fully reduced blocks circulate for another N-1 steps so all GPUs receive the complete global reduction.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. Phase 1 (Scatter-Reduce): Each rank sends chunk (r-step)%N to (r+1)%N while receiving from (r-1)%N. Incoming chunks are added to local buffers. After N-1 steps, each rank holds 1 fully reduced chunk.\n2. Phase 2 (All-Gather): The fully reduced chunks are forwarded around the ring for another N-1 steps without addition, overwriting local chunks until every rank holds all N reduced chunks.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "Total data transferred per GPU is 2 * (N-1)/N * S bytes. For large N, this approaches 2S bytes—meaning every GPU transfers only twice the tensor size regardless of whether there are 8 GPUs or 1,024 GPUs! This makes Ring-AllReduce bandwidth-optimal for massive distributed Deep Learning workloads.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
          body: "While Ring-AllReduce maximizes bandwidth utilization, its latency scales linearly O(N) with step count 2(N-1). For small tensors (<256 KB), NCCL switches to Double Binary Trees to achieve O(log N) latency at the cost of slightly lower link efficiency.",
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

