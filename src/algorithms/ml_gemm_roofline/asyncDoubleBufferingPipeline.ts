import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asyncDoubleBufferingPipelineInput {
  numStages?: number;
  blockSize?: number;
  data?: number[];
  target?: number;
}

export const ASYNCDOUBLEBUFFERINGPIPELINE_CODE = `def async_double_buffering_pipeline(num_stages=4, block_size=4):
    pipeline_states = []
    buf_a, buf_b = [0] * block_size, [0] * block_size
    for stage in range(num_stages):
        stage_data = [stage * 10 + i for i in range(block_size)]
        buf_b = stage_data
        compute_res = [val * 2 for val in buf_a]
        pipeline_states.append((stage, buf_a, buf_b, compute_res))
        buf_a, buf_b = buf_b, buf_a
    return pipeline_states`;

export const DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT: asyncDoubleBufferingPipelineInput = {
  numStages: 5,
  blockSize: 4,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAsyncDoubleBufferingPipelineSteps = (
  input: asyncDoubleBufferingPipelineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numStages = Math.max(input.numStages ?? 5, 4);
  const blockSize = Math.max(input.blockSize ?? 4, 3);

  let bufA: number[] = new Array(blockSize).fill(0);
  let bufB: number[] = new Array(blockSize).fill(0);

  const getMatrixSnapshot = (
    currentBufA: number[],
    currentBufB: number[],
    computeRes: number[],
    hbmData: number[],
    stage: number,
    phase: string,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];

    // Row 0: Buffer A (SRAM Compute)
    for (let c = 0; c < blockSize; c++) {
      cells.push({
        row: 0,
        col: c,
        value: currentBufA[c] ?? 0,
        label: `BufA[${c}]`,
        state: phase === "compute" || phase === "append" ? "active" : "sorted",
      });
    }

    // Row 1: Buffer B (SRAM DMA Target)
    for (let c = 0; c < blockSize; c++) {
      cells.push({
        row: 1,
        col: c,
        value: currentBufB[c] ?? 0,
        label: `BufB[${c}]`,
        state: phase === "dma" ? "pivot" : "compared",
      });
    }

    // Row 2: Compute Result
    for (let c = 0; c < blockSize; c++) {
      cells.push({
        row: 2,
        col: c,
        value: computeRes[c] ?? 0,
        label: `Out[${c}]`,
        state: phase === "compute" || phase === "append" ? "active" : "default",
      });
    }

    // Row 3: HBM Memory Source
    for (let c = 0; c < blockSize; c++) {
      cells.push({
        row: 3,
        col: c,
        value: hbmData[c] ?? 0,
        label: `HBM[${c}]`,
        state: phase === "dma" ? "compared" : "inactive",
      });
    }

    return {
      kind: "matrix",
      rows: 4,
      cols: blockSize,
      title: `Double-Buffering Pipeline (Stage ${stage}/${numStages} - ${phase.toUpperCase()})`,
      rowHeaders: ["Buf A (Compute)", "Buf B (DMA Target)", "Compute Output", "HBM Input Batch"],
      colHeaders: Array.from({ length: blockSize }, (_, idx) => `Slot ${idx}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    matrixSnapshot: MatrixVisualSnapshot,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: matrixSnapshot,
      auxiliaryState: {
        customState: {
          numStages: String(numStages),
          blockSize: String(blockSize),
        },
      },
      variables,
    });
  };

  // Step 1: Function setup
  let emptyCompute = new Array(blockSize).fill(0);
  let emptyHbm = new Array(blockSize).fill(0);

  addStep(
    1,
    "Initialize Async Double-Buffering Copy Pipeline",
    "Setting up execution parameters for double-buffering DMA overlap.",
    { num_stages: numStages, block_size: blockSize },
    getMatrixSnapshot(bufA, bufB, emptyCompute, emptyHbm, 0, "init"),
  );

  // Line 2: Initialize pipeline states history log
  addStep(
    2,
    "Initialize Pipeline State History Log",
    "Allocating tracking list for recording ping-pong buffer states across stages.",
    { pipeline_states: "[]" },
    getMatrixSnapshot(bufA, bufB, emptyCompute, emptyHbm, 0, "init"),
  );

  // Line 3: Allocate SRAM ping-pong buffers
  addStep(
    3,
    "Allocate Ping-Pong SRAM Buffers",
    `Allocated buf_a and buf_b of size ${blockSize} in on-chip SRAM initialized to zeros.`,
    { buf_a: `[${bufA.join(",")}]`, buf_b: `[${bufB.join(",")}]` },
    getMatrixSnapshot(bufA, bufB, emptyCompute, emptyHbm, 0, "init"),
  );

  for (let stage = 0; stage < numStages; stage++) {
    // Line 4: Stage loop header
    addStep(
      4,
      `Begin Pipeline Stage ${stage}`,
      `Iterating through pipeline stage ${stage} of ${numStages}.`,
      { stage, num_stages: numStages },
      getMatrixSnapshot(bufA, bufB, emptyCompute, emptyHbm, stage, "stage_start"),
    );

    // Line 5: Generate stage DMA data batch
    const stageData = Array.from({ length: blockSize }, (_, i) => stage * 10 + i);
    addStep(
      5,
      `Issue Async DMA Load for Stage ${stage}`,
      `Fetching HBM data batch [${stageData.join(", ")}] into background transfer queue.`,
      { stage, stage_data: `[${stageData.join(",")}]` },
      getMatrixSnapshot(bufA, bufB, emptyCompute, stageData, stage, "dma"),
    );

    // Line 6: Assign DMA to buf_b
    bufB = [...stageData];
    addStep(
      6,
      `Store DMA Batch into SRAM Buffer B`,
      `Buffer B now holds stage ${stage} tile data while Tensor Cores process Buffer A.`,
      { stage, buf_b: `[${bufB.join(",")}]` },
      getMatrixSnapshot(bufA, bufB, emptyCompute, stageData, stage, "dma"),
    );

    // Line 7: Compute results on buf_a
    const computeRes = bufA.map((val) => val * 2);
    addStep(
      7,
      `Execute Tensor Core Compute on Active Buffer A`,
      `Computing arithmetic output on active Buffer A: [${computeRes.join(", ")}].`,
      { stage, compute_res: `[${computeRes.join(",")}]` },
      getMatrixSnapshot(bufA, bufB, computeRes, stageData, stage, "compute"),
    );

    // Line 8: Record state
    addStep(
      8,
      `Record Pipeline Stage ${stage} Snapshot`,
      `Appending stage tuple (stage=${stage}, buf_a, buf_b, compute_res) to history log.`,
      { stage, recorded: true },
      getMatrixSnapshot(bufA, bufB, computeRes, stageData, stage, "append"),
    );

    // Line 9: Buffer swap
    const temp = bufA;
    bufA = bufB;
    bufB = temp;
    addStep(
      9,
      `Swap Ping-Pong SRAM Buffers (buf_a <-> buf_b)`,
      `Swapped pointers: buf_a now holds stage ${stage} data for next stage compute, buf_b released for DMA load.`,
      { stage, buf_a: `[${bufA.join(",")}]`, buf_b: `[${bufB.join(",")}]` },
      getMatrixSnapshot(bufA, bufB, computeRes, stageData, stage, "swap"),
    );
  }

  // Line 10: Return
  addStep(
    10,
    "Pipeline Execution Complete",
    "Successfully executed async double-buffering pipeline simulation across all stages.",
    { completed: true },
    getMatrixSnapshot(bufA, bufB, emptyCompute, emptyHbm, numStages, "complete"),
  );

  return steps;
};

const ASYNCDOUBLEBUFFERINGPIPELINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["time.sleep(0.001)", "buf_a = [0] * block_size", "pipeline_states.clear()"],
  hints: [
    { line: 4, hint: "Loop through pipeline stages to process hardware tile batches." },
    {
      line: 9,
      hint: "Swap ping-pong buffer pointers so the loaded buffer becomes active for compute.",
    },
  ],
  lineExplanations: {
    1: "Defines async_double_buffering_pipeline function accepting num_stages and block_size parameters.",
    2: "Initializes empty pipeline_states list to track buffer snapshots across stages.",
    3: "Allocates ping-pong shared memory buffers buf_a and buf_b initialized to zeros.",
    4: "Iterates through each execution stage from 0 to num_stages - 1.",
    5: "Generates asynchronous DMA transfer data batch for the current stage.",
    6: "Assigns fetched DMA stage data asynchronously into target buffer buf_b.",
    7: "Executes parallel Tensor Core compute operations on active buffer buf_a.",
    8: "Appends pipeline stage tuple (stage, buf_a, buf_b, compute_res) to history log.",
    9: "Swaps ping-pong buffers buf_a and buf_b for the next pipeline stage.",
    10: "Returns complete history log of pipeline execution states.",
  },
};

export const asyncDoubleBufferingPipeline: AlgorithmDefinition<asyncDoubleBufferingPipelineInput> =
  {
    id: "async-double-buffering-pipeline",
    title: "Async Double-Buffering Copy Pipeline",
    topicIds: ["ml_gemm_roofline", "arrays_and_hashing"],
    difficulty: "Hard",
    description: `In high-performance GPU programming (NVIDIA CUDA CUTLASS, OpenAI Triton, C++20 \`cuda::pipeline\`, and Hopper TMA), **asynchronous double-buffering** (ping-pong buffering) is a critical software pipelining technique used to hide global memory latency in GEMM and Attention kernels.

Without software pipelining, Tensor Cores spend up to $70\\%$ of execution cycles stalled waiting for DRAM/HBM memory transfers. Double-buffering hides memory latency by maintaining two distinct shared memory (SRAM) tile buffers ($\\text{Buffer}_A$ and $\\text{Buffer}_B$). While the GPU Tensor Cores execute floating-point matrix arithmetic on tile $k$ stored in $\\text{Buffer}_A$, an asynchronous DMA engine (\`cp.async\` or TMA) simultaneously transfers tile $k+1$ from HBM into $\\text{Buffer}_B$ in the background.

Under the Roofline Model, total execution time for $S$ tile stages drops from:
$$T_{\\text{serial}} = S \\times (T_{\\text{load}} + T_{\\text{compute}})$$
to:
$$T_{\\text{pipelined}} = T_{\\text{load}, 0} + (S-1) \\times \\max(T_{\\text{load}}, T_{\\text{compute}}) + T_{\\text{compute}, S-1}$$
When $T_{\\text{compute}} \\ge T_{\\text{load}}$, memory latency is completely hidden and throughput reaches the arithmetic ceiling.

This algorithm simulates an Async Double-Buffering Copy Pipeline step-by-step, explicitly modeling the HBM-to-SRAM DMA load queue, the active Tensor Core compute buffer, the output result matrix, and the ping-pong buffer swapping operation across stages.`,
    constraints: ["4 <= numStages <= 20", "2 <= blockSize <= 8"],
    examples: [
      {
        kind: "basic",
        title: "Standard 5-Stage Double Buffering",
        inputDisplay: "numStages = 5, blockSize = 4",
        outputDisplay: "5 Pipeline Stage Snapshots Recorded",
        input: DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
        output: "5 Pipeline Stage Snapshots Recorded",
        explanation: "Overlaps 5 stages of asynchronous DMA loads with SRAM Tensor Core compute.",
      },
      {
        kind: "complex",
        title: "Deep Pipeline Execution",
        inputDisplay: "numStages = 8, blockSize = 4",
        outputDisplay: "8 Pipeline Stage Snapshots Recorded",
        input: { numStages: 8, blockSize: 4 },
        output: "8 Pipeline Stage Snapshots Recorded",
        explanation:
          "Evaluates multi-stage pipeline latency hiding under sustained memory throughput.",
      },
    ],
    code: ASYNCDOUBLEBUFFERINGPIPELINE_CODE,
    timeComplexity: { best: "O(S * B)", average: "O(S * B)", worst: "O(S * B)" },
    spaceComplexity: "O(S * B)",
    complexityAnalysis: {
      time: "Linear in the total number of elements processed across S stages and B block size O(S * B).",
      space: "O(S * B) space to log pipeline stage history states.",
    },
    topicGuide: {
      overview:
        "Double-buffering (ping-pong buffering) is an asynchronous software pipelining technique engineered to saturate hardware compute units by overlapping high-latency memory transfers with arithmetic computation. In GPU architectures, moving data from High Bandwidth Memory (HBM) to on-chip shared memory (SRAM) incurs hundreds of clock cycles of latency. Without pipelining, Tensor Cores spend up to $70\\%$ of their execution cycles stalled waiting for data.\n\nBy allocating two distinct shared memory buffers ($\\text{Buffer}_A$ and $\\text{Buffer}_B$), an asynchronous DMA engine copies block $k+1$ from HBM into $\\text{Buffer}_B$ while Tensor Cores process block $k$ from $\\text{Buffer}_A$ in parallel.",
      sections: [
        {
          heading: "Why It Exists & Theoretical Foundations",
          body: "Under the Roofline Performance Model, kernel execution is bounded by either memory bandwidth or compute throughput. Without pipelining, total execution time for $S$ stages is $T_{\\text{total}} = S \\times (T_{\\text{load}} + T_{\\text{compute}})$. With double-buffering, data transfer and compute occur concurrently:\n$$T_{\\text{total}} = T_{\\text{load}, 0} + (S-1) \\times \\max(T_{\\text{load}}, T_{\\text{compute}}) + T_{\\text{compute}, S-1}$$\nWhen $T_{\\text{compute}} \\ge T_{\\text{load}}$, memory access latency is completely hidden, pushing execution up to the arithmetic ceiling of the Roofline curve.",
        },
        {
          heading: "What It Solves & Real-World Applications",
          body: "Double-buffering solves hardware stall cycles in large matrix multiplications (GEMM), FlashAttention-2/3 kernels, and Conv2D deep learning operators. It is natively implemented in NVIDIA CUTLASS, OpenAI Triton, PyTorch Inductor, and LLM serving engines (vLLM, TensorRT-LLM) to achieve peak TFLOPS on H100/B200 Tensor Core GPUs.",
        },
        {
          heading: "Step-by-Step Intuition & Worked Example",
          body: "Consider processing 4 tile stages with block size $B = 4$. At Stage 0 (prologue), $\\text{Buffer}_A$ contains zeros while HBM loads Batch 0 into $\\text{Buffer}_B$. At Stage 1, pointers swap: $\\text{Buffer}_A$ holds Batch 0 (Tensor Cores multiply Batch 0 by 2), while DMA asynchronously pulls Batch 1 into $\\text{Buffer}_B$. At Stage 2, pointers swap again: $\\text{Buffer}_A$ computes on Batch 1, while $\\text{Buffer}_B$ receives Batch 2. This continuous ping-pong flow maintains $100\\%$ Tensor Core utilization.",
        },
        {
          heading: "Trade-offs & Hardware Realities",
          body: "The primary trade-off of double-buffering is doubled SRAM (shared memory) footprint per thread block. Because GPU SRAM capacity is strictly limited (e.g. $228\\text{ KB}$ per SM on NVIDIA H100), allocating two buffers reduces the maximum active thread blocks per SM (occupancy). Developers must balance shared memory tile sizing against register pressure and warp occupancy.",
        },
        {
          heading: "Time & Space Complexity Analysis",
          body: "Time Complexity: $\\mathcal{O}(S \\times B)$ where $S$ is the number of stages and $B$ is the tile block size. Overlapped memory accesses reduce total wall-clock latency from $\\mathcal{O}(S \\times (T_{\\text{load}} + T_{\\text{compute}}))$ to $\\mathcal{O}(S \\times \\max(T_{\\text{load}}, T_{\\text{compute}}))$. Space Complexity: $\\mathcal{O}(B)$ hardware SRAM buffers required per thread block.",
        },
      ],
      keyTerms: [
        {
          term: "Ping-Pong Buffering",
          definition:
            "Alternating between two dedicated memory buffers so hardware DMA can load new data into one buffer while compute units process the other.",
        },
        {
          term: "Asynchronous Copy (cp.async / TMA)",
          definition:
            "Hardware instructions that copy data from DRAM to SRAM in the background without holding warp execution threads hostage.",
        },
        {
          term: "Latency Hiding",
          definition:
            "Overlapping slow memory access cycles with independent arithmetic calculations so memory delay does not stall the processor.",
        },
        {
          term: "Pipeline Prologue & Epilogue",
          definition:
            "The initial pipeline fill phase before compute begins and the final drain phase after all memory transfers finish.",
        },
      ],
    },
    trivia: ASYNCDOUBLEBUFFERINGPIPELINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
    defaultInput: DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
    generateSteps: generateAsyncDoubleBufferingPipelineSteps,
  };
