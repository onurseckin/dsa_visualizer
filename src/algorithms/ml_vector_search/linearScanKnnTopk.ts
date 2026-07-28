import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface LinearScanKnnTopkInput {
  query: number[];
  database: number[][];
  k: number;
}

export const DEFAULT_LINEAR_SCAN_KNN_INPUT: LinearScanKnnTopkInput = {
  query: [1.0, 1.0],
  database: [
    [0.1, 0.2],
    [0.9, 1.1],
    [5.0, 5.0],
    [1.0, 0.8],
    [2.0, 2.0],
  ],
  k: 2,
};

export const LINEAR_SCAN_KNN_CODE = `import heapq
import math

def l2_distance(v1: list[float], v2: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

def linear_scan_knn_topk(query: list[float], database: list[list[float]], k: int) -> list[tuple[float, int]]:
    max_heap = []

    for idx, vec in enumerate(database):
        dist = l2_distance(query, vec)
        if len(max_heap) < k:
            heapq.heappush(max_heap, (-dist, idx))
        elif dist < -max_heap[0][0]:
            heapq.heapreplace(max_heap, (-dist, idx))

    top_k = [(-dist, idx) for dist, idx in max_heap]
    top_k.sort(key=lambda x: x[0])
    return top_k`;

export const generateLinearScanKnnSteps = (input: LinearScanKnnTopkInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, database, k } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - (v2[idx] ?? 0)) ** 2, 0));

  // Computed distances cache for cleaner labels
  const computedDists: (number | null)[] = new Array(database.length).fill(null);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: `Initialize Exact Linear Scan kNN Search Engine (K = ${k})`,
      why: `Searching for K = ${k} nearest neighbors to query [${query.join(
        ", ",
      )}] across ${database.length} database vectors.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: database.map((v, idx) => ({
        id: `v-${idx}`,
        value: idx,
        label: `V${idx} [${v.join(",")}]`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        query: `[${query.join(", ")}]`,
        k: String(k),
        heap: "[]",
        status: "Initialized",
      },
    },
    variables: { k, databaseSize: database.length },
  });

  const topHeap: { dist: number; idx: number }[] = [];

  for (let i = 0; i < database.length; i++) {
    const vec = database[i];
    const dist = l2Dist(query, vec);
    computedDists[i] = dist;
    const maxDistInHeap = topHeap.length > 0 ? Math.max(...topHeap.map((h) => h.dist)) : Infinity;

    if (topHeap.length < k) {
      topHeap.push({ dist, idx: i });
      topHeap.sort((a, b) => b.dist - a.dist);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 13,
        explanation: {
          what: `Scan Vector V${i} [${vec.join(", ")}] (dist=${dist.toFixed(3)}) -> Added to Max-Heap`,
          why: `Heap size (${topHeap.length}) < K (${k}). Inserted candidate (-dist, V${i}) into top-K max-heap.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: database.map((_, idx) => ({
            id: `v-${idx}`,
            value: idx,
            label: `V${idx} (d=${computedDists[idx] !== null ? computedDists[idx]!.toFixed(2) : "?"})`,
            state:
              idx === i
                ? ("active" as ElementState)
                : topHeap.some((h) => h.idx === idx)
                  ? ("sorted" as ElementState)
                  : idx < i
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
            pointers: idx === i ? [`In Heap (dist=${dist.toFixed(2)})`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            scanned: `V${i}`,
            dist: dist.toFixed(3),
            action: "Inserted into heap",
            topKHeap: topHeap.map((h) => `V${h.idx}:${h.dist.toFixed(2)}`).join(", "),
          },
        },
        variables: { i, dist: Math.round(dist * 100) / 100 },
      });
    } else if (dist < maxDistInHeap) {
      const evicted = topHeap.shift()!; // remove max element
      topHeap.push({ dist, idx: i });
      topHeap.sort((a, b) => b.dist - a.dist);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 15,
        explanation: {
          what: `Scan Vector V${i} (dist=${dist.toFixed(3)}) -> Replaced Worst Candidate V${evicted.idx}`,
          why: `Distance ${dist.toFixed(3)} < worst heap distance ${evicted.dist.toFixed(
            3,
          )}. Evicted V${evicted.idx} from top-K heap.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: database.map((_, idx) => ({
            id: `v-${idx}`,
            value: idx,
            label: `V${idx} (d=${computedDists[idx] !== null ? computedDists[idx]!.toFixed(2) : "?"})`,
            state:
              idx === i
                ? ("active" as ElementState)
                : topHeap.some((h) => h.idx === idx)
                  ? ("sorted" as ElementState)
                  : ("visited" as ElementState),
            pointers: idx === i ? ["Replaced Worst"] : idx === evicted.idx ? ["Evicted"] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            scanned: `V${i}`,
            evicted: `V${evicted.idx} (${evicted.dist.toFixed(2)})`,
            newMinDist: dist.toFixed(3),
            topKHeap: topHeap.map((h) => `V${h.idx}:${h.dist.toFixed(2)}`).join(", "),
          },
        },
        variables: { i, dist: Math.round(dist * 100) / 100, evictedIdx: evicted.idx },
      });
    } else {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Scan Vector V${i} (dist=${dist.toFixed(3)}) -> Discarded`,
          why: `Distance ${dist.toFixed(3)} >= worst heap candidate distance (${maxDistInHeap.toFixed(
            3,
          )}). Discarded candidate.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: database.map((_, idx) => ({
            id: `v-${idx}`,
            value: idx,
            label: `V${idx} (d=${computedDists[idx] !== null ? computedDists[idx]!.toFixed(2) : "?"})`,
            state:
              idx === i
                ? ("visited" as ElementState)
                : topHeap.some((h) => h.idx === idx)
                  ? ("sorted" as ElementState)
                  : idx < i
                    ? ("visited" as ElementState)
                    : ("default" as ElementState),
          })),
        },
        auxiliaryState: {
          customState: {
            scanned: `V${i}`,
            dist: dist.toFixed(3),
            action: "Discarded",
          },
        },
        variables: { i, dist: Math.round(dist * 100) / 100 },
      });
    }
  }

  // Step Final: Sorted
  topHeap.sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Exact Linear Scan kNN Complete: Retained Top K = ${k} Nearest Neighbors`,
      why: `Final top-K ranking: ${topHeap
        .map((h, r) => `#${r + 1}: V${h.idx} (dist=${h.dist.toFixed(3)})`)
        .join(", ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: topHeap.map((h, rank) => ({
        id: `v-${h.idx}`,
        value: h.idx,
        label: `Rank ${rank + 1}: V${h.idx} (dist=${h.dist.toFixed(3)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("active" as ElementState),
        pointers: rank === 0 ? ["#1 Nearest"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        topKNeighbors: topHeap.map((h) => `V${h.idx}`).join(", "),
        distances: topHeap.map((h) => h.dist.toFixed(3)).join(", "),
        status: "Completed",
      },
    },
    variables: { topIdx: topHeap[0]?.idx ?? 0, complete: true },
  });

  return steps;
};

export const linearScanKnnTopk: AlgorithmDefinition<LinearScanKnnTopkInput> = {
  id: "linear-scan-knn-topk",
  title: "Linear Scan Exact K-Nearest Neighbors (kNN Top-K)",
  topicIds: ["ml_vector_search"],
  difficulty: "Easy",
  description:
    "Executes brute-force exact K-Nearest Neighbor (kNN) search across N database vectors. Evaluates pairwise distances sequentially and uses a max-heap of capacity K to track top candidates in O(N log K) total time. Provides 100% ground-truth recall for benchmarking approximate search indexes.\n\nInput Format:\n- query: D-dimensional query embedding vector.\n- database: Array of N database embedding vectors.\n- k: Number of top nearest neighbors K to retrieve.\n\nOutput Format:\n- Returns sorted list of (distance, vectorIndex) of size K.\n\nEdge Cases & Constraints:\n- K >= N: Returns all N database vectors sorted by distance.",
  constraints: ["1 <= k <= database.length.", "All vectors must have identical dimension D."],
  examples: [
    {
      kind: "basic",
      title: "Top K = 2 Nearest Neighbor Scan",
      inputDisplay: "query = [1.0, 1.0], 5 database vectors, K = 2",
      outputDisplay: "Top 2: V1 (dist=0.141), V3 (dist=0.200)",
      input: DEFAULT_LINEAR_SCAN_KNN_INPUT,
      output: "[V1, V3]",
      explanation: "Finds the 2 closest vectors V1 and V3 using max-heap bounded by K = 2.",
    },
    {
      kind: "complex",
      title: "Exact Matching Candidate",
      inputDisplay: "query matches exact database element V3",
      outputDisplay: "V3 distance = 0.0000",
      input: {
        query: [1.0, 0.8],
        database: [
          [0.1, 0.2],
          [0.9, 1.1],
          [1.0, 0.8],
        ],
        k: 1,
      },
      output: "[V3]",
      explanation: "Finds exact match V3 at distance 0.0.",
    },
    {
      kind: "negative",
      title: "K Exceeding Database Size (K = 10, N = 2)",
      inputDisplay: "K = 10, N = 2",
      outputDisplay: "Returns all N = 2 vectors",
      input: {
        query: [0.0, 0.0],
        database: [
          [1.0, 1.0],
          [2.0, 2.0],
        ],
        k: 10,
      },
      output: "[V0, V1]",
      explanation: "Bounded by database size N = 2.",
    },
  ],
  defaultInput: DEFAULT_LINEAR_SCAN_KNN_INPUT,
  code: LINEAR_SCAN_KNN_CODE,
  timeComplexity: {
    best: "O(N * D + N log K)",
    average: "O(N * D + N log K)",
    worst: "O(N * D + N log K)",
  },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "O(N * D) for distance calculations plus O(N log K) for max-heap pushes and pops across N database vectors.",
    space: "O(K) auxiliary space to maintain top-K priority queue.",
  },
  topicGuide: {
    overview:
      "Brute-force linear scan is the exact gold standard against which all Approximate Nearest Neighbor (ANN) index algorithms (HNSW, IVF-PQ, LSH) are evaluated. When N is small (N < 10,000) or vector dimension is very low, brute-force GPU GEMM linear scan outperforms indexed graph traversals due to 100% memory bandwidth saturation and zero index overhead.",
    sections: [
      {
        heading: "Core Concept & Priority Queue Mechanics",
        body: "Maintaining a max-heap of size K stores the current K closest distances. If a new candidate has a distance smaller than the heap max root, the max root is popped and replaced in O(log K) time.",
      },
      {
        heading: "Systems & GPU Batch Acceleration",
        body: "On GPUs, brute-force kNN evaluates batch matrix multiplications Q * X^T on Tensor Cores, followed by parallel radix sort / top-K reduction kernels (CUDA CUB `BlockRadixSort`).",
      },
      {
        heading: "Recall Benchmark Ground Truth",
        body: "Evaluating ANN index quality requires calculating Recall@K = |ANN_topK intersect Exact_topK| / K. Linear scan produces the ground truth denominator.",
      },
    ],
    keyTerms: [
      {
        term: "Brute-Force Scan",
        definition:
          "Evaluating distance against every single vector in the database without indexing.",
      },
      {
        term: "Recall@K",
        definition:
          "Fraction of true exact K-nearest neighbors retrieved by an approximate search index.",
      },
      {
        term: "Max-Heap Top-K Reduction",
        definition:
          "Bounded priority queue technique maintaining the smallest K items seen so far.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Exact kNN Benchmark Ground Truth" }],
  generateSteps: generateLinearScanKnnSteps,
};
