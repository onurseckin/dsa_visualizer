import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface IvfInvertedIndexPostingListsInput {
  query: number[];
  centroids: number[][];
  postingLists: Record<number, { id: number; vector: number[] }[]>;
  nprobe: number;
}

export const DEFAULT_IVF_INVERTED_INDEX_INPUT: IvfInvertedIndexPostingListsInput = {
  query: [1.0, 1.0],
  centroids: [
    [0.0, 0.0],
    [0.9, 0.9],
    [-1.0, 1.0],
  ],
  postingLists: {
    0: [
      { id: 101, vector: [0.1, 0.2] },
      { id: 102, vector: [-0.1, 0.1] },
    ],
    1: [
      { id: 201, vector: [0.8, 0.95] },
      { id: 202, vector: [1.05, 0.85] },
      { id: 203, vector: [1.2, 1.1] },
    ],
    2: [{ id: 301, vector: [-0.9, 0.8] }],
  },
  nprobe: 2,
};

export const IVF_INVERTED_INDEX_CODE = `import math

def l2_distance(v1: list[float], v2: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

def ivf_inverted_index_search(query: list[float], centroids: list[list[float]], posting_lists: dict, nprobe: int) -> list[tuple[float, int]]:
    """
    Inverted File (IVF) vector index search.
    Finds the 'nprobe' nearest centroids to query, then scans candidate vectors in their posting lists.
    """
    # Step 1: Compute distance from query to all coarse centroids
    centroid_dists = [(l2_distance(query, c), idx) for idx, c in enumerate(centroids)]
    centroid_dists.sort(key=lambda x: x[0])

    # Select top nprobe coarse centroids
    probed_centroids = centroid_dists[:nprobe]

    # Step 2: Scan posting lists of probed centroids
    candidate_results = []
    for c_dist, c_idx in probed_centroids:
        for item in posting_lists.get(c_idx, []):
            vec_id = item["id"]
            vec_data = item["vector"]
            dist = l2_distance(query, vec_data)
            candidate_results.append((round(dist, 4), vec_id))

    candidate_results.sort(key=lambda x: x[0])
    return candidate_results`;

export const generateIvfInvertedIndexSteps = (
  input: IvfInvertedIndexPostingListsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, centroids, postingLists, nprobe } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Inverted File (IVF) Search Engine (nprobe = ${nprobe})`,
      why: `Query vector [${query.join(", ")}]. Voronoi partition space contains ${centroids.length} centroids. Probing nprobe = ${nprobe} nearest clusters.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: centroids.map((c, idx) => ({
        id: `cent-${idx}`,
        value: idx,
        label: `Centroid ${idx} [${c.join(",")}]`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        query: `[${query.join(", ")}]`,
        totalCentroids: String(centroids.length),
        nprobe: String(nprobe),
        status: "Initialized",
      },
    },
    variables: { nprobe, numCentroids: centroids.length },
  });

  // Step 1: Compute Centroid Distances
  const centroidDists = centroids
    .map((c, idx) => ({ idx, dist: l2Dist(query, c) }))
    .sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: "Calculate Coarse Centroid Distances to Query",
      why: `Closest centroids: ${centroidDists
        .map((cd) => `Centroid ${cd.idx} (dist=${cd.dist.toFixed(3)})`)
        .join(", ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: centroidDists.map((cd, rank) => ({
        id: `cent-${cd.idx}`,
        value: cd.idx,
        label: `Centroid ${cd.idx} (dist=${cd.dist.toFixed(3)})`,
        state: rank < nprobe ? ("active" as ElementState) : ("visited" as ElementState),
        pointers: rank < nprobe ? [`Probe #${rank + 1}`] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        probedCentroidIds: centroidDists
          .slice(0, nprobe)
          .map((cd) => `Centroid ${cd.idx}`)
          .join(", "),
        action: "Selected top nprobe Voronoi cells",
      },
    },
    variables: { probedCount: nprobe },
  });

  const probedCentroids = centroidDists.slice(0, nprobe);
  const candidates: { id: number; dist: number; centroidIdx: number }[] = [];

  // Step 2: Scan Posting Lists
  for (const probed of probedCentroids) {
    const cIdx = probed.idx;
    const list = postingLists[cIdx] || [];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Scan Inverted Posting List for Centroid ${cIdx} (${list.length} vectors)`,
        why: `Fetching candidate vectors belonging to Voronoi partition ${cIdx}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: list.map((item) => ({
          id: `vec-${item.id}`,
          value: item.id,
          label: `ID ${item.id} [${item.vector.join(",")}]`,
          state: "highlighted" as ElementState,
        })),
      },
      auxiliaryState: {
        customState: {
          activeCentroid: `Centroid ${cIdx}`,
          vectorsInList: String(list.length),
        },
      },
      variables: { cIdx, listSize: list.length },
    });

    for (const item of list) {
      const dist = l2Dist(query, item.vector);
      candidates.push({ id: item.id, dist, centroidIdx: cIdx });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 22,
        explanation: {
          what: `Evaluate Distance to Candidate Vector ID ${item.id}`,
          why: `Distance(query, V_${item.id}) = ${dist.toFixed(4)}. Added candidate to top-K evaluation heap.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: list.map((v) => ({
            id: `vec-${v.id}`,
            value: v.id,
            label: `ID ${v.id} (dist=${v.id === item.id ? dist.toFixed(3) : "?"})`,
            state: v.id === item.id ? ("active" as ElementState) : ("visited" as ElementState),
            pointers: v.id === item.id ? [`dist=${dist.toFixed(3)}`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            activeVector: `ID ${item.id}`,
            distance: dist.toFixed(4),
          },
        },
        variables: { vectorId: item.id, dist: Math.round(dist * 100) / 100 },
      });
    }
  }

  // Step Final: Complete
  candidates.sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: "IVF Search Complete: Sorted Candidate Nearest Neighbors",
      why: `Top match: Vector ID ${candidates[0]?.id} with distance ${candidates[0]?.dist.toFixed(
        4,
      )}. Scanned only ${candidates.length} vectors instead of full database.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: candidates.map((cand, rank) => ({
        id: `res-${cand.id}`,
        value: cand.id,
        label: `Rank ${rank + 1}: ID ${cand.id} (dist=${cand.dist.toFixed(3)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Top Match"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        topVectorId: String(candidates[0]?.id),
        topDistance: candidates[0]?.dist.toFixed(4),
        totalScannedVectors: String(candidates.length),
        status: "Completed",
      },
    },
    variables: { topId: candidates[0]?.id, scanned: candidates.length, complete: true },
  });

  return steps;
};

export const ivfInvertedIndexPostingLists: AlgorithmDefinition<IvfInvertedIndexPostingListsInput> =
  {
    id: "ivfInvertedIndexPostingLists",
    title: "Inverted File (IVF) Index & Posting Lists",
    category: "ml_vector_search",
    categories: ["ml_vector_search"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_vector_search",
    description:
      "Inverted File (IVF) indexing partitions vector database space into K Voronoi cells via K-Means clustering. During query execution, the system finds the `nprobe` nearest centroid cells to the query, scanning only the posting lists of those clusters. This reduces vector distance computations from O(N) to O(K + (nprobe / K) * N).\n\nInput Format:\n- query: D-dimensional query embedding vector.\n- centroids: K cluster center vectors.\n- postingLists: Dictionary mapping centroid index to vector items.\n- nprobe: Number of centroid Voronoi cells to inspect.\n\nOutput Format:\n- Returns sorted list of (distance, vectorId) candidates.\n\nEdge Cases & Constraints:\n- nprobe = 1: Fastest search speed, potential boundary recall loss.\n- nprobe = K: Equivalent to exact brute-force linear search.",
    constraints: [
      "1 <= nprobe <= len(centroids).",
      "centroids and query must share vector dimension D.",
    ],
    examples: [
      {
        kind: "basic",
        title: "IVF Search with nprobe = 2",
        inputDisplay: "query = [1.0, 1.0], 3 centroids, nprobe = 2",
        outputDisplay: "Scanned 4 candidate vectors. Top match ID 201 (dist 0.206)",
        input: DEFAULT_IVF_INVERTED_INDEX_INPUT,
        output: "ID 201",
        explanation: "Probes nearest centroids 1 and 0, ignoring distant centroid 2.",
      },
      {
        kind: "complex",
        title: "Single Probed Cell (nprobe = 1)",
        inputDisplay: "nprobe = 1",
        outputDisplay: "Scanned 3 candidate vectors in Centroid 1 only",
        input: {
          ...DEFAULT_IVF_INVERTED_INDEX_INPUT,
          nprobe: 1,
        },
        output: "ID 201",
        explanation: "Restricts scan strictly to the single nearest Voronoi cluster.",
      },
      {
        kind: "negative",
        title: "Empty Posting List Probe",
        inputDisplay: "Posting list for probed centroid is empty",
        outputDisplay: "Returns empty or remaining cluster candidates",
        input: {
          query: [1.0, 1.0],
          centroids: [[0.0, 0.0]],
          postingLists: { 0: [] },
          nprobe: 1,
        },
        output: "[]",
        explanation: "Handles empty posting lists gracefully.",
      },
    ],
    defaultInput: DEFAULT_IVF_INVERTED_INDEX_INPUT,
    code: IVF_INVERTED_INDEX_CODE,
    timeComplexity: {
      best: "O(K * D + (nprobe / K) * N * D)",
      average: "O(K * D + (nprobe / K) * N * D)",
      worst: "O(N * D)",
    },
    spaceComplexity: "O(N * D)",
    complexityAnalysis: {
      time: "O(K * D) to locate nprobe nearest coarse centroids, plus O((nprobe / K) * N * D) to scan inverted posting lists.",
      space: "O(N * D) to store pre-clustered inverted index posting lists.",
    },
    topicGuide: {
      overview:
        "The Inverted File (IVF) index (Sivic & Zisserman 2003, Jegou et al. 2011) is a fundamental coarse quantizer for high-dimensional ANN search engines like FAISS IVF-Flat. By converting full N-vector scans into localized posting list lookups, IVF enables billion-scale vector retrieval.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Vector space is partitioned into K Voronoi cells V_1, ..., V_K with centroids c_1, ..., c_K. A query vector q is routed to the closest nprobe centroids argmin_k ||q - c_k||_2, pruning (K - nprobe) / K fraction of search space.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "IVF posting lists are stored as contiguous memory buffers (flat array per centroid). Memory memory bandwidth usage drops dramatically because non-probed centroid buffers are never read into cache.",
        },
        {
          heading: "Implementation Nuances & Coarse Quantizer Training",
          body: "Selecting centroid count K typically follows K ~ sqrt(N) for balanced posting list sizes. If posting lists become imbalanced, residual vector quantization or re-clustering is applied.",
        },
      ],
      keyTerms: [
        {
          term: "Voronoi Cell",
          definition:
            "Region of vector space containing all points closer to a specific centroid than to any other centroid.",
        },
        {
          term: "nprobe",
          definition: "Number of nearest coarse centroid Voronoi cells inspected per query.",
        },
        {
          term: "Posting List",
          definition:
            "Contiguous array storing vector IDs and embeddings assigned to a single Voronoi cluster.",
        },
      ],
    },
    sources: [
      { type: "ml_infra", kind: "ml_infra", label: "FAISS IVF Inverted Index (Jegou et al.)" },
    ],
    generateSteps: generateIvfInvertedIndexSteps,
  };
