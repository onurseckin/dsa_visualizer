export type TopicTrack = "dsa" | "ml-infra";

interface TopicDefinitionShape {
  id: string;
  label: string;
  track: TopicTrack;
}

export const TOPIC_CATALOG = [
  { id: "arrays_and_hashing", label: "Arrays & Hashing", track: "dsa" },
  { id: "two_pointers", label: "Two Pointers", track: "dsa" },
  { id: "stack_and_queue", label: "Stack & Queue", track: "dsa" },
  { id: "binary_search", label: "Binary Search", track: "dsa" },
  { id: "sliding_window", label: "Sliding Window", track: "dsa" },
  { id: "linked_list", label: "Linked List", track: "dsa" },
  { id: "tree_fundamentals", label: "Tree Fundamentals", track: "dsa" },
  {
    id: "tree_queries_and_diameter",
    label: "Tree Queries & Diameter",
    track: "dsa",
  },
  { id: "tries_and_strings", label: "Tries & Strings", track: "dsa" },
  {
    id: "heap_and_priority_queue",
    label: "Heap / Priority Queue",
    track: "dsa",
  },
  { id: "backtracking", label: "Backtracking", track: "dsa" },
  { id: "graph_traversal", label: "Graph Traversal", track: "dsa" },
  {
    id: "graph_shortest_paths",
    label: "Graph Shortest Paths",
    track: "dsa",
  },
  {
    id: "graph_spanning_trees",
    label: "Graph Spanning Trees",
    track: "dsa",
  },
  {
    id: "graph_directed_and_scc",
    label: "Directed Graphs & SCC",
    track: "dsa",
  },
  {
    id: "graph_flows_and_cuts",
    label: "Graph Flows & Cuts",
    track: "dsa",
  },
  { id: "dp_1d", label: "1-D Dynamic Programming", track: "dsa" },
  { id: "dp_2d", label: "2-D Dynamic Programming", track: "dsa" },
  { id: "intervals", label: "Intervals", track: "dsa" },
  { id: "greedy_algorithms", label: "Greedy Algorithms", track: "dsa" },
  { id: "bit_manipulation", label: "Bit Manipulation", track: "dsa" },
  {
    id: "math_and_number_theory",
    label: "Math & Number Theory",
    track: "dsa",
  },
  { id: "game_theory", label: "Game Theory", track: "dsa" },
  {
    id: "advanced_range_queries",
    label: "Advanced Range Queries",
    track: "dsa",
  },
  {
    id: "geometry_and_sweep_line",
    label: "Geometry & Sweep Line",
    track: "dsa",
  },
  {
    id: "ml_matrix_memory_layout",
    label: "Matrix Memory Layout & Flat Offsets",
    track: "ml-infra",
  },
  {
    id: "ml_tensor_strides_views",
    label: "Tensor Strides, Views & Broadcasting",
    track: "ml-infra",
  },
  {
    id: "ml_vector_spaces_gram_schmidt",
    label: "Vector Spaces, Orthogonality & Gram-Schmidt",
    track: "ml-infra",
  },
  {
    id: "ml_matrix_svd_pca",
    label: "Matrix Decompositions, SVD & PCA",
    track: "ml-infra",
  },
  {
    id: "ml_gradients_jacobians_hessians",
    label: "Gradients, Jacobians & Hessians",
    track: "ml-infra",
  },
  {
    id: "ml_autodiff_engines",
    label: "Automatic Differentiation Engines",
    track: "ml-infra",
  },
  {
    id: "ml_gradient_descent_adamw",
    label: "Gradient Descent & AdamW Optimizer",
    track: "ml-infra",
  },
  {
    id: "ml_loss_functions_info_theory",
    label: "Loss Functions & Information Theory",
    track: "ml-infra",
  },
  {
    id: "ml_distributions_covariance",
    label: "Probability Distributions & Covariance",
    track: "ml-infra",
  },
  {
    id: "ml_mle_map_naive_bayes",
    label: "MLE, MAP & Naive Bayes",
    track: "ml-infra",
  },
  {
    id: "ml_hypothesis_testing_bootstrap",
    label: "Hypothesis Testing & Bootstrap A/B Testing",
    track: "ml-infra",
  },
  {
    id: "ml_sampling_top_p",
    label: "Sampling Algorithms & Top-P Nucleus Sampling",
    track: "ml-infra",
  },
  {
    id: "ml_linear_logistic_regression",
    label: "Linear & Logistic Regression",
    track: "ml-infra",
  },
  {
    id: "ml_decision_trees_cart",
    label: "Decision Trees & Gini Impurity Split",
    track: "ml-infra",
  },
  {
    id: "ml_ensemble_xgboost",
    label: "Random Forest & XGBoost Split Gain",
    track: "ml-infra",
  },
  {
    id: "ml_clustering_kmeans_dbscan",
    label: "Clustering: K-Means++ & DBSCAN",
    track: "ml-infra",
  },
  {
    id: "ml_svm_kernel_smo",
    label: "Support Vector Machines & Kernel Tricks",
    track: "ml-infra",
  },
  {
    id: "ml_collaborative_filtering_als",
    label: "Matrix Factorization & Alternating Least Squares",
    track: "ml-infra",
  },
  {
    id: "ml_mlp_backpropagation",
    label: "Multilayer Perceptrons & Backpropagation",
    track: "ml-infra",
  },
  {
    id: "ml_activations_online_softmax",
    label: "Activations, GELU, SwiGLU & Online Softmax",
    track: "ml-infra",
  },
  {
    id: "ml_normalization_rmsnorm",
    label: "LayerNorm, BatchNorm & RMSNorm",
    track: "ml-infra",
  },
  {
    id: "ml_convolutions_im2col_gemm",
    label: "Spatial Convolutions & Im2Col GEMM",
    track: "ml-infra",
  },
  {
    id: "ml_recurrent_lstm_gru",
    label: "Recurrent Networks & LSTM/GRU Gating",
    track: "ml-infra",
  },
  {
    id: "ml_trie_aho_corasick",
    label: "Trie Vocabularies & Aho-Corasick",
    track: "ml-infra",
  },
  {
    id: "ml_subword_bpe_tiktoken",
    label: "Subword Tokenization: BPE & Tiktoken",
    track: "ml-infra",
  },
  {
    id: "ml_kd_trees_top_k",
    label: "Exact Top-K Retrieval & K-D Trees",
    track: "ml-infra",
  },
  {
    id: "ml_ann_hnsw_ivfpq",
    label: "Approximate Nearest Neighbors: HNSW & IVF-PQ",
    track: "ml-infra",
  },
  {
    id: "ml_attention_causal_sdpa",
    label: "Scaled Dot-Product Attention & Causal Masking",
    track: "ml-infra",
  },
  {
    id: "ml_rope_gqa_attention",
    label: "Multi-Head, GQA & Rotary Position Encodings (RoPE)",
    track: "ml-infra",
  },
  {
    id: "ml_flashattention_sram_tiling",
    label: "IO-Aware FlashAttention SRAM Tiling",
    track: "ml-infra",
  },
  {
    id: "ml_continuous_batching_orca",
    label: "Continuous Batching & Orca Schedulers",
    track: "ml-infra",
  },
  {
    id: "ml_pagedattention_cow_vllm",
    label: "PagedAttention & Copy-on-Write (vLLM)",
    track: "ml-infra",
  },
  {
    id: "ml_speculative_decoding",
    label: "Speculative Decoding & Prefix Caching",
    track: "ml-infra",
  },
  {
    id: "ml_floating_point_kahan",
    label: "Floating-Point Formats & Kahan Summation",
    track: "ml-infra",
  },
  {
    id: "ml_affine_quantization_int8",
    label: "Affine Quantization: INT8 & FP8",
    track: "ml-infra",
  },
  {
    id: "ml_dense_gemm_tiling",
    label: "Dense GEMM & SRAM L1 Tiling",
    track: "ml-infra",
  },
  {
    id: "ml_interconnect_alpha_beta",
    label: "Interconnect Topologies & Alpha-Beta Cost Models",
    track: "ml-infra",
  },
  {
    id: "ml_ring_allreduce_collective",
    label: "Collective Communication & Ring-AllReduce",
    track: "ml-infra",
  },
  {
    id: "ml_zero3_parameter_sharding",
    label: "Distributed Sharding: ZeRO-1/2/3 & FSDP",
    track: "ml-infra",
  },
  {
    id: "ml_compiler_fusion_liveness",
    label: "Kernel Fusion & Buffer Liveness Memory Arenas",
    track: "ml-infra",
  },
  {
    id: "ml_parallelism_3d_moe_1f1b",
    label: "3D Parallelism, 1F1B Scheduling & MoE Routing",
    track: "ml-infra",
  },
] as const satisfies readonly TopicDefinitionShape[];

export type Topic = (typeof TOPIC_CATALOG)[number];
export type TopicId = Topic["id"];

const TOPIC_BY_ID = new Map<string, Topic>(TOPIC_CATALOG.map((topic) => [topic.id, topic]));

export const getAllTopics = (): readonly Topic[] => TOPIC_CATALOG;

export const getTopic = (id: string): Topic | undefined => TOPIC_BY_ID.get(id);

export const isTopicId = (value: unknown): value is TopicId =>
  typeof value === "string" && TOPIC_BY_ID.has(value);

export const isMlInfraTopic = (topicId: TopicId): boolean =>
  TOPIC_BY_ID.get(topicId)?.track === "ml-infra";

export const getTopicLabel = (topicId: TopicId): string =>
  TOPIC_BY_ID.get(topicId)?.label ?? topicId;
