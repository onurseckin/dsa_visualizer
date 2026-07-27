import { CSSProperties } from "react";
import { CategoryType } from "../../types/dsa";

export const CATEGORY_LABELS: Partial<Record<CategoryType, string>> = {
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
  dp_1d: "1D Dynamic Programming",
  dp_2d: "2D Dynamic Programming",
  intervals: "Intervals",
  greedy_algorithms: "Greedy Algorithms",
  bit_manipulation: "Bit Manipulation",
  math_and_number_theory: "Math & Number Theory",
  game_theory: "Game Theory",
  advanced_range_queries: "Advanced Range Queries",
  geometry_and_sweep_line: "Geometry & Sweep Line",
  ml_tensor_algebra: "Tensor Algebra & Memory Strides",
  ml_autograd_dags: "Autograd & Computational Graphs",
  ml_precision_quantization: "Precision Math & Quantization",
  ml_vector_search: "Vector Search & Spatial Indexing",
  ml_tokenization: "Subword Tokenization & Tries",
  ml_convolutions: "Convolutional Tiling & Recurrent Gates",
  ml_attention_geometry: "Attention Geometry & KV-Cache",
  ml_graph_compilers: "Model Compression & Compilers",
  ml_distributed_systems: "Distributed ML & Interconnects",
  ml_llm_serving: "LLM Serving & Continuous Batching",
  ml_infrastructure: "ML Infrastructure",
  ml_infra: "ML Infrastructure",
};

export const PROBLEM_LIST_STORAGE_PREFIX = "dsa_visualizer_problem_list_";

export function readStoredProblemListValue<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  try {
    const raw = window.localStorage.getItem(PROBLEM_LIST_STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredProblemListValue(key: string, value: string): void {
  try {
    window.localStorage.setItem(PROBLEM_LIST_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort
  }
}

export type ProblemListDifficulty = "All" | "Easy" | "Medium" | "Hard";
export type ProblemListSource = "All" | "leetcode" | "book" | "standard" | "ml_infra";
export type ProblemListSortField = "title" | "difficulty" | "category";
export type ProblemListSortOrder = "asc" | "desc";

export const isProblemListDifficulty = (value: unknown): value is ProblemListDifficulty =>
  value === "All" || value === "Easy" || value === "Medium" || value === "Hard";

export const isProblemListSource = (value: unknown): value is ProblemListSource =>
  value === "All" || value === "leetcode" || value === "book" || value === "standard" || value === "ml_infra";

export const isProblemListSortField = (value: unknown): value is ProblemListSortField =>
  value === "title" || value === "difficulty" || value === "category";

export const isProblemListSortOrder = (value: unknown): value is ProblemListSortOrder =>
  value === "asc" || value === "desc";

export const cellPadding = "var(--space-3) var(--space-4)";
export const PANEL_BORDER: CSSProperties = { borderColor: "var(--border-default)" };
export const CATEGORY_ENTRIES = Object.entries(CATEGORY_LABELS) as [CategoryType, string][];
