import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
  ProblemExample,
} from "../../types/dsa";

export interface RingAllreduceInput {
  numRanks: number;
  tensors: number[][]; // [numRanks][numRanks]
}

export const RING_ALLREDUCE_PARTITION_CODE = `def ring_allreduce(tensors: list[list[float]], num_ranks: int) -> list[list[float]]:
    chunks = [list(tensors[r]) for r in range(num_ranks)]
    for step in range(num_ranks - 1):
        for r in range(num_ranks):
            send_chunk_idx = (r - step) % num_ranks
            recv_rank = (r + 1) % num_ranks
            recv_chunk_idx = (send_chunk_idx - 1) % num_ranks
            chunks[recv_rank][recv_chunk_idx] += chunks[r][send_chunk_idx]
    for step in range(num_ranks - 1):
        for r in range(num_ranks):
            send_chunk_idx = (r - step + 1) % num_ranks
            recv_rank = (r + 1) % num_ranks
            chunks[recv_rank][send_chunk_idx] = chunks[r][send_chunk_idx]
    return chunks`;

export const DEFAULT_RING_ALLREDUCE_INPUT: RingAllreduceInput = {
  numRanks: 4,
  tensors: [
    [1, 2, 3, 4], // GPU 0
    [5, 6, 7, 8], // GPU 1
    [9, 10, 11, 12], // GPU 2
    [13, 14, 15, 16], // GPU 3
  ],
};

export const RING_ALLREDUCE_EXAMPLES: ProblemExample<RingAllreduceInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "4-GPU Ring-AllReduce Collective",
    input: {
      numRanks: 4,
      tensors: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ],
    },
    output: "All 4 GPUs receive identical reduced tensor [28, 32, 36, 40]",
    explanation:
      "3 Scatter-Reduce steps accumulate sums into single chunks per GPU, followed by 3 All-Gather steps broadcasting fully reduced values.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "3-GPU Asymmetric Data Reduction",
    input: {
      numRanks: 3,
      tensors: [
        [10, 20, 30],
        [1, 2, 3],
        [100, 200, 300],
      ],
    },
    output: "All 3 GPUs contain [111, 222, 333]",
    explanation: "Reduces 3 chunks per GPU across a 3-node ring topology in 2+2=4 step iterations.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "2-GPU Minimum Ring Network",
    input: {
      numRanks: 2,
      tensors: [
        [4, 8],
        [2, 6],
      ],
    },
    output: "Both GPUs hold [6, 14]",
    explanation:
      "Minimum viable 2-node ring performing 1 Scatter-Reduce step and 1 All-Gather step.",
  },
];

export function generateRingAllreduceSteps(input: RingAllreduceInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numRanks, tensors } = input;

  const createMatrixSnapshot = (
    currentChunks: number[][],
    cellStates: { row: number; col: number; state: MatrixCellItem["state"] }[] = [],
    title?: string,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < currentChunks.length; r++) {
      for (let c = 0; c < (currentChunks[r]?.length || 0); c++) {
        const match = cellStates.find((cs) => cs.row === r && cs.col === c);
        cells.push({
          row: r,
          col: c,
          value: currentChunks[r][c],
          label: `GPU${r}[${c}]`,
          state: match ? match.state : "default",
        });
      }
    }
    return {
      kind: "matrix",
      rows: currentChunks.length,
      cols: currentChunks[0]?.length || 0,
      cells,
      rowHeaders: Array.from({ length: currentChunks.length }, (_, i) => `GPU ${i}`),
      colHeaders: Array.from({ length: currentChunks[0]?.length || 0 }, (_, j) => `Chunk ${j}`),
      title: title || "GPU Rank Tensor Chunks Matrix",
    };
  };

  if (numRanks < 2 || !tensors || tensors.length < numRanks) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid Ring-AllReduce Configuration",
        why: "Ring-AllReduce requires at least 2 GPU ranks and valid tensor arrays matching the rank count.",
      },
      primarySnapshot: createMatrixSnapshot([]),
      auxiliaryState: { customState: { error: "Requires >= 2 ranks" } },
      variables: { numRanks: numRanks ?? 0 },
    });
    return steps;
  }

  // Create deep copy of chunks per rank
  const chunks: number[][] = tensors.map((t) => [...t]);

  const snapshotTensors = () => chunks.map((c, r) => `GPU#${r}: [${c.join(", ")}]`).join(" | ");

  // Step 1: Initial state & Chunk partitioning (codeLine: 2)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Initialize Ring-AllReduce Protocol & Partition Chunks",
      why: `Configured ${numRanks}-rank logical GPU ring. Each GPU partitions its local model/gradient tensor into ${numRanks} chunks to enable bandwidth-optimal allreduce.`,
    },
    primarySnapshot: createMatrixSnapshot(chunks, [], "Initial GPU Tensor Chunks"),
    auxiliaryState: {
      customState: {
        phase: "Initialization",
        currentStep: 0,
        ringTopology: `${numRanks} GPUs in ring (0 -> 1 -> ... -> ${numRanks - 1} -> 0)`,
        gpuTensors: snapshotTensors(),
      },
    },
    variables: { numRanks, tensorSize: tensors[0]?.length || 0 },
  });

  // Phase 1: Scatter-Reduce
  for (let s = 0; s < numRanks - 1; s++) {
    const updates: { recvRank: number; recvChunkIdx: number; valueToAdd: number }[] = [];
    const cellStates: { row: number; col: number; state: MatrixCellItem["state"] }[] = [];

    for (let r = 0; r < numRanks; r++) {
      const sendChunkIdx = (r - s + numRanks) % numRanks;
      const recvRank = (r + 1) % numRanks;
      const recvChunkIdx = (sendChunkIdx - 1 + numRanks) % numRanks;
      const valueToAdd = chunks[r][sendChunkIdx] ?? 0;

      cellStates.push({ row: r, col: sendChunkIdx, state: "compared" });
      cellStates.push({ row: recvRank, col: recvChunkIdx, state: "active" });

      updates.push({ recvRank, recvChunkIdx, valueToAdd });
    }

    for (const u of updates) {
      chunks[u.recvRank][u.recvChunkIdx] = (chunks[u.recvRank][u.recvChunkIdx] ?? 0) + u.valueToAdd;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Phase 1: Scatter-Reduce Step ${s + 1}/${numRanks - 1}`,
        why: `Each GPU sends chunk (r - step) % N to successor GPU (r + 1) % N. Received values are accumulated into chunk (send_idx - 1) % N.`,
      },
      primarySnapshot: createMatrixSnapshot(
        chunks,
        cellStates,
        `Scatter-Reduce Step ${s + 1}/${numRanks - 1}`,
      ),
      auxiliaryState: {
        customState: {
          phase: "Phase 1: Scatter-Reduce",
          currentStep: s + 1,
          ringTopology: `${numRanks} GPUs in ring (0 -> 1 -> ... -> ${numRanks - 1} -> 0)`,
          gpuTensors: snapshotTensors(),
        },
      },
      variables: { step: s + 1, totalScatterSteps: numRanks - 1, numRanks },
    });
  }

  // Mark single chunk per GPU fully reduced
  const pivotCellStates: { row: number; col: number; state: MatrixCellItem["state"] }[] = [];
  for (let r = 0; r < numRanks; r++) {
    const reducedChunkIdx = (r + 1) % numRanks;
    pivotCellStates.push({ row: r, col: reducedChunkIdx, state: "pivot" });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Scatter-Reduce Phase Complete",
      why: "Each GPU rank now holds the fully accumulated reduced sum for exactly 1 chunk of the overall tensor.",
    },
    primarySnapshot: createMatrixSnapshot(
      chunks,
      pivotCellStates,
      "Scatter-Reduce Complete (1 Chunk Reduced per GPU)",
    ),
    auxiliaryState: {
      customState: {
        phase: "Phase 1 Complete",
        currentStep: numRanks - 1,
        ringTopology: `${numRanks} GPUs in ring`,
        gpuTensors: snapshotTensors(),
      },
    },
    variables: { numRanks },
  });

  // Phase 2: All-Gather
  for (let s = 0; s < numRanks - 1; s++) {
    const updates: { recvRank: number; sendChunkIdx: number; valueToCopy: number }[] = [];
    const cellStates: { row: number; col: number; state: MatrixCellItem["state"] }[] = [];

    for (let r = 0; r < numRanks; r++) {
      const sendChunkIdx = (r - s + 1 + numRanks) % numRanks;
      const recvRank = (r + 1) % numRanks;
      const valueToCopy = chunks[r][sendChunkIdx] ?? 0;

      cellStates.push({ row: r, col: sendChunkIdx, state: "compared" });
      cellStates.push({ row: recvRank, col: sendChunkIdx, state: "active" });

      updates.push({ recvRank, sendChunkIdx, valueToCopy });
    }

    for (const u of updates) {
      chunks[u.recvRank][u.sendChunkIdx] = u.valueToCopy;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Phase 2: All-Gather Step ${s + 1}/${numRanks - 1}`,
        why: `Each GPU rank passes its fully reduced chunk to the next neighbor around the logical ring to replicate complete sum across all ranks.`,
      },
      primarySnapshot: createMatrixSnapshot(
        chunks,
        cellStates,
        `All-Gather Step ${s + 1}/${numRanks - 1}`,
      ),
      auxiliaryState: {
        customState: {
          phase: "Phase 2: All-Gather",
          currentStep: s + 1,
          ringTopology: `${numRanks} GPUs in ring`,
          gpuTensors: snapshotTensors(),
        },
      },
      variables: { step: s + 1, totalGatherSteps: numRanks - 1, numRanks },
    });
  }

  // All-Gather Complete / Protocol Complete
  const sortedCellStates: { row: number; col: number; state: MatrixCellItem["state"] }[] = [];
  for (let r = 0; r < numRanks; r++) {
    for (let c = 0; c < numRanks; c++) {
      sortedCellStates.push({ row: r, col: c, state: "sorted" });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: "Ring-AllReduce Protocol Complete",
      why: `All ${numRanks} GPUs now possess identical fully reduced tensors across all chunks. Total data transferred per GPU is 2 * (N - 1) / N * S, independent of GPU count.`,
    },
    primarySnapshot: createMatrixSnapshot(chunks, sortedCellStates, "Ring-AllReduce Completed"),
    auxiliaryState: {
      customState: {
        phase: "Complete",
        currentStep: 2 * (numRanks - 1),
        gpuTensors: snapshotTensors(),
      },
    },
    variables: { totalTensorsReduced: numRanks, ranks: numRanks },
  });

  return steps;
}

export const ringAllreducePartition: AlgorithmDefinition<RingAllreduceInput> = {
  id: "ring-allreduce-partition",
  title: "Ring-AllReduce 2-Phase Distributed Parallelism",
  topicIds: ["ml_distributed_systems"],
  difficulty: "Hard",
  description:
    "Bandwidth-optimal distributed communication collective algorithm for synchronizing model weights/gradients across GPU clusters using a 2-phase Scatter-Reduce and All-Gather logical ring topology.",
  constraints: [
    "Number of ranks N >= 2",
    "Equal tensor size across all GPU ranks",
    "Tensor size divisible by rank count N",
  ],
  examples: RING_ALLREDUCE_EXAMPLES,
  code: RING_ALLREDUCE_PARTITION_CODE,
  timeComplexity: {
    best: "O(2 * (N - 1) / N * S)",
    average: "O(2 * (N - 1) / N * S)",
    worst: "O(2 * (N - 1) / N * S)",
  },
  spaceComplexity: "O(S)",
  complexityAnalysis: {
    time: "Each GPU sends and receives 2 * (N - 1) chunks of size S/N across 2*(N-1) communication steps, making total bandwidth consumption independent of rank count N.",
    space: "Requires in-place buffer workspace of size S matching the local model tensor slice.",
  },
  topicGuide: {
    overview:
      "Ring-AllReduce (popularized by Baidu and NVIDIA NCCL) is the core network collective algorithm enabling Data-Parallel (DDP) multi-GPU training. By passing chunked data around a logical ring ring network, it achieves theoretical optimal bandwidth utilization.",
    sections: [
      {
        heading: "Two-Phase Protocol",
        body: "1) Scatter-Reduce: In N-1 steps, each rank accumulates partial sums into 1 chunk. 2) All-Gather: In N-1 steps, the fully reduced chunk is broadcast around the ring so all ranks receive complete results.",
      },
      {
        heading: "Bandwidth Efficiency",
        body: "Unlike naive master-worker broadcast which bottlenecks a single server at O(N*S), Ring-AllReduce transfers only 2*(N-1)/N * S bytes per GPU regardless of cluster size.",
      },
    ],
    keyTerms: [
      {
        term: "Ring-AllReduce",
        definition:
          "Bandwidth-optimal communication collective algorithm using a logical ring topology.",
      },
      {
        term: "Scatter-Reduce",
        definition:
          "First phase of Ring-AllReduce where chunks are passed and summed around the ring.",
      },
      {
        term: "All-Gather",
        definition:
          "Second phase of Ring-AllReduce where reduced chunks are replicated to all nodes.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" }],
  defaultInput: DEFAULT_RING_ALLREDUCE_INPUT,
  generateSteps: generateRingAllreduceSteps,
};
