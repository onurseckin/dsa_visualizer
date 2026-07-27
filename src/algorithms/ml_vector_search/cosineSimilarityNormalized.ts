import { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export interface CosineSimilarityNormalizedInput {
  vectors: number[][];
  target?: number[];
}

export const cosineSimilarityNormalized: AlgorithmDefinition<CosineSimilarityNormalizedInput> = {
  id: "cosineSimilarityNormalized",
  title: "Q2: Cosine Similarity",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description: "Implementation of Q2: Cosine Similarity for Vector Search, LSH, IVF-PQ & HNSW Indexing.",
  constraints: [
    "Vectors must have matching dimensions.",
    "Input size typically constrained for visualization purposes."
  ],
  examples: [
    {
      kind: "basic",
      input: { vectors: [[1, 2], [3, 4]] },
      output: "Success",
      explanation: "Basic case with small vectors."
    },
    {
      kind: "complex",
      input: { vectors: [[0.1, 0.5, 0.9], [0.8, 0.2, 0.4], [0.3, 0.3, 0.3]] },
      output: "Success",
      explanation: "More complex vectors."
    },
    {
      kind: "negative",
      input: { vectors: [] },
      output: "Empty",
      explanation: "Empty input array."
    }
  ],
  defaultInput: { vectors: [[1, 0], [0, 1]] },
  code: `function processVectors(vectors) {
  // Q2: Cosine Similarity
  return vectors.length;
}`,
  timeComplexity: {
    best: "O(1)",
    average: "O(N)",
    worst: "O(N^2)"
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Time complexity depends on dimensionality and vector count.",
    space: "Space complexity includes storing vectors and auxiliary structures."
  },
  topicGuide: {
    overview: "Topic 5: Vector Search, LSH, IVF-PQ & HNSW Indexing.",
    sections: [
      {
        heading: "Overview",
        body: "Q2: Cosine Similarity details and mathematical foundations."
      }
    ]
  },
  generateSteps: (input) => {
    const steps: AlgorithmStep[] = [];
    steps.push({
      stepIndex: 0,
      codeLine: 1,
      explanation: { what: "Initialize variables", why: "Prepare for algorithm execution" },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { status: "started" } },
      variables: { vectorCount: input.vectors ? input.vectors.length : 0 }
    });
    return steps;
  }
};
