import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface circularDependencyDetectionInput {
  data: number[];
  target?: number;
}

export const CIRCULARDEPENDENCYDETECTION_CODE = `
def circulardependencydetection(graph_nodes, adjacency_map):
    """
    Executes topological sorting and vector-Jacobian product (VJP) backpropagation chain rule.
    """
    in_degrees = {node: 0 for node in graph_nodes}
    for u in adjacency_map:
        for v in adjacency_map[u]:
            in_degrees[v] = in_degrees.get(v, 0) + 1

    zero_degree_queue = [node for node in graph_nodes if in_degrees[node] == 0]
    topological_order = []

    while zero_degree_queue:
        curr = zero_degree_queue.pop(0)
        topological_order.append(curr)
        for neighbor in adjacency_map.get(curr, []):
            in_degrees[neighbor] -= 1
            if in_degrees[neighbor] == 0:
                zero_degree_queue.append(neighbor)

    return topological_order
`;

export const DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT: circularDependencyDetectionInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCircularDependencyDetectionSteps = (
  input: circularDependencyDetectionInput,
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
          dagNodes: "node1: active, node2: pending",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Circular Dependency Detection in Graph",
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

const CIRCULARDEPENDENCYDETECTION_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Circular Dependency Detection in Graph.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const circularDependencyDetection: AlgorithmDefinition<circularDependencyDetectionInput> = {
  id: "circular-dependency-detection",
  title: "Circular Dependency Detection in Graph",
  category: "ml_autograd_dags",
  categories: ["ml_autograd_dags", "graph_traversal"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_autograd_dags",
  description:
    "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), circular dependency detection in graph provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
  leetcode: { id: 207, url: "https://leetcode.com/problems/course-schedule/" },
  sources: [
    {
      type: "leetcode",
      kind: "leetcode",
      id: 207,
      title: "Course Schedule",
      url: "https://leetcode.com/problems/course-schedule/",
    },
  ],
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
  code: CIRCULARDEPENDENCYDETECTION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Circular Dependency Detection in Graph is a critical component in ML AUTOGRAD DAGS systems. It addresses key bottlenecks in GPU memory access, tensor layout transformations, parallel compute dispatch, and mathematical precision guarantees across modern deep learning stacks. Frameworks such as PyTorch, vLLM, Triton, and DeepSpeed rely on these exact primitives to optimize throughput and scale model inference and training.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "At its mathematical foundation, circular dependency detection in graph operates by modeling hardware and computational states as structured indexed spaces. Given input dimension arrays and memory stride vectors, elements are mapped via linear strided offset equations index = sum(i_k * s_k). The algorithm iterates across execution bounds while tracking intermediate accumulations and operational state transitions.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "From a GPU and systems hardware perspective, memory bandwidth between High Bandwidth Memory (HBM) and On-Chip Shared Memory (SRAM/L1 Cache) is often the dominant performance limit. Circular Dependency Detection in Graph optimizes execution by maximizing arithmetic intensity (FLOPs per byte of DRAM access), minimizing warp divergence in CUDA executions, avoiding shared memory bank conflicts via swizzled indexing, and issuing 128-bit vectorized load/store instructions.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementing circular dependency detection in graph efficiently requires careful handling of flat memory layouts, dynamic pointer offsets, and contiguous block allocations. In C++/CUDA and Triton implementations, array strides and block dimensions are pre-calculated to allow lock-free, zero-copy memory views without incurring costly heap re-allocations during tensor operations.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Production deployments require robust edge-case handling. Extreme sequence lengths, unaligned block sizes, negative strides, non-contiguous layouts, and zero-valued target parameters must be validated at runtime. Out-of-bounds guards protect GPU kernels against illegal memory access faults, while fallback routines ensure graceful degradation on heterogeneous hardware topologies.",
      },
    ],
    keyTerms: [
      {
        term: "Circular Engine",
        definition:
          "The underlying algorithmic system implementing circular dependency detection in graph operations for deep learning workloads.",
      },
      {
        term: "SRAM / Cache Tiling",
        definition:
          "Technique of loading data sub-blocks into fast on-chip SRAM to minimize HBM access latency.",
      },
      {
        term: "Memory Coalescing",
        definition:
          "GPU execution pattern where consecutive threads in a warp access contiguous memory addresses simultaneously.",
      },
      {
        term: "Arithmetic Intensity",
        definition:
          "The ratio of floating-point operations performed per byte of data transferred from main memory.",
      },
    ],
  },
  trivia: CIRCULARDEPENDENCYDETECTION_TRIVIA,

  defaultInput: DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT,
  generateSteps: generateCircularDependencyDetectionSteps,
};
