import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface TritonFusionInput {
  numElements: number;
  blockSize: number; // e.g. 1024 or 256
  inputVector: number[];
  biasVector: number[];
}

export const TRITON_KERNEL_FUSION_CODE = `import math

def triton_fused_bias_gelu_kernel(
    x: list[float],
    bias: list[float],
    block_size: int
) -> list[float]:
    n = len(x)
    output = [0.0] * n
    num_blocks = (n + block_size - 1) // block_size
    
    # Process blocks in parallel GPU thread blocks
    for pid in range(num_blocks):
        block_start = pid * block_size
        block_end = min(n, block_start + block_size)
        
        # In SRAM: compute fused y = GELU(x + bias) without DRAM write
        for i in range(block_start, block_end):
            val = x[i] + bias[i]
            # Fast GELU approximation: 0.5 * val * (1 + tanh(sqrt(2/pi) * (val + 0.044715 * val^3)))
            cdf = 0.5 * (1.0 + math.tanh(math.sqrt(2.0 / math.pi) * (val + 0.044715 * (val ** 3))))
            output[i] = val * cdf
            
    return output`;

export const DEFAULT_TRITON_FUSION_INPUT: TritonFusionInput = {
  numElements: 6,
  blockSize: 2,
  inputVector: [1.0, -0.5, 2.0, -1.5, 0.0, 0.8],
  biasVector: [0.2, 0.1, -0.5, 0.5, 1.0, -0.2],
};

export const TRITON_FUSION_EXAMPLES: ProblemExample<TritonFusionInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "Fused Bias+GELU Kernel (6 Elements, Block Size 2)",
    input: {
      numElements: 6,
      blockSize: 2,
      inputVector: [1.0, -0.5, 2.0, -1.5, 0.0, 0.8],
      biasVector: [0.2, 0.1, -0.5, 0.5, 1.0, -0.2],
    },
    output: "6 Fused activation outputs computed in 3 GPU program blocks",
    explanation: "Eliminates intermediate DRAM memory allocations by executing Bias addition and GELU non-linearity inside GPU SRAM registers.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "Large Block Fusion (8 Elements, Block Size 4)",
    input: {
      numElements: 8,
      blockSize: 4,
      inputVector: [0.5, 1.2, -2.0, 3.0, -0.1, 0.0, 1.5, -1.0],
      biasVector: [0.0, -0.2, 0.5, -1.0, 0.1, 0.5, -0.5, 1.0],
    },
    output: "8 Fused outputs across 2 program block launches",
    explanation: "Higher block size improves thread occupancy per GPU streaming multiprocessor (SM).",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Minimal 2-Element Block Kernel",
    input: {
      numElements: 2,
      blockSize: 2,
      inputVector: [0.0, 1.0],
      biasVector: [0.0, 0.0],
    },
    output: "2 Fused outputs in 1 program block",
    explanation: "Single GPU thread block execution path.",
  },
];

export function generateTritonFusionSteps(input: TritonFusionInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numElements: N, blockSize, inputVector: X, biasVector: B } = input;

  if (N <= 0 || blockSize <= 0 || !X || !B || X.length < N || B.length < N) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid Triton Kernel Fusion Input",
        why: "Elements, block size, and input vectors must be valid and matching in length.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Invalid inputs" } },
      variables: {},
    });
    return steps;
  }

  const numBlocks = Math.ceil(N / blockSize);
  const output: number[] = new Array(N).fill(0);

  const elements: ArrayElement[] = Array.from({ length: N }, (_, idx) => ({
    id: `elem-${idx}`,
    value: idx,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeBlockId: number,
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el, idx) => {
          const blockId = Math.floor(idx / blockSize);
          let state: ArrayElement["state"] = "default";
          if (blockId === activeBlockId) state = "active";
          else if (blockId < activeBlockId) state = "sorted";

          return {
            ...el,
            state,
            pointers: blockId === activeBlockId ? [`Program Block #${blockId}`] : undefined,
          };
        }),
      },
      auxiliaryState: {
        customState: {
          numBlocks,
          blockSize,
          fusedOutput: output.map((v) => v.toFixed(3)).join(", "),
          memoryReadsSaved: `Saved ${N * 4} bytes DRAM roundtrip`,
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize Triton Fused Kernel Execution Grid",
    `Spawning ${numBlocks} GPU thread blocks with block size ${blockSize} to execute fused Bias+GELU.`,
    -1,
    { N, blockSize, numBlocks }
  );

  for (let pid = 0; pid < numBlocks; pid++) {
    const blockStart = pid * blockSize;
    const blockEnd = Math.min(N, blockStart + blockSize);

    for (let i = blockStart; i < blockEnd; i++) {
      const val = (X[i] ?? 0) + (B[i] ?? 0);
      const cdf = 0.5 * (1.0 + Math.tanh(Math.sqrt(2.0 / Math.PI) * (val + 0.044715 * Math.pow(val, 3))));
      output[i] = val * cdf;
    }

    addStep(
      12,
      `Executed GPU Program Block #${pid} (Indices ${blockStart}..${blockEnd - 1})`,
      `Computed fused Bias addition and GELU activation directly in GPU registers/SRAM, bypassing DRAM intermediate allocation.`,
      pid,
      { programId: pid, blockStart, blockEnd: blockEnd - 1 }
    );
  }

  elements.forEach((el) => {
    el.state = "sorted";
  });

  addStep(
    20,
    "Triton Fused Kernel Execution Complete",
    `Successfully processed all ${N} elements across ${numBlocks} blocks with 1 single DRAM write pass.`,
    numBlocks,
    { totalElements: N, totalBlocks: numBlocks }
  );

  return steps;
}

export const tritonKernelFusion: AlgorithmDefinition<TritonFusionInput> = {
  id: "triton-kernel-fusion",
  title: "Triton Kernel Operator Fusion",
  category: "ml_hardware_kernels",
  difficulty: "Hard",
  description:
    "JIT-compiled GPU hardware kernel operator fusion (using OpenAI Triton / CUDA) that combines consecutive elementwise operations (e.g. Bias + GELU / LayerNorm) into a single SRAM block program to maximize memory bandwidth utilization.",
  isMlInfra: true,
  mlInfraLevel: 8,
  constraints: [
    "Number of elements N > 0",
    "Block size power of 2 (e.g. 128, 256, 1024)",
    "Input and Bias vectors must match length N",
  ],
  examples: TRITON_FUSION_EXAMPLES,
  code: TRITON_KERNEL_FUSION_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) arithmetic operations executed in parallel across GPU Streaming Multiprocessors (SMs).",
    space: "O(N) for final output matrix; zero intermediate DRAM allocations required due to register-level fusion.",
  },
  topicGuide: {
    overview:
      "Modern GPU deep learning workloads are heavily memory-bandwidth bound. Operator fusion combines multiple PyTorch operations (like `GELU(x + bias)`) into a single GPU C++/Triton kernel so data stays in fast GPU SRAM registers rather than being written to and read back from DRAM.",
    sections: [
      {
        heading: "OpenAI Triton JIT",
        body: "Triton allows writing Python block-level GPU programs that compile directly to PTX/NVVM code, competing with manually written CUDA C++ kernels.",
      },
      {
        heading: "Memory Bandwidth Optimization",
        body: "Unfused operators require 2 DRAM reads and 2 DRAM writes per element. Fused kernels require only 1 DRAM read and 1 DRAM write.",
      },
    ],
    keyTerms: [
      {
        term: "Operator Fusion",
        definition: "Combining multiple tensor operations into a single GPU kernel launch.",
      },
      {
        term: "Triton",
        definition: "Python-based domain-specific language for writing high-performance CUDA/GPU hardware kernels.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_TRITON_FUSION_INPUT,
  generateSteps: generateTritonFusionSteps,
};
