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
    chunks: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
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
      auxiliaryState: { customState: { num_ranks: String(input.chunks.length) } },
      variables,
    });
  };

  const N = input.chunks.length;
  addStep(
    1,
    "Initialize Ring Scatter-Reduce Collective Simulation",
    "Setting up participating GPU rank chunks for ring accumulation.",
    { num_ranks: N },
    [...elements],
  );

  addStep(
    14,
    `Compute Total Ranks num_ranks = ${N}`,
    `Loaded ${N} participating rank gradient chunks.`,
    { num_ranks: N },
    [...elements],
  );

  if (N === 0) {
    addStep(15, "Check Empty Chunks Guard (num_ranks == 0)", "No GPUs in the ring.", { num_ranks: N }, [...elements]);
    addStep(16, "Return 0", "Empty ring return value.", { num_ranks: N }, [...elements]);
    return steps;
  }

  addStep(
    15,
    `Check Empty Chunks Guard (num_ranks == ${N} > 0)`,
    `Rank count ${N} > 0, proceeding with scatter-reduce ring loop.`,
    { num_ranks: N, is_empty: false },
    [...elements],
  );

  let reducedValue = input.chunks[0];
  let currentElements = elements.map((el, idx) =>
    idx === 0 ? { ...el, state: "active" as const, pointers: ["accumulator"] } : el,
  );

  addStep(
    18,
    `Initialize accumulator = ${reducedValue}`,
    `Starting reduction sequence with initial chunk value from Rank 0 (${reducedValue}).`,
    { num_ranks: N, accumulator: reducedValue },
    currentElements,
  );

  for (let i = 1; i < N; i++) {
    currentElements = elements.map((el, idx) => {
      if (idx === i) return { ...el, state: "compare" as const, pointers: [`Rank_${i}`] };
      if (idx < i) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      19,
      `Enter Loop Iteration Step ${i}/${N - 1} for Rank ${i}`,
      `Passing partial chunk from Rank ${i - 1} to Rank ${i} along the ring topology.`,
      { num_ranks: N, i, accumulator: reducedValue, current_chunk: input.chunks[i] },
      currentElements,
    );

    const prevAcc = reducedValue;
    reducedValue += input.chunks[i];

    currentElements = elements.map((el, idx) => {
      if (idx === i) return { ...el, state: "active" as const, pointers: [`Rank_${i}`, "accumulator"] };
      if (idx < i) return { ...el, state: "visited" as const };
      return el;
    });

    addStep(
      20,
      `Accumulate Chunk from Rank ${i} (+${input.chunks[i]} => ${reducedValue})`,
      `Element-wise addition: accumulator = ${prevAcc} + ${input.chunks[i]} = ${reducedValue}.`,
      { num_ranks: N, i, chunk_added: input.chunks[i], accumulator: reducedValue },
      currentElements,
    );
  }

  currentElements = elements.map((el) => ({ ...el, state: "sorted" as const, pointers: ["Reduced"] }));
  addStep(
    22,
    `Ring Scatter-Reduce Complete (Final Total = ${reducedValue})`,
    `Completed ${N - 1} ring communication steps across ${N} ranks. Total accumulated value: ${reducedValue}.`,
    { num_ranks: N, accumulator: reducedValue },
    currentElements,
  );

  return steps;
};

const RINGSCATTERREDUCEARRAYACCUMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 21],
  distractors: [
    "accumulator = 0.0",
    "for i in range(0, num_ranks):",
    "accumulator *= chunks[i]",
    "num_ranks = len(chunks) * 2",
  ],
  hints: [
    { line: 18, hint: "Initialize accumulator with first GPU chunk value chunks[0]." },
    { line: 19, hint: "Loop over range(1, num_ranks) for N-1 ring transfer steps." },
    { line: 20, hint: "Additively accumulate received chunk value: accumulator += chunks[i]." },
    { line: 22, hint: "Return fully reduced accumulator scalar sum." },
  ],
  lineExplanations: {
    1: "Defines function ring_scatter_reduce taking partial gradient chunks list.",
    2: "Docstring start describing Ring-AllReduce Scatter-Reduce collective phase.",
    3: "Explains simulation of Scatter-Reduce phase across N participating ranks.",
    4: "Blank line in docstring.",
    5: "Explains partial tensor chunk starting states.",
    6: "Explains clockwise ring transfer and element-wise accumulation over N-1 iterations.",
    7: "Blank line in docstring.",
    8: "Docstring args section header.",
    9: "Explains chunks parameter containing gradient values from participating ranks.",
    10: "Blank line in docstring.",
    11: "Docstring returns section header.",
    12: "Explains return value representing total accumulated sum.",
    13: "Docstring close.",
    14: "Calculates total number of participating ranks num_ranks = len(chunks).",
    15: "Checks edge case guard for empty input chunks list.",
    16: "Returns 0 if no GPU ranks participate in the ring.",
    17: "Blank line before accumulator initialization.",
    18: "Initializes accumulator variable with first GPU rank chunk value chunks[0].",
    19: "Iterates i over range(1, num_ranks) executing N-1 ring transfer steps.",
    20: "Accumulates received chunk value additively: accumulator += chunks[i].",
    21: "Blank line before return statement.",
    22: "Returns fully reduced accumulator scalar sum.",
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
      "Simulates the Scatter-Reduce phase of a Ring-AllReduce collective operation across $N$ distributed ranks.\n\n### Mathematical Formulation & Ring Topology\nIn distributed data-parallel ML training, gradients or activation tensors $S$ are divided into $N$ equal contiguous chunks across $N$ GPUs ($C_0, C_1, \\dots, C_{N-1}$).\n\nDuring the Scatter-Reduce phase:\n1. Over $N-1$ synchronous ring transfer steps, each rank $r \\in [0, N-1]$ sends chunk block $C_k$ to rank $(r+1) \\pmod N$ while receiving chunk block $C_k$ from rank $(r-1+N) \\pmod N$.\n2. Received partial values are added element-wise to local buffers:\n$$C_{\\text{reduced}}^{(r)} = \\sum_{i=0}^{N-1} C_{i}^{(r)}$$\n\nAt the end of $N-1$ ring steps, each GPU rank holds exactly one fully reduced chunk representing the global sum of that specific tensor partition across all GPUs.\n\nMathematical Communication & Complexity Analysis:\n- Number of ring transfer steps: $N - 1$\n- Total volume of data sent per GPU: $V_{\\text{send}} = \\frac{N-1}{N} S \\text{ bytes}$\n- Cumulative ring bandwidth utilization efficiency: $\\eta = 100\\%$ (all $N$ links active simultaneously)\n- FLOP count per GPU: $(N-1) \\times \\text{FLOPs}_{\\text{chunk}}$\n\nInput Format:\n- `chunks`: Array of numeric partial values or gradient tensor chunk magnitudes from each GPU rank.\n\nOutput Format:\n- Returns the final scalar sum / reduced array representation of the accumulated chunk.\n\nEdge Cases & Constraints:\n- Empty input ($N=0$): Returns 0 immediately.\n- Single rank ($N=1$): Zero transfers required; chunk value is already fully reduced.\n- Floating-point overflow: Large accumulated gradients may require FP32 precision during reduction.",
    constraints: ["1 <= chunks.length <= 100", "-10^5 <= chunks[i] <= 10^5"],
    examples: [
      {
        kind: "basic",
        title: "12 GPUs Ring Accumulation",
        inputDisplay: "12 chunks: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]",
        outputDisplay: "Reduced Sum = 450",
        input: DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
        output: "450",
        explanation:
          "Each GPU contributes its partial chunk value, accumulating to 450 over 11 ring steps.",
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
          body: "The global gradient tensor of size $S$ is divided into $N$ equal chunks. At step $s$, GPU $r$ sends chunk $(r - s) \\pmod N$ to GPU $(r+1) \\pmod N$ and receives chunk $(r - s - 1 + N) \\pmod N$. As chunks rotate around the ring over $N-1$ steps, each rank accumulates the received partial gradients into its target partition buffer.",
        },
        {
          heading: "Systems & Memory Bandwidth Efficiency",
          body: "Scatter-Reduce maximizes ring network utilization because every link in the ring transfers $\\frac{1}{N} S$ bytes simultaneously during each of the $N-1$ steps. Total data sent per GPU is $V_{\\text{send}} = \\frac{N-1}{N} S$. Contrast this with naive parameter server reduction, which transfers $S \\cdot (N-1)$ through a single network bottleneck.",
        },
        {
          heading: "Implementation Nuances & CUDA Stream Overlap",
          body: "Production NCCL implementations overlap communication with computation by double-buffering ring chunks. While CUDA kernel warp threads reduce chunk $k$ in SRAM, PCIe/NVLink copy engines stream chunk $k+1$ into GPU memory via DMA.",
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
