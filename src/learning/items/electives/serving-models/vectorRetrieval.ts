import {
  arraySteps,
  defineCalculatorItem,
  defineDebuggingItem,
  defineTraceItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../../authoring";

const searchCode = `def compare_exact_and_graph_search(record):
    points = {point["id"]: point["value"] for point in record["points"]}
    query = record["query"]
    exact = [key for key, _ in sorted(points.items(), key=lambda pair: (abs(pair[1] - query), pair[0]))[:record["k"]]]
    current = record["start"]
    visited = []
    while current not in visited:
        visited.append(current)
        better = [node for node in record["graph"].get(current, []) if abs(points[node] - query) < abs(points[current] - query)]
        if not better: break
        current = min(better, key=lambda node: (abs(points[node] - query), node))
    approximate = sorted(visited, key=lambda node: (abs(points[node] - query), node))[:record["k"]]
    return {"exact": exact, "simulated_graph": approximate, "visited": visited, "recall_at_k": round(len(set(exact) & set(approximate)) / record["k"], 6)}`;

const searchExecution = functionExecution({
  entrypoint: "compare_exact_and_graph_search",
  outputContract:
    "Return exact one-dimensional nearest IDs and a deterministic greedy graph-search simulation, visited nodes, and recall@k. This is an algorithmic simulation, not hnswlib, Faiss, GPU, or production index execution.",
  cases: [
    {
      id: "greedy-finds-nearest",
      label: "Greedy graph reaches nearest point",
      input: {
        points: [
          { id: "a", value: 0 },
          { id: "b", value: 3 },
          { id: "c", value: 5 },
        ],
        graph: { a: ["b"], b: ["a", "c"], c: ["b"] },
        start: "a",
        query: 4,
        k: 1,
      },
      expected: { exact: ["b"], simulated_graph: ["b"], visited: ["a", "b"], recall_at_k: 1 },
      comparison: "deep-equal",
    },
    {
      id: "local-minimum",
      label: "Graph can miss exact neighbor",
      input: {
        points: [
          { id: "a", value: 0 },
          { id: "b", value: 4 },
          { id: "c", value: 5 },
        ],
        graph: { a: [], b: ["c"], c: ["b"] },
        start: "a",
        query: 5,
        k: 1,
      },
      expected: { exact: ["c"], simulated_graph: ["a"], visited: ["a"], recall_at_k: 0 },
      comparison: "deep-equal",
    },
    {
      id: "two-neighbors",
      label: "Recall is computed for k two",
      input: {
        points: [
          { id: "a", value: 0 },
          { id: "b", value: 2 },
          { id: "c", value: 4 },
        ],
        graph: { a: ["b"], b: ["a", "c"], c: ["b"] },
        start: "a",
        query: 3,
        k: 2,
      },
      expected: {
        exact: ["b", "c"],
        simulated_graph: ["b", "a"],
        visited: ["a", "b"],
        recall_at_k: 0.5,
      },
      comparison: "deep-equal",
    },
  ],
});

export const exactVsHnswSearch = defineTraceItem({
  id: "exact-vs-hnsw-search",
  title: "Exact versus HNSW search",
  topicIds: ["ml_vector_retrieval"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Compare exhaustive nearest-neighbor ranking with a tiny deterministic greedy graph-search simulation that makes approximation failure visible.",
  objective:
    "Explain recall loss from search-path coverage without representing this standard-library trace as a real HNSW library benchmark or index implementation.",
  completionEvidence:
    "The learner identifies the exact nearest set, the simulated visited path, and why a local graph path can lower recall@k.",
  sources: [
    verifiedSource({ label: "HNSW original paper", url: "https://arxiv.org/abs/1603.09320" }),
    verifiedSource({
      label: "Faiss IndexHNSW API",
      url: "https://faiss.ai/cpp_api/struct/structfaiss_1_1IndexHNSW.html",
    }),
  ],
  code: searchCode,
  starterCode: semanticStarter({
    entrypoint: "compare_exact_and_graph_search",
    parameters: ["record"],
    contract:
      "Compare exhaustive ranking with a deterministic greedy graph-search simulation; do not import an ANN library.",
  }),
  execution: searchExecution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 4,
        what: "Rank every point by exact distance to the query.",
        why: "Exhaustive ranking is the reference set used to measure approximation recall.",
        values: ["all points", "distance", "exact top-k"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 7,
        what: "Start from one graph entry point and record visits.",
        why: "Approximate graph search sees only the path it explores, not the entire collection.",
        values: ["entry", "visited", "neighbors"],
        activeIndices: [1],
        completedIndices: [0],
      },
      {
        codeLine: 9,
        what: "Move only to a strictly closer neighbor in this simulation.",
        why: "A local optimum illustrates the search-quality tradeoff without reproducing HNSW internals.",
        values: ["current", "closer neighbor", "local minimum"],
        activeIndices: [1],
        completedIndices: [0, 2],
      },
      {
        codeLine: 13,
        what: "Measure overlap with exact top-k as recall@k.",
        why: "Recall exposes quality loss independently from unmeasured latency claims.",
        values: ["exact", "simulated", "recall@k"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
    ]),
  assessmentPayload: {
    variant: "changed-entry-and-graph-edges",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Trace exact and simulated graph search after changing the entry point and edges.",
    currentState: "small one-dimensional collection and graph",
    referenceNextState: "visited coverage determines simulated recall",
  },
});

const indexCode = `def choose_vector_index(record):
    eligible = [option for option in record["options"] if option["recall"] >= record["min_recall"] and option["latency_ms"] <= record["max_latency_ms"] and option["memory_mb"] <= record["max_memory_mb"] and option["freshness_s"] <= record["max_freshness_s"]]
    eligible.sort(key=lambda option: (option["latency_ms"], option["memory_mb"], option["name"]))
    return {"eligible": [option["name"] for option in eligible], "selected": eligible[0]["name"] if eligible else None, "constraints_met": bool(eligible)}`;
const indexExecution = functionExecution({
  entrypoint: "choose_vector_index",
  outputContract:
    "Return the eligible named index options and a deterministic lowest-latency selection under authored recall, latency, memory, and freshness constraints. It compares supplied measurements; it does not build an index.",
  cases: [
    {
      id: "hnsw-selected",
      label: "Lowest-latency eligible option",
      input: {
        min_recall: 0.9,
        max_latency_ms: 20,
        max_memory_mb: 1000,
        max_freshness_s: 60,
        options: [
          { name: "flat", recall: 1, latency_ms: 30, memory_mb: 800, freshness_s: 5 },
          { name: "hnsw", recall: 0.94, latency_ms: 10, memory_mb: 900, freshness_s: 30 },
        ],
      },
      expected: { eligible: ["hnsw"], selected: "hnsw", constraints_met: true },
      comparison: "deep-equal",
    },
    {
      id: "freshness-excludes",
      label: "Stale index is not eligible",
      input: {
        min_recall: 0.8,
        max_latency_ms: 30,
        max_memory_mb: 500,
        max_freshness_s: 10,
        options: [
          { name: "ivf", recall: 0.9, latency_ms: 12, memory_mb: 300, freshness_s: 20 },
          { name: "pq", recall: 0.82, latency_ms: 15, memory_mb: 100, freshness_s: 5 },
        ],
      },
      expected: { eligible: ["pq"], selected: "pq", constraints_met: true },
      comparison: "deep-equal",
    },
    {
      id: "none-fit",
      label: "No index meets the contract",
      input: {
        min_recall: 0.99,
        max_latency_ms: 5,
        max_memory_mb: 10,
        max_freshness_s: 1,
        options: [{ name: "flat", recall: 1, latency_ms: 50, memory_mb: 100, freshness_s: 2 }],
      },
      expected: { eligible: [], selected: null, constraints_met: false },
      comparison: "deep-equal",
    },
  ],
});
export const vectorIndexTradeoffs = defineCalculatorItem({
  id: "vector-index-tradeoffs",
  title: "Vector-index tradeoffs",
  topicIds: ["ml_vector_retrieval"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Use supplied recall, latency, memory, and freshness measurements to eliminate infeasible retrieval-index options.",
  objective:
    "Select from measured options under explicit constraints while recognizing that filtering, reranking, and update behavior can change the feasible set.",
  completionEvidence:
    "A passing result preserves all eligibility constraints, reports no selection when none fit, and explains which measurements must be refreshed.",
  sources: [
    verifiedSource({
      label: "Faiss index selection guidance",
      url: "https://github.com/facebookresearch/faiss/wiki/Faiss-indexes",
    }),
  ],
  code: indexCode,
  starterCode: semanticStarter({
    entrypoint: "choose_vector_index",
    parameters: ["record"],
    contract:
      "Filter supplied index measurements by recall, latency, memory, and freshness then select a deterministic eligible candidate.",
  }),
  execution: indexExecution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 2,
        what: "Read the minimum quality and operational constraints.",
        why: "Index names are not decisions until their measured limits are compared with the workload contract.",
        values: ["recall", "latency", "memory", "freshness"],
        activeIndices: [0, 1, 2, 3],
      },
      {
        codeLine: 2,
        what: "Filter every supplied option against every hard constraint.",
        why: "A low latency number cannot compensate for a recall, memory, or staleness violation.",
        values: ["flat", "graph", "partitioned", "eligible"],
        activeIndices: [3],
        completedIndices: [0, 1, 2],
      },
      {
        codeLine: 3,
        what: "Sort eligible candidates by the authored tie-breaking policy.",
        why: "Deterministic selection makes the calculator auditable without claiming the policy is universal.",
        values: ["latency", "memory", "name"],
        activeIndices: [0],
        completedIndices: [1, 2],
      },
      {
        codeLine: 4,
        what: "Return no selection when the evidence does not satisfy the constraints.",
        why: "Forcing an index choice hides an infeasible production requirement.",
        values: ["eligible", "selected", "constraints met"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
    ]),
  assessmentPayload: {
    variant: "changed-recall-and-freshness-budget",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Choose from changed measured index options.",
    inputs: [
      { id: "min_recall", label: "Minimum recall", defaultValue: "0.9" },
      { id: "max_latency_ms", label: "Latency budget", unit: "ms", defaultValue: "20" },
    ],
    result: { value: 1, unit: "eligible options", tolerance: 0 },
  },
});

const retrievalCode = `def diagnose_retrieval_regression(record):
    failures = []
    if record.get("query_embedding_version") != record.get("index_embedding_version"): failures.append("embedding_version")
    if record.get("index_age_s", 0) > record.get("freshness_slo_s", 0): failures.append("index_staleness")
    if record.get("distance") not in ("cosine", "dot", "l2"): failures.append("distance")
    if not record.get("chunking_version"): failures.append("chunking")
    if record.get("filter_applied") and not record.get("filter_field_version"): failures.append("filter_metadata")
    failures.sort()
    return {"healthy": not failures, "failures": failures}`;
const retrievalExecution = functionExecution({
  entrypoint: "diagnose_retrieval_regression",
  outputContract:
    "Return a health flag and sorted retrieval-regression causes from embedding version, index freshness, distance, chunking, and metadata-filter evidence.",
  cases: [
    {
      id: "healthy",
      label: "Aligned retrieval artifact",
      input: {
        query_embedding_version: "e2",
        index_embedding_version: "e2",
        index_age_s: 20,
        freshness_slo_s: 60,
        distance: "cosine",
        chunking_version: "c4",
        filter_applied: true,
        filter_field_version: "m1",
      },
      expected: { healthy: true, failures: [] },
      comparison: "deep-equal",
    },
    {
      id: "version-and-stale",
      label: "Embedding and freshness regress",
      input: {
        query_embedding_version: "e3",
        index_embedding_version: "e2",
        index_age_s: 90,
        freshness_slo_s: 60,
        distance: "cosine",
        chunking_version: "c4",
        filter_applied: false,
      },
      expected: { healthy: false, failures: ["embedding_version", "index_staleness"] },
      comparison: "deep-equal",
    },
    {
      id: "semantic-metadata",
      label: "Missing chunk and filter evidence",
      input: {
        query_embedding_version: "e2",
        index_embedding_version: "e2",
        index_age_s: 5,
        freshness_slo_s: 60,
        distance: "manhattan",
        chunking_version: "",
        filter_applied: true,
      },
      expected: { healthy: false, failures: ["chunking", "distance", "filter_metadata"] },
      comparison: "deep-equal",
    },
  ],
});
export const retrievalRegressionDebugging = defineDebuggingItem({
  id: "retrieval-regression-debugging",
  title: "Retrieval regression debugging",
  topicIds: ["ml_vector_retrieval"],
  difficultyProfile: profile(3, 3, 3, 3),
  description:
    "Diagnose quality loss from version, staleness, chunking, distance, and metadata-filter evidence rather than an opaque recall drop.",
  objective:
    "Classify retrieval failures from the artifact boundary where query, index, chunking, and filtering semantics must agree.",
  completionEvidence:
    "The learner returns the precise evidence failures and proposes a repair that preserves versioned offline evaluation before serving rollout.",
  sources: [
    verifiedSource({
      label: "Faiss metric types",
      url: "https://github.com/facebookresearch/faiss/wiki/MetricType-and-distances",
    }),
  ],
  code: retrievalCode,
  starterCode: semanticStarter({
    entrypoint: "diagnose_retrieval_regression",
    parameters: ["record"],
    contract: "Return sorted retrieval-contract failures from the supplied artifact evidence.",
  }),
  execution: retrievalExecution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 3,
        what: "Compare query and index embedding versions.",
        why: "A shared vector space is a contract, not an implicit property of embedding APIs.",
        values: ["query version", "index version", "compatible"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 4,
        what: "Check index age against its freshness SLO.",
        why: "An otherwise valid index can return obsolete corpus evidence.",
        values: ["index age", "freshness SLO", "stale"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 6,
        what: "Require an explicit chunking version.",
        why: "Chunk boundaries change retrieval semantics and must be auditable during a regression.",
        values: ["documents", "chunking version", "retrieval units"],
        activeIndices: [1],
        completedIndices: [0, 2],
      },
      {
        codeLine: 9,
        what: "Return sorted evidence failures for repair planning.",
        why: "A diagnosis distinguishes multiple contract breaks instead of pretending one cause explains every quality loss.",
        values: ["healthy", "failures", "repair"],
        activeIndices: [1],
        completedIndices: [0, 2],
      },
    ]),
  assessmentPayload: {
    variant: "changed-index-and-filter-evidence",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: 'return {"healthy": True, "failures": []}',
    evidence: [
      {
        label: "Offline regression",
        content: "Recall fell after an embedding and metadata rollout.",
      },
    ],
    failingTests: ["embedding version mismatch must be reported", "stale index must be reported"],
    hints: ["Compare representations before changing approximate-search knobs."],
  },
});
