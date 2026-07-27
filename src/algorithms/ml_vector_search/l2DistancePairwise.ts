import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface L2DistancePairwiseInput {
  query: number[];
  database: number[][];
}

export const DEFAULT_L2_DISTANCE_PAIRWISE_INPUT: L2DistancePairwiseInput = {
  query: [1.0, 2.0],
  database: [
    [1.0, 2.0],
    [4.0, 6.0],
    [1.0, 5.0],
    [-2.0, 2.0],
  ],
};

export const L2_DISTANCE_PAIRWISE_CODE = `import math

def l2_distance_pairwise(query: list[float], database: list[list[float]]) -> list[tuple[int, float]]:
    """
    Computes pairwise Euclidean L2 distance between query vector and database vectors.
    L2 distance: sqrt(sum((q_i - v_i)^2)).
    """
    distances = []
    for idx, vec in enumerate(database):
        sum_sq = sum((q - v) ** 2 for q, v in zip(query, vec))
        dist = math.sqrt(sum_sq)
        distances.append((idx, round(dist, 4)))

    distances.sort(key=lambda x: x[1])
    return distances`;

export const generateL2DistancePairwiseSteps = (
  input: L2DistancePairwiseInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, database } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Pairwise L2 Distance Computation",
      why: `Computing Euclidean distance between query [${query.join(
        ", ",
      )}] and ${database.length} database vectors.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: database.map((vec, idx) => ({
        id: `v-${idx}`,
        value: idx,
        label: `V${idx} [${vec.join(",")}]`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        query: `[${query.join(", ")}]`,
        databaseSize: String(database.length),
        status: "Initialized",
      },
    },
    variables: { databaseSize: database.length },
  });

  const dists: { idx: number; dist: number; sumSq: number }[] = [];

  for (let i = 0; i < database.length; i++) {
    const vec = database[i];
    const diffs = query.map((q, d) => (q - vec[d]) ** 2);
    const sumSq = diffs.reduce((acc, v) => acc + v, 0);
    const dist = Math.sqrt(sumSq);

    dists.push({ idx: i, dist, sumSq });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Compute L2 Distance for Vector V${i} [${vec.join(", ")}]`,
        why: `Squared difference sum = ${diffs.join(" + ")} = ${sumSq.toFixed(2)}. sqrt(${sumSq.toFixed(
          2,
        )}) = ${dist.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: database.map((_, idx) => ({
          id: `v-${idx}`,
          value: idx === i ? Math.round(dist * 100) : idx,
          label: `V${idx} (d=${idx <= i ? (dists[idx]?.dist ?? 0).toFixed(2) : "?"})`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`dist=${dist.toFixed(4)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeVector: `V${i} [${vec.join(", ")}]`,
          sumSquaredDiffs: sumSq.toFixed(2),
          euclideanDist: dist.toFixed(4),
        },
      },
      variables: { i, sumSq, dist: Math.round(dist * 100) / 100 },
    });
  }

  // Step Final: Sorted
  const sorted = [...dists].sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: "Sort Candidate Vectors by Ascending L2 Distance",
      why: `Closest neighbor is V${sorted[0].idx} with L2 distance ${sorted[0].dist.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: sorted.map((item, rank) => ({
        id: `v-${item.idx}`,
        value: Math.round(item.dist * 100),
        label: `Rank ${rank + 1}: V${item.idx} (dist=${item.dist.toFixed(4)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Nearest Neighbor"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        nearestNeighbor: `V${sorted[0].idx}`,
        minDistance: sorted[0].dist.toFixed(4),
        status: "Completed",
      },
    },
    variables: { nearestIdx: sorted[0].idx, minDistance: sorted[0].dist },
  });

  return steps;
};

export const l2DistancePairwise: AlgorithmDefinition<L2DistancePairwiseInput> = {
  id: "l2DistancePairwise",
  title: "Pairwise L2 Euclidean Distance Engine",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description:
    "Computes exact pairwise Euclidean L2 distances d(x, y) = sqrt(sum_{i=1}^D (x_i - y_i)^2) between a query vector and database embeddings. Serves as the fundamental distance baseline for kNN, LSH, and IVF vector search benchmark evaluations.\n\nInput Format:\n- query: D-dimensional query vector.\n- database: Array of N candidate embedding vectors.\n\nOutput Format:\n- Returns sorted array of tuples (vectorIndex, L2Distance) in ascending order.\n\nEdge Cases & Constraints:\n- Identical query and database vector: Yields exact distance 0.0.",
  constraints: ["All vectors must have identical dimension D."],
  examples: [
    {
      kind: "basic",
      title: "Exact Matching Query Vector",
      inputDisplay: "query = [1.0, 2.0], V0 = [1.0, 2.0]",
      outputDisplay: "V0 L2 Distance: 0.0000",
      input: DEFAULT_L2_DISTANCE_PAIRWISE_INPUT,
      output: "V0 dist = 0.0000",
      explanation: "Identical vector V0 yields zero Euclidean distance.",
    },
    {
      kind: "complex",
      title: "Pythagorean 3-4-5 Distance Triangle",
      inputDisplay: "query = [1.0, 2.0], V1 = [4.0, 6.0]",
      outputDisplay: "V1 L2 Distance: 5.0000",
      input: DEFAULT_L2_DISTANCE_PAIRWISE_INPUT,
      output: "V1 dist = 5.0000",
      explanation: "dx = 3, dy = 4 -> sqrt(3^2 + 4^2) = sqrt(25) = 5.0000.",
    },
    {
      kind: "negative",
      title: "Negative Coordinate Space",
      inputDisplay: "query = [1.0, 2.0], V3 = [-2.0, 2.0]",
      outputDisplay: "V3 L2 Distance: 3.0000",
      input: DEFAULT_L2_DISTANCE_PAIRWISE_INPUT,
      output: "V3 dist = 3.0000",
      explanation: "dx = 3, dy = 0 -> sqrt(3^2) = 3.0000.",
    },
  ],
  defaultInput: DEFAULT_L2_DISTANCE_PAIRWISE_INPUT,
  code: L2_DISTANCE_PAIRWISE_CODE,
  timeComplexity: {
    best: "O(N * D)",
    average: "O(N * D)",
    worst: "O(N * D)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N * D) for N database vectors of dimension D.",
    space: "O(N) auxiliary space to store candidate distance pairs.",
  },
  topicGuide: {
    overview:
      "Euclidean L2 distance is the canonical geometric metric in vector search spaces. In matrix notation, pairwise squared L2 distances between query Q and database matrix X can be expressed via matrix multiplication: ||Q - X_i||^2 = ||Q||^2 + ||X_i||^2 - 2 (Q . X_i), enabling BLAS Level 3 GPU acceleration.",
    sections: [
      {
        heading: "Core Concept & Mathematical Expansion",
        body: "Expanding ||Q - X||^2 = ||Q||^2 + ||X||^2 - 2 Q X^T converts N vector distance evaluations into a single GEMM matrix-matrix multiplication plus two norm additions.",
      },
      {
        heading: "Systems & Memory Performance",
        body: "Direct elementwise subtraction loop incurs high memory bandwidth penalties. Matrix decomposition reduces DRAM access and maximizes GPU arithmetic intensity.",
      },
      {
        heading: "Numerical Precision (Float32 vs Float16)",
        body: "When using GEMM-based L2 distance expansions in FP16, precision loss can cause negative values under sqrt. Systems enforce max(0.0, dist_sq) clamping.",
      },
    ],
    keyTerms: [
      {
        term: "Euclidean Distance (L2)",
        definition: "The straight-line geometric distance between two points in Euclidean space.",
      },
      {
        term: "Squared Euclidean Distance",
        definition: "Omitting the square root function to optimize comparison speed.",
      },
      {
        term: "GEMM Metric Expansion",
        definition:
          "Reformulating ||A - B||^2 using dot products to leverage fast BLAS matrix engines.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Fundamental Vector Geometry" }],
  generateSteps: generateL2DistancePairwiseSteps,
};
