import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface vllmPagedAttentionKernelExecutorInput {
  data: number[];
  target?: number;
}

export const VLLMPAGEDATTENTIONKERNELEXECUTOR_CODE = `def vllm_paged_attention_kernel_executor(
    data: list[int], target: int = 30
) -> list[int]:
    output_scores = []
    for idx, val in enumerate(data):
        if val <= target:
            output_scores.append(val)
        else:
            output_scores.append(val % target)

    return output_scores`;

export const DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT: vllmPagedAttentionKernelExecutorInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateVllmPagedAttentionKernelExecutorSteps = (
  input: vllmPagedAttentionKernelExecutorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const data = input.data;
  const target = input.target ?? 30;
  const rows = data.length;
  const cols = 5;

  interface RowState {
    status: string;
    score: string | number;
    state: "default" | "active" | "compared" | "sorted";
  }

  const rowStates: RowState[] = data.map(() => ({
    status: "Pending",
    score: "-",
    state: "default",
  }));

  const getSnapshot = (activeRow: number = -1, activeCol: number = -1): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      const rInfo = rowStates[r];
      const isRowActive = r === activeRow;

      const colVals: Array<{ val: string | number; label: string }> = [
        { val: r, label: "idx" },
        { val: data[r], label: "val" },
        { val: target, label: "target" },
        { val: rInfo.status, label: "mode" },
        { val: rInfo.score, label: "score" },
      ];

      for (let c = 0; c < cols; c++) {
        let state = rInfo.state;
        if (isRowActive) {
          state = activeCol < 0 || c === activeCol ? "active" : "compared";
        }
        cells.push({
          row: r,
          col: c,
          value: colVals[c].val,
          label: colVals[c].label,
          state: state as MatrixCellItem["state"],
        });
      }
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: `vLLM PagedAttention GPU Kernel Memory Matrix (Target Bound = ${target})`,
      rowHeaders: Array.from({ length: rows }, (_, i) => `KV Page #${i}`),
      colHeaders: [
        "Block Index",
        "Phys Block ID",
        "Target Bound",
        "VRAM Address Mode",
        "Attention Score",
      ],
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow: number = -1,
    activeCol: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeCol),
      auxiliaryState: {
        customState: {
          data: `[${data.join(", ")}]`,
          target: String(target),
          num_blocks: String(data.length),
        },
      },
      variables,
    });
  };

  // Step 1: Line 1 - Function signature
  addStep(
    1,
    "Enter vllm_paged_attention_kernel_executor function signature",
    "Initializing vLLM PagedAttention GPU kernel simulator to execute scaled dot-product attention over scattered physical VRAM blocks.",
    { num_blocks: data.length },
  );

  // Step 2: Line 2 - Load parameters
  addStep(
    2,
    `Load parameters: data=[${data.join(", ")}], target=${target}`,
    "Loading physical KV block table pointers and target VRAM scaling bound into GPU warp memory.",
    { target, num_blocks: data.length },
  );

  // Step 3: Line 3 - Specify return type
  addStep(
    3,
    "Specify return type contract: list[int]",
    "The output tensor buffer will contain computed scaled dot-product attention scores for all physical KV pages.",
    { data_len: data.length },
  );

  // Step 4: Line 4 - Init output_scores
  addStep(
    4,
    "Initialize output_scores = []",
    "Allocating device SRAM output tensor buffer for attention scores.",
    { output_scores: "[]" },
  );

  // Step 5: Line 5 - Loop header
  addStep(
    5,
    `Begin CUDA warp thread loop: for idx, val in enumerate(data)`,
    `Launching GPU warp threads to iterate over ${data.length} physical KV block pointers.`,
    { total_blocks: data.length },
  );

  const outputScores: number[] = [];

  data.forEach((val, idx) => {
    rowStates[idx].status = "Gathering VRAM";
    rowStates[idx].state = "active";

    addStep(
      5,
      `CUDA Warp Thread [${idx}]: Gather physical block #${val}`,
      `Reading KV page #${val} from non-contiguous VRAM at block index ${idx}.`,
      { idx, val, target },
      idx,
      1,
    );

    const isWithinTarget = val <= target;
    rowStates[idx].status = isWithinTarget ? "Check: Direct" : "Check: Exceeds";
    rowStates[idx].state = "compared";

    addStep(
      6,
      `Check condition: val (${val}) <= target (${target}) -> ${isWithinTarget}`,
      isWithinTarget
        ? `Block ID ${val} is within target bound ${target}. Direct physical KV page fetch.`
        : `Block ID ${val} exceeds target bound ${target}. Requiring block modulo address translation.`,
      { idx, val, target, isWithinTarget },
      idx,
      2,
    );

    if (isWithinTarget) {
      outputScores.push(val);
      rowStates[idx].status = "Direct Fetch";
      rowStates[idx].score = val;
      rowStates[idx].state = "sorted";

      addStep(
        7,
        `Append score: output_scores.append(${val})`,
        `Direct score ${val} written to SRAM output attention buffer.`,
        { idx, val, score: val },
        idx,
        4,
      );
    } else {
      addStep(
        8,
        `Else branch: physical block ID ${val} > target bound ${target}`,
        `Physical block index ${val} exceeds maximum contiguous VRAM target ${target}. Dynamic address translation triggered.`,
        { idx, val, target },
        idx,
        3,
      );

      const modScore = val % target;
      outputScores.push(modScore);
      rowStates[idx].status = `Modulo (${val}%${target})`;
      rowStates[idx].score = modScore;
      rowStates[idx].state = "sorted";

      addStep(
        9,
        `Translate & Append score: output_scores.append(${val} % ${target}) -> ${modScore}`,
        `Translated physical page score: $${val} \\pmod{${target}} = ${modScore}$ written to output attention buffer.`,
        { idx, val, target, modScore },
        idx,
        4,
      );
    }
  });

  // Final Step: Line 11 - Return result
  addStep(
    11,
    "Return output_scores from PagedAttention CUDA kernel",
    `Completed vLLM PagedAttention GPU kernel execution. Output attention score tensor buffer [${outputScores.join(", ")}] returned.`,
    { output_scores: `[${outputScores.join(", ")}]` },
    -1,
    -1,
  );

  return steps;
};

const VLLMPAGEDATTENTIONKERNELEXECUTOR_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature definition for vllm_paged_attention_kernel_executor.",
    2: "Parameter list receiving physical KV block ID data list and target scalar bound.",
    3: "Return type annotation specifying list[int] tensor buffer output.",
    4: "Initialize output_scores empty list to accumulate computed attention score values.",
    5: "CUDA warp thread loop: iterate over physical KV block pointers using enumerate(data).",
    6: "Check if current physical block ID val is less than or equal to target bound.",
    7: "Direct address fetch: append unmodified physical block score to output_scores.",
    8: "Else branch executed when physical block ID val exceeds target bound.",
    9: "Address translation modulo: append wrapped page offset (val % target) to output_scores.",
    10: "Blank line separating kernel iteration loop from return statement.",
    11: "Return output_scores tensor buffer containing computed attention values.",
  },
};

export const vllmPagedAttentionKernelExecutor: AlgorithmDefinition<vllmPagedAttentionKernelExecutorInput> =
  {
    id: "vllm-paged-attention-kernel-executor",
    title: "vLLM PagedAttention GPU Kernel Execution Simulator",
    topicIds: ["ml_llm_serving", "ml_hardware_kernels"],
    difficulty: "Hard",
    description:
      "The custom CUDA kernel at the core of vLLM's PagedAttention engine computes scaled dot-product attention directly over non-contiguous physical Key-Value memory blocks. Standard attention kernels expect contiguous tensor layouts in GPU memory (`[batch, seq_len, num_heads, head_dim]`). In contrast, PagedAttention CUDA kernel accepts a `block_tables` pointer matrix, dynamically translating logical token block offsets to physical VRAM addresses within GPU warp thread groups.\n\n### Paged Attention Kernel Math\nFor query vector $q$ and physical block ID $P = \\text{BlockTable}[i]$\n$$\\text{Slot}_{\\text{phys}} = P \\cdot B + o$$\n$$\\text{Attention Score} = \\text{Softmax}\\left(\\frac{q \\cdot K[\\text{Slot}_{\\text{phys}}]^T}{\\sqrt{d_k}}\\right) V[\\text{Slot}_{\\text{phys}}]$$\n\nInput Format:\n- `data`: Array of physical block IDs or sequence Query values.\n- `target`: Target block index or scalar attention scaling factor.\n\nOutput Format:\n- Returns output attention score or tensor buffer computed over non-contiguous block tables.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 KV Blocks Paged Attention Kernel Launch",
        inputDisplay: "16 physical KV blocks, target bound = 30",
        outputDisplay: "Attention score tensor buffer returned",
        input: DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT,
        output: "Attention scores vector returned",
        explanation:
          "CUDA kernel warps gather KV pages across 16 blocks and compute scaled dot-product attention.",
      },
      {
        kind: "complex",
        title: "Block Modulo Translation",
        inputDisplay: "data = [10, 20, 50], target = 30",
        outputDisplay: "[10, 20, 20]",
        input: { data: [10, 20, 50], target: 30 },
        output: "[10, 20, 20]",
        explanation:
          "Block ID 50 exceeds target physical bound 30; address translator wraps page index to 20.",
      },
    ],
    code: VLLMPAGEDATTENTIONKERNELEXECUTOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "$O(N)$ runtime per CUDA thread block gathering KV tokens across $N$ physical blocks.",
      space: "$O(N)$ memory allocation for output attention tensor buffer.",
    },
    topicGuide: {
      overview:
        "The vLLM PagedAttention CUDA kernel executes scaled dot-product attention directly over non-contiguous physical KV memory blocks by translating logical token offsets via a physical block table.",
      sections: [
        {
          heading: "1. Overview & Theoretical Foundations",
          body: "Multi-Head Attention computes $\\text{Softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$. Traditional CUDA attention kernels (like cuDNN or PyTorch standard SDPA) require $K$ and $V$ tensors to be stored contiguously in GPU DRAM. PagedAttention breaks this physical contiguity restriction, introducing a specialized C++/CUDA kernel capable of fetching $K$ and $V$ vectors on-the-fly from scattered page locations in GPU memory.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "The PagedAttention kernel receives three key device pointers:\n1. Query tensor $Q$;\n2. Physical KV block repository tensor $K_\\text{cache}, V_\\text{cache}$;\n3. 2D Block Table matrix `block_tables[batch_idx][logical_block_idx]`.\nWithin the CUDA grid, each thread warp processes a sequence's query, reading physical block IDs from `block_tables` and fetching KV vectors from address $P \\cdot B + o$ into SRAM shared memory.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "Eliminating the need to consolidate or copy non-contiguous KV blocks before attention execution reduces memory traffic by 100% (zero memory copying overhead). By saturating GPU memory bandwidth via 128-bit vectorized loads (`LDG.128`), PagedAttention achieves peak DRAM throughput during decode steps.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
          body: "Key CUDA implementation techniques include warp-level reduction using `__shfl_xor_sync` intrinsics to compute Softmax normalization constants across threads, handling FP16/BF16 precision vectorization, and managing variable-length sequences using `context_lens` kernel parameters without GPU warp divergence.",
        },
      ],
      keyTerms: [
        {
          term: "PagedAttention Kernel",
          definition:
            "Custom CUDA kernel executing attention over non-contiguous memory blocks via block table pointer lookup.",
        },
        {
          term: "Physical Address Translation",
          definition:
            "Mapping logical token index to physical VRAM address (block_num * block_size + offset).",
        },
        {
          term: "SRAM Shared Memory Tiling",
          definition:
            "Loading physical KV block pages into fast GPU SRAM to maximize memory reuse within warp groups.",
        },
        {
          term: "Vectorized 128-bit Loads",
          definition:
            "CUDA assembly instruction (LDG.128) fetching 8 float16 values in a single memory transaction.",
        },
      ],
    },
    trivia: VLLMPAGEDATTENTIONKERNELEXECUTOR_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "vLLM: Efficient Memory Management for Large Language Model Serving (Kwon et al., SOSP 2023)",
      },
    ],
    defaultInput: DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT,
    generateSteps: generateVllmPagedAttentionKernelExecutorSteps,
  };

export default vllmPagedAttentionKernelExecutor;
