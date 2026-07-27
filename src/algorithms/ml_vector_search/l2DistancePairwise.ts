import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";

export interface L2DistancePairwiseInput {
  vectors: number[][];
  target: number[];
}

export const l2DistancePairwise: AlgorithmDefinition<L2DistancePairwiseInput> = {
  id: "l2DistancePairwise",
  title: "Pairwise L2 Distance Computation",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description:
    "Computes the Euclidean (L2) distance between a set of query vectors and a target vector.",
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
    overview: "Computes Euclidean distances between input vectors and a reference target.",
    sections: [
      {
        heading: "L2 Distance Formula",
        body: "The L2 distance d(u, v) = sqrt(sum((u_i - v_i)^2)).",
      },
    ],
    keyTerms: [
      {
        term: "Euclidean Distance",
        definition: "The straight-line distance between two points in Euclidean space.",
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
