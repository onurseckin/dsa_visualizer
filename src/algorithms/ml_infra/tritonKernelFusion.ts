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
    for pid in range(num_blocks):
        block_start = pid * block_size
        block_end = min(n, block_start + block_size)
        for i in range(block_start, block_end):
            val = x[i] + bias[i]
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
    explanation:
      "Eliminates intermediate DRAM memory allocations by executing Bias addition and GELU non-linearity inside GPU SRAM registers.",
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
    explanation:
      "Higher block size improves thread occupancy per GPU streaming multiprocessor (SM).",
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

type ElementState = "default" | "active" | "sorted" | "compare";

export function generateTritonFusionSteps(input: TritonFusionInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { numElements: N, blockSize, inputVector: X, biasVector: B } = input;

  if (N <= 0 || blockSize <= 0 || !X || !B || X.length < N || B.length < N) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
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
  const computed: boolean[] = new Array(N).fill(false);

  const createElements = (
    activePid: number,
    currentIdx?: number,
    currentValState?: ElementState,
  ): ArrayElement[] => {
    return Array.from({ length: N }, (_, idx) => {
      const blockId = Math.floor(idx / blockSize);
      let state: ElementState = "default";
      const pointers: string[] = [];

      if (computed[idx]) {
        state = "sorted";
      } else if (blockId === activePid) {
        state = "active";
      }

      if (idx === currentIdx && currentValState) {
        state = currentValState;
        pointers.push(`i=${idx}`);
      }

      if (idx === activePid * blockSize && activePid >= 0 && activePid < numBlocks) {
        pointers.push(`Block #${activePid}`);
      }

      const valDisplay = computed[idx] ? output[idx].toFixed(3) : (X[idx] ?? 0).toFixed(2);

      return {
        id: `elem-${idx}`,
        value: valDisplay,
        label: `x[${idx}]`,
        state,
        pointers: pointers.length > 0 ? pointers : undefined,
      };
    });
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: "Initialize Triton Fused Kernel Execution Grid",
      why: `Spawning ${numBlocks} GPU program blocks with block size ${blockSize} for vector of size ${N}. Fuses Bias + GELU operations into single SRAM kernel pass.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(-1),
    },
    auxiliaryState: {
      customState: {
        numBlocks,
        blockSize,
        inputVector: X.slice(0, N).join(", "),
        biasVector: B.slice(0, N).join(", "),
        memoryBandwidthSavings: `Saved ${N * 4 * 2} bytes DRAM roundtrip`,
      },
    },
    variables: { N, blockSize, numBlocks },
  });

  for (let pid = 0; pid < numBlocks; pid++) {
    const blockStart = pid * blockSize;
    const blockEnd = Math.min(N, blockStart + blockSize);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Launch GPU Program Block #${pid}`,
        why: `Program block #${pid} assigned to process vector indices [${blockStart}..${blockEnd - 1}] in fast GPU SRAM registers.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createElements(pid, blockStart, "active"),
      },
      auxiliaryState: {
        customState: {
          activeBlock: `Block #${pid}`,
          blockRange: `[${blockStart}..${blockEnd - 1}]`,
          fusedOutputSoFar:
            output
              .slice(0, blockStart)
              .map((v) => v.toFixed(3))
              .join(", ") || "None",
        },
      },
      variables: { pid, blockStart, blockEnd: blockEnd - 1 },
    });

    for (let i = blockStart; i < blockEnd; i++) {
      const val = (X[i] ?? 0) + (B[i] ?? 0);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 15,
        explanation: {
          what: `SRAM Bias Addition at Index ${i}`,
          why: `x[${i}] (${(X[i] ?? 0).toFixed(2)}) + bias[${i}] (${(B[i] ?? 0).toFixed(2)}) = ${val.toFixed(4)}. Result resides in register/SRAM, avoiding DRAM write.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createElements(pid, i, "compare"),
        },
        auxiliaryState: {
          customState: {
            registerVal: val.toFixed(4),
            operation: `Bias Addition (x[${i}] + bias[${i}])`,
            sramLocation: `Block #${pid} Register`,
          },
        },
        variables: { pid, i, "x[i]": X[i] ?? 0, "bias[i]": B[i] ?? 0, val: Number(val.toFixed(4)) },
      });

      const cdf =
        0.5 * (1.0 + Math.tanh(Math.sqrt(2.0 / Math.PI) * (val + 0.044715 * Math.pow(val, 3))));

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `SRAM GELU Approximation at Index ${i}`,
          why: `Evaluates GELU CDF approximation cdf = ${cdf.toFixed(4)} directly on register value ${val.toFixed(4)} without intermediate DRAM read.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createElements(pid, i, "active"),
        },
        auxiliaryState: {
          customState: {
            registerVal: val.toFixed(4),
            geluCdf: cdf.toFixed(4),
            operation: "Fast GELU Approximation",
          },
        },
        variables: { pid, i, val: Number(val.toFixed(4)), cdf: Number(cdf.toFixed(4)) },
      });

      const res = val * cdf;
      output[i] = res;
      computed[i] = true;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 17,
        explanation: {
          what: `Write Fused GELU Output at Index ${i}`,
          why: `output[${i}] = val * cdf = ${res.toFixed(4)}. Single fused DRAM write complete.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createElements(pid, i, "sorted"),
        },
        auxiliaryState: {
          customState: {
            fusedValue: res.toFixed(4),
            operation: "Write to Output Vector DRAM",
            fusedOutput: output.map((v, idx) => (computed[idx] ? v.toFixed(3) : "?")).join(", "),
          },
        },
        variables: { pid, i, "output[i]": Number(res.toFixed(4)) },
      });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: "Triton Fused Kernel Execution Complete",
      why: `Successfully computed fused Bias + GELU across ${N} elements in ${numBlocks} GPU thread blocks with 1 single DRAM write pass instead of 2 read/write passes.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: createElements(-1),
    },
    auxiliaryState: {
      customState: {
        totalElements: N,
        totalBlocks: numBlocks,
        finalOutput: output.map((v) => v.toFixed(3)).join(", "),
        status: "Kernel Execution Finished",
      },
    },
    variables: { totalElements: N, numBlocks },
  });

  return steps;
}

export const tritonKernelFusion: AlgorithmDefinition<TritonFusionInput> = {
  id: "triton-kernel-fusion",
  title: "Triton Kernel Operator Fusion",
  topicIds: ["ml_hardware_kernels"],
  difficulty: "Hard",
  description:
    "JIT-compiled GPU hardware kernel operator fusion (using OpenAI Triton / CUDA) that combines consecutive elementwise operations (e.g. Bias + GELU / LayerNorm) into a single SRAM block program to maximize memory bandwidth utilization.",
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
    space:
      "O(N) for final output matrix; zero intermediate DRAM allocations required due to register-level fusion.",
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
        definition:
          "Python-based domain-specific language for writing high-performance CUDA/GPU hardware kernels.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_TRITON_FUSION_INPUT,
  generateSteps: generateTritonFusionSteps,
};
