import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface nvlinkSymmetricMemoryPeerToPeerEngineInput {
  data: number[];
  target?: number;
}

export const NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_CODE = `def nvlink_symmetric_memory_peer_to_peer_engine(data_buffer: list[float], target_rank: int, num_ranks: int = 4) -> list[dict]:
    buffer_len = len(data_buffer)
    if num_ranks <= 0 or buffer_len == 0:
        return []

    peer_transfers = []
    chunk_size = (buffer_len + num_ranks - 1) // num_ranks

    for rank in range(num_ranks):
        start = rank * chunk_size
        end = min(start + chunk_size, buffer_len)
        chunk_data = data_buffer[start:end]

        symmetric_offset = start * 4
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
  const dataBuffer =
    input.data && input.data.length > 0 ? input.data : [100, 200, 300, 400, 500, 600, 700, 800];
  const numRanks = 4;
  const targetRank = Math.max(0, Math.min(input.target ?? 0, numRanks - 1));
  const bufferLen = dataBuffer.length;
  const chunkSize = Math.ceil(bufferLen / numRanks);

  const buildMatrixCells = (
    currentRank?: number,
    completedRanks: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < numRanks; r++) {
      const start = r * chunkSize;
      const end = Math.min(start + chunkSize, bufferLen);
      const elementsInChunk = Math.max(0, end - start);
      const offsetBytes = start * 4;
      const isPeer = r !== targetRank;

      const isDone = completedRanks.includes(r);
      const isActive = r === currentRank;

      const rowValues = [
        `Rank ${r}`,
        `0x${offsetBytes.toString(16)}`,
        `${elementsInChunk} Float32`,
        isPeer ? "900 GB/s" : "3000 GB/s",
        isPeer ? "DIRECT_NVLINK_P2P" : "LOCAL_VRAM",
      ];

      for (let c = 0; c < 5; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isDone) state = "sorted";
        else if (isActive) state = c === 3 ? "active" : "compared";

        cells.push({
          row: r,
          col: c,
          value: rowValues[c],
          label: `Rank ${r} (col ${c})`,
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
    currentRank?: number,
    completedRanks: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numRanks,
        cols: 5,
        rowHeaders: Array.from({ length: numRanks }, (_, r) => `GPU ${r}`),
        colHeaders: [
          "GPU Rank",
          "Symmetric Offset (Bytes)",
          "Chunk Element Count",
          "Interconnect Bandwidth",
          "P2P Transfer Mode",
        ],
        cells: buildMatrixCells(currentRank, completedRanks),
      },
      auxiliaryState: {
        customState: {
          totalBufferElements: String(bufferLen),
          targetRank: String(targetRank),
          chunkSize: String(chunkSize),
          completedRanks: String(completedRanks.length),
        },
      },
      variables,
    });
  };

  // Step 1: Function entry (Line 1)
  addStep(
    1,
    "Enter nvlink_symmetric_memory_peer_to_peer_engine",
    `Initializing NVLink SymmetricMemory direct peer-to-peer load/store engine for ${bufferLen} elements targeting Rank ${targetRank}.`,
    { buffer_len: bufferLen, target_rank: targetRank, num_ranks: numRanks },
  );

  // Step 2: Buffer length (Line 2)
  addStep(
    2,
    "Read Buffer Length",
    `Calculated buffer_len = len(data_buffer) = ${bufferLen} float32 elements.`,
    { buffer_len: bufferLen },
  );

  // Step 3: Input check (Line 3)
  addStep(
    3,
    "Validate Rank Count & Buffer Length",
    `Checking if num_ranks (${numRanks}) <= 0 or buffer_len (${bufferLen}) == 0. Validation passed.`,
    { num_ranks: numRanks, buffer_len: bufferLen, valid: true },
  );

  // Step 4: Initialize list (Line 6)
  addStep(
    6,
    "Initialize Peer Transfers List",
    "Created empty peer_transfers array to accumulate P2P status descriptors for each GPU rank.",
    { peer_transfers_size: 0 },
  );

  // Step 5: Calculate chunk size (Line 7)
  addStep(
    7,
    "Compute Per-Rank Chunk Size",
    `chunk_size = (${bufferLen} + ${numRanks} - 1) // ${numRanks} = ${chunkSize} elements per rank.`,
    { chunk_size: chunkSize },
  );

  const completedRanks: number[] = [];

  for (let rank = 0; rank < numRanks; rank++) {
    // Line 9: Loop header
    addStep(
      9,
      `Iterate GPU Rank ${rank} Allocation`,
      `Processing rank=${rank} in symmetric memory domain.`,
      { rank, num_ranks: numRanks },
      rank,
      completedRanks,
    );

    // Line 10: Compute start
    const start = rank * chunkSize;
    addStep(
      10,
      `Compute Start Index for Rank ${rank}`,
      `start = ${rank} * ${chunkSize} = ${start}.`,
      { rank, start_index: start },
      rank,
      completedRanks,
    );

    // Line 11: Compute end
    const end = Math.min(start + chunkSize, bufferLen);
    addStep(
      11,
      `Compute End Index for Rank ${rank}`,
      `end = min(${start} + ${chunkSize}, ${bufferLen}) = ${end}.`,
      { rank, start_index: start, end_index: end },
      rank,
      completedRanks,
    );

    // Line 12: Slice chunk_data
    const chunkData = dataBuffer.slice(start, end);
    addStep(
      12,
      `Extract Parameter Sub-slice for Rank ${rank}`,
      `chunk_data = data_buffer[${start}:${end}] (${chunkData.length} elements).`,
      { rank, chunk_elements: chunkData.length },
      rank,
      completedRanks,
    );

    // Line 14: Calculate symmetric byte offset
    const offsetBytes = start * 4;
    addStep(
      14,
      `Compute Symmetric Byte Offset for Rank ${rank}`,
      `symmetric_offset = ${start} * 4 = ${offsetBytes} bytes (0x${offsetBytes.toString(16)}).`,
      { rank, symmetric_offset: offsetBytes },
      rank,
      completedRanks,
    );

    // Line 15: Check is_peer
    const isPeer = rank !== targetRank;
    addStep(
      15,
      `Evaluate Is-Peer Flag for Rank ${rank}`,
      `is_peer = (${rank} != ${targetRank}) = ${isPeer}.`,
      { rank, is_peer: isPeer, target_rank: targetRank },
      rank,
      completedRanks,
    );

    // Line 17: Append payload dict
    completedRanks.push(rank);
    addStep(
      17,
      `Append Rank ${rank} Transfer Status Descriptor`,
      `Registered Rank ${rank} descriptor: offset 0x${offsetBytes.toString(16)}, ${chunkData.length} elements, ${isPeer ? "900 GB/s DIRECT_NVLINK_P2P" : "3000 GB/s LOCAL_VRAM"}.`,
      {
        rank,
        target_rank: targetRank,
        symmetric_offset_bytes: offsetBytes,
        chunk_elements: chunkData.length,
        nvlink_bandwidth_gbps: isPeer ? 900 : 3000,
        transfer_mode: isPeer ? "DIRECT_NVLINK_P2P" : "LOCAL_VRAM",
      },
      undefined,
      completedRanks,
    );
  }

  // Return step (Line 26)
  addStep(
    26,
    "Return Peer Transfers List",
    "Returning final list of per-rank NVLink SymmetricMemory transfer status dictionaries.",
    { completed: true, total_descriptors: completedRanks.length },
    undefined,
    completedRanks,
  );

  return steps;
};

const NVLINKSYMMETRICMEMORYPEERTOPEERENGINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "cudaMemcpy(dst, src, bytes, cudaMemcpyHostToDevice)",
    "socket.sendall(data_buffer)",
    "return data_buffer[::-1]",
  ],
  hints: [
    {
      line: 14,
      hint: "SymmetricMemory maps identical virtual addresses so byte offset equals index * float32 size.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for NVLink SymmetricMemory P2P direct transfer engine function.",
    2: "Measures total length of the input data buffer.",
    3: "Validates positive rank count and non-empty buffer length.",
    4: "Returns empty list immediately if input arguments are invalid.",
    5: "Blank line.",
    6: "Initializes empty list to accumulate P2P transfer status dictionaries.",
    7: "Computes per-rank chunk size using integer ceiling division.",
    8: "Blank line.",
    9: "Iterates through each GPU rank ID from 0 to num_ranks - 1.",
    10: "Calculates global parameter starting index for current rank.",
    11: "Calculates global parameter ending index capped at total array length.",
    12: "Extracts sub-slice of buffer data for current rank.",
    13: "Blank line.",
    14: "Calculates symmetric VRAM byte offset assuming 4 bytes per float32 element.",
    15: "Checks if current rank differs from target_rank.",
    16: "Blank line.",
    17: "Appends dictionary containing P2P transfer status for current rank.",
    18: "Sets rank key.",
    19: "Sets target_rank key.",
    20: "Sets symmetric_offset_bytes key.",
    21: "Sets chunk_elements key.",
    22: "Assigns 900 GB/s for peer NVLink or 3000 GB/s for local VRAM.",
    23: "Assigns DIRECT_NVLINK_P2P or LOCAL_VRAM transfer mode string.",
    24: "Closes dictionary entry construct.",
    25: "Blank line.",
    26: "Returns complete list of per-rank P2P transfer status dictionaries.",
  },
};

export const nvlinkSymmetricMemoryPeerToPeerEngine: AlgorithmDefinition<nvlinkSymmetricMemoryPeerToPeerEngineInput> =
  {
    id: "nvlink-symmetric-memory-peer-to-peer-engine",
    title: "NVLink SymmetricMemory Peer-to-Peer Direct Transfer Engine",
    topicIds: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Hard",
    description:
      "NVLink SymmetricMemory (introduced in CUDA 12 and modern NVIDIA Hopper/Blackwell architectures) provides a unified, symmetric virtual address space across intra-node GPUs connected via NVSwitch.\n\n### Why It Exists & Problem Solved\nTraditional inter-process GPU communication requires calling CUDA driver APIs (`cudaMemcpyPeer`, `cudaIpcOpenMemHandle`), passing handle structures, and launching synchronization kernels. SymmetricMemory exposes remote GPU VRAM directly to low-level PTX assembly instructions (`LD.E`, `ST.E`, `red.async`). GPU thread blocks on Rank 0 can write directly to remote VRAM on Rank 1 at up to 900 GB/s bi-directional bandwidth per GPU, completely bypassing CUDA driver API call overheads and host CPU memory staging.\n\n### Step-by-Step Intuition\n1. **Symmetric Mapping**: A unified virtual memory mapping ensures address `0x7fff0000` on GPU 0 corresponds to the exact same physical memory offset on GPU 1.\n2. **Direct PTX Instruction Execution**: GPU kernels execute direct assembly loads and stores to remote GPU addresses without host CPU intervention.\n3. **Global Memory Barriers**: Memory fences (`membar.gl`) ensure remote NVLink write operations become visible across all GPU ranks.\n\n### Trade-offs & Complexity\n- **Time Complexity**: $O(N)$ linear step to compute symmetric rank offsets.\n- **Space Complexity**: $O(N)$ space storing peer transfer descriptors.\n- **Hardware Constraint**: Requires high-speed NVSwitch interconnect fabric (e.g. HGX H100 with 900 GB/s bi-directional bandwidth).",
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
          heading: "Why It Exists & Problem Solved",
          body: "SymmetricMemory maps identical virtual address ranges across all GPUs in an NVSwitch node. A pointer address 0x7fff0000 on GPU 0 corresponds to the exact same physical memory offset on GPU 1. Kernels execute direct PTX global loads/stores (LD.E, ST.E) to read and write peer memory without host driver invocation.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. Virtual memory space is symmetrically mapped across all GPUs in the node.\n2. GPU threads issue PTX assembly instructions directly targeting remote VRAM over NVLink at 900 GB/s.\n3. Hardware memory fences (membar.gl) enforce global visibility without driver API overhead.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "Traditional NCCL point-to-point transfers require CUDA driver kernel launches, staging buffers, and GPU signal flag checks. SymmetricMemory eliminates kernel launch overheads completely, allowing GPU threads to stream data over NVLink at full wire speed.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
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
