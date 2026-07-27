import { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export interface LinearScanKnnTopkInput {
  vectors: number[][];
  target?: number[];
}

export const linearScanKnnTopk: AlgorithmDefinition<LinearScanKnnTopkInput> = {
  id: "linearScanKnnTopk",
  title: "Q3: Top-K Elements Using Min-Heap (KNN)",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description:
    "Implementation of Q3: Top-K Elements Using Min-Heap (KNN) for Vector Search, LSH, IVF-PQ & HNSW Indexing.",
  constraints: [
    "Vectors must have matching dimensions.",
    "Input size typically constrained for visualization purposes.",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "Basic Input",
      outputDisplay: "Basic Output",
      input: {} as unknown as LinearScanKnnTopkInput, // Will need actual data but cast to any
      output: "Basic Success",
      explanation: "A simple clear basic example for linearScanKnnTopk.",
    },
    {
      kind: "complex",
      inputDisplay: "Complex Input",
      outputDisplay: "Complex Output",
      input: {} as unknown as LinearScanKnnTopkInput,
      output: "Complex Success",
      explanation: "A more intricate scenario with multiple elements.",
    },
    {
      kind: "negative",
      inputDisplay: "Empty Input",
      outputDisplay: "Empty Output",
      input: {} as unknown as LinearScanKnnTopkInput,
      output: "Empty",
      explanation: "Handling empty or invalid edge cases.",
    },
  ],
  defaultInput: {} as unknown as LinearScanKnnTopkInput,
  code: `
def linearScanKnnTopk(query_vector, database_embeddings, top_k=3):
    """
    Q3: Top-K Elements Using Min-Heap (KNN)
    Performs nearest-neighbor vector search over multi-dimensional vector embeddings.
    """
    import math

    candidate_distances = []
    for idx, embedding in enumerate(database_embeddings):
        # Calculate Euclidean distance: sqrt(sum((q_i - p_i)^2))
        euclidean_dist = math.sqrt(sum((q - p) ** 2 for q, p in zip(query_vector, embedding)))
        candidate_distances.append((euclidean_dist, idx, embedding))

    candidate_distances.sort(key=lambda item: item[0])
    return candidate_distances[:top_k]
`,
  timeComplexity: {
    best: "O(1)",
    average: "O(N log N)",
    worst: "O(N^2)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Time complexity heavily depends on the input size N.",
    space: "Requires O(N) auxiliary space for storing the intermediate processing states.",
  },
  topicGuide: {
    overview: "Comprehensive guide to linearScanKnnTopk in machine learning infrastructure.",
    sections: [
      {
        heading: "Core Concept",
        body: "The linearScanKnnTopk algorithm is a foundational component.",
      },
      {
        heading: "Mathematical Foundation",
        body: "It relies on well-established principles for its operation.",
      },
    ],
    keyTerms: [
      { term: "Node", definition: "A single unit of data or point in space." },
      { term: "Edge", definition: "A connection or transition between nodes." },
    ],
  },
  generateSteps: (_input: LinearScanKnnTopkInput) => {
    const steps: AlgorithmStep[] = [];

    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: { what: "Initialize algorithm", why: "To set up the initial state" },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { phase: "init" } },
      variables: { i: 0 },
    });

    steps.push({
      stepIndex: 1,
      codeLine: 4,
      explanation: { what: "Iterate over elements", why: "Processing each element" },
      primarySnapshot: {
        kind: "array",
        elements: [{ id: "el-1", value: 1, label: "node1", state: "active" }],
      },
      auxiliaryState: {},
      variables: { i: 1 },
    });

    steps.push({
      stepIndex: 2,
      codeLine: 6,
      explanation: { what: "Finish execution", why: "All elements processed" },
      primarySnapshot: {
        kind: "array",
        elements: [{ id: "el-1", value: 1, label: "node1", state: "sorted" }],
      },
      auxiliaryState: {},
      variables: { i: 1 },
    });

    return steps;
  },
};
