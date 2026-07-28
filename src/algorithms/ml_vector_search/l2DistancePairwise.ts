import {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorItem,
  VectorVisualSnapshot,
} from "../../types/dsa";

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
    distances = []
    for idx, vec in enumerate(database):
        sum_sq = sum((q - v) ** 2 for q, v in zip(query, vec))
        dist = math.sqrt(sum_sq)
        distances.append((idx, round(dist, 4)))

    distances.sort(key=lambda x: x[1])
    return distances`;

const makeVectorSnapshot = (
  query: number[],
  database: number[][],
  activeIdx: number | null,
  dists: { idx: number; dist: number }[],
  sortedRankings?: number[],
  planeTitle?: string,
): VectorVisualSnapshot => {
  const is3D = query.length >= 3;
  const vectors: VectorItem[] = [];

  vectors.push({
    id: "query",
    label: `Query [${query.join(", ")}]`,
    x: query[0] ?? 0,
    y: query[1] ?? 0,
    z: is3D ? query[2] : undefined,
    color: "#ef4444",
    state: "active",
    subText: "Query Vector",
  });

  database.forEach((vec, idx) => {
    const computed = dists.find((d) => d.idx === idx);
    const isActive = idx === activeIdx;
    const rank = sortedRankings ? sortedRankings.indexOf(idx) : -1;

    let state: VectorItem["state"] = "default";
    let color = "#94a3b8";
    let subText = `V${idx} [${vec.join(", ")}]`;

    if (isActive) {
      state = "active";
      color = "#f59e0b";
      if (computed !== undefined) {
        subText = `V${idx}: L2 = ${computed.dist.toFixed(4)}`;
      }
    } else if (rank === 0) {
      state = "result";
      color = "#22c55e";
      if (computed !== undefined) {
        subText = `Rank 1: L2 = ${computed.dist.toFixed(4)}`;
      }
    } else if (rank > 0) {
      state = "compared";
      color = "#3b82f6";
      if (computed !== undefined) {
        subText = `Rank ${rank + 1}: L2 = ${computed.dist.toFixed(4)}`;
      }
    } else if (computed !== undefined) {
      state = "compared";
      color = "#64748b";
      subText = `V${idx}: L2 = ${computed.dist.toFixed(4)}`;
    }

    vectors.push({
      id: `v-${idx}`,
      label: `V${idx}`,
      x: vec[0] ?? 0,
      y: vec[1] ?? 0,
      z: is3D ? vec[2] : undefined,
      color,
      state,
      subText,
    });
  });

  return {
    kind: "vector",
    vectors,
    dimensions: is3D ? "3d" : "2d",
    planeTitle: planeTitle ?? "2D Euclidean Vector Space (L2 Distance)",
  };
};

export const generateL2DistancePairwiseSteps = (
  input: L2DistancePairwiseInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, database } = input;
  let stepIndex = 0;

  // Step 0: Init (Line 4)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize empty distances list.",
      why: `Setting up an empty array distances = [] to store pairwise (vector_index, L2_distance) pairs for ${database.length} candidate database vectors against Query [${query.join(
        ", ",
      )}].`,
    },
    primarySnapshot: makeVectorSnapshot(
      query,
      database,
      null,
      [],
      undefined,
      "Initial State: Query & Database Vectors",
    ),
    auxiliaryState: {
      customState: {
        query: `[${query.join(", ")}]`,
        databaseSize: String(database.length),
        status: "Initialized",
        distances: "[]",
      },
    },
    variables: { databaseSize: database.length, processedCount: 0 },
  });

  const dists: { idx: number; dist: number; sumSq: number }[] = [];

  for (let i = 0; i < database.length; i++) {
    const vec = database[i];
    const diffs = query.map((q, d) => (q - (vec[d] ?? 0)) ** 2);
    const sumSq = diffs.reduce((acc, v) => acc + v, 0);
    const dist = Math.sqrt(sumSq);

    // Line 5: Select database vector
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Select database vector V${i} [${vec.join(", ")}]`,
        why: `Iterating to candidate index ${i}. Preparing to compute Euclidean distance between Query [${query.join(
          ", ",
        )}] and V${i} [${vec.join(", ")}].`,
      },
      primarySnapshot: makeVectorSnapshot(
        query,
        database,
        i,
        dists,
        undefined,
        `Selecting Candidate Vector V${i}`,
      ),
      auxiliaryState: {
        customState: {
          activeVector: `V${i} [${vec.join(", ")}]`,
          status: `Processing V${i}`,
        },
      },
      variables: { i, activeVector: `V${i}` },
    });

    // Line 6: Compute squared component sum
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Compute sum of squared component differences for V${i}`,
        why: `Summing squared component differences: sum((q_k - v_k)^2) = ${diffs
          .map((v) => v.toFixed(2))
          .join(" + ")} = ${sumSq.toFixed(4)}.`,
      },
      primarySnapshot: makeVectorSnapshot(
        query,
        database,
        i,
        dists,
        undefined,
        `Squared Difference Sum for V${i}`,
      ),
      auxiliaryState: {
        customState: {
          activeVector: `V${i}`,
          sumSquaredDiffs: sumSq.toFixed(4),
        },
      },
      variables: { i, sumSq: Math.round(sumSq * 10000) / 10000 },
    });

    // Line 7: Compute L2 square root distance
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Calculate Euclidean L2 distance for V${i}`,
        why: `Taking square root of sum of squared differences: sqrt(${sumSq.toFixed(
          4,
        )}) = ${dist.toFixed(4)}.`,
      },
      primarySnapshot: makeVectorSnapshot(
        query,
        database,
        i,
        [...dists, { idx: i, dist, sumSq }],
        undefined,
        `L2 Distance Computed for V${i}`,
      ),
      auxiliaryState: {
        customState: {
          activeVector: `V${i}`,
          euclideanDist: dist.toFixed(4),
        },
      },
      variables: {
        i,
        sumSq: Math.round(sumSq * 10000) / 10000,
        dist: Math.round(dist * 10000) / 10000,
      },
    });

    dists.push({ idx: i, dist, sumSq });

    // Line 8: Append pair to distances list
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Append (index, distance) pair to distances array`,
        why: `Recorded tuple (${i}, ${dist.toFixed(
          4,
        )}) into distances list. (${dists.length}/${database.length} vectors processed).`,
      },
      primarySnapshot: makeVectorSnapshot(
        query,
        database,
        null,
        dists,
        undefined,
        `Appended V${i} to distances`,
      ),
      auxiliaryState: {
        customState: {
          distances: JSON.stringify(dists.map((d) => [d.idx, Number(d.dist.toFixed(4))])),
        },
      },
      variables: { i, processedCount: dists.length },
    });
  }

  // Line 10: Sort by L2 distance
  const sorted = [...dists].sort((a, b) => a.dist - b.dist);
  const sortedRankings = sorted.map((s) => s.idx);

  const nearestIdx = sorted[0]?.idx ?? 0;
  const minDistance = sorted[0]?.dist ?? 0;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: "Sort candidate database vectors by ascending L2 distance.",
      why: `Sorted distances array by L2 distance. Nearest vector is V${nearestIdx} (d=${minDistance.toFixed(
        4,
      )}), followed by V${sorted[1]?.idx ?? "N/A"} (d=${sorted[1]?.dist.toFixed(4) ?? "N/A"}).`,
    },
    primarySnapshot: makeVectorSnapshot(
      query,
      database,
      null,
      dists,
      sortedRankings,
      "Vectors Ranked by Ascending L2 Distance",
    ),
    auxiliaryState: {
      customState: {
        nearestNeighbor: `V${nearestIdx}`,
        minDistance: minDistance.toFixed(4),
        sortedPairs: JSON.stringify(sorted.map((d) => [d.idx, Number(d.dist.toFixed(4))])),
      },
    },
    variables: {
      nearestIdx,
      minDistance: Math.round(minDistance * 10000) / 10000,
    },
  });

  // Line 11: Return distances
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: "Return ranked list of vector indices and L2 distances.",
      why: `Returned sorted pairwise L2 distance ranking. The closest neighbor to Query is V${nearestIdx} with L2 distance ${minDistance.toFixed(
        4,
      )}.`,
    },
    primarySnapshot: makeVectorSnapshot(
      query,
      database,
      null,
      dists,
      sortedRankings,
      "Final Pairwise Distance Computation Completed",
    ),
    auxiliaryState: {
      customState: {
        status: "Completed",
        nearestNeighbor: `V${nearestIdx} (dist=${minDistance.toFixed(4)})`,
      },
    },
    variables: {
      nearestIdx,
      minDistance: Math.round(minDistance * 10000) / 10000,
    },
  });

  return steps;
};

export const l2DistancePairwise: AlgorithmDefinition<L2DistancePairwiseInput> = {
  id: "l2-distance-pairwise",
  title: "Pairwise L2 Euclidean Distance Engine",
  topicIds: ["ml_vector_search"],
  difficulty: "Easy",
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
