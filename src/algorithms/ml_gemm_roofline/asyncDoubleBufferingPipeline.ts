import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asyncDoubleBufferingPipelineInput {
  data: number[];
  target?: number;
}

export const ASYNCDOUBLEBUFFERINGPIPELINE_CODE = `
def async_double_buffering_pipeline(num_stages=4, block_size=4):
    """
    Simulates async double-buffering DMA transfers overlapping HBM loads with SRAM compute.
    """
    pipeline_states = []
    buf_a, buf_b = [0] * block_size, [0] * block_size

    for stage in range(num_stages):
        stage_data = [stage * 10 + i for i in range(block_size)]
        buf_b = stage_data
        compute_res = [val * 2 for val in buf_a]
        pipeline_states.append((stage, buf_a, buf_b, compute_res))
        buf_a, buf_b = buf_b, buf_a

    return pipeline_states
`;

export const DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT: asyncDoubleBufferingPipelineInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAsyncDoubleBufferingPipelineSteps = (
  input: asyncDoubleBufferingPipelineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
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
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Async Double-Buffering Copy Pipeline",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in memory layout.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    15,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ASYNCDOUBLEBUFFERINGPIPELINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines async double-buffering pipeline simulation function.",
    4: "Initializes pipeline state history log array.",
    5: "Allocates two ping-pong SRAM buffers A and B of size block_size.",
    7: "Iterates through pipeline execution stages from 0 to num_stages - 1.",
    9: "Simulates asynchronous DMA transfer loading next stage data into buffer B.",
    10: "Performs parallel Tensor Core compute operations on active buffer A.",
    11: "Records pipeline stage snapshot with active buffer states.",
    12: "Swaps ping-pong buffers A and B for next iteration stage.",
    14: "Returns completed pipeline execution history.",
  },
};

export const asyncDoubleBufferingPipeline: AlgorithmDefinition<asyncDoubleBufferingPipelineInput> =
  {
    id: "async-double-buffering-pipeline",
    title: "Async Double-Buffering Copy Pipeline",
    category: "ml_gemm_roofline",
    categories: ["ml_gemm_roofline", "arrays_and_hashing"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 2,
    mlInfraCategory: "ml_gemm_roofline",
    description:
      "In high-performance GPU programming (CUDA async copy, Triton TMA, PyTorch FlashAttention), memory transfer latency between High Bandwidth Memory (HBM) and on-chip SRAM is a primary performance bottleneck. Double-buffering hides memory access latency by prefetching the next iteration's data block into a ping-pong buffer asynchronously while GPU Tensor Cores compute on the current buffer block.\n\nThis algorithm implements Async Double-Buffering Copy Pipeline, tracking ping-pong buffer swaps and overlapping HBM-to-SRAM transfers with execution computations.\n\nInput Format:\n- data: Input memory payload buffer.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns pipeline stage states tracking SRAM ping-pong buffer allocations and compute results.\n\nEdge Cases & Constraints:\n- Pipeline startup latency (Stage 0 initial filling).\n- Pipeline drain phase (final stage completion).\n- Asynchronous DMA transfer synchronizations.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Execution",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
        output: "[10, 20, 30]",
        explanation: "Standard execution pass.",
      },
      {
        kind: "complex",
        title: "Complex Execution",
        inputDisplay: "data = [10, 20, 30, 40, 50]",
        outputDisplay: "[10, 20, 30, 40, 50]",
        input: DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
        output: "[10, 20, 30, 40, 50]",
        explanation: "Evaluates workload performance boundaries.",
      },
      {
        kind: "negative",
        title: "Edge Case",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
        output: "[5, 10, 15]",
        explanation: "Edge case execution completes safely.",
      },
    ],
    code: ASYNCDOUBLEBUFFERINGPIPELINE_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Execution time complexity pass across input elements.",
      space: "Memory allocation space for result structures.",
    },
    topicGuide: {
      overview:
        "Double-buffering (ping-pong buffering) is an asynchronous pipeline pattern used in high-throughput GPU kernel programming. By allocating two separate shared memory buffers (Buffer A and Buffer B), hardware DMA engines copy block k+1 from HBM to Buffer B while Tensor Cores process block k from Buffer A in parallel.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, total execution time for N iterations without pipelining is T_total = N * (T_transfer + T_compute). With double-buffering, transfers and computations overlap: T_total = T_transfer_0 + (N-1) * max(T_transfer, T_compute) + T_compute_{N-1}, drastically reducing overall latency.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "NVIDIA Hopper architecture introduces Tensor Memory Accelerator (TMA) asynchronous copy instructions (cp.async), allowing warps to issue memory load requests to SRAM without blocking SIMT execution pipelines.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation toggles active pointers between buf_a and buf_b across stages, executing compute loops on active buffer while staging next tile loads.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes single-stage executions, memory allocation constraints in limited SRAM capacity, and thread synchronization via barriers (cuda::pipeline).",
        },
      ],
      keyTerms: [
        {
          term: "Ping-Pong Buffering",
          definition:
            "Alternating between two dedicated memory buffers to overlap data transfer with processing.",
        },
        {
          term: "Asynchronous Copy",
          definition:
            "Issuing memory transfer instructions that execute in the background without stalling compute threads.",
        },
        {
          term: "Memory Hiding",
          definition: "Overlapping HBM memory access latency with active arithmetic computations.",
        },
      ],
    },
    trivia: ASYNCDOUBLEBUFFERINGPIPELINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
    defaultInput: DEFAULT_ASYNCDOUBLEBUFFERINGPIPELINE_INPUT,
    generateSteps: generateAsyncDoubleBufferingPipelineSteps,
  };
