import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ringAllgatherVectorReconstructorInput {
  data: number[];
  target?: number;
}

export const RINGALLGATHERVECTORRECONSTRUCTOR_CODE = `def ring_allgather_vector_reconstructor(local_shards: list[list[float]]) -> list[list[float]]:
    num_ranks = len(local_shards)
    if num_ranks == 0:
        return []

    rank_buffers = []
    for rank in range(num_ranks):
        buf = [None] * num_ranks
        buf[rank] = list(local_shards[rank])
        rank_buffers.append(buf)

    for step in range(num_ranks - 1):
        for rank in range(num_ranks):
            send_chunk_idx = (rank - step) % num_ranks
            recv_rank = (rank + 1) % num_ranks
            rank_buffers[recv_rank][send_chunk_idx] = list(rank_buffers[rank][send_chunk_idx])

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
  const numRanks = Math.max(2, input.target ?? input.data.length ?? 4);

  // Initialize input shards per rank
  const localShardsInput: number[][] = [];
  for (let r = 0; r < numRanks; r++) {
    const shard: number[] = [];
    const baseVal = input.data[r % input.data.length] ?? (r + 1) * 10;
    shard.push(baseVal);
    localShardsInput.push(shard);
  }

  // rankBuffers[r][c] holds chunk c for rank r
  const rankBuffers: Array<Array<number[] | null>> = [];
  for (let r = 0; r < numRanks; r++) {
    const buf: Array<number[] | null> = Array.from({ length: numRanks }, () => null);
    rankBuffers.push(buf);
  }

  const buildMatrixCells = (
    activeRank?: number,
    activeChunk?: number,
    isComplete?: boolean,
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numRanks; r++) {
      for (let c = 0; c < numRanks; c++) {
        const chunk = rankBuffers[r][c];
        const valStr = chunk ? `[${chunk.join(",")}]` : "EMPTY";
        let state: MatrixCellItem["state"] = "default";

        if (isComplete) {
          state = "sorted";
        } else if (r === activeRank && c === activeChunk) {
          state = "active";
        } else if (chunk !== null) {
          state = "compared";
        } else {
          state = "inactive";
        }

        cells.push({
          row: r,
          col: c,
          value: valStr,
          label: `R${r}-Chunk${c}`,
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
    isComplete?: boolean,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numRanks,
        cols: numRanks,
        rowHeaders: Array.from({ length: numRanks }, (_, r) => `GPU Rank ${r}`),
        colHeaders: Array.from({ length: numRanks }, (_, c) => `Chunk Slot ${c}`),
        cells: buildMatrixCells(activeRank, activeChunk, isComplete),
      },
      auxiliaryState: {
        customState: {
          numRanks: String(numRanks),
          allGatherSteps: String(numRanks - 1),
          reconstructedShardsCount: String(
            rankBuffers.reduce((acc, row) => acc + row.filter((x) => x !== null).length, 0),
          ),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Enter ring_allgather_vector_reconstructor",
    `Initializing Ring All-Gather vector reconstructor for ${numRanks} GPU ranks in logical ring.`,
    { num_ranks: numRanks },
  );

  // Step 2: Read num_ranks
  addStep(2, "Compute Number of Ranks", `Calculated num_ranks = len(local_shards) = ${numRanks}.`, {
    num_ranks: numRanks,
  });

  // Step 3: Input check
  addStep(
    3,
    "Validate Rank Shard List",
    `Checking if num_ranks (${numRanks}) == 0. Validation passed.`,
    { num_ranks: numRanks, valid: true },
  );

  // Step 4: Initialize rank_buffers
  addStep(
    6,
    "Initialize Rank Memory Buffers Table",
    "Created empty rank_buffers array to store per-rank gathered chunk slots.",
    { rank_buffers_size: 0 },
  );

  // Step 5: Populate local shards
  for (let rank = 0; rank < numRanks; rank++) {
    addStep(
      7,
      `Initialize Rank ${rank} Buffer with Local Shard`,
      `Setting buf[${rank}] = [${localShardsInput[rank].join(",")}] into Rank ${rank} memory slot.`,
      { rank, local_shard: `[${localShardsInput[rank].join(",")}]` },
      rank,
      rank,
    );

    rankBuffers[rank][rank] = [...localShardsInput[rank]];

    addStep(
      9,
      `Register Rank ${rank} Initial Local Slot in Memory Table`,
      `Rank ${rank} memory slot ${rank} initialized.`,
      { rank, slot: rank },
      rank,
      rank,
    );
  }

  // Phase: Ring All-Gather loops (N-1 steps)
  addStep(
    12,
    "Begin N-1 Ring All-Gather Shift Steps",
    `Starting loop for ${numRanks - 1} ring shift steps broadcasting local shards across all GPU ranks.`,
    { total_shift_steps: numRanks - 1 },
  );

  for (let step = 0; step < numRanks - 1; step++) {
    addStep(
      12,
      `Ring Shift Step ${step + 1}/${numRanks - 1}: Loop Entry`,
      `Executing ring shift pass for step = ${step}.`,
      { step: step + 1, total_steps: numRanks - 1 },
    );

    for (let rank = 0; rank < numRanks; rank++) {
      const sendChunkIdx = (rank - step + numRanks * 10) % numRanks;
      const recvRank = (rank + 1) % numRanks;

      addStep(
        14,
        `Shift Step ${step + 1}, Rank ${rank}: Calculate Send Chunk Index`,
        `send_chunk_idx = (${rank} - ${step}) % ${numRanks} = Chunk ${sendChunkIdx}.`,
        { rank, send_chunk_idx: sendChunkIdx, step: step + 1 },
        rank,
        sendChunkIdx,
      );

      addStep(
        15,
        `Shift Step ${step + 1}, Rank ${rank}: Calculate Recv Neighbor Rank`,
        `recv_rank = (${rank} + 1) % ${numRanks} = Rank ${recvRank}.`,
        { rank, recv_rank: recvRank, step: step + 1 },
        rank,
        sendChunkIdx,
      );

      const chunkToTransfer = rankBuffers[rank][sendChunkIdx];
      if (chunkToTransfer) {
        rankBuffers[recvRank][sendChunkIdx] = [...chunkToTransfer];
      }

      addStep(
        16,
        `Shift Step ${step + 1}: Rank ${rank} -> Rank ${recvRank} Transmit Chunk ${sendChunkIdx}`,
        `Rank ${recvRank} received Chunk ${sendChunkIdx} ([${chunkToTransfer ? chunkToTransfer.join(",") : ""}]) from Rank ${rank}.`,
        { rank, recv_rank: recvRank, send_chunk_idx: sendChunkIdx },
        recvRank,
        sendChunkIdx,
      );
    }
  }

  // Flattening phase
  addStep(
    18,
    "Begin Vector Flattening Phase",
    "Created empty reconstructed array to flatten gathered chunks for each GPU rank.",
    { num_ranks: numRanks },
    undefined,
    undefined,
    true,
  );

  for (let rank = 0; rank < numRanks; rank++) {
    addStep(
      19,
      `Flatten Reconstructed Vector for Rank ${rank}`,
      `Concatenating all ${numRanks} gathered chunks for GPU Rank ${rank}.`,
      { rank },
      rank,
      undefined,
      true,
    );

    const fullVec: number[] = [];
    for (let c = 0; c < numRanks; c++) {
      const chunk = rankBuffers[rank][c];
      if (chunk) fullVec.push(...chunk);
    }

    addStep(
      24,
      `Rank ${rank} Global Vector Reconstructed: [${fullVec.join(",")}]`,
      `Successfully flattened global parameter vector for Rank ${rank}.`,
      { rank, vector_length: fullVec.length },
      rank,
      undefined,
      true,
    );
  }

  // Return step
  addStep(
    26,
    "Return Reconstructed Global Vectors List",
    `Completed Ring All-Gather vector reconstruction. All ${numRanks} GPU ranks hold identical complete parameter tensors.`,
    { completed: true, num_ranks: numRanks },
    undefined,
    undefined,
    true,
  );

  return steps;
};

const RINGALLGATHERVECTORRECONSTRUCTOR_TRIVIA: TriviaMeta = {
  skipLines: [5, 11, 17, 25],
  distractors: [
    "torch.distributed.all_reduce(shard, op=torch.distributed.ReduceOp.SUM)",
    "rank_buffers.clear()",
    "return local_shards[::-1]",
  ],
  hints: [
    {
      line: 12,
      hint: "All-Gather takes N-1 ring shift steps to copy each GPU's shard to all other N-1 ranks.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for Ring All-Gather vector reconstructor function.",
    2: "Calculates total number of GPU ranks from local_shards length.",
    3: "Validates positive rank count.",
    4: "Returns empty list immediately if local_shards is empty.",
    5: "Blank line before buffer initialization.",
    6: "Initializes empty rank_buffers list.",
    7: "Loop iterating through each GPU rank ID.",
    8: "Creates empty buffer slot array initialized with None.",
    9: "Copies local shard into current rank's own memory slot.",
    10: "Appends buffer slot array to rank_buffers.",
    11: "Blank line before Ring All-Gather loop.",
    12: "Outer loop executing N-1 ring communication shift passes.",
    13: "Inner loop iterating through each GPU rank 0 to N-1.",
    14: "Calculates send chunk index (rank - step) % num_ranks.",
    15: "Calculates downstream receiving neighbor rank (rank + 1) % num_ranks.",
    16: "Copies chunk buffer to receiving neighbor's corresponding memory slot.",
    17: "Blank line before vector flattening phase.",
    18: "Initializes empty reconstructed array.",
    19: "Loop iterating through each GPU rank 0 to N-1.",
    20: "Initializes empty full_vector array for current rank.",
    21: "Inner loop iterating through gathered chunks in rank_buffers[rank].",
    22: "Checks if chunk is non-None.",
    23: "Extends full_vector with chunk elements.",
    24: "Appends flattened full_vector to reconstructed list.",
    25: "Blank line before returning reconstructed.",
    26: "Returns final list of fully reconstructed global parameter vectors.",
  },
};

export const ringAllgatherVectorReconstructor: AlgorithmDefinition<ringAllgatherVectorReconstructorInput> =
  {
    id: "ring-allgather-vector-reconstructor",
    title: "Ring All-Gather Phase Vector Reconstructor",
    topicIds: ["ml_distributed_systems", "ml_tensor_algebra"],
    difficulty: "Medium",
    description:
      "Ring All-Gather is a core collective communication primitive used in distributed Deep Learning frameworks (e.g. PyTorch FSDP, DeepSpeed ZeRO-3, and Megatron-LM Tensor Parallelism) to reconstruct a full global tensor from sharded per-rank slices.\n\n### Why It Exists & Problem Solved\nIn ZeRO-3 parameter sharding, model weights are split across $N$ GPUs to save VRAM ($1/N$ weight memory per GPU). Before executing forward or backward passes on a layer, each GPU invokes Ring All-Gather across $N-1$ communication steps to dynamically reconstruct the full weight tensor in local VRAM.\n\n### Step-by-Step Intuition\n1. **Initialization**: Each GPU rank $r$ begins with its own local parameter shard $W_r$.\n2. **Phase 1 Ring Shift**: GPU $r$ sends chunk $(r - \text{step}) \\% N$ to GPU $(r+1) \\% N$ while receiving chunk $(r - \text{step} - 1) \\% N$ from GPU $(r-1) \\% N$.\n3. **After $N-1$ Steps**: Every GPU has gathered all $N$ parameter shards into its local memory table, reconstructing the complete global tensor.\n4. **Dynamic Cleanup**: Right after GEMM computation finishes, ZeRO-3 immediately discards the full tensor, restoring the $1/N$ VRAM memory bound.\n\n### Trade-offs & Complexity\n- **Time Complexity**: $O(N)$ communication steps ($N-1$ total steps).\n- **Bandwidth Consumption**: Each GPU transfers $\\frac{N-1}{N} S$ bytes during All-Gather, where $S$ is full tensor byte size.\n- **Overlapping Compute & Comm**: Dual CUDA streams allow overlapping Ring All-Gather transfers for layer $l+1$ while executing GEMM on layer $l$.",
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
          heading: "Why It Exists & Problem Solved",
          body: "In ZeRO-3 (Fully Sharded Data Parallel), model parameters are sharded across N GPUs during optimizer updates. When executing a forward pass on layer l, each GPU rank broadcasts its sharded slice to its downstream neighbor rank. Over N-1 ring shift steps, all N parameter shards circulate through all GPUs, enabling each rank to assemble the full weight matrix W_l.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. Each GPU starts with only 1 parameter shard.\n2. Over N-1 shift passes, each rank forwards its received chunk to rank (r+1)%N while receiving from (r-1)%N.\n3. After N-1 passes, all N chunks are stored in every GPU's memory buffer, forming the full tensor.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "Ring All-Gather transmits (N-1)/N * S bytes per GPU. Overlapping All-Gather communications with matrix multiplication execution (using dual CUDA streams) hides up to 90% of collective communication latency behind GPU computation time.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
          body: "Immediately after the GEMM forward/backward pass finishes, ZeRO-3 executes tensor memory release to discard the reconstructed full weight matrix, keeping peak VRAM memory footprint bounded to 1/N of static model parameters.",
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
