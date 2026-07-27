import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface KmeansCentroidClusteringInput {
  vectors: number[][];
  k: number;
  maxIter: number;
  initialCentroids?: number[][];
}

export const DEFAULT_KMEANS_INPUT: KmeansCentroidClusteringInput = {
  vectors: [
    [1.0, 1.0],
    [1.5, 2.0],
    [3.0, 4.0],
    [5.0, 7.0],
    [3.5, 5.0],
    [4.5, 6.0],
  ],
  k: 2,
  maxIter: 3,
  initialCentroids: [
    [1.0, 1.0],
    [5.0, 7.0],
  ],
};

export const KMEANS_CENTROID_CLUSTERING_CODE = `import math

def l2_distance_sq(v1: list[float], v2: list[float]) -> float:
    return sum((a - b) ** 2 for a, b in zip(v1, v2))

def kmeans_clustering(vectors: list[list[float]], k: int, max_iter: int = 10, initial_centroids: list[list[float]] = None) -> tuple[list[list[float]], list[int]]:
    """
    K-Means centroid clustering algorithm.
    Iteratively assigns vectors to nearest centroid and updates centroids as cluster means.
    """
    dim = len(vectors[0])
    if initial_centroids:
        centroids = [c[:] for c in initial_centroids]
    else:
        centroids = [vectors[i][:] for i in range(k)]

    assignments = [-1] * len(vectors)

    for iteration in range(max_iter):
        changed = False

        # Expectation Step (E-step): Assign vectors to nearest centroid
        for idx, vec in enumerate(vectors):
            best_c = -1
            min_dist = float('inf')
            for c_idx, c_vec in enumerate(centroids):
                dist_sq = l2_distance_sq(vec, c_vec)
                if dist_sq < min_dist:
                    min_dist = dist_sq
                    best_c = c_idx

            if assignments[idx] != best_c:
                assignments[idx] = best_c
                changed = True

        if not changed:
            break

        # Maximization Step (M-step): Recompute centroids as mean of assigned vectors
        for c_idx in range(k):
            cluster_vecs = [vectors[i] for i, a in enumerate(assignments) if a == c_idx]
            if cluster_vecs:
                centroids[c_idx] = [sum(vec[d] for vec in cluster_vecs) / len(cluster_vecs) for d in range(dim)]

    return centroids, assignments`;

export const generateKmeansClusteringSteps = (
  input: KmeansCentroidClusteringInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { vectors, k, maxIter, initialCentroids } = input;
  let stepIndex = 0;

  const dim = vectors[0].length;
  let centroids = initialCentroids
    ? initialCentroids.map((c) => [...c])
    : vectors.slice(0, k).map((v) => [...v]);

  const assignments = new Array(vectors.length).fill(-1);

  const l2DistSq = (v1: number[], v2: number[]) =>
    v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `Initialize K-Means Clustering (K = ${k}, N = ${vectors.length})`,
      why: `Initial centroids: ${centroids.map((c, i) => `C${i} [${c.join(",")}]`).join("; ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: vectors.map((v, idx) => ({
        id: `v-${idx}`,
        value: idx,
        label: `V${idx} [${v.join(",")}]`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        k: String(k),
        centroids: centroids
          .map((c, i) => `C${i}:[${c.map((x) => x.toFixed(1)).join(",")}]`)
          .join(" | "),
        phase: "Initialization",
      },
    },
    variables: { k, N: vectors.length },
  });

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    // E-Step: Assign
    for (let i = 0; i < vectors.length; i++) {
      const vec = vectors[i];
      let bestC = -1;
      let minD = Infinity;

      for (let cIdx = 0; cIdx < k; cIdx++) {
        const dSq = l2DistSq(vec, centroids[cIdx]);
        if (dSq < minD) {
          minD = dSq;
          bestC = cIdx;
        }
      }

      if (assignments[i] !== bestC) {
        assignments[i] = bestC;
        changed = true;
      }
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Iter ${iter + 1}: E-Step (Cluster Assignment)`,
        why: `Assigned ${vectors.length} vectors to ${k} centroids. Cluster counts: ${Array.from(
          { length: k },
          (_, cIdx) => `C${cIdx}:${assignments.filter((a) => a === cIdx).length}`,
        ).join(", ")}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: vectors.map((_, idx) => ({
          id: `v-${idx}`,
          value: assignments[idx],
          label: `V${idx} -> C${assignments[idx]}`,
          state: assignments[idx] === 0 ? ("active" as ElementState) : ("sorted" as ElementState),
          pointers: [`Cluster ${assignments[idx]}`],
        })),
      },
      auxiliaryState: {
        customState: {
          iteration: String(iter + 1),
          assignments: assignments.map((a, idx) => `V${idx}:C${a}`).join(", "),
          step: "Expectation (E-Step)",
        },
      },
      variables: { iter: iter + 1, changed },
    });

    if (!changed && iter > 0) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 28,
        explanation: {
          what: "Convergence Reached: Centroid assignments stabilized",
          why: "No vector cluster assignments changed during iteration. Halting early.",
        },
        primarySnapshot: {
          kind: "array",
          elements: vectors.map((_, idx) => ({
            id: `v-${idx}`,
            value: assignments[idx],
            label: `V${idx} (C${assignments[idx]})`,
            state: "sorted" as ElementState,
          })),
        },
        auxiliaryState: { customState: { status: "Converged" } },
        variables: { converged: true },
      });
      break;
    }

    // M-Step: Recompute centroids
    const newCentroids: number[][] = [];
    for (let cIdx = 0; cIdx < k; cIdx++) {
      const clusterVecs = vectors.filter((_, idx) => assignments[idx] === cIdx);
      if (clusterVecs.length > 0) {
        const mean = Array.from(
          { length: dim },
          (_, d) => clusterVecs.reduce((sum, v) => sum + v[d], 0) / clusterVecs.length,
        );
        newCentroids.push(mean);
      } else {
        newCentroids.push([...centroids[cIdx]]);
      }
    }
    centroids = newCentroids;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 34,
      explanation: {
        what: `Iter ${iter + 1}: M-Step (Recompute Centroids)`,
        why: `Updated centroid positions to cluster means: ${centroids
          .map((c, i) => `C${i} [${c.map((x) => x.toFixed(2)).join(",")}]`)
          .join("; ")}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: centroids.map((c, cIdx) => ({
          id: `c-${cIdx}`,
          value: cIdx,
          label: `C${cIdx} mean [${c.map((x) => x.toFixed(2)).join(",")}]`,
          state: "highlighted" as ElementState,
          pointers: [`C${cIdx} Center`],
        })),
      },
      auxiliaryState: {
        customState: {
          iteration: String(iter + 1),
          newCentroids: centroids
            .map((c, i) => `C${i}:[${c.map((x) => x.toFixed(2)).join(",")}]`)
            .join(" | "),
          step: "Maximization (M-Step)",
        },
      },
      variables: { iter: iter + 1 },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 37,
    explanation: {
      what: "K-Means Clustering Complete",
      why: `Final centroids: ${centroids
        .map((c, i) => `C${i} [${c.map((x) => x.toFixed(2)).join(",")}]`)
        .join("; ")}. Partitioned ${vectors.length} vectors into K=${k} clusters.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: vectors.map((_, idx) => ({
        id: `v-${idx}`,
        value: assignments[idx],
        label: `V${idx} in C${assignments[idx]}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        finalCentroids: centroids
          .map((c, i) => `C${i}:[${c.map((x) => x.toFixed(2)).join(",")}]`)
          .join(" | "),
        status: "Completed",
      },
    },
    variables: { k, complete: true },
  });

  return steps;
};

export const kmeansCentroidClustering: AlgorithmDefinition<KmeansCentroidClusteringInput> = {
  id: "kmeansCentroidClustering",
  title: "K-Means Centroid Clustering",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description:
    "K-Means clustering partitions N multi-dimensional vectors into K distinct Voronoi clusters using Lloyd's Expectation-Maximization (EM) algorithm. Alternates between the Expectation step (assigning each vector to its nearest centroid) and the Maximization step (updating centroids to the arithmetic mean of assigned vectors).\n\nInput Format:\n- vectors: N data vectors of dimension D.\n- k: Target number of clusters K.\n- maxIter: Maximum optimization iterations.\n- initialCentroids: Optional K initial centroid coordinates.\n\nOutput Format:\n- Returns tuple (finalCentroids, clusterAssignments).\n\nEdge Cases & Constraints:\n- Empty cluster: Retains previous centroid position.\n- K >= N: Every vector becomes its own centroid.",
  constraints: ["1 <= k <= vectors.length.", "All vectors must have matching dimension D."],
  examples: [
    {
      kind: "basic",
      title: "2-Cluster Partitioning of 6 Vectors",
      inputDisplay: "6 vectors, K = 2, maxIter = 3",
      outputDisplay: "C0 around [1.25, 1.5], C1 around [4.0, 5.5]",
      input: DEFAULT_KMEANS_INPUT,
      output: "Centroids updated over 3 iterations",
      explanation:
        "Separates low-coordinate vectors [1.0, 1.0], [1.5, 2.0] from high-coordinate vectors.",
    },
    {
      kind: "complex",
      title: "Convergence in 1 Iteration",
      inputDisplay: "Already well-separated vectors",
      outputDisplay: "Converges immediately",
      input: {
        vectors: [
          [0.0, 0.0],
          [10.0, 10.0],
        ],
        k: 2,
        maxIter: 5,
      },
      output: "Centroids: [0,0] and [10,10]",
      explanation: "No assignment changes occur after 1st E-step.",
    },
    {
      kind: "negative",
      title: "K = 1 Single Cluster",
      inputDisplay: "K = 1 for 6 vectors",
      outputDisplay: "Single centroid at overall vector mean",
      input: {
        ...DEFAULT_KMEANS_INPUT,
        k: 1,
        initialCentroids: [[0.0, 0.0]],
      },
      output: "Single mean centroid",
      explanation: "All vectors assigned to cluster 0, centroid becomes dataset mean.",
    },
  ],
  defaultInput: DEFAULT_KMEANS_INPUT,
  code: KMEANS_CENTROID_CLUSTERING_CODE,
  timeComplexity: {
    best: "O(I * K * N * D)",
    average: "O(I * K * N * D)",
    worst: "O(I * K * N * D)",
  },
  spaceComplexity: "O(K * D + N)",
  complexityAnalysis: {
    time: "O(I * K * N * D) where I is iterations, K is cluster count, N is vector count, and D is dimension.",
    space: "O(K * D + N) space for centroid positions and cluster assignments.",
  },
  topicGuide: {
    overview:
      "K-Means clustering (MacQueen 1967, Lloyd 1982) is the standard method for constructing coarse Voronoi index cells in IVF vector search engines (FAISS, ScaNN, Milvus). By grouping data into K representative cluster centroids, vector search engines narrow query searches down to relevant partitions.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Minimizes within-cluster sum of squares (WCSS / Inertia): argmin_S sum_{i=1}^K sum_{x in S_i} ||x - mu_i||^2. The E-step solves spatial assignment; the M-step updates cluster mean mu_i = (1/|S_i|) sum_{x in S_i} x.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "In production, K-Means initialization uses K-Means++ to prevent poor local minima. GPU implementations (FAISS GPU-KMeans) leverage SIMD matrix operations to process millions of vectors.",
      },
      {
        heading: "Implementation Nuances & Convergence",
        body: "Handling empty clusters (when no vectors are assigned to a centroid) requires re-initializing the centroid to a random vector with maximum distance to existing centroids.",
      },
    ],
    keyTerms: [
      {
        term: "Inertia / WCSS",
        definition:
          "Within-cluster sum of squared distances from vectors to their assigned centroid.",
      },
      {
        term: "Expectation-Maximization (EM)",
        definition:
          "Two-step iterative optimization paradigm for finding maximum likelihood parameter estimates.",
      },
      {
        term: "K-Means++",
        definition:
          "Initialization scheme choosing initial centroids proportional to squared distance from existing centroids.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "Foundational ML Clustering (Lloyd / MacQueen)" },
  ],
  generateSteps: generateKmeansClusteringSteps,
};
