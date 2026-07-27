import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ringScatterReduceArrayAccumulatorInput {
  chunks: number[];
}

export const RINGSCATTERREDUCEARRAYACCUMULATOR_CODE = `def ring_scatter_reduce(chunks: list[float]) -> float:
    # Simulates one chunk's reduction across N GPUs in a Ring topology.
    # Each GPU sends its partial chunk sum to the next GPU.
    N = len(chunks)
    if N == 0:
        return 0.0
    
    reduced_value = chunks[0]
    
    for i in range(1, N):
        # In a real system, this is a receive from neighbor and local sum
        reduced_value += chunks[i]
        
    return reduced_value
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
    7,
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
      9,
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
      11,
      `Accumulate chunk from GPU ${i}`,
      "The received partial chunk is added to the local chunk value.",
      { N, i, reduced_value: reducedValue },
      currentElements,
    );
  }

  currentElements = elements.map((el) => ({ ...el, state: "sorted" as const }));
  addStep(
    13,
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
  hints: [{ line: 11, hint: "Scatter-Reduce accumulates values additively across GPUs." }],
  lineExplanations: {
    4: "Get the number of participating GPUs.",
    7: "Initialize the running sum with the first GPU's chunk.",
    9: "Iterate N-1 times, representing communication steps in the ring.",
    11: "Accumulate the received chunk with the local chunk.",
    13: "Return the fully reduced chunk.",
  },
};

export const ringScatterReduceArrayAccumulator: AlgorithmDefinition<ringScatterReduceArrayAccumulatorInput> =
  {
    id: "ring-scatter-reduce-array-accumulator",
    title: "Ring-AllReduce Scatter-Reduce Phase",
    category: "ml_distributed_systems",
    categories: ["ml_distributed_systems"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 11,
    mlInfraCategory: "ml_distributed_systems",
    description:
      "Simulates the Scatter-Reduce phase of Ring-AllReduce where chunks are passed and accumulated across N GPUs.",
    constraints: ["1 <= chunks.length <= 100", "-10^5 <= chunks[i] <= 10^5"],
    examples: [
      {
        kind: "basic",
        title: "4 GPUs",
        inputDisplay: "chunks = [10, 20, 30, 40]",
        outputDisplay: "100",
        input: { chunks: [10, 20, 30, 40] },
        output: "100",
        explanation: "Each GPU contributes its partial chunk, totaling 100.",
      },
      {
        kind: "complex",
        title: "8 GPUs with Negative Gradients",
        inputDisplay: "chunks = [1, -2, 3, -4, 5, -6, 7, -8]",
        outputDisplay: "-4",
        input: { chunks: [1, -2, 3, -4, 5, -6, 7, -8] },
        output: "-4",
        explanation: "Gradient accumulations can result in cancellations.",
      },
      {
        kind: "negative",
        title: "Single GPU",
        inputDisplay: "chunks = [50]",
        outputDisplay: "50",
        input: { chunks: [50] },
        output: "50",
        explanation: "With 1 GPU, no communication or accumulation is needed.",
      },
    ],
    code: RINGSCATTERREDUCEARRAYACCUMULATOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Each chunk undergoes N-1 additions across the ring, resulting in O(N) time.",
      space: "The accumulator requires O(1) auxiliary space beyond the input chunks.",
    },
    topicGuide: {
      overview:
        "Scatter-Reduce is the first half of the Ring-AllReduce collective operation used heavily in distributed data parallel training.",
      sections: [
        {
          heading: "Core Concept",
          body: "In Scatter-Reduce, the tensor is split into N chunks. Each GPU passes one chunk to its neighbor and receives another, accumulating the results. After N-1 steps, each GPU holds exactly one fully reduced chunk.",
        },
        {
          heading: "Systems Impact",
          body: "By splitting the payload and distributing the accumulation, Ring-AllReduce ensures network bandwidth is fully utilized uniformly across all links, avoiding bottlenecks.",
        },
      ],
      keyTerms: [
        {
          term: "Scatter-Reduce",
          definition:
            "Phase where partial sums are accumulated. Leaves each GPU with one fully reduced chunk.",
        },
        {
          term: "All-Gather",
          definition: "Second phase where the fully reduced chunks are shared with all GPUs.",
        },
        {
          term: "Chunk",
          definition:
            "A partition of the full tensor. For N GPUs, the tensor is split into N chunks.",
        },
      ],
    },
    trivia: RINGSCATTERREDUCEARRAYACCUMULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 11" }],
    defaultInput: DEFAULT_RINGSCATTERREDUCEARRAYACCUMULATOR_INPUT,
    generateSteps: generateRingScatterReduceArrayAccumulatorSteps,
  };
