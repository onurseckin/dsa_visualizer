import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
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
        else:  # cosine distance = 1 - cosine similarity
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

export const generateDistanceMetricsKnnSteps = (
  input: DistanceMetricsKnnInput
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
      // cosine distance
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
    vars: Record<string, string | number | boolean>
  ) => {
    const elements: ArrayElement[] = dataset.map((vec, i) => {
      const match = distList.find((d) => d.idx === i);
      let state: ArrayElement["state"] = "default";
      if (i === activeIdx) state = "active";
      else if (match) state = "visited";

      return {
        id: `vec-${i}`,
        value: match ? Math.round(match.dist * 100) / 100 : i,
        state,
        pointers: match
          ? [`Vec${i}: d=${match.dist.toFixed(2)}`]
          : [`Vec${i}: [${vec.join(",")}]`],
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements,
      },
      auxiliaryState: {
        customState: {
          metric,
          query: `[${query.join(", ")}]`,
          k: String(k),
          computedDistances: distList
            .map((d) => `V${d.idx}:${d.dist.toFixed(3)}`)
            .join(", "),
        },
      },
      variables: vars,
    });
  };

  if (n === 0 || k <= 0) {
    addStep(2, "Empty dataset or invalid k", "Dataset is empty or k is not positive.", null, [], {
      valid: false,
    });
    return steps;
  }

  addStep(
    3,
    `Initialize k-NN Distance Search (${metric}, k=${k})`,
    `Query vector: [${query.join(", ")}]. Computing ${metric} distance to ${n} dataset vectors.`,
    null,
    [],
    { n, k, metric }
  );

  const distances: { idx: number; dist: number }[] = [];

  for (let idx = 0; idx < n; idx++) {
    const vec = dataset[idx];
    const rawDist = computeDistance(query, vec, metric);
    const dist = Math.round(rawDist * 10000) / 10000;
    distances.push({ idx, dist });

    addStep(
      13,
      `Compute ${metric} distance to Vec ${idx} [${vec.join(", ")}]: d = ${dist}`,
      `Distance between Query and Vec ${idx} is ${dist}. Appended to candidate distance pool.`,
      idx,
      [...distances],
      { idx, dist, poolSize: distances.length }
    );
  }

  const sortedDistances = [...distances].sort((a, b) => a.dist - b.dist);

  addStep(
    15,
    `Sort candidates by distance ascending`,
    `Sorted distances: ${sortedDistances
      .map((d) => `V${d.idx}: ${d.dist}`)
      .join(", ")}.`,
    null,
    sortedDistances,
    { poolSize: sortedDistances.length }
  );

  const topK = sortedDistances.slice(0, Math.min(k, n));

  const finalElements: ArrayElement[] = dataset.map((_, i) => {
    const rank = topK.findIndex((d) => d.idx === i);
    const isTop = rank !== -1;
    return {
      id: `vec-${i}`,
      value: isTop ? topK[rank].dist : 99,
      state: isTop ? "sorted" : "default",
      pointers: isTop ? [`Rank #${rank + 1} (d=${topK[rank].dist})`] : undefined,
    };
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Top-${k} Nearest Neighbors Selected`,
      why: `Selected nearest vectors: ${topK
        .map((d, r) => `#${r + 1}: Vec ${d.idx} (dist=${d.dist})`)
        .join(", ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        topK: topK.map((d) => `V${d.idx}:${d.dist}`).join(", "),
      },
    },
    variables: { k, topKCount: topK.length, complete: true },
  });

  return steps;
};

export const DISTANCE_METRICS_KNN_TRIVIA: TriviaMeta = {
  skipLines: [2],
  hints: [
    { line: 5, hint: "Euclidean distance uses sqrt of sum of squared differences" },
    { line: 7, hint: "Manhattan distance uses sum of absolute differences" },
    { line: 11, hint: "Cosine distance equals 1 - Cosine Similarity" },
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
  category: "ml_vector_search",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
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
      explanation: "Vec 0 and Vec 2 are nearest to query [1.0, 2.0] at distance sqrt(0.5) = 0.7071.",
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
