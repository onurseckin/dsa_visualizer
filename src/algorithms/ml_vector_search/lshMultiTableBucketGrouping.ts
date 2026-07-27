import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

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
    """
    Multi-table Locality Sensitive Hashing (LSH) candidate bucket retrieval.
    Probes L hash tables using query hash keys, unions matching bucket candidates (OR-construction),
    and computes exact distances over deduplicated candidate set.
    """
    candidate_ids = set()

    # Step 1: Union candidates from probed buckets across L hash tables
    for table_idx, hash_key in enumerate(query_hashes):
        bucket_vectors = hash_tables[table_idx].get(hash_key, [])
        candidate_ids.update(bucket_vectors)

    # Step 2: Exact distance calculation over unioned candidate set
    results = []
    for vec_id in candidate_ids:
        vec_data = database_vectors[vec_id]
        dist = l2_distance(query, vec_data)
        results.append((round(dist, 4), vec_id))

    results.sort(key=lambda x: x[0])
    return results`;

export const generateLshMultiTableSteps = (
  input: LshMultiTableBucketGroupingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { query, hashTables, queryHashes, databaseVectors } = input;
  let stepIndex = 0;

  const l2Dist = (v1: number[], v2: number[]) =>
    Math.sqrt(v1.reduce((sum, val, idx) => sum + (val - v2[idx]) ** 2, 0));

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Multi-Table LSH Bucket Engine (L = ${hashTables.length} tables)`,
      why: `Probing L = ${hashTables.length} LSH tables using query hash keys [${queryHashes.map((h, i) => `T${i}:"${h}"`).join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: hashTables.map((_, idx) => ({
        id: `tbl-${idx}`,
        value: idx,
        label: `Table ${idx} (Key: "${queryHashes[idx]}")`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        query: `[${query.join(", ")}]`,
        queryHashes: queryHashes.join(" | "),
        numTables: String(hashTables.length),
        status: "Initialized",
      },
    },
    variables: { numTables: hashTables.length },
  });

  const candidateSet = new Set<number>();

  for (let t = 0; t < hashTables.length; t++) {
    const key = queryHashes[t];
    const bucket = hashTables[t][key] || [];

    for (const vId of bucket) {
      candidateSet.add(vId);
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Probe Hash Table T${t} with Key "${key}" -> Retrieved Bucket [${bucket.join(", ")}]`,
        why: `Unioned bucket candidates into candidate set. Accumulated set size: ${candidateSet.size} unique vectors.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: bucket.map((vId) => ({
          id: `cand-${vId}`,
          value: vId,
          label: `Vector ${vId}`,
          state: "highlighted" as ElementState,
          pointers: [`T${t} Match`],
        })),
      },
      auxiliaryState: {
        customState: {
          tableIndex: String(t),
          hashKey: key,
          bucketVectors: bucket.join(", "),
          accumulatedCandidates: Array.from(candidateSet).join(", "),
        },
      },
      variables: { table: t, bucketSize: bucket.length, setSize: candidateSet.size },
    });
  }

  // Step 2: Exact Distance Evaluation over Deduplicated Candidates
  const results: { id: number; dist: number }[] = [];
  const candArray = Array.from(candidateSet);

  for (const vId of candArray) {
    const vecData = databaseVectors[vId];
    const dist = l2Dist(query, vecData);
    results.push({ id: vId, dist });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Evaluate Distance for Candidate Vector ID ${vId} [${vecData.join(", ")}]`,
        why: `Distance(query, V_${vId}) = ${dist.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: candArray.map((idVal) => ({
          id: `vec-${idVal}`,
          value: idVal,
          label: `ID ${idVal} (dist=${idVal === vId ? dist.toFixed(3) : "?"})`,
          state: idVal === vId ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: idVal === vId ? [`dist=${dist.toFixed(3)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          vectorId: String(vId),
          distance: dist.toFixed(4),
        },
      },
      variables: { vectorId: vId, dist: Math.round(dist * 100) / 100 },
    });
  }

  // Step Final: Complete
  results.sort((a, b) => a.dist - b.dist);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: "Multi-Table LSH Retrieval Complete",
      why: `Top candidate: Vector ID ${results[0]?.id} with L2 distance ${results[0]?.dist.toFixed(
        4,
      )}. Scanned ${results.length} unioned candidates across L=${hashTables.length} tables.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: results.map((res, rank) => ({
        id: `res-${res.id}`,
        value: res.id,
        label: `Rank ${rank + 1}: ID ${res.id} (dist=${res.dist.toFixed(3)})`,
        state: rank === 0 ? ("sorted" as ElementState) : ("visited" as ElementState),
        pointers: rank === 0 ? ["Top Match"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        topVectorId: String(results[0]?.id),
        topDistance: results[0]?.dist.toFixed(4),
        unionedCandidateCount: String(results.length),
        status: "Completed",
      },
    },
    variables: { topId: results[0]?.id, totalScanned: results.length, complete: true },
  });

  return steps;
};

export const lshMultiTableBucketGrouping: AlgorithmDefinition<LshMultiTableBucketGroupingInput> = {
  id: "lshMultiTableBucketGrouping",
  title: "Multi-Table LSH Bucket Grouping & Candidate Union",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
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
