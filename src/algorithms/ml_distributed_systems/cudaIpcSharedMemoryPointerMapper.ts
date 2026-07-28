import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface cudaIpcSharedMemoryPointerMapperInput {
  data: number[];
  target?: number;
}

export const CUDAIPCSHAREDMEMORYPOINTERMAPPER_CODE = `def cuda_ipc_shared_memory_pointer_mapper(buffer_addresses: list[int], target_rank: int) -> dict:
    if not buffer_addresses:
        return {}

    mapped_handles = {}
    total_ranks = len(buffer_addresses)

    for rank, base_addr in enumerate(buffer_addresses):
        ipc_handle_hash = (base_addr ^ 0xDEADBEEF00) & 0xFFFFFFFFFFFFFFFF
        is_target = (rank == target_rank)

        mapped_handles[rank] = {
            "rank": rank,
            "virtual_address": hex(base_addr),
            "ipc_handle": f"cudaIpcHandle_0x{ipc_handle_hash:016x}",
            "peer_access_enabled": not is_target,
            "can_access_target": is_target or (rank < total_ranks)
        }

    return mapped_handles
`;

export const DEFAULT_CUDAIPCSHAREDMEMORYPOINTERMAPPER_INPUT: cudaIpcSharedMemoryPointerMapperInput =
  {
    data: [0x7f8000, 0x7f8400, 0x7f8800, 0x7f8c00],
    target: 0,
  };

export const generateCudaIpcSharedMemoryPointerMapperSteps = (
  input: cudaIpcSharedMemoryPointerMapperInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const addresses = input.data.length > 0 ? input.data : [0x7f8000, 0x7f8400, 0x7f8800, 0x7f8c00];
  const targetRank = Math.max(0, Math.min(input.target ?? 0, addresses.length - 1));
  const totalRanks = addresses.length;

  const buildMatrixCells = (
    currentRank?: number,
    completedRanks: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    const colLabels = ["Rank", "Virtual Addr", "IPC Handle", "P2P Access"];

    for (let r = 0; r < totalRanks; r++) {
      const addr = addresses[r];
      const handleHashStr = ((BigInt(addr) ^ BigInt("0xDEADBEEF00")) & BigInt("0xFFFFFFFFFFFFFFFF"))
        .toString(16)
        .padStart(16, "0");
      const isTarget = r === targetRank;
      const isDone = completedRanks.includes(r);
      const isActive = r === currentRank;

      const rowValues = [
        `Rank ${r}`,
        `0x${addr.toString(16)}`,
        `cudaIpcHandle_0x${handleHashStr}`,
        isTarget ? "Local Owner" : "P2P Enabled",
      ];

      for (let c = 0; c < 4; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isDone) state = "sorted";
        else if (isActive) state = c === 2 ? "active" : "compared";

        cells.push({
          row: r,
          col: c,
          value: rowValues[c],
          label: `${colLabels[c]} (R${r})`,
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
        rows: totalRanks,
        cols: 4,
        rowHeaders: Array.from({ length: totalRanks }, (_, r) => `GPU ${r}`),
        colHeaders: ["Rank", "VRAM Address", "CUDA IPC Handle", "Peer Access Status"],
        cells: buildMatrixCells(currentRank, completedRanks),
      },
      auxiliaryState: {
        customState: {
          totalRanks: String(totalRanks),
          targetRank: String(targetRank),
          completedCount: String(completedRanks.length),
          primaryAddress: `0x${addresses[targetRank].toString(16)}`,
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    1,
    "Enter cuda_ipc_shared_memory_pointer_mapper",
    `Initializing CUDA IPC zero-copy shared memory pointer mapping for ${totalRanks} GPU processes targeting Rank ${targetRank}.`,
    { total_addresses: totalRanks, target_rank: targetRank },
  );

  // Step 2: Input check
  addStep(
    2,
    "Validate Buffer Address List",
    `Evaluating if buffer_addresses list is empty. Found ${totalRanks} valid physical VRAM address pointers.`,
    { buffer_addresses_count: totalRanks, valid: true },
  );

  // Step 3: Initialize container
  addStep(
    5,
    "Initialize Mapped Handles Dictionary",
    "Created empty mapped_handles dictionary to store exported 64-byte CUDA IPC mem handles and virtual offsets.",
    { mapped_handles_size: 0 },
  );

  // Step 4: Compute total_ranks
  addStep(
    6,
    "Compute Total Rank Count",
    `Set total_ranks = len(buffer_addresses) = ${totalRanks}.`,
    { total_ranks: totalRanks },
  );

  const completedRanks: number[] = [];

  // Loop over ranks
  for (let rank = 0; rank < totalRanks; rank++) {
    const baseAddr = addresses[rank];
    const isTarget = rank === targetRank;

    // Step: Loop header
    addStep(
      8,
      `Iterate GPU Rank ${rank} Base Address`,
      `Processing rank=${rank} with physical base VRAM address 0x${baseAddr.toString(16)}.`,
      { rank, base_addr_hex: `0x${baseAddr.toString(16)}` },
      rank,
      completedRanks,
    );

    // Step: Compute IPC handle hash
    const handleHashStr = (
      (BigInt(baseAddr) ^ BigInt("0xDEADBEEF00")) &
      BigInt("0xFFFFFFFFFFFFFFFF")
    )
      .toString(16)
      .padStart(16, "0");
    addStep(
      9,
      `Compute IPC Handle Hash for Rank ${rank}`,
      `ipc_handle_hash = (0x${baseAddr.toString(16)} ^ 0xDEADBEEF00) & mask = 0x${handleHashStr}.`,
      { rank, ipc_handle_hash: `0x${handleHashStr}` },
      rank,
      completedRanks,
    );

    // Step: Is target evaluation
    addStep(
      10,
      `Evaluate Target Rank Flag for Rank ${rank}`,
      `is_target = (${rank} == ${targetRank}) = ${isTarget}.`,
      { rank, is_target: isTarget, target_rank: targetRank },
      rank,
      completedRanks,
    );

    // Step: Construct dictionary payload start
    addStep(
      12,
      `Construct Mapped Handle Entry for Rank ${rank}`,
      `Building dictionary payload mapping rank ${rank} to IPC mem handle.`,
      { rank },
      rank,
      completedRanks,
    );

    // Step: Assign rank field
    addStep(
      13,
      `Set rank Field = ${rank}`,
      `Populating dictionary field "rank": ${rank}.`,
      { rank },
      rank,
      completedRanks,
    );

    // Step: Assign virtual_address field
    addStep(
      14,
      `Set virtual_address Field = 0x${baseAddr.toString(16)}`,
      `Populating dictionary field "virtual_address": hex(${baseAddr}).`,
      { rank, hex_addr: `0x${baseAddr.toString(16)}` },
      rank,
      completedRanks,
    );

    // Step: Assign ipc_handle field
    addStep(
      15,
      `Export cudaIpcGetMemHandle String for Rank ${rank}`,
      `Populating field "ipc_handle": "cudaIpcHandle_0x${handleHashStr}".`,
      { rank, handle: `cudaIpcHandle_0x${handleHashStr}` },
      rank,
      completedRanks,
    );

    // Step: Assign peer_access_enabled field
    addStep(
      16,
      `Set peer_access_enabled = ${!isTarget} for Rank ${rank}`,
      isTarget
        ? "Target rank uses direct local virtual address; P2P export unnecessary."
        : "Exporting cudaIpcOpenMemHandle for peer zero-copy DMA access.",
      { rank, peer_access_enabled: !isTarget },
      rank,
      completedRanks,
    );

    // Step: Assign can_access_target field
    addStep(
      17,
      `Verify can_access_target = true for Rank ${rank}`,
      `Validated cudaDeviceCanAccessPeer between Rank ${rank} and Rank ${targetRank}.`,
      { rank, can_access_target: true },
      rank,
      completedRanks,
    );

    // Step: Complete entry dictionary
    completedRanks.push(rank);
    addStep(
      18,
      `Store Rank ${rank} Mapping in IPC Handle Table`,
      `Successfully registered Rank ${rank} IPC handle into mapped_handles dictionary.`,
      { rank, total_mapped: completedRanks.length },
      undefined,
      completedRanks,
    );
  }

  // Verification step: Memory alignment & zero copy checks
  addStep(
    20,
    "Verify CUDA Driver Page Alignment & Zero-Copy Pointer Table",
    `Verified all ${totalRanks} GPU handles align with 2MB hugepages and NVLink P2P DMA permissions.`,
    { total_ranks: totalRanks, verified: true },
    undefined,
    completedRanks,
  );

  // Return step
  addStep(
    20,
    "Return Mapped Handles Dictionary",
    "Returning final dictionary of mapped CUDA IPC shared memory handles and zero-copy peer pointers.",
    { completed: true, mapped_ranks: totalRanks },
    undefined,
    completedRanks,
  );

  return steps;
};

const CUDAIPCSHAREDMEMORYPOINTERMAPPER_TRIVIA: TriviaMeta = {
  skipLines: [4, 7, 11, 19],
  distractors: [
    "cudaMemcpy(dst, src, bytes, cudaMemcpyHostToDevice)",
    "shm_open('/cuda_ipc_shm', O_CREAT | O_RDWR, 0666)",
    "return buffer_addresses[::-1]",
  ],
  hints: [
    { line: 9, hint: "Generate 64-byte IPC memory handle from physical GPU VRAM base address." },
  ],
  lineExplanations: {
    1: "Defines entry point for CUDA IPC zero-copy shared memory pointer mapper function.",
    2: "Checks if the buffer_addresses list is empty.",
    3: "Returns an empty dictionary immediately if buffer_addresses is empty.",
    4: "Blank line before handle mapping initialization.",
    5: "Initializes empty dictionary to accumulate mapped IPC handles.",
    6: "Calculates total number of GPU processes in the node group.",
    7: "Blank line before process enumeration loop.",
    8: "Iterates through buffer_addresses with rank index and base_addr pointer.",
    9: "Generates 64-byte CUDA IPC handle hash from VRAM address offset.",
    10: "Checks if current rank matches target_rank.",
    11: "Blank line before dictionary payload construction.",
    12: "Appends mapping dictionary entry for current GPU rank.",
    13: "Sets rank key in output mapping entry.",
    14: "Sets virtual_address key formatted as hex string.",
    15: "Sets ipc_handle key as formatted cudaIpcHandle string.",
    16: "Sets peer_access_enabled boolean flag.",
    17: "Sets can_access_target boolean validation flag.",
    18: "Closes mapping dictionary entry definition.",
    19: "Blank line before returning mapped_handles.",
    20: "Returns complete dictionary of mapped CUDA IPC handles.",
  },
};

export const cudaIpcSharedMemoryPointerMapper: AlgorithmDefinition<cudaIpcSharedMemoryPointerMapperInput> =
  {
    id: "cuda-ipc-shared-memory-pointer-mapper",
    title: "CUDA IPC Zero-Copy Shared Memory Pointer Mapper",
    topicIds: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Medium",
    description:
      "CUDA Inter-Process Communication (IPC) allows multiple GPU worker processes residing on the same host (e.g. PyTorch DDP ranks or vLLM Worker Ray actors) to share device VRAM pointers directly over NVLink or PCIe without staging data through host CPU system RAM.\n\n### Why It Exists & Problem Solved\nStandard multi-process communication requires copying GPU data to host CPU memory before sending it over Unix sockets or shared memory (Device-to-Host -> CPU IPC -> Host-to-Device), capped by PCIe host bandwidth (~32-64 GB/s). CUDA IPC exports opaque 64-byte physical memory tokens (`cudaIpcMemHandle_t`) that peer processes open (`cudaIpcOpenMemHandle`), granting direct zero-copy GPU-to-GPU DMA transfers at full NVLink speed (up to 900 GB/s on NVSwitch).\n\n### Step-by-Step Intuition\n1. **Handle Export**: Owner GPU process allocates VRAM (`cudaMalloc`) and calls `cudaIpcGetMemHandle(&handle, ptr)`.\n2. **Handle Exchange**: The 64-byte IPC handle is passed to peer worker processes via Unix domain sockets or shared memory.\n3. **Peer Memory Binding**: Peer process calls `cudaIpcOpenMemHandle(&peer_ptr, handle, cudaIpcMemLazyEnablePeerAccess)` to map the remote physical VRAM directly into its local CUDA virtual address space.\n4. **Zero-Copy Execution**: Peer GPU reads/writes `peer_ptr` directly over NVLink without host CPU intervention.\n\n### Trade-offs & Complexity\n- **Time Complexity**: $O(N)$ linear step to export handles for $N$ GPU worker ranks.\n- **Space Complexity**: $O(N)$ memory table storing IPC handles and virtual offset pointers.\n- **Scope Limit**: CUDA IPC handles are valid ONLY within the same physical host and IPC namespace. Cross-node transfers must use NCCL InfiniBand transport.",
    constraints: ["1 <= data.length <= 64", "0 <= target < data.length"],
    examples: [
      {
        kind: "basic",
        title: "4-GPU Intra-Node IPC Mapping",
        inputDisplay: "data = [0x7f8000, 0x7f8400, 0x7f8800, 0x7f8c00], target = 0",
        outputDisplay: "Mapped 4 GPU IPC Handles for Target Rank 0",
        input: { data: [0x7f8000, 0x7f8400, 0x7f8800, 0x7f8c00], target: 0 },
        output: "Mapped 4 GPU IPC Handles for Target Rank 0",
        explanation:
          "Exports 64-byte IPC handles for GPU Ranks 1, 2, 3 into Rank 0 virtual memory space.",
      },
      {
        kind: "complex",
        title: "2-GPU Direct Peer Mapping",
        inputDisplay: "data = [0x1000, 0x2000], target = 1",
        outputDisplay: "Mapped 2 GPU IPC Handles for Target Rank 1",
        input: { data: [0x1000, 0x2000], target: 1 },
        output: "Mapped 2 GPU IPC Handles for Target Rank 1",
        explanation: "Maps GPU 0 device pointer directly to GPU 1 consumer process.",
      },
      {
        kind: "negative",
        title: "Single GPU Self-Mapping",
        inputDisplay: "data = [0xa000], target = 0",
        outputDisplay: "Mapped 1 GPU IPC Handle for Target Rank 0",
        input: { data: [0xa000], target: 0 },
        output: "Mapped 1 GPU IPC Handle for Target Rank 0",
        explanation: "Single GPU process returns local virtual address without peer IPC transfers.",
      },
    ],
    code: CUDAIPCSHAREDMEMORYPOINTERMAPPER_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass O(N) over GPU process address list to generate IPC handles.",
      space: "O(N) space to store IPC memory handle table and peer virtual address mapping.",
    },
    topicGuide: {
      overview:
        "CUDA IPC enables multi-process GPU workers on the same node to directly share device VRAM pointers over NVLink without host memory copies.",
      sections: [
        {
          heading: "Why It Exists & Problem Solved",
          body: "In high-performance ML inference servers (such as vLLM or TensorRT-LLM running Ray worker processes), multiple Python worker processes run on separate GPUs on the same machine. Passing KV-cache buffers or model weights between worker processes via CPU memory creates severe PCI bottlenecking. CUDA IPC allows workers to pass 64-byte handles and read remote GPU VRAM directly over NVLink.",
        },
        {
          heading: "Step-by-Step Intuition",
          body: "1. The allocating GPU process invokes cudaIpcGetMemHandle to obtain a hardware handle for its VRAM allocation.\n2. The handle is sent to peer processes over IPC domain sockets.\n3. Consumers call cudaIpcOpenMemHandle to translate the handle into a local device pointer.\n4. Direct Peer-to-Peer (P2P) DMA transfers proceed at full interconnect speed.",
        },
        {
          heading: "Distributed Systems & Bandwidth Analysis",
          body: "Bypassing CPU host memory saves up to 10x-20x latency per memory transfer. Direct NVLink bandwidth (up to 900 GB/s on NVIDIA NVSwitch) enables microsecond-level KV-cache block sharing and zero-copy tensor parallelism.",
        },
        {
          heading: "Hardware & Architecture Trade-offs",
          body: "IPC handles require unified virtual addressing (UVA) and valid Peer-to-Peer access permissions (cudaDeviceCanAccessPeer). Processes must explicitly close open memory handles (cudaIpcCloseMemHandle) before driver termination to prevent GPU VRAM memory leaks.",
        },
      ],
      keyTerms: [
        {
          term: "CUDA IPC Handle",
          definition:
            "An opaque 64-byte hardware token exporting a physical GPU VRAM allocation across process boundaries.",
        },
        {
          term: "Zero-Copy Access",
          definition:
            "Direct GPU device memory access bypassing host CPU system RAM allocations entirely.",
        },
        {
          term: "Peer-to-Peer (P2P) DMA",
          definition:
            "Direct memory access transfer executed directly across NVLink or PCIe interconnects between GPUs.",
        },
        {
          term: "Virtual Address Translation",
          definition:
            "Binding a remote GPU physical memory region into a local CUDA process virtual memory address space.",
        },
      ],
    },
    trivia: CUDAIPCSHAREDMEMORYPOINTERMAPPER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_CUDAIPCSHAREDMEMORYPOINTERMAPPER_INPUT,
    generateSteps: generateCudaIpcSharedMemoryPointerMapperSteps,
  };
