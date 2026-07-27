import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface RingAllreduceInput {
  numRanks: number;
  tensors: number[][]; // [numRanks][numRanks]
}

export const RING_ALLREDUCE_PARTITION_CODE = `def ring_allreduce(tensors: list[list[float]], num_ranks: int) -> list[list[float]]:
    # Partition each GPU rank tensor into num_ranks chunks
    chunks = [list(tensors[r]) for r in range(num_ranks)]
    
    # Phase 1: Scatter-Reduce (num_ranks - 1 steps)
    for step in range(num_ranks - 1):
        for r in range(num_ranks):
            send_chunk_idx = (r - step) % num_ranks
            recv_rank = (r + 1) % num_ranks
            recv_chunk_idx = (send_chunk_idx - 1) % num_ranks
            
            # Send chunk to neighbor and accumulate sum
            chunks[recv_rank][recv_chunk_idx] += chunks[r][send_chunk_idx]
            
    # Phase 2: All-Gather (num_ranks - 1 steps)
    for step in range(num_ranks - 1):
        for r in range(num_ranks):
            send_chunk_idx = (r - step + 1) % num_ranks
            recv_rank = (r + 1) % num_ranks
            
            # Broadcast fully reduced chunk around the logical ring
            chunks[recv_rank][send_chunk_idx] = chunks[r][send_chunk_idx]
            
    return chunks`;

export const DEFAULT_RING_ALLREDUCE_INPUT: RingAllreduceInput = {
  numRanks: 4,
  tensors: [
    [1, 2, 3, 4],    // GPU 0
    [5, 6, 7, 8],    // GPU 1
    [9, 10, 11, 12],  // GPU 2
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
    explanation: "3 Scatter-Reduce steps accumulate sums into single chunks per GPU, followed by 3 All-Gather steps broadcasting fully reduced values.",
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
    explanation: "Minimum viable 2-node ring performing 1 Scatter-Reduce step and 1 All-Gather step.",
  },
];

export function generateRingAllreduceSteps(input: RingAllreduceInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numRanks, tensors } = input;

  if (numRanks < 2 || !tensors || tensors.length < numRanks) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid Ring-AllReduce Configuration",
        why: "Ring-AllReduce requires at least 2 GPU ranks and valid tensor arrays.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Requires >= 2 ranks" } },
      variables: {},
    });
    return steps;
  }

  // Create deep copy of chunks per rank
  const chunks: number[][] = tensors.map((t) => [...t]);

  const elements: ArrayElement[] = Array.from({ length: numRanks }, (_, idx) => ({
    id: `gpu-${idx}`,
    value: idx,
    state: "default",
  }));

  const snapshotTensors = () =>
    chunks.map((c, r) => `GPU#${r}: [${c.join(", ")}]`).join(" | ");

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    phase: string,
    currentStep: number,
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({ ...el, pointers: el.pointers ? [...el.pointers] : undefined })),
      },
      auxiliaryState: {
        customState: {
          phase,
          currentStep,
          ringTopology: `${numRanks} GPUs in ring (0 -> 1 -> ... -> ${numRanks - 1} -> 0)`,
          gpuTensors: snapshotTensors(),
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize Ring-AllReduce 2-Phase Protocol",
    `Configured ${numRanks}-rank logical GPU ring. Data divided into ${numRanks} chunks per rank to achieve bandwith-optimal allreduce.`,
    "Initialization",
    0,
    { numRanks }
  );

  // Phase 1: Scatter-Reduce
  for (let s = 0; s < numRanks - 1; s++) {
    elements.forEach((el) => {
      el.state = "active";
      el.pointers = [`SR step ${s + 1}`];
    });

    // We collect updates first to avoid in-place race mutation
    const updates: { recvRank: number; recvChunkIdx: number; valueToAdd: number }[] = [];

    for (let r = 0; r < numRanks; r++) {
      const sendChunkIdx = (r - s + numRanks) % numRanks;
      const recvRank = (r + 1) % numRanks;
      const recvChunkIdx = (sendChunkIdx - 1 + numRanks) % numRanks;
      const valueToAdd = chunks[r][sendChunkIdx] ?? 0;

      updates.push({ recvRank, recvChunkIdx, valueToAdd });
    }

    for (const u of updates) {
      chunks[u.recvRank][u.recvChunkIdx] = (chunks[u.recvRank][u.recvChunkIdx] ?? 0) + u.valueToAdd;
    }

    addStep(
      6,
      `Phase 1: Scatter-Reduce Step ${s + 1}/${numRanks - 1}`,
      `Each GPU sent chunk around ring to accumulate partial gradient sums into neighboring GPU memory.`,
      "Phase 1: Scatter-Reduce",
      s + 1,
      { step: s + 1, totalSteps: numRanks - 1 }
    );
  }

  // Mark single chunk per GPU fully reduced
  elements.forEach((el) => {
    el.state = "pivot";
    el.pointers = ["Chunk Reduced"];
  });

  addStep(
    12,
    "Scatter-Reduce Phase Complete",
    "Each GPU rank now holds the fully accumulated reduced sum for exactly 1 chunk of the tensor.",
    "Phase 1 Complete",
    numRanks - 1,
    { numRanks }
  );

  // Phase 2: All-Gather
  for (let s = 0; s < numRanks - 1; s++) {
    elements.forEach((el) => {
      el.state = "active";
      el.pointers = [`AG step ${s + 1}`];
    });

    const updates: { recvRank: number; sendChunkIdx: number; valueToCopy: number }[] = [];

    for (let r = 0; r < numRanks; r++) {
      const sendChunkIdx = (r - s + 1 + numRanks) % numRanks;
      const recvRank = (r + 1) % numRanks;
      const valueToCopy = chunks[r][sendChunkIdx] ?? 0;

      updates.push({ recvRank, sendChunkIdx, valueToCopy });
    }

    for (const u of updates) {
      chunks[u.recvRank][u.sendChunkIdx] = u.valueToCopy;
    }

    addStep(
      15,
      `Phase 2: All-Gather Step ${s + 1}/${numRanks - 1}`,
      `Each GPU rank passed fully reduced chunk to next neighbor in logical ring.`,
      "Phase 2: All-Gather",
      s + 1,
      { step: s + 1, totalSteps: numRanks - 1 }
    );
  }

  elements.forEach((el) => {
    el.state = "sorted";
    el.pointers = undefined;
  });

  addStep(
    22,
    "Ring-AllReduce Protocol Complete",
    `All ${numRanks} GPUs now possess identical fully reduced tensors. Total data transferred per GPU is 2 * (N - 1) / N * S, independent of GPU count.`,
    "Complete",
    2 * (numRanks - 1),
    { totalTensorsReduced: numRanks, ranks: numRanks }
  );

  return steps;
}

export const ringAllreducePartition: AlgorithmDefinition<RingAllreduceInput> = {
  id: "ring-allreduce-partition",
  title: "Ring-AllReduce 2-Phase Distributed Parallelism",
  category: "ml_distributed_systems",
  difficulty: "Hard",
  description:
    "Bandwidth-optimal distributed communication collective algorithm for synchronizing model weights/gradients across GPU clusters using a 2-phase Scatter-Reduce and All-Gather logical ring topology.",
  isMlInfra: true,
  mlInfraLevel: 9,
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
        definition: "Bandwidth-optimal communication collective algorithm using a logical ring topology.",
      },
      {
        term: "Scatter-Reduce",
        definition: "First phase of Ring-AllReduce where chunks are passed and summed around the ring.",
      },
      {
        term: "All-Gather",
        definition: "Second phase of Ring-AllReduce where reduced chunks are replicated to all nodes.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 9" }],
  defaultInput: DEFAULT_RING_ALLREDUCE_INPUT,
  generateSteps: generateRingAllreduceSteps,
};
