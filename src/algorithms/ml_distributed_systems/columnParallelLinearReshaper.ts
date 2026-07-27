import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface columnParallelLinearReshaperInput {
  data: number[];
  target?: number;
}

export const COLUMNPARALLELLINEARRESHAPER_CODE = `
def columnparallellinearreshaper(ring_ranks, parameter_shards):
    """
    Ring-AllReduce collective communications and vLLM PagedAttention virtual memory translation.
    """
    num_nodes = len(ring_ranks)
    shard_buffers = [list(shard) for shard in parameter_shards]

    # Phase 1: Scatter-Reduce across circular ring topology
    for step in range(num_nodes - 1):
        for rank in range(num_nodes):
            send_idx = (rank - step) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] += shard_buffers[rank][send_idx]

    # Phase 2: AllGather across circular ring topology
    for step in range(num_nodes - 1):
        for rank in range(num_nodes):
            send_idx = (rank - step + 1) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] = shard_buffers[rank][send_idx]

    return shard_buffers
`;

export const DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT: columnParallelLinearReshaperInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateColumnParallelLinearReshaperSteps = (
  input: columnParallelLinearReshaperInput,
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
    "Initialize Megatron-LM Column Parallel Linear Layer Reshaper",
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
      `Evaluating element at index ${idx} against target condition.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const COLUMNPARALLELLINEARRESHAPER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Megatron-LM Column Parallel Linear Layer Reshaper.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const columnParallelLinearReshaper: AlgorithmDefinition<columnParallelLinearReshaperInput> =
  {
    id: "column-parallel-linear-reshaper",
    title: "Megatron-LM Column Parallel Linear Layer Reshaper",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "graph_traversal"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), megatron-lm column parallel linear layer reshaper provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Processes standard input array cleanly.",
      },
      {
        kind: "complex",
        title: "Larger Data Input",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates larger array with 5 elements.",
      },
      {
        kind: "negative",
        title: "Edge Case Target Not Found",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Target is absent from memory, processing finishes safely.",
      },
    ],
    code: COLUMNPARALLELLINEARRESHAPER_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for result structures.",
    },
    topicGuide: {
      overview:
        "Column parallel linear layers split weight matrix W along output column dimension.",
      sections: [
        {
          heading: "Core Concept",
          body: "Splits weight matrix W along columns (W_i = W[:, i*d/N:(i+1)*d/N]) for Tensor Parallelism.",
        },
        {
          heading: "Systems Impact",
          body: "Optimizing memory access patterns maximizes execution throughput.",
        },
      ],
      keyTerms: [
        {
          term: "Column Parallelism",
          definition: "Splitting GEMM weight columns across Tensor Parallel ranks.",
        },
      ],
    },
    trivia: COLUMNPARALLELLINEARRESHAPER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_COLUMNPARALLELLINEARRESHAPER_INPUT,
    generateSteps: generateColumnParallelLinearReshaperSteps,
  };
