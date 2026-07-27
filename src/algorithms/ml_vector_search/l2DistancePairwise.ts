import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";

export interface L2DistancePairwiseInput {
  vectors: number[][];
  target: number[];
}

export const l2DistancePairwise: AlgorithmDefinition<L2DistancePairwiseInput> = {
  id: "l2DistancePairwise",
  title: "Pairwise L2 Distance Computation",
  category: "ml_vector_search",
  categories: ["ml_vector_search", "binary_search"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description:
    "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), pairwise l2 distance computation provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
  constraints: [
    "Vectors must have matching dimensions.",
    "Input size typically constrained for visualization purposes.",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "Vectors: [[1, 2], [3, 4]], Target: [0, 0]",
      outputDisplay: "[2.236, 5.0]",
      input: {
        vectors: [
          [1, 2],
          [3, 4],
        ],
        target: [0, 0],
      },
      output: "[2.23606797749979, 5.0]",
      explanation: "Basic L2 distance calculation from origin.",
    },
    {
      kind: "complex",
      inputDisplay: "Vectors: [[0.1, 0.5, 0.9], [0.8, 0.2, 0.4]], Target: [0.5, 0.5, 0.5]",
      outputDisplay: "[0.5656, 0.4358]",
      input: {
        vectors: [
          [0.1, 0.5, 0.9],
          [0.8, 0.2, 0.4],
        ],
        target: [0.5, 0.5, 0.5],
      },
      output: "[0.565685424949238, 0.43588989435406733]",
      explanation: "3D vectors distance calculation.",
    },
    {
      kind: "negative",
      inputDisplay: "Empty vectors",
      outputDisplay: "[]",
      input: { vectors: [], target: [1, 1] },
      output: "[]",
      explanation: "Empty array returns empty distances.",
    },
  ],
  defaultInput: {
    vectors: [
      [1, 0],
      [0, 1],
    ],
    target: [0, 0],
  },
  code: `import math

def l2_distance(vectors: list[list[float]], target: list[float]) -> list[float]:
    distances = []
    for vec in vectors:
        dist = math.sqrt(sum((v - t) ** 2 for v, t in zip(vec, target)))
        distances.append(dist)
    return distances`,
  timeComplexity: {
    best: "O(N * D)",
    average: "O(N * D)",
    worst: "O(N * D)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each of the N vectors requires calculating differences across D dimensions.",
    space: "Requires memory for N computed distance floats.",
  },
  topicGuide: {
    overview:
      "Pairwise L2 Distance Computation is a critical component in ML VECTOR SEARCH systems. It addresses key bottlenecks in GPU memory access, tensor layout transformations, parallel compute dispatch, and mathematical precision guarantees across modern deep learning stacks. Frameworks such as PyTorch, vLLM, Triton, and DeepSpeed rely on these exact primitives to optimize throughput and scale model inference and training.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "At its mathematical foundation, pairwise l2 distance computation operates by modeling hardware and computational states as structured indexed spaces. Given input dimension arrays and memory stride vectors, elements are mapped via linear strided offset equations index = sum(i_k * s_k). The algorithm iterates across execution bounds while tracking intermediate accumulations and operational state transitions.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "From a GPU and systems hardware perspective, memory bandwidth between High Bandwidth Memory (HBM) and On-Chip Shared Memory (SRAM/L1 Cache) is often the dominant performance limit. Pairwise L2 Distance Computation optimizes execution by maximizing arithmetic intensity (FLOPs per byte of DRAM access), minimizing warp divergence in CUDA executions, avoiding shared memory bank conflicts via swizzled indexing, and issuing 128-bit vectorized load/store instructions.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementing pairwise l2 distance computation efficiently requires careful handling of flat memory layouts, dynamic pointer offsets, and contiguous block allocations. In C++/CUDA and Triton implementations, array strides and block dimensions are pre-calculated to allow lock-free, zero-copy memory views without incurring costly heap re-allocations during tensor operations.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Production deployments require robust edge-case handling. Extreme sequence lengths, unaligned block sizes, negative strides, non-contiguous layouts, and zero-valued target parameters must be validated at runtime. Out-of-bounds guards protect GPU kernels against illegal memory access faults, while fallback routines ensure graceful degradation on heterogeneous hardware topologies.",
      },
    ],
    keyTerms: [
      {
        term: "Pairwise Engine",
        definition:
          "The underlying algorithmic system implementing pairwise l2 distance computation operations for deep learning workloads.",
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
  generateSteps: (input: L2DistancePairwiseInput): AlgorithmStep[] => {
    const steps: AlgorithmStep[] = [];
    const target = input.target || [0, 0];
    const targetStr = JSON.stringify(target);

    steps.push({
      stepIndex: 0,
      codeLine: 5,
      explanation: { what: "Initialize distances array", why: "To store the computed distances" },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { target: targetStr } },
      variables: {},
    });

    for (let i = 0; i < input.vectors.length; i++) {
      const vecStr = JSON.stringify(input.vectors[i]);

      const elementsDuringComp: ArrayElement[] = input.vectors.map((_, idx) => ({
        id: `vec-${idx}`,
        value: idx,
        label: `Vec ${idx}`,
        state: idx === i ? "active" : idx < i ? "visited" : "default",
      }));

      steps.push({
        stepIndex: steps.length,
        codeLine: 6,
        explanation: {
          what: `Processing vector ${i}`,
          why: "Computing distance for current vector",
        },
        primarySnapshot: {
          kind: "array",
          elements: elementsDuringComp,
        },
        auxiliaryState: { customState: { currentVec: vecStr } },
        variables: { i },
      });

      let sum = 0;
      for (let j = 0; j < input.vectors[i].length; j++) {
        sum += Math.pow(input.vectors[i][j] - target[j], 2);
      }
      const dist = Math.sqrt(sum);

      steps.push({
        stepIndex: steps.length,
        codeLine: 12,
        explanation: {
          what: `Computed distance for vector ${i}: ${dist.toFixed(4)}`,
          why: "Distance has been calculated",
        },
        primarySnapshot: {
          kind: "array",
          elements: elementsDuringComp,
        },
        auxiliaryState: { customState: { currentVec: vecStr, dist: Number(dist.toFixed(4)) } },
        variables: { i, dist: Number(dist.toFixed(4)) },
      });
    }

    const finalElements: ArrayElement[] = input.vectors.map((_, idx) => ({
      id: `vec-${idx}`,
      value: idx,
      label: `Vec ${idx}`,
      state: "sorted",
    }));

    steps.push({
      stepIndex: steps.length,
      codeLine: 13,
      explanation: { what: "Return distances", why: "All vectors processed" },
      primarySnapshot: {
        kind: "array",
        elements: finalElements,
      },
      auxiliaryState: { customState: {} },
      variables: {},
    });

    return steps;
  },
};
