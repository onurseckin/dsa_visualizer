import type { CategoryType } from "../types/dsa";

export const CATEGORY_KEYS = {
  ARRAYS_AND_HASHING: "arrays_and_hashing",
  TWO_POINTERS: "two_pointers",
  SLIDING_WINDOW: "sliding_window",
  STACK_AND_QUEUE: "stack_and_queue",
  BINARY_SEARCH: "binary_search",
  LINKED_LIST: "linked_list",
  TREE_FUNDAMENTALS: "tree_fundamentals",
  TREE_QUERIES_AND_DIAMETER: "tree_queries_and_diameter",
  TRIES_AND_STRINGS: "tries_and_strings",
  HEAP_AND_PRIORITY_QUEUE: "heap_and_priority_queue",
  BACKTRACKING: "backtracking",
  GRAPH_TRAVERSAL: "graph_traversal",
  GRAPH_SHORTEST_PATHS: "graph_shortest_paths",
  GRAPH_SPANNING_TREES: "graph_spanning_trees",
  GRAPH_DIRECTED_AND_SCC: "graph_directed_and_scc",
  GRAPH_FLOWS_AND_CUTS: "graph_flows_and_cuts",
  DP_1D: "dp_1d",
  DP_2D: "dp_2d",
  INTERVALS: "intervals",
  GREEDY_ALGORITHMS: "greedy_algorithms",
  BIT_MANIPULATION: "bit_manipulation",
  MATH_AND_NUMBER_THEORY: "math_and_number_theory",
  GAME_THEORY: "game_theory",
  ADVANCED_RANGE_QUERIES: "advanced_range_queries",
  GEOMETRY_AND_SWEEP_LINE: "geometry_and_sweep_line",
  ML_TENSOR_ALGEBRA: "ml_tensor_algebra",
  ML_GEMM_ROOFLINE: "ml_gemm_roofline",
  ML_AUTOGRAD_DAGS: "ml_autograd_dags",
  ML_PRECISION_QUANTIZATION: "ml_precision_quantization",
  ML_VECTOR_SEARCH: "ml_vector_search",
  ML_TOKENIZATION: "ml_tokenization",
  ML_TREE_ENSEMBLES: "ml_tree_ensembles",
  ML_CONVOLUTIONS: "ml_convolutions",
  ML_RECURRENT_GATES: "ml_recurrent_gates",
  ML_ATTENTION_GEOMETRY: "ml_attention_geometry",
  ML_HARDWARE_KERNELS: "ml_hardware_kernels",
  ML_GRAPH_COMPILERS: "ml_graph_compilers",
  ML_DISTRIBUTED_SYSTEMS: "ml_distributed_systems",
  ML_LLM_SERVING: "ml_llm_serving",
} as const;

export const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: "arrays_and_hashing", label: "1. Arrays & Hashing" },
  { id: "two_pointers", label: "2. Two Pointers" },
  { id: "stack_and_queue", label: "3. Stack & Queue" },
  { id: "binary_search", label: "4. Binary Search" },
  { id: "sliding_window", label: "5. Sliding Window" },
  { id: "linked_list", label: "6. Linked List" },
  { id: "tree_fundamentals", label: "7. Tree Fundamentals" },
  { id: "tree_queries_and_diameter", label: "8. Tree Queries & Diameter" },
  { id: "tries_and_strings", label: "9. Tries & Strings" },
  { id: "heap_and_priority_queue", label: "10. Heap / Priority Queue" },
  { id: "backtracking", label: "11. Backtracking" },
  { id: "graph_traversal", label: "12. Graph Traversal" },
  { id: "graph_shortest_paths", label: "13. Graph Shortest Paths" },
  { id: "graph_spanning_trees", label: "14. Graph Spanning Trees" },
  { id: "graph_directed_and_scc", label: "15. Graph Directed & SCC" },
  { id: "graph_flows_and_cuts", label: "16. Graph Flows & Cuts" },
  { id: "dp_1d", label: "17. 1-D Dynamic Programming" },
  { id: "dp_2d", label: "18. 2-D Dynamic Programming" },
  { id: "intervals", label: "19. Intervals" },
  { id: "greedy_algorithms", label: "20. Greedy Algorithms" },
  { id: "bit_manipulation", label: "21. Bit Manipulation" },
  { id: "math_and_number_theory", label: "22. Math & Number Theory" },
  { id: "game_theory", label: "23. Game Theory" },
  { id: "advanced_range_queries", label: "24. Advanced Range Queries" },
  { id: "geometry_and_sweep_line", label: "25. Geometry & Sweep Line" },
  { id: "ml_tensor_algebra", label: "26. Tensor Memory & Strides" },
  { id: "ml_gemm_roofline", label: "27. GEMM & Roofline Model" },
  { id: "ml_autograd_dags", label: "28. Autograd & Computation Graphs" },
  { id: "ml_precision_quantization", label: "29. Precision Math & Quantization" },
  { id: "ml_vector_search", label: "30. Vector Search & Spatial Geometry" },
  { id: "ml_tokenization", label: "31. Subword Tokenization & Tries" },
  { id: "ml_tree_ensembles", label: "32. Tree Ensembles & XGBoost" },
  { id: "ml_convolutions", label: "33. Convolutional Tiling & im2col" },
  { id: "ml_recurrent_gates", label: "34. Recurrent Gates & Sequences" },
  { id: "ml_attention_geometry", label: "35. Attention Geometry & RoPE" },
  { id: "ml_hardware_kernels", label: "36. Hardware Kernels & Fusion" },
  { id: "ml_graph_compilers", label: "37. Model Compression & Compilers" },
  { id: "ml_distributed_systems", label: "38. Distributed ML & Interconnects" },
  { id: "ml_llm_serving", label: "39. LLM Serving & Continuous Batching" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  arrays_and_hashing: "Arrays & Hashing",
  two_pointers: "Two Pointers",
  sliding_window: "Sliding Window",
  stack_and_queue: "Stack & Queue",
  binary_search: "Binary Search",
  linked_list: "Linked List",
  tree_fundamentals: "Tree Fundamentals",
  tree_queries_and_diameter: "Tree Queries & Diameter",
  tries_and_strings: "Tries & Strings",
  heap_and_priority_queue: "Heap / Priority Queue",
  backtracking: "Backtracking",
  graph_traversal: "Graph Traversal",
  graph_shortest_paths: "Graph Shortest Paths",
  graph_spanning_trees: "Graph Spanning Trees",
  graph_directed_and_scc: "Graph Directed & SCC",
  graph_flows_and_cuts: "Graph Flows & Cuts",
  dp_1d: "1-D Dynamic Programming",
  dp_2d: "2-D Dynamic Programming",
  intervals: "Intervals",
  greedy_algorithms: "Greedy Algorithms",
  bit_manipulation: "Bit Manipulation",
  math_and_number_theory: "Math & Number Theory",
  game_theory: "Game Theory",
  advanced_range_queries: "Advanced Range Queries",
  geometry_and_sweep_line: "Geometry & Sweep Line",
  ml_tensor_algebra: "Tensor Algebra & Memory Strides",
  ml_gemm_roofline: "GEMM & Roofline Model",
  ml_autograd_dags: "Autograd & Computational Graphs",
  ml_precision_quantization: "Precision Math & Quantization",
  ml_vector_search: "Vector Search & Spatial Indexing",
  ml_tokenization: "Subword Tokenization & Tries",
  ml_tree_ensembles: "Tree Ensembles & XGBoost",
  ml_convolutions: "Convolutional Tiling & im2col",
  ml_recurrent_gates: "Recurrent Gates & Sequences",
  ml_attention_geometry: "Attention Geometry & KV-Cache",
  ml_hardware_kernels: "Hardware Kernels & GPU SRAM",
  ml_graph_compilers: "Model Compression & Compilers",
  ml_distributed_systems: "Distributed ML & Ring-AllReduce",
  ml_llm_serving: "LLM Serving & PagedAttention",
};

export function getAlgorithmPrimaryCategory(alg: {
  category?: CategoryType;
  categories?: CategoryType[];
}): CategoryType {
  if (alg.categories && alg.categories.length > 0) {
    return alg.categories[0];
  }
  return alg.category || "arrays_and_hashing";
}

export function getAlgorithmCategories(alg: {
  category?: CategoryType;
  categories?: CategoryType[];
}): CategoryType[] {
  if (alg.categories && alg.categories.length > 0) {
    return alg.categories;
  }
  if (alg.category) {
    return [alg.category];
  }
  return ["arrays_and_hashing"];
}

const CATEGORY_ID_SET = new Set<string>(CATEGORIES.map((category) => category.id));

/* Narrowing guard for URL search params: only the canonical category ids above
   count — the legacy CategoryType aliases are not valid routeable filters. */
export function isCategoryType(
  value: string | number | boolean | null | undefined | object,
): value is CategoryType {
  return typeof value === "string" && CATEGORY_ID_SET.has(value);
}
