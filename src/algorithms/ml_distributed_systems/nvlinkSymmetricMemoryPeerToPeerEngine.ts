import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface nvlinkSymmetricMemoryPeerToPeerEngineInput {
  data: number[];
  target?: number;
}

export const NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_CODE = `def nvlink_symmetric_memory_peer_to_peer_engine(data_buffer: list[float], target_rank: int, num_ranks: int = 4) -> list[dict]:
    """
    Simulates NVLink SymmetricMemory zero-copy peer-to-peer direct load/store transfer across GPU ranks.
    Maps symmetric virtual memory address offsets and calculates hardware interconnect throughput.

    Input:
        data_buffer: Flat tensor parameter/activation data buffer list.
        target_rank: GPU rank issuing the direct peer load/store operation.
        num_ranks: Total GPU ranks participating in the symmetric memory domain.

    Output:
        List of per-rank P2P transfer status dictionaries containing symmetric byte offsets and NVLink bandwidth metrics.
    """
    buffer_len = len(data_buffer)
    if num_ranks <= 0 or buffer_len == 0:
        return []

    peer_transfers = []
    chunk_size = (buffer_len + num_ranks - 1) // num_ranks

    for rank in range(num_ranks):
        start = rank * chunk_size
        end = min(start + chunk_size, buffer_len)
        chunk_data = data_buffer[start:end]

        symmetric_offset = start * 4  # 4 bytes per float32 element
        is_peer = (rank != target_rank)

        peer_transfers.append({
            "rank": rank,
            "target_rank": target_rank,
            "symmetric_offset_bytes": symmetric_offset,
            "chunk_elements": len(chunk_data),
            "nvlink_bandwidth_gbps": 900 if is_peer else 3000,
            "transfer_mode": "DIRECT_NVLINK_P2P" if is_peer else "LOCAL_VRAM"
        })

    return peer_transfers
`;

export const DEFAULT_NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_INPUT: nvlinkSymmetricMemoryPeerToPeerEngineInput =
  {
    data: [100, 200, 300, 400, 500, 600, 700, 800],
    target: 0,
  };

export const generateNvlinkSymmetricMemoryPeerToPeerEngineSteps = (
  input: nvlinkSymmetricMemoryPeerToPeerEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const targetRank = input.target ?? 0;
  const numRanks = 4;
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
          dataBuffer: `[${input.data.join(", ")}]`,
          targetRank: String(targetRank),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize NVLink SymmetricMemory Peer-to-Peer Direct Transfer Engine",
    `Establishing symmetric virtual address mapping across ${numRanks} intra-node GPUs targeting Rank ${targetRank}.`,
    { total_elements: input.data.length, target_rank: targetRank, num_ranks: numRanks },
  );

  const chunkLength = Math.ceil(input.data.length / numRanks);

  for (let r = 0; r < numRanks; r++) {
    const start = r * chunkLength;
    const end = Math.min(start + chunkLength, input.data.length);
    const isPeer = r !== targetRank;

    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i >= start && i < end) {
        return {
          ...el,
          state: isPeer ? "active" : "compare",
          pointers: [isPeer ? `Peer-R${r}->R${targetRank}` : `Local-R${targetRank}`],
        };
      }
      if (i < start) return { ...el, state: "visited" };
      return el;
    });

    const byteOffset = start * 4;

    addStep(
      20,
      `Rank ${r} -> Target Rank ${targetRank}: Offset 0x${byteOffset.toString(16)} B (${isPeer ? "900 GB/s NVLink P2P" : "3000 GB/s Local VRAM"})`,
      isPeer
        ? `Executing zero-copy NVLink direct store to peer GPU ${r} symmetric address space without CPU staging.`
        : `Accessing local GPU VRAM at primary symmetric memory base address.`,
      {
        rank: r,
        target_rank: targetRank,
        offset_bytes: byteOffset,
        bandwidth_gbps: isPeer ? 900 : 3000,
      },
      currentElements,
    );
  }

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    30,
    "Execution Complete",
    `Successfully completed direct NVLink SymmetricMemory P2P transfers across all ${numRanks} GPU ranks at 900 GB/s bisection bandwidth.`,
    { completed: true, target_rank: targetRank, total_peers: numRanks - 1 },
    finalElements,
  );

  return steps;
};

const NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  distractors: [
    "cudaMemcpy(dst, src, bytes, cudaMemcpyHostToDevice)",
    "socket.sendall(data_buffer)",
    "return data_buffer[::-1]",
  ],
  hints: [
    {
      line: 20,
      hint: "NVLink SymmetricMemory enables direct load/store instructions (900 GB/s) bypassing driver API staging.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for NVLink SymmetricMemory P2P direct transfer engine.",
    14: "Validates non-empty data buffer and positive rank count.",
    18: "Computes per-rank symmetric memory chunk size.",
    21: "Calculates byte offset in symmetric virtual address space.",
    27: "Populates P2P transfer dictionary with 900 GB/s NVLink bandwidth metrics.",
    30: "Returns complete peer-to-peer transfer engine status list.",
  },
};

export const nvlinkSymmetricMemoryPeerToPeerEngine: AlgorithmDefinition<nvlinkSymmetricMemoryPeerToPeerEngineInput> =
  {
    id: "nvlink-symmetric-memory-peer-to-peer-engine",
    title: "NVLink SymmetricMemory Peer-to-Peer Direct Transfer Engine",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "NVLink SymmetricMemory (introduced in CUDA 12 and modern NVIDIA Hopper/Blackwell architectures) provides a unified, symmetric virtual address space across intra-node GPUs connected via NVSwitch.\n\nUnlike traditional CUDA IPC handles, SymmetricMemory exposes remote GPU VRAM directly to PTX assembly instructions (`LD.E`, `ST.E`, `red.async`). GPU thread blocks on Rank 0 can write directly to remote VRAM on Rank 1 at up to 900 GB/s bi-directional bandwidth per GPU, completely bypassing CUDA driver API call overheads and CPU host memory staging.\n\nInput Format:\n- data: Array of numerical tensor data values to be transferred across peer GPUs.\n- target: Target GPU rank ID issuing the direct peer load/store operation.\n\nOutput Format:\n- Returns a list of per-rank transfer objects detailing symmetric virtual byte offsets, chunk sizes, and NVLink bandwidth metrics.\n\nEdge Cases & Constraints:\n- NVSwitch Fabric: Requires full bisection NVLink interconnects (e.g. HGX H100 with 900 GB/s NVSwitch fabric).\n- Memory Barriers: Requires `membar.gl` (global memory fence) to ensure remote NVLink write operations become visible across all GPU ranks.\n- Non-NVLink Fallback: PCIe-connected systems fallback to standard P2P DMA at reduced bandwidth (~32-64 GB/s).",
    constraints: ["1 <= data.length <= 1000", "0 <= target < 64"],
    examples: [
      {
        kind: "basic",
        title: "4-GPU SymmetricMemory P2P Transfers",
        inputDisplay: "data = [100, 200, 300, 400], target = 0",
        outputDisplay: "Mapped 4 Ranks at 900 GB/s NVLink P2P Bandwidth",
        input: { data: [100, 200, 300, 400], target: 0 },
        output: "Mapped 4 Ranks at 900 GB/s NVLink P2P Bandwidth",
        explanation:
          "Generates symmetric VRAM offsets and executes 900 GB/s zero-copy transfers targeting GPU Rank 0.",
      },
      {
        kind: "complex",
        title: "Large Buffer Multi-Rank Offset Mapping",
        inputDisplay: "data = [10, 20, 30, 40, 50, 60, 70, 80], target = 2",
        outputDisplay: "Mapped 8 Elements into 4 Symmetric Chunks for Rank 2",
        input: { data: [10, 20, 30, 40, 50, 60, 70, 80], target: 2 },
        output: "Mapped 8 Elements into 4 Symmetric Chunks for Rank 2",
        explanation:
          "Slices 8 elements into 2-element chunks per rank and computes 4-byte float32 symmetric VRAM offsets.",
      },
      {
        kind: "negative",
        title: "Single Element Buffer",
        inputDisplay: "data = [999], target = 0",
        outputDisplay: "Mapped 1 Element for Rank 0",
        input: { data: [999], target: 0 },
        output: "Mapped 1 Element for Rank 0",
        explanation: "Processes single element buffer safely across symmetric VRAM domain.",
      },
    ],
    code: NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time O(N) pass over GPU rank buffers to calculate symmetric memory offsets and P2P metrics.",
      space: "O(N) space to store symmetric memory peer transfer descriptor objects.",
    },
    topicGuide: {
      overview:
        "NVLink SymmetricMemory enables zero-copy peer-to-peer VRAM load/store transfers at 900 GB/s using unified virtual memory addresses.",
      sections: [
        {
          heading: "Core Concepts",
          body: "SymmetricMemory maps identical virtual address ranges across all GPUs in an NVSwitch node. A pointer address `0x7fff0000` on GPU 0 corresponds to the exact same physical memory offset on GPU 1. Kernels execute direct PTX global loads/stores (`LD.E`, `ST.E`) to read and write peer memory without host driver invocation.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "Traditional NCCL point-to-point transfers require CUDA driver kernel launches, staging buffers, and GPU signal flag checks. SymmetricMemory eliminates kernel launch overheads completely, allowing GPU threads to stream data over NVLink at full wire speed (900 GB/s on NVIDIA NVSwitch 3/4).",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Because remote GPU writes bypass CUDA stream synchronization, code must issue global memory fences (`membar.gl`) or PTX release operations before remote GPUs read updated values. Neglecting memory barriers results in subtle data race conditions.",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "SymmetricMemory is essential for modern high-performance LLM serving frameworks (like vLLM PagedAttention and DeepSpeed-UltraFast) where dynamic KV-cache page blocks must be swapped across GPUs with sub-microsecond latency.",
        },
      ],
      keyTerms: [
        {
          term: "Symmetric Virtual Memory",
          definition:
            "Unified virtual address space where identical virtual addresses point to symmetric physical VRAM buffers across GPUs.",
        },
        {
          term: "NVSwitch Fabric",
          definition:
            "High-speed crossbar interconnect providing 900 GB/s bi-directional all-to-all GPU bandwidth per node.",
        },
        {
          term: "PTX Global Store (ST.E)",
          definition:
            "Low-level CUDA assembly instruction executing direct memory stores to remote peer GPU VRAM addresses.",
        },
        {
          term: "Global Memory Fence",
          definition:
            "Hardware barrier instruction (membar.gl) enforcing visibility of remote NVLink writes across all GPU ranks.",
        },
      ],
    },
    trivia: NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_INPUT,
    generateSteps: generateNvlinkSymmetricMemoryPeerToPeerEngineSteps,
  };
