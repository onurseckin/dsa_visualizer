import { getCourseJourney } from "./index";

/**
 * Career track specialization objectives for targeted learning paths.
 */
export type CareerGoal =
  | "LLM_SYSTEMS_ENGINEER"
  | "DISTRIBUTED_ML_ARCHITECT"
  | "COMPETITIVE_PROGRAMMING_GRANDMASTER"
  | "MATHEMATICAL_OPTIMIZATION_SPECIALIST";

/**
 * Milestone waypoint along a personalized curriculum path.
 */
export interface PathMilestone {
  readonly step: number;
  readonly topicId: string;
  readonly title: string;
  readonly unlocks: readonly string[];
}

/**
 * Synthesized topological learning path result.
 */
export interface LearningPathResult {
  readonly goal: string;
  readonly orderedTopicIds: readonly string[];
  readonly totalCourses: number;
  readonly estimatedHours: number;
  readonly milestones: readonly PathMilestone[];
}

/**
 * Explicit Prerequisite Dependency Directed Acyclic Graph across all 64 courses.
 * Map: Course ID -> List of Direct Prerequisite Course IDs.
 */
export const CURRICULUM_PREREQUISITES: Record<string, readonly string[]> = Object.freeze({
  // =========================================================================
  // Track 1: Data Structures & Advanced Algorithms (23 Courses)
  // =========================================================================
  dsa_arrays_and_hashing: [],
  dsa_two_pointers: ["dsa_arrays_and_hashing"],
  dsa_sliding_window: ["dsa_arrays_and_hashing", "dsa_two_pointers"],
  dsa_stack_and_queue: ["dsa_arrays_and_hashing"],
  dsa_binary_search: ["dsa_arrays_and_hashing"],
  dsa_linked_list: [],
  dsa_intervals: ["dsa_arrays_and_hashing", "dsa_two_pointers"],

  dsa_tree_fundamentals: ["dsa_stack_and_queue", "dsa_linked_list"],
  dsa_tree_queries_and_diameter: ["dsa_tree_fundamentals"],
  dsa_heap_and_priority_queue: ["dsa_arrays_and_hashing", "dsa_tree_fundamentals"],
  dsa_tries_and_strings: ["dsa_arrays_and_hashing", "dsa_tree_fundamentals"],

  dsa_graph_traversal: ["dsa_stack_and_queue", "dsa_tree_fundamentals"],
  dsa_graph_shortest_paths: ["dsa_graph_traversal", "dsa_heap_and_priority_queue"],
  dsa_graph_spanning_trees: ["dsa_graph_traversal", "dsa_heap_and_priority_queue"],
  dsa_graph_flows_and_cuts: ["dsa_graph_traversal", "dsa_graph_shortest_paths"],

  dsa_dp_1d: ["dsa_arrays_and_hashing"],
  dsa_dp_2d: ["dsa_dp_1d"],
  dsa_advanced_range_queries: [
    "dsa_tree_fundamentals",
    "dsa_bit_manipulation",
    "dsa_binary_search",
  ],
  dsa_bit_manipulation: ["dsa_arrays_and_hashing"],
  dsa_math_and_number_theory: ["dsa_bit_manipulation"],
  dsa_geometry_and_sweep_line: ["dsa_arrays_and_hashing", "dsa_intervals"],
  dsa_backtracking: ["dsa_stack_and_queue", "dsa_tree_fundamentals"],
  dsa_game_theory: ["dsa_dp_1d", "dsa_backtracking", "dsa_bit_manipulation"],

  // =========================================================================
  // Track 2: Machine Learning Systems & Foundations (41 Courses)
  // =========================================================================
  // Part A: Foundational Linear Algebra & Autodiff
  ml_matrix_memory_layout: [],
  ml_tensor_strides_views: ["ml_matrix_memory_layout"],
  ml_vector_spaces_gram_schmidt: ["ml_matrix_memory_layout"],
  ml_matrix_svd_pca: ["ml_matrix_memory_layout", "ml_vector_spaces_gram_schmidt"],
  ml_gradients_jacobians_hessians: ["ml_matrix_memory_layout", "ml_vector_spaces_gram_schmidt"],
  ml_autodiff_engines: ["ml_gradients_jacobians_hessians", "dsa_graph_traversal"],

  // Part B: Optimization & Statistical Foundations
  ml_gradient_descent_adamw: ["ml_gradients_jacobians_hessians"],
  ml_loss_functions_info_theory: ["ml_gradients_jacobians_hessians"],
  ml_distributions_covariance: ["ml_matrix_svd_pca"],
  ml_mle_map_naive_bayes: ["ml_distributions_covariance"],
  ml_hypothesis_testing_bootstrap: ["ml_distributions_covariance"],
  ml_sampling_top_p: ["ml_loss_functions_info_theory", "dsa_heap_and_priority_queue"],

  // Part C: Classical Machine Learning & Kernel Methods
  ml_linear_logistic_regression: [
    "ml_gradients_jacobians_hessians",
    "ml_vector_spaces_gram_schmidt",
  ],
  ml_decision_trees_cart: ["dsa_tree_fundamentals", "ml_loss_functions_info_theory"],
  ml_ensemble_xgboost: ["ml_decision_trees_cart", "ml_gradients_jacobians_hessians"],
  ml_clustering_kmeans_dbscan: ["ml_vector_spaces_gram_schmidt", "dsa_heap_and_priority_queue"],
  ml_svm_kernel_smo: ["ml_linear_logistic_regression", "ml_gradient_descent_adamw"],
  ml_collaborative_filtering_als: ["ml_matrix_svd_pca", "ml_linear_logistic_regression"],

  // Part D: Deep Learning & Architectural Building Blocks
  ml_mlp_backpropagation: ["ml_autodiff_engines", "ml_gradient_descent_adamw"],
  ml_activations_online_softmax: ["ml_mlp_backpropagation", "ml_loss_functions_info_theory"],
  ml_normalization_rmsnorm: ["ml_mlp_backpropagation", "ml_vector_spaces_gram_schmidt"],
  ml_convolutions_im2col_gemm: ["ml_tensor_strides_views", "ml_mlp_backpropagation"],
  ml_recurrent_lstm_gru: ["ml_mlp_backpropagation"],

  // Part E: Specialized NLP, Retrieval & Quantization
  ml_trie_aho_corasick: ["dsa_tries_and_strings", "dsa_graph_traversal"],
  ml_subword_bpe_tiktoken: ["ml_trie_aho_corasick", "dsa_heap_and_priority_queue"],
  ml_kd_trees_top_k: ["dsa_tree_fundamentals", "ml_vector_spaces_gram_schmidt"],
  ml_ann_hnsw_ivfpq: ["ml_kd_trees_top_k", "dsa_graph_traversal", "ml_clustering_kmeans_dbscan"],

  // Part F: Attention Systems & High-Throughput Serving
  ml_attention_causal_sdpa: ["ml_activations_online_softmax", "ml_normalization_rmsnorm"],
  ml_rope_gqa_attention: ["ml_attention_causal_sdpa", "ml_matrix_memory_layout"],
  ml_dense_gemm_tiling: ["ml_tensor_strides_views", "ml_convolutions_im2col_gemm"],
  ml_flashattention_sram_tiling: ["ml_attention_causal_sdpa", "ml_dense_gemm_tiling"],
  ml_pagedattention_cow_vllm: ["ml_attention_causal_sdpa", "dsa_arrays_and_hashing"],
  ml_continuous_batching_orca: ["ml_pagedattention_cow_vllm", "dsa_heap_and_priority_queue"],
  ml_speculative_decoding: ["ml_sampling_top_p", "ml_continuous_batching_orca"],

  // Part G: Systems, Interconnects & Distributed Training
  ml_floating_point_kahan: ["ml_matrix_memory_layout"],
  ml_affine_quantization_int8: ["ml_floating_point_kahan", "ml_distributions_covariance"],
  ml_interconnect_alpha_beta: ["ml_matrix_memory_layout"],
  ml_ring_allreduce_collective: ["ml_interconnect_alpha_beta", "dsa_graph_traversal"],
  ml_zero3_parameter_sharding: ["ml_ring_allreduce_collective", "ml_gradient_descent_adamw"],
  ml_compiler_fusion_liveness: ["ml_autodiff_engines", "ml_dense_gemm_tiling"],
  ml_parallelism_3d_moe_1f1b: [
    "ml_zero3_parameter_sharding",
    "ml_flashattention_sram_tiling",
    "ml_ring_allreduce_collective",
  ],
});

/**
 * Career Goal Target Topic Maps.
 */
const CAREER_GOAL_TARGETS: Record<CareerGoal, readonly string[]> = Object.freeze({
  LLM_SYSTEMS_ENGINEER: [
    "ml_flashattention_sram_tiling",
    "ml_pagedattention_cow_vllm",
    "ml_continuous_batching_orca",
    "ml_speculative_decoding",
    "ml_dense_gemm_tiling",
    "ml_compiler_fusion_liveness",
  ],
  DISTRIBUTED_ML_ARCHITECT: [
    "ml_interconnect_alpha_beta",
    "ml_ring_allreduce_collective",
    "ml_zero3_parameter_sharding",
    "ml_parallelism_3d_moe_1f1b",
  ],
  COMPETITIVE_PROGRAMMING_GRANDMASTER: [
    "dsa_graph_flows_and_cuts",
    "dsa_advanced_range_queries",
    "dsa_dp_2d",
    "dsa_geometry_and_sweep_line",
    "dsa_game_theory",
    "dsa_tries_and_strings",
  ],
  MATHEMATICAL_OPTIMIZATION_SPECIALIST: [
    "ml_matrix_svd_pca",
    "ml_gradients_jacobians_hessians",
    "ml_gradient_descent_adamw",
    "ml_svm_kernel_smo",
    "ml_collaborative_filtering_als",
    "ml_loss_functions_info_theory",
  ],
});

/**
 * Retrieves direct or transitive prerequisites for a course topic.
 */
export function getPrerequisites(
  topicId: string,
  options: { transitive?: boolean } = {},
): readonly string[] {
  const direct = CURRICULUM_PREREQUISITES[topicId] || [];
  if (!options.transitive) {
    return direct;
  }

  const visited = new Set<string>();
  const queue = [...direct];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!visited.has(current)) {
      visited.add(current);
      const nextPrereqs = CURRICULUM_PREREQUISITES[current] || [];
      for (const next of nextPrereqs) {
        if (!visited.has(next)) {
          queue.push(next);
        }
      }
    }
  }

  return Array.from(visited);
}

/**
 * Retrieves immediate or downstream dependents unlocked upon completing a course topic.
 */
export function getDependents(
  topicId: string,
  options: { transitive?: boolean } = {},
): readonly string[] {
  const direct: string[] = [];

  for (const [courseId, prereqs] of Object.entries(CURRICULUM_PREREQUISITES)) {
    if (prereqs.includes(topicId)) {
      direct.push(courseId);
    }
  }

  if (!options.transitive) {
    return direct;
  }

  const visited = new Set<string>();
  const queue = [...direct];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!visited.has(current)) {
      visited.add(current);
      for (const [courseId, prereqs] of Object.entries(CURRICULUM_PREREQUISITES)) {
        if (prereqs.includes(current) && !visited.has(courseId)) {
          queue.push(courseId);
        }
      }
    }
  }

  return Array.from(visited);
}

/**
 * Validates that the curriculum prerequisite graph is strictly a Directed Acyclic Graph (0 cycles).
 */
export function validateDAG(): {
  readonly isAcyclic: boolean;
  readonly topologicalOrder: readonly string[];
  readonly cycles: readonly string[][];
} {
  const allNodes = Object.keys(CURRICULUM_PREREQUISITES);
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  for (const node of allNodes) {
    inDegree[node] = (CURRICULUM_PREREQUISITES[node] || []).length;
    adjList[node] = [];
  }

  for (const [u, prereqs] of Object.entries(CURRICULUM_PREREQUISITES)) {
    for (const v of prereqs) {
      if (!adjList[v]) adjList[v] = [];
      adjList[v].push(u);
    }
  }

  const queue: string[] = [];
  for (const node of allNodes) {
    if (inDegree[node] === 0) {
      queue.push(node);
    }
  }

  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    topologicalOrder.push(u);

    for (const v of adjList[u] || []) {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    }
  }

  const isAcyclic = topologicalOrder.length === allNodes.length;
  const cycles: string[][] = [];

  if (!isAcyclic) {
    const remainingNodes = allNodes.filter((n) => !topologicalOrder.includes(n));
    cycles.push(remainingNodes);
  }

  return { isAcyclic, topologicalOrder, cycles };
}

/**
 * Generates an optimal topological learning path tailored to a career goal or target topics.
 */
export function generateLearningPath(
  goal: CareerGoal | { targetTopicIds: readonly string[] },
): LearningPathResult {
  const targetTopics =
    typeof goal === "string" ? CAREER_GOAL_TARGETS[goal] || [] : goal.targetTopicIds;

  const goalName = typeof goal === "string" ? goal : "CUSTOM_LEARNING_PATH";

  // 1. Collect all necessary ancestors (transitive closure)
  const neededTopics = new Set<string>(targetTopics);
  for (const target of targetTopics) {
    const prereqs = getPrerequisites(target, { transitive: true });
    for (const p of prereqs) {
      neededTopics.add(p);
    }
  }

  // 2. Perform topological sort on needed subgraph
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  for (const node of neededTopics) {
    inDegree[node] = 0;
    adjList[node] = [];
  }

  for (const node of neededTopics) {
    const prereqs = (CURRICULUM_PREREQUISITES[node] || []).filter((p) => neededTopics.has(p));
    inDegree[node] = prereqs.length;
    for (const p of prereqs) {
      adjList[p].push(node);
    }
  }

  const queue: string[] = [];
  for (const node of neededTopics) {
    if (inDegree[node] === 0) {
      queue.push(node);
    }
  }

  const orderedTopicIds: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    orderedTopicIds.push(u);

    for (const v of adjList[u] || []) {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    }
  }

  // 3. Build milestone entries
  const milestones: PathMilestone[] = orderedTopicIds.map((topicId, idx) => {
    const journey = getCourseJourney(topicId);
    const directUnlocks = getDependents(topicId).filter((d) => neededTopics.has(d));
    return {
      step: idx + 1,
      topicId,
      title: journey?.title || topicId,
      unlocks: directUnlocks,
    };
  });

  const estimatedHours = Math.round(orderedTopicIds.length * 1.5);

  return {
    goal: goalName,
    orderedTopicIds,
    totalCourses: orderedTopicIds.length,
    estimatedHours,
    milestones,
  };
}
