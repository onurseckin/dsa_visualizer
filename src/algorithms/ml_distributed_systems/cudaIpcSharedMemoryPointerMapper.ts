import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface cudaIpcSharedMemoryPointerMapperInput {
  data: number[];
  target?: number;
}

export const CUDAIPCSHAREDMEMORYPOINTERMAPPER_CODE = `def cuda_ipc_shared_memory_pointer_mapper(buffer_addresses: list[int], target_rank: int) -> dict:
    """
    Simulates CUDA IPC (Inter-Process Communication) zero-copy shared memory handle mapping across peer GPUs.
    Maps local physical VRAM virtual addresses into exported IPC mem handles and peer device pointers.

    Input:
        buffer_addresses: List of physical memory virtual address pointers (int64) for each GPU process.
        target_rank: GPU rank ID requesting peer memory access.

    Output:
        Dictionary mapping GPU ranks to exported IPC mem handles, virtual offsets, and peer mapping status.
    """
    if not buffer_addresses:
        return {}

    mapped_handles = {}
    total_ranks = len(buffer_addresses)

    for rank, base_addr in enumerate(buffer_addresses):
        # Generate 64-byte CUDA IPC handle hash from VRAM address offset
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
  const targetRank = input.target ?? 0;
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
          addresses: `[${input.data.map((v) => `0x${v.toString(16)}`).join(", ")}]`,
          targetRank: String(targetRank),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize CUDA IPC Zero-Copy Shared Memory Pointer Mapper",
    "Setting up physical GPU virtual address pointers and initializing IPC export table.",
    { total_buffers: input.data.length, target_rank: targetRank },
  );

  input.data.forEach((val, idx) => {
    const isTarget = idx === targetRank;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? "active" : "compare",
          pointers: [isTarget ? "Target-GPU" : `Peer-Rank-${idx}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    const handleHash = ((val ^ 0xdeadbeef) >>> 0).toString(16);

    addStep(
      15,
      `Map Rank ${idx} Address (0x${val.toString(16)}) -> IPC Handle (0x${handleHash})`,
      isTarget
        ? `Rank ${idx} is target process; assigning local primary virtual memory address.`
        : `Exporting cudaIpcGetMemHandle for Rank ${idx} to open peer device pointer for zero-copy DMA.`,
      {
        rank: idx,
        address: `0x${val.toString(16)}`,
        handle: `0x${handleHash}`,
        zeroCopy: !isTarget,
      },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    25,
    "Execution Complete",
    "Successfully mapped all intra-node GPU IPC handles into zero-copy peer memory pointers.",
    { completed: true, mapped_ranks: input.data.length },
    finalElements,
  );

  return steps;
};

const CUDAIPCSHAREDMEMORYPOINTERMAPPER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "cudaMemcpy(dst, src, bytes, cudaMemcpyHostToDevice)",
    "shm_open('/cuda_ipc_shm', O_CREAT | O_RDWR, 0666)",
    "return buffer_addresses[::-1]",
  ],
  hints: [
    { line: 15, hint: "Generate IPC handle for each GPU base address via bitwise translation." },
  ],
  lineExplanations: {
    1: "Defines entry point for CUDA IPC zero-copy memory handle pointer mapper.",
    11: "Validates non-empty buffer address list.",
    14: "Loops across GPU process virtual address pointers.",
    16: "Generates 64-bit IPC memory handle hash.",
    20: "Populates peer mapping table with IPC virtual address pointers.",
    27: "Returns complete IPC handle mapping dictionary.",
  },
};

export const cudaIpcSharedMemoryPointerMapper: AlgorithmDefinition<cudaIpcSharedMemoryPointerMapperInput> =
  {
    id: "cuda-ipc-shared-memory-pointer-mapper",
    title: "CUDA IPC Zero-Copy Shared Memory Pointer Mapper",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "CUDA Inter-Process Communication (IPC) allows multiple GPU worker processes residing on the same host (e.g. PyTorch DDP ranks or vLLM Worker Ray actors) to share device VRAM pointers directly over NVLink or PCIe without staging data through host CPU RAM.\n\nThis algorithm models the process of retrieving memory handles (`cudaIpcGetMemHandle`) on the owner rank and opening peer device pointers (`cudaIpcOpenMemHandle`) on consumer ranks to build a zero-copy intra-node shared memory table.\n\nInput Format:\n- data: Array of virtual memory address pointers (int64) representing allocated device VRAM buffers across GPU processes.\n- target: Rank ID of the primary process querying or exporting peer handles.\n\nOutput Format:\n- Returns a dictionary mapping each GPU rank to its exported IPC handle string, base virtual address, and zero-copy peer access status.\n\nEdge Cases & Constraints:\n- Peer access validation: `cudaDeviceCanAccessPeer` must be true for direct zero-copy NVLink DMA transfers.\n- Process lifetime: Closing a mapped IPC handle (`cudaIpcCloseMemHandle`) after process termination prevents GPU VRAM memory leaks.\n- Alignment: Memory allocations must be aligned to CUDA page boundaries (typically 2MB hugepages or 64KB blocks).",
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
          heading: "Core Concepts",
          body: "CUDA Inter-Process Communication utilizes `cudaIpcGetMemHandle` to export an opaque 64-byte handle (`cudaIpcMemHandle_t`) representing a physical VRAM allocation. Another process on the same node invokes `cudaIpcOpenMemHandle` to obtain a valid local device pointer pointing directly to remote GPU VRAM over the PCIe/NVLink bus.",
        },
        {
          heading: "Systems & Bandwidth Impact",
          body: "Standard multi-process communication requires staging GPU memory through host CPU RAM (Device-to-Host -> IPC -> Host-to-Device), bottlenecked by CPU PCIe bandwidth (~32-64 GB/s). CUDA IPC bypasses host memory entirely, achieving full NVLink bandwidth (up to 900 GB/s on NVIDIA NVSwitch architectures).",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "CUDA IPC handles are valid only within the same Linux IPC namespace and physical node. Passing handles across nodes or unshared IPC namespaces causes runtime invalid pointer crashes. Processes must explicitly call `cudaIpcCloseMemHandle` before freeing allocations to avoid device driver deadlocks.",
        },
        {
          heading: "Architecture & Topology Trade-offs",
          body: "In high-throughput LLM serving systems (such as vLLM or TensorRT-LLM), multi-process execution models rely on CUDA IPC shared memory buffers for zero-copy KV-cache transfer and PagedAttention block pointer exchanges between Ray worker processes.",
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
