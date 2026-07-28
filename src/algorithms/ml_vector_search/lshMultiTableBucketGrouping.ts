import {
  AlgorithmDefinition,
  AlgorithmStep,
  VectorVisualSnapshot,
  VectorItem,
} from "../../types/dsa";

export interface LshMultiTableBucketGroupingInput {
  query: number[];
  hashTables: Record<string, number[]>[]; // L tables, each mapping compositeKey -> [vectorIds]
  queryHashes: string[]; // L composite hash strings for query
  databaseVectors: Record<number, number[]>;
}

export const DEFAULT_LSH_MULTI_TABLE_INPUT: LshMultiTableBucketGroupingInput = {
  query: [1.0, 1.0],
  queryHashes: ["1-0", "0-1"],
  hashTables: [
    {
      "1-0": [101, 102],
      "0-0": [103],
    },
    {
      "0-1": [102, 104],
      "1-1": [105],
    },
  ],
  databaseVectors: {
    101: [0.9, 0.8],
    102: [1.05, 0.95],
    103: [-1.0, -1.0],
    104: [1.2, 1.3],
    105: [5.0, 5.0],
  },
};

export const LSH_MULTI_TABLE_CODE = `import math

def l2_distance(v1: list[float], v2: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

def lsh_multi_table_search(query: list[float], query_hashes: list[str], hash_tables: list[dict], database_vectors: dict) -> list[tuple[float, int]]:
    candidate_ids = set()

    for table_idx, hash_key in enumerate(query_hashes):
        bucket_vectors = hash_tables[table_idx].get(hash_key, [])
        candidate_ids.update(bucket_vectors)

    results = []
    for vec_id in candidate_ids:
        vec_data = database_vectors[vec_id]
        dist = l2_distance(query, vec_data)
        results.append((round(dist, 4), vec_id))

    results.sort(key=lambda x: x[0])
    return results`;

const buildVectorSnapshot = (
  query: number[],
  databaseVectors: Record<number, number[]>,
  activeVecId?: number,
  bucketVecIds?: Set<number>,
  candidateSet?: Set<number>,
  topVecId?: number,
): VectorVisualSnapshot => {
  const is3D = query.length >= 3;
  const vectors: VectorItem[] = [];

  // Query vector
  vectors.push({
    id: "query",
    label: `Query [${query.map((n) => n.toFixed(2)).join(", ")}]`,
    x: query[0] ?? 0,
    y: query[1] ?? 0,
    z: is3D ? query[2] : undefined,
    color: "#ef4444",
    state: "active",
    subText: "Query Target",
  });

  // Database vectors
  for (const [idStr, vec] of Object.entries(databaseVectors)) {
    const vId = Number(idStr);
    let state: VectorItem["state"] = "default";
    let color: string | undefined = undefined;
    let subText = `V_${vId} [${vec.map((n) => n.toFixed(2)).join(", ")}]`;

    if (topVecId !== undefined && vId === topVecId) {
      state = "result";
      color = "#22c55e";
      subText += " (Top Match)";
    } else if (vId === activeVecId) {
      state = "active";
      color = "#f59e0b";
      subText += " (Evaluating Dist)";
    } else if (bucketVecIds?.has(vId)) {
      state = "compared";
      color = "#3b82f6";
      subText += " (Bucket Match)";
    } else if (candidateSet?.has(vId)) {
      state = "compared";
      color = "#8b5cf6";
      subText += " (Candidate Union)";
    } else {
      state = "inactive";
      color = "#94a3b8";
    }

    vectors.push({
      id: `vec-${vId}`,
      label: `V_${vId}`,
      x: vec[0] ?? 0,
      y: vec[1] ?? 0,
      z: is3D ? vec[2] : undefined,
      color,
      state,
      subText,
    });
  }

  return {
    kind: "vector",
    vectors,
    planeTitle: "2D Vector Space - Multi-Table LSH Bucket Grouping",
    dimensions: is3D ? "3d" : "2d",
  };
};

export const generateLshMultiTableSteps = (
  input: LshMultiTableBucketGroupingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, hashTables, queryHashes, databaseVectors } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));

  // Line 7: candidate_ids = set()
  const candidateSet = new Set<number>();
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Initialize candidate set candidate_ids = set()`,
      why: `Preparing to union candidate vector IDs retrieved from L = ${hashTables.length} independent LSH tables.`,
    },
    primarySnapshot: buildVectorSnapshot(
      query,
      databaseVectors,
      undefined,
      undefined,
      candidateSet,
    ),
    auxiliaryState: {
      customState: {
        query: `[${query.join(", ")}]`,
        queryHashes: queryHashes.join(" | "),
        numTables: String(hashTables.length),
        candidateSet: "{ }",
      },
      visited: [],
    },
    variables: { numTables: hashTables.length, candidateCount: 0 },
  });

  // Line 9: for table_idx, hash_key in enumerate(query_hashes):
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Looping through L = ${hashTables.length} hash tables with query hash keys`,
      why: `Iterating over each table to retrieve candidate vectors falling into matching hash buckets.`,
    },
    primarySnapshot: buildVectorSnapshot(
      query,
      databaseVectors,
      undefined,
      undefined,
      candidateSet,
    ),
    auxiliaryState: {
      customState: {
        tableCount: String(hashTables.length),
        queryHashes: queryHashes.join(" | "),
        candidateSet: `{${Array.from(candidateSet).join(", ")}}`,
      },
      visited: [],
    },
    variables: { tableCount: hashTables.length },
  });

  for (let t = 0; t < hashTables.length; t++) {
    const key = queryHashes[t];
    const bucket = hashTables[t][key] || [];
    const bucketSet = new Set(bucket);

    // Line 10: bucket_vectors = hash_tables[table_idx].get(hash_key, [])
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Probe Hash Table T${t} with Key "${key}" -> Bucket vectors: [${bucket.join(", ")}]`,
        why: `Query hash key "${key}" matches bucket [${bucket.length ? bucket.join(", ") : "empty"}] in Table T${t}.`,
      },
      primarySnapshot: buildVectorSnapshot(
        query,
        databaseVectors,
        undefined,
        bucketSet,
        candidateSet,
      ),
      auxiliaryState: {
        customState: {
          tableIndex: String(t),
          hashKey: key,
          bucketVectors: bucket.length ? bucket.join(", ") : "None",
          candidateSet: `{${Array.from(candidateSet).join(", ")}}`,
        },
        hashMap: {
          [`Table T${t} Key "${key}"`]: bucket.join(", ") || "empty",
        },
        visited: Array.from(candidateSet),
      },
      variables: { table_idx: t, hash_key: key, bucket_count: bucket.length },
    });

    // Line 11: candidate_ids.update(bucket_vectors)
    for (const vId of bucket) {
      candidateSet.add(vId);
    }
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Union bucket vectors into candidate_ids set: {${Array.from(candidateSet).join(", ")}}`,
        why: `OR-construction adds ${bucket.length} candidate(s) from Table T${t} to candidate set (deduplicated total: ${candidateSet.size}).`,
      },
      primarySnapshot: buildVectorSnapshot(
        query,
        databaseVectors,
        undefined,
        undefined,
        candidateSet,
      ),
      auxiliaryState: {
        customState: {
          tableIndex: String(t),
          addedVectors: bucket.join(", "),
          candidateSet: `{${Array.from(candidateSet).join(", ")}}`,
          totalCandidates: String(candidateSet.size),
        },
        visited: Array.from(candidateSet),
      },
      variables: { candidate_count: candidateSet.size },
    });
  }

  // Line 13: results = []
  const results: { id: number; dist: number }[] = [];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Initialize results list results = []`,
      why: `Preparing to calculate exact L2 distance for each of the ${candidateSet.size} deduplicated candidates in candidate_ids.`,
    },
    primarySnapshot: buildVectorSnapshot(
      query,
      databaseVectors,
      undefined,
      undefined,
      candidateSet,
    ),
    auxiliaryState: {
      customState: {
        candidateSet: `{${Array.from(candidateSet).join(", ")}}`,
        results: "[]",
      },
      visited: Array.from(candidateSet),
    },
    variables: { candidateCount: candidateSet.size, resultsCount: 0 },
  });

  // Line 14: for vec_id in candidate_ids:
  const candArray = Array.from(candidateSet);
  const distanceTable: Record<string, number> = {};

  for (const vId of candArray) {
    const vecData = databaseVectors[vId];

    // Line 15: vec_data = database_vectors[vec_id]
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Fetch vector data for Vector ID ${vId}: [${vecData.join(", ")}]`,
        why: `Retrieving D-dimensional coordinates for Vector V_${vId} from database.`,
      },
      primarySnapshot: buildVectorSnapshot(query, databaseVectors, vId, undefined, candidateSet),
      auxiliaryState: {
        customState: {
          vec_id: String(vId),
          vec_data: `[${vecData.join(", ")}]`,
        },
        distanceTable: { ...distanceTable },
        visited: Array.from(candidateSet),
      },
      variables: { vec_id: vId },
    });

    // Line 16: dist = l2_distance(query, vec_data)
    const dist = l2Dist(query, vecData);
    distanceTable[`Vector V_${vId}`] = Math.round(dist * 10000) / 10000;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Compute L2 distance between Query [${query.join(", ")}] and Vector V_${vId}: ${dist.toFixed(4)}`,
        why: `L2 distance = sqrt(sum((q_i - v_i)^2)) = ${dist.toFixed(4)}.`,
      },
      primarySnapshot: buildVectorSnapshot(query, databaseVectors, vId, undefined, candidateSet),
      auxiliaryState: {
        customState: {
          vec_id: String(vId),
          dist: dist.toFixed(4),
        },
        distanceTable: { ...distanceTable },
        visited: Array.from(candidateSet),
      },
      variables: { vec_id: vId, dist: Math.round(dist * 10000) / 10000 },
    });

    // Line 17: results.append((round(dist, 4), vec_id))
    results.push({ id: vId, dist });
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 17,
      explanation: {
        what: `Append tuple (${dist.toFixed(4)}, Vector ID ${vId}) to results`,
        why: `Added candidate Vector V_${vId} with distance ${dist.toFixed(4)} to results list.`,
      },
      primarySnapshot: buildVectorSnapshot(query, databaseVectors, vId, undefined, candidateSet),
      auxiliaryState: {
        customState: {
          resultsCount: String(results.length),
          lastAppended: `(${dist.toFixed(4)}, ID ${vId})`,
        },
        distanceTable: { ...distanceTable },
        visited: Array.from(candidateSet),
      },
      variables: { resultsCount: results.length },
    });
  }

  // Line 19: results.sort(key=lambda x: x[0])
  results.sort((a, b) => a.dist - b.dist);
  const topMatch = results[0];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Sort candidate results by Euclidean distance ascending`,
      why: `Ordering candidates so nearest neighbor appears first. Top candidate: ${topMatch ? `Vector V_${topMatch.id} (dist: ${topMatch.dist.toFixed(4)})` : "None"}.`,
    },
    primarySnapshot: buildVectorSnapshot(
      query,
      databaseVectors,
      undefined,
      undefined,
      candidateSet,
      topMatch?.id,
    ),
    auxiliaryState: {
      customState: {
        sortedResults:
          results.map((r) => `(ID ${r.id}, d=${r.dist.toFixed(4)})`).join(", ") || "[]",
        topId: topMatch ? String(topMatch.id) : "None",
      },
      distanceTable: { ...distanceTable },
      visited: Array.from(candidateSet),
    },
    variables: {
      topMatchId: topMatch?.id,
      minDistance: topMatch ? Math.round(topMatch.dist * 10000) / 10000 : undefined,
    },
  });

  // Line 20: return results
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Return sorted LSH candidate search results`,
      why: `Multi-table LSH search complete. ${topMatch ? `Top candidate: Vector V_${topMatch.id} with distance ${topMatch.dist.toFixed(4)}.` : "No candidates found."} Scanned ${results.length} unioned candidates across L = ${hashTables.length} tables.`,
    },
    primarySnapshot: buildVectorSnapshot(
      query,
      databaseVectors,
      undefined,
      undefined,
      candidateSet,
      topMatch?.id,
    ),
    auxiliaryState: {
      customState: {
        topVectorId: topMatch ? String(topMatch.id) : "None",
        topDistance: topMatch ? topMatch.dist.toFixed(4) : "N/A",
        unionedCandidateCount: String(results.length),
        status: "Completed",
      },
      distanceTable: { ...distanceTable },
      visited: Array.from(candidateSet),
    },
    variables: { topId: topMatch?.id, totalCandidates: results.length, complete: true },
  });

  return steps;
};

export const lshMultiTableBucketGrouping: AlgorithmDefinition<LshMultiTableBucketGroupingInput> = {
  id: "lsh-multi-table-bucket-grouping",
  title: "Multi-Table LSH Bucket Grouping & Candidate Union",
  topicIds: ["ml_vector_search"],
  difficulty: "Medium",
  description:
    "Executes multi-table Locality Sensitive Hashing (LSH) candidate retrieval. Probes L independent hash tables constructed with distinct random projection families. Unions candidate vectors that collide in at least one hash table (OR-amplification), and evaluates exact Euclidean distances over the deduplicated candidate set.\n\nInput Format:\n- query: D-dimensional query embedding vector.\n- queryHashes: L hash key strings computed for query across L hash tables.\n- hashTables: L dictionaries mapping composite hash key -> vector ID list.\n- databaseVectors: Dictionary mapping vector ID to vector data.\n\nOutput Format:\n- Returns sorted list of (distance, vectorId) candidates.\n\nEdge Cases & Constraints:\n- Empty bucket match: Gracefully falls through to remaining tables.",
  constraints: ["queryHashes.length == hashTables.length."],
  examples: [
    {
      kind: "basic",
      title: "2-Table LSH Retrieval & Union",
      inputDisplay: "L = 2 tables, queryHashes = ['1-0', '0-1']",
      outputDisplay: "Unioned Candidates: [101, 102, 104]. Top Match ID 102 (dist 0.071)",
      input: DEFAULT_LSH_MULTI_TABLE_INPUT,
      output: "ID 102",
      explanation:
        "Table 0 yields [101, 102], Table 1 yields [102, 104]. Union yields [101, 102, 104].",
    },
    {
      kind: "complex",
      title: "No Candidate Collision",
      inputDisplay: "Query hash keys match no existing hash table buckets",
      outputDisplay: "Returns empty candidate list []",
      input: {
        ...DEFAULT_LSH_MULTI_TABLE_INPUT,
        queryHashes: ["9-9", "9-9"],
      },
      output: "[]",
      explanation: "No bucket matches found across any table.",
    },
    {
      kind: "negative",
      title: "Duplicate Candidate Deduplication",
      inputDisplay: "Vector ID 102 present in both hash tables",
      outputDisplay: "Evaluated only once",
      input: DEFAULT_LSH_MULTI_TABLE_INPUT,
      output: "ID 102 evaluated once",
      explanation: "Set union deduplicates ID 102, preventing redundant distance calculation.",
    },
  ],
  defaultInput: DEFAULT_LSH_MULTI_TABLE_INPUT,
  code: LSH_MULTI_TABLE_CODE,
  timeComplexity: {
    best: "O(L + |Candidates| * D)",
    average: "O(L + |Candidates| * D)",
    worst: "O(L + N * D)",
  },
  spaceComplexity: "O(|Candidates|)",
  complexityAnalysis: {
    time: "O(L) hash table probes plus O(|Candidates| * D) exact distance calculations over deduplicated unioned set.",
    space: "O(|Candidates|) auxiliary set memory for candidate deduplication.",
  },
  topicGuide: {
    overview:
      "A single LSH table with K hash functions (AND-construction) has high precision but low recall because missing a single hash key bit prevents bucket collision. To fix this, multi-table LSH constructs L independent hash tables and unions candidates (OR-construction), boosting recall to near 100%.",
    sections: [
      {
        heading: "Core Concept & Probability Amplification",
        body: "If a single LSH function has collision probability p(d) for vectors at distance d, an AND-K / OR-L multi-table setup yields total retrieval probability P(d) = 1 - (1 - p(d)^K)^L.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "Multi-table LSH converts unstructured spatial searches into flat hash map lookups. Index memory scales linearly with O(L * N).",
      },
      {
        heading: "Implementation Nuances & Bit Packing",
        body: "Composite hash keys are packed into 64-bit unsigned integers (`uint64_t`) to enable lock-free std::unordered_map lookups without string allocations.",
      },
    ],
    keyTerms: [
      {
        term: "OR-Amplification",
        definition:
          "Combining L independent hash tables to boost recall by accepting matches in any table.",
      },
      {
        term: "Candidate Deduplication",
        definition:
          "Using a hash set to ensure vectors matching in multiple tables are evaluated only once.",
      },
      {
        term: "Hash Table Capacity (L)",
        definition: "Number of independent hash index tables maintained in memory.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "Multi-Table LSH Theory (Indyk & Motwani)" },
  ],
  generateSteps: generateLshMultiTableSteps,
};
