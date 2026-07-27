import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ringScatterReduceArrayAccumulatorInput {
  chunks: number[];
}

export const RINGSCATTERREDUCEARRAYACCUMULATOR_CODE = `def ring_scatter_reduce(chunks):
    """
    Simulates the Scatter-Reduce phase of a Ring-AllReduce collective operation across N ranks.
    
    Each rank starts with a partial tensor chunk. Over N-1 ring iterations,
    chunks are passed clockwise and element-wise accumulated.

    Args:
        chunks: List of numeric gradient/parameter values from participating ranks

    Returns:
        Total sum accumulated after N-1 ring transfer steps.
    """
    num_ranks = len(chunks)
    if num_ranks == 0:
        return 0

    accumulator = chunks[0]
    for i in range(1, num_ranks):
        accumulator += chunks[i]

    return accumulator
`;

export const DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT: ringScatterReduceArrayAccumulatorInput =
  {
    chunks: [10, 20, 30, 40],
  };

export const generateRingScatterReduceArrayAccumulatorSteps = (
  input: ringScatterReduceArrayAccumulatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.chunks.map((val, idx) => ({
    id: `gpu-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: customElements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: { customState: {} },
      variables,
    });
  };

  const N = input.chunks.length;
  addStep(
    4,
    "Initialize Ring Scatter-Reduce Simulation",
    "We determine the number of GPUs participating in the ring.",
    { N },
    [...elements],
  );

  if (N === 0) {
    addStep(5, "Empty chunks", "No GPUs in the ring.", { N }, [...elements]);
    return steps;
  }

  let reducedValue = input.chunks[0];
  let currentElements = elements.map((el, idx) =>
    idx === 0 ? { ...el, state: "active" as const, pointers: ["reduced"] } : el,
  );

  addStep(
    18,
    "Initialize reduced_value",
    "Start with the chunk value from the first GPU.",
    { N, reduced_value: reducedValue },
    currentElements,
  );

  for (let i = 1; i < N; i++) {
    currentElements = elements.map((el, idx) => {
      if (idx === i) return { ...el, state: "compare" as const, pointers: ["i"] };
      if (idx < i) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      19,
      `Enter loop for GPU ${i}`,
      `Passing the chunk to GPU ${i} to accumulate its partial value.`,
      { N, i, reduced_value: reducedValue },
      currentElements,
    );

    reducedValue += input.chunks[i];

    currentElements = elements.map((el, idx) => {
      if (idx === i) return { ...el, state: "active" as const, pointers: ["i", "reduced"] };
      if (idx < i) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      20,
      `Accumulate chunk from GPU ${i}`,
      "The received partial chunk is added to the local chunk value.",
      { N, i, reduced_value: reducedValue },
      currentElements,
    );
  }

  currentElements = elements.map((el) => ({ ...el, state: "sorted" as const }));
  addStep(
    22,
    "Scatter-Reduce Complete",
    "The chunk has traversed N-1 GPUs and is now fully reduced.",
    { N, reduced_value: reducedValue },
    currentElements,
  );

  return steps;
};

const RINGSCATTERREDUCEARRAYACCUMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: ["reduced_value = 0.0", "for i in range(0, N):", "reduced_value *= chunks[i]"],
  hints: [{ line: 20, hint: "Scatter-Reduce accumulates values additively across GPUs." }],
  lineExplanations: {
    1: "Get the number of participating GPUs.",
    18: "Initialize the running sum with the first GPU's chunk.",
    19: "Iterate N-1 times, representing communication steps in the ring.",
    20: "Accumulate the received chunk with the local chunk.",
    22: "Return the fully reduced chunk.",
  },
};

export const ringScatterReduceArrayAccumulator: AlgorithmDefinition<ringScatterReduceArrayAccumulatorInput> =
  {
    id: "ring-scatter-reduce-array-accumulator",
    title: "Ring-AllReduce Scatter-Reduce Phase",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems", "ml_tensor_algebra"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Simulates the Scatter-Reduce phase of a Ring-AllReduce collective operation across $N$ distributed ranks.\n\nIn distributed data-parallel ML training, gradients or activation tensors are divided into $N$ equal chunks across $N$ GPUs. During Scatter-Reduce:\n1. The payload is partitioned into $N$ blocks ($C_0, C_1, \\dots, C_{N-1}$).\n2. Over $N-1$ synchronous ring transfer steps, each rank $r$ sends chunk block $C_k$ to rank $(r+1) \\pmod N$ while receiving chunk block $C_k$ from rank $(r-1+N) \\pmod N$.\n3. Received partial values are added element-wise to local buffers.\n\nAt the end of $N-1$ ring steps, each GPU rank holds exactly one fully reduced chunk representing the global sum of that specific tensor partition across all GPUs.\n\nMathematical Properties:\n- Steps required: $N - 1$\n- Total bytes sent per GPU: $\\frac{N-1}{N} S$\n- Compute cost per GPU: $(N-1) \\times \\text{FLOPs}_{\\text{chunk}}$\n\nInput Format:\n- chunks: Array of numeric partial values or gradient tensor chunk magnitudes from each GPU rank.\n\nOutput Format:\n- Returns the final scalar sum / reduced array representation of the accumulated chunk.\n\nEdge Cases & Constraints:\n- Empty input ($N=0$): Returns 0 immediately.\n- Single rank ($N=1$): Zero transfers required; chunk value is already fully reduced.\n- Floating-point overflow: Large accumulated gradients may require FP32 precision during reduction.",
    constraints: ["1 <= chunks.length <= 100", "-10^5 <= chunks[i] <= 10^5"],
    examples: [
      {
        kind: "basic",
        title: "4 GPUs Ring Accumulation",
        inputDisplay: "chunks = [10, 20, 30, 40]",
        outputDisplay: "Reduced Sum = 100",
        input: { chunks: [10, 20, 30, 40] },
        output: "100",
        explanation:
          "Each GPU contributes its partial chunk value, accumulating to 100 over 3 ring steps.",
      },
      {
        kind: "complex",
        title: "8 GPUs with Negative Gradients",
        inputDisplay: "chunks = [1, -2, 3, -4, 5, -6, 7, -8]",
        outputDisplay: "Reduced Sum = -4",
        input: { chunks: [1, -2, 3, -4, 5, -6, 7, -8] },
        output: "-4",
        explanation:
          "Gradient accumulations can include negative components resulting in cancellation.",
      },
      {
        kind: "negative",
        title: "Single GPU Standalone",
        inputDisplay: "chunks = [50]",
        outputDisplay: "Reduced Sum = 50",
        input: { chunks: [50] },
        output: "50",
        explanation: "With 1 GPU, no inter-GPU communication or reduction steps are needed.",
      },
    ],
    code: RINGSCATTERREDUCEARRAYACCUMULATOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Each chunk undergoes N-1 additions across the ring, resulting in O(N) step execution time.",
      space: "The accumulator requires O(1) auxiliary space beyond input chunk buffers.",
    },
    topicGuide: {
      overview:
        "Scatter-Reduce is the first phase of the Ring-AllReduce collective operation used heavily in distributed data-parallel training (PyTorch DDP, Horovod, NCCL).",
      sections: [
        {
          heading: "Overview & Problem Context",
          body: "When training deep neural networks across multiple GPUs, each GPU processes a different mini-batch and computes local gradients. To maintain synchronized weights, all local gradients must be summed element-wise across GPUs. Scatter-Reduce efficiently computes this global sum for tensor partitions without requiring any master node.",
        },
        {
          heading: "Core Concepts & Chunk Rotation",
          body: "The global gradient tensor of size $S$ is divided into $N$ equal chunks. At step $s=0$, GPU $r$ sends chunk $(r - s) \\pmod N$ to GPU $(r+1) \\pmod N$ and receives chunk $(r - s - 1 + N) \\pmod N$. As chunks rotate around the ring over $N-1$ steps, each rank accumulates the received partial gradients into its target partition buffer.",
        },
        {
          heading: "Systems & Memory Bandwidth Efficiency",
          body: "Scatter-Reduce maximizes ring network utilization because every link in the ring transfers $(1/N)$th of the total tensor payload simultaneously during each of the $N-1$ steps. Total data sent per GPU is $\\frac{N-1}{N} S$. Contrast this with naive parameter server reduction, which transfers $S \\cdot (N-1)$ through a single network bottleneck.",
        },
        {
          heading: "Implementation Nuances & CUDA Stream Overlap",
          body: "Production NCCL implementations overlap communication with computation by double-buffering ring chunks. While CUDA kernel warp threads reduce chunk $k$ in SRAM, PCIe/NVLink copy engines stream chunk $k+1$ into GPU memory.",
        },
      ],
      keyTerms: [
        {
          term: "Scatter-Reduce",
          definition:
            "Phase of Ring-AllReduce where partial gradient chunks are accumulated, leaving each rank with one fully reduced chunk.",
        },
        {
          term: "Chunk Partition",
          definition:
            "A slice of the full model gradient tensor created by splitting the tensor into $N$ equal contiguously aligned segments.",
        },
        {
          term: "All-Gather",
          definition:
            "The secondary ring phase that follows Scatter-Reduce, broadcasting the fully reduced chunks back to all GPUs.",
        },
        {
          term: "Double Buffering",
          definition:
            "Using alternate memory buffers to overlap GPU computation (element-wise addition) with DMA network transfers.",
        },
      ],
    },
    trivia: RINGSCATTERREDUCEARRAYACCUMULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
    generateSteps: generateRingScatterReduceArrayAccumulatorSteps,
  };
