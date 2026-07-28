import type {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorItem,
  VectorVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface DistanceMetricsKnnInput {
  query: number[];
  dataset: number[][];
  k: number;
  metric: "euclidean" | "manhattan" | "cosine";
}

export const DISTANCE_METRICS_KNN_CODE = `def knn_distance_search(query: list[float], dataset: list[list[float]], k: int, metric: str) -> list[tuple[int, float]]:
    distances = []
    for idx, vec in enumerate(dataset):
        if metric == "euclidean":
            dist = math.sqrt(sum((q - v) ** 2 for q, v in zip(query, vec)))
        elif metric == "manhattan":
            dist = sum(abs(q - v) for q, v in zip(query, vec))
        else:
            dot = sum(q * v for q, v in zip(query, vec))
            norm_q = math.sqrt(sum(q ** 2 for q in query))
            norm_v = math.sqrt(sum(v ** 2 for v in vec))
            dist = 1.0 - (dot / (norm_q * norm_v)) if norm_q * norm_v > 0 else 1.0
        distances.append((idx, round(dist, 4)))
        
    distances.sort(key=lambda x: x[1])
    return distances[:k]`;

export const DEFAULT_DISTANCE_METRICS_KNN_INPUT: DistanceMetricsKnnInput = {
  query: [1.0, 2.0],
  dataset: [
    [1.5, 2.5],
    [4.0, 5.0],
    [0.5, 1.5],
    [10.0, 10.0],
  ],
  k: 2,
  metric: "euclidean",
};

const createVectorSnapshot = (
  query: number[],
  dataset: number[][],
  activeIdx: number | null,
  computedDistances: { idx: number; dist: number }[],
  topKIndices: Set<number>,
  metric: string,
): VectorVisualSnapshot => {
  const is3D = query.length >= 3;
  const vectors: VectorItem[] = [];

  // Query vector
  vectors.push({
    id: "query",
    label: "Query",
    x: query[0] ?? 0,
    y: query[1] ?? 0,
    z: is3D ? query[2] : undefined,
    color: "#ef4444",
    state: "active",
    subText: `Query [${query.join(", ")}]`,
  });

  // Dataset vectors
  dataset.forEach((vec, idx) => {
    const match = computedDistances.find((d) => d.idx === idx);
    const isTop = topKIndices.has(idx);
    const isActive = idx === activeIdx;

    let state: VectorItem["state"] = "default";
    let color = "#94a3b8";
    let subText = `[${vec.join(", ")}]`;

    if (isActive) {
      state = "active";
      color = "#f59e0b";
      if (match) subText = `d = ${match.dist.toFixed(4)}`;
    } else if (isTop) {
      state = "result";
      color = "#22c55e";
      if (match) subText = `Top-K (d = ${match.dist.toFixed(4)})`;
    } else if (match) {
      state = "compared";
      color = "#3b82f6";
      subText = `d = ${match.dist.toFixed(4)}`;
    }

    vectors.push({
      id: `vec-${idx}`,
      label: `Vec ${idx}`,
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
    planeTitle: `KNN Vector Space (${metric.toUpperCase()})`,
  };
};

export const generateDistanceMetricsKnnSteps = (
  input: DistanceMetricsKnnInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { query, dataset, k, metric } = input;
  const n = dataset.length;

  const computeDistance = (q: number[], v: number[], m: string): number => {
    if (m === "euclidean") {
      const sumSq = q.reduce((acc, val, i) => acc + (val - (v[i] || 0)) ** 2, 0);
      return Math.sqrt(sumSq);
    } else if (m === "manhattan") {
      return q.reduce((acc, val, i) => acc + Math.abs(val - (v[i] || 0)), 0);
    } else {
      const dot = q.reduce((acc, val, i) => acc + val * (v[i] || 0), 0);
      const normQ = Math.sqrt(q.reduce((acc, val) => acc + val ** 2, 0));
      const normV = Math.sqrt(v.reduce((acc, val) => acc + val ** 2, 0));
      const sim = normQ * normV > 0 ? dot / (normQ * normV) : 0;
      return 1.0 - sim;
    }
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeIdx: number | null,
    distList: { idx: number; dist: number }[],
    topKSet: Set<number>,
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createVectorSnapshot(query, dataset, activeIdx, distList, topKSet, metric),
      auxiliaryState: {
        customState: {
          metric,
          query: `[${query.join(", ")}]`,
          k: String(k),
          computedDistances: distList.map((d) => `V${d.idx}:${d.dist.toFixed(3)}`).join(", "),
        },
      },
      variables: vars,
    });
  };

  if (n === 0 || k <= 0) {
    addStep(
      2,
      "Empty dataset or invalid k",
      "Dataset is empty or k is not positive.",
      null,
      [],
      new Set(),
      { valid: false },
    );
    return steps;
  }

  addStep(
    2,
    `Initialize k-NN Distance Search (${metric}, k=${k})`,
    `Query vector: [${query.join(", ")}]. Preparing distance calculations for ${n} dataset vectors.`,
    null,
    [],
    new Set(),
    { n, k, metric },
  );

  const distances: { idx: number; dist: number }[] = [];
  const calcLine = metric === "euclidean" ? 5 : metric === "manhattan" ? 7 : 12;

  for (let idx = 0; idx < n; idx++) {
    const vec = dataset[idx];
    const rawDist = computeDistance(query, vec, metric);
    const dist = Math.round(rawDist * 10000) / 10000;
    distances.push({ idx, dist });

    addStep(
      calcLine,
      `Compute ${metric} distance to Vec ${idx} [${vec.join(", ")}]: d = ${dist}`,
      `Distance between Query [${query.join(", ")}] and Vec ${idx} [${vec.join(", ")}] using ${metric} metric is ${dist}. Appended to candidate distances.`,
      idx,
      [...distances],
      new Set(),
      { idx, dist, poolSize: distances.length },
    );
  }

  const sortedDistances = [...distances].sort((a, b) => a.dist - b.dist);

  addStep(
    15,
    `Sort candidate distances ascending`,
    `Sorted distances: ${sortedDistances.map((d) => `Vec ${d.idx}: ${d.dist}`).join(", ")}.`,
    null,
    sortedDistances,
    new Set(),
    { poolSize: sortedDistances.length },
  );

  const topK = sortedDistances.slice(0, Math.min(k, n));
  const topKSet = new Set(topK.map((d) => d.idx));

  addStep(
    16,
    `Top-${k} Nearest Neighbors Selected`,
    `Selected nearest vectors: ${topK
      .map((d, r) => `#${r + 1}: Vec ${d.idx} (dist=${d.dist})`)
      .join(", ")}.`,
    null,
    sortedDistances,
    topKSet,
    { k, topKCount: topK.length, complete: true },
  );

  return steps;
};

export const DISTANCE_METRICS_KNN_TRIVIA: TriviaMeta = {
  skipLines: [2],
  hints: [
    { line: 5, hint: "Euclidean distance uses sqrt of sum of squared differences" },
    { line: 7, hint: "Manhattan distance uses sum of absolute differences" },
    { line: 12, hint: "Cosine distance equals 1 - Cosine Similarity" },
  ],
  distractors: [
    "dist = sum((q + v) ** 2 for q, v in zip(query, vec))",
    "dist = dot * norm_q * norm_v",
    "distances.sort(key=lambda x: -x[1])",
  ],
};

export const distanceMetricsKnn: AlgorithmDefinition<DistanceMetricsKnnInput> = {
  id: "distance-metrics-knn",
  title: "Distance Metrics & K-Nearest Neighbors",
  topicIds: ["ml_vector_search"],
  difficulty: "Medium",
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Evaluate vector distances (Euclidean L2, Manhattan L1, Cosine) and select top-k nearest neighbors.",
  code: DISTANCE_METRICS_KNN_CODE,
  defaultInput: DEFAULT_DISTANCE_METRICS_KNN_INPUT,
  examples: [
    {
      kind: "basic",
      title: "Euclidean 2-NN Search",
      input: DEFAULT_DISTANCE_METRICS_KNN_INPUT,
      output: "[(0, 0.7071), (2, 0.7071)]",
      explanation:
        "Vec 0 and Vec 2 are nearest to query [1.0, 2.0] at distance sqrt(0.5) = 0.7071.",
    },
    {
      kind: "complex",
      title: "Manhattan Metric 2-NN Search",
      input: {
        query: [0.0, 0.0],
        dataset: [
          [1.0, 1.0],
          [2.0, 0.0],
          [0.0, 3.0],
        ],
        k: 2,
        metric: "manhattan",
      },
      output: "[(0, 2.0), (1, 2.0)]",
      explanation: "|1-0|+|1-0|=2, |2-0|+|0-0|=2. Top-2 distances are 2.0.",
    },
    {
      kind: "negative",
      title: "Empty Dataset Search",
      input: {
        query: [1.0, 1.0],
        dataset: [],
        k: 3,
        metric: "euclidean",
      },
      output: "[]",
      explanation: "Empty dataset yields empty nearest neighbors result.",
    },
  ],
  timeComplexity: {
    best: "O(N * D + N log N)",
    average: "O(N * D + N log N)",
    worst: "O(N * D + N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N * D) for computing N distances in D dimensions, plus O(N log N) for sorting.",
    space: "O(N) memory to store distances.",
  },
  topicGuide: {
    overview:
      "Distance metrics measure vector dissimilarity in high-dimensional embedding space. K-NN identifies the k most similar vectors to a query, forming the core of vector databases and retrieval-augmented generation (RAG).",
    sections: [
      {
        heading: "L2 vs L1 vs Cosine",
        body: "Euclidean (L2) measures straight-line distance; Manhattan (L1) measures grid distance; Cosine measures angular difference independent of vector magnitude.",
      },
    ],
    keyTerms: [
      { term: "Euclidean Distance", definition: "sqrt(sum((a_i - b_i)^2))." },
      { term: "Cosine Similarity", definition: "(A . B) / (||A|| * ||B||)." },
    ],
  },
  trivia: DISTANCE_METRICS_KNN_TRIVIA,
  generateSteps: generateDistanceMetricsKnnSteps,
};
