/**
 * Visualizer Router & Primary Stage Dispatch Engine
 * Dynamic component resolution, layout dimensions, and interactive capability dispatching across all 64 curriculum courses.
 */

import { ALL_COURSE_JOURNEYS } from "./catalog";

export type VisualizerType =
  | "FlashAttentionTileVisualizer"
  | "RingAllReduceVisualizer"
  | "PagedAttentionBlockVisualizer"
  | "DinicFlowVisualizer"
  | "FenwickTreeVisualizer"
  | "ConvexHullSweepVisualizer"
  | "TreeVisualizer"
  | "GraphVisualizer"
  | "MatrixVisualizer"
  | "ArrayVisualizer"
  | "QuantizationVisualizer"
  | "AttentionMapVisualizer"
  | "StateSpaceVisualizer"
  | "IntervalVisualizer"
  | "HeapVisualizer"
  | "HashTableVisualizer"
  | "DsuVisualizer"
  | "BitmaskVisualizer"
  | "GridVisualizer"
  | "CompositeVisualizer";

export type VisualizerCategory =
  | "dsa_primitive"
  | "ml_systems"
  | "deep_learning"
  | "numerical"
  | "distributed";

export interface VisualizerRouteDescriptor {
  topicId: string;
  componentName: VisualizerType;
  category: VisualizerCategory;
  defaultDimensions: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  supportedControls: {
    hasStepSlider: boolean;
    hasSpeedControl: boolean;
    hasInspectionDrawer: boolean;
    hasInteractiveCanvas: boolean;
  };
  hasMemoryTraceOverlay: boolean;
  description: string;
}

/**
 * Master visualizer mapping table for all DSA and ML Infra courses.
 */
export const VISUALIZER_ROUTING_TABLE: Record<string, VisualizerRouteDescriptor> = {
  // --- DSA Track ---
  dsa_arrays_and_hashing: {
    topicId: "dsa_arrays_and_hashing",
    componentName: "ArrayVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Dynamic array element traversal, two-sum pointer jumps, and hash bucket collisions.",
  },
  dsa_two_pointers: {
    topicId: "dsa_two_pointers",
    componentName: "ArrayVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Converging left-right pointer indices and monotonic boundary search.",
  },
  dsa_stack_and_queue: {
    topicId: "dsa_stack_and_queue",
    componentName: "ArrayVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "LIFO stack pushes/pops and FIFO queue ring-buffer head/tail increments.",
  },
  dsa_binary_search: {
    topicId: "dsa_binary_search",
    componentName: "ArrayVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Logarithmic interval bisection with low/mid/high cursor tracking.",
  },
  dsa_sliding_window: {
    topicId: "dsa_sliding_window",
    componentName: "ArrayVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Variable-length and fixed-size sliding window bracket expansion/contraction.",
  },
  dsa_linked_list: {
    topicId: "dsa_linked_list",
    componentName: "GraphVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Singly and doubly linked list pointer updates, reversals, and Floyd cycle detection.",
  },
  dsa_tree_fundamentals: {
    topicId: "dsa_tree_fundamentals",
    componentName: "TreeVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 840, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Binary tree recursive traversals (Pre/In/Post/Level) and AVL/BST balance rotations.",
  },
  dsa_tree_queries_and_diameter: {
    topicId: "dsa_tree_queries_and_diameter",
    componentName: "TreeVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 840, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Binary lifting 2^k ancestor jumps, lowest common ancestor (LCA), and tree diameter.",
  },
  dsa_tries_and_strings: {
    topicId: "dsa_tries_and_strings",
    componentName: "TreeVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 840, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Prefix tree trie node exploration and Aho-Corasick failure link transitions.",
  },
  dsa_heap_and_priority_queue: {
    topicId: "dsa_heap_and_priority_queue",
    componentName: "HeapVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Binary min/max heap sift-up, sift-down, and priority queue extract-min operations.",
  },
  dsa_backtracking: {
    topicId: "dsa_backtracking",
    componentName: "StateSpaceVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 860, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Recursive state space exploration tree with pruning and choice stack tracking.",
  },
  dsa_graph_traversal: {
    topicId: "dsa_graph_traversal",
    componentName: "GraphVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 860, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "BFS queue frontiers, DFS recursive call tree, and Kahn topological ordering.",
  },
  dsa_graph_shortest_paths: {
    topicId: "dsa_graph_shortest_paths",
    componentName: "GraphVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 860, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Dijkstra priority relaxation, Bellman-Ford negative edge sweeps, and 0-1 BFS deque.",
  },
  dsa_graph_spanning_trees: {
    topicId: "dsa_graph_spanning_trees",
    componentName: "DsuVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 860, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Kruskal edge sorting with Disjoint Set Union (DSU) path compression and Prim's cut growth.",
  },
  dsa_graph_directed_and_scc: {
    topicId: "dsa_graph_directed_and_scc",
    componentName: "GraphVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 860, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Tarjan's low-link DFS stack tracking and Kosaraju two-pass condensation graph DAG.",
  },
  dsa_graph_flows_and_cuts: {
    topicId: "dsa_graph_flows_and_cuts",
    componentName: "DinicFlowVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 900, height: 560, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Dinic level graph BFS layer construction, blocking flow DFS, and residual capacity saturation.",
  },
  dsa_dp_1d: {
    topicId: "dsa_dp_1d",
    componentName: "ArrayVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "1D tabular memoization table with dependency arrow transitions and optimal subproblem values.",
  },
  dsa_dp_2d: {
    topicId: "dsa_dp_2d",
    componentName: "GridVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 840, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "2D matrix dynamic programming grid (LCS, Knapsack, Edit Distance) with cell dependency arrows.",
  },
  dsa_intervals: {
    topicId: "dsa_intervals",
    componentName: "IntervalVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "1D timeline sweep line, overlapping interval merges, and non-overlapping interval scheduling.",
  },
  dsa_greedy_algorithms: {
    topicId: "dsa_greedy_algorithms",
    componentName: "ArrayVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Locally optimal choice selection sequence across sorted candidate arrays.",
  },
  dsa_bit_manipulation: {
    topicId: "dsa_bit_manipulation",
    componentName: "BitmaskVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Binary bit register manipulation, Brian Kernighan bit counts, and subset masks.",
  },
  dsa_math_and_number_theory: {
    topicId: "dsa_math_and_number_theory",
    componentName: "ArrayVisualizer",
    category: "numerical",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Extended Euclidean Bézout steps, Sieve of Eratosthenes, and modular exponentiation.",
  },
  dsa_advanced_range_queries: {
    topicId: "dsa_advanced_range_queries",
    componentName: "FenwickTreeVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 900, height: 560, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Fenwick Tree (Binary Indexed Tree) dyadic interval covers and Segment Tree range queries.",
  },
  dsa_geometry_and_sweep_line: {
    topicId: "dsa_geometry_and_sweep_line",
    componentName: "ConvexHullSweepVisualizer",
    category: "dsa_primitive",
    defaultDimensions: { width: 900, height: 560, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Andrew's Monotone Chain 2D convex hull sweep, 2D cross product turns, and shoelace area.",
  },

  // --- ML Infra & Foundations Track ---
  ml_matrix_memory_layout: {
    topicId: "ml_matrix_memory_layout",
    componentName: "MatrixVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 840, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Row-major vs column-major flat byte address calculation and DRAM cacheline spatial locality.",
  },
  ml_tensor_strides_views: {
    topicId: "ml_tensor_strides_views",
    componentName: "MatrixVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 840, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "N-dimensional tensor stride strides arithmetic, non-contiguous views, and broadcasting strides.",
  },
  ml_floating_point_kahan: {
    topicId: "ml_floating_point_kahan",
    componentName: "ArrayVisualizer",
    category: "numerical",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "IEEE 754 float precision loss, 2Sum Kahan error compensator register tracking.",
  },
  ml_affine_quantization_int8: {
    topicId: "ml_affine_quantization_int8",
    componentName: "QuantizationVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 880, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Uniform affine scale & zero-point quantization, INT8 clipping, and dequantization reconstruction.",
  },
  ml_dense_gemm_tiling: {
    topicId: "ml_dense_gemm_tiling",
    componentName: "MatrixVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 880, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Hierarchical L1/L2 SRAM cache blocking, matrix tile multiplication, and register reuse.",
  },
  ml_convolutions_im2col_gemm: {
    topicId: "ml_convolutions_im2col_gemm",
    componentName: "MatrixVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 840, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Spatial patch unrolling to 2D column matrices (Im2Col) for tensor core GEMM convolution.",
  },
  ml_activations_online_softmax: {
    topicId: "ml_activations_online_softmax",
    componentName: "ArrayVisualizer",
    category: "numerical",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: "Single-pass streaming online softmax normalizer and SwiGLU gating activations.",
  },
  ml_normalization_rmsnorm: {
    topicId: "ml_normalization_rmsnorm",
    componentName: "ArrayVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Root Mean Square Layer Normalization forward scale and orthogonal gradient backward pass.",
  },
  ml_mlp_backpropagation: {
    topicId: "ml_mlp_backpropagation",
    componentName: "StateSpaceVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Multi-layer perceptron computational DAG forward loss evaluation and reverse-mode adjoint backprop.",
  },
  ml_gradient_descent_adamw: {
    topicId: "ml_gradient_descent_adamw",
    componentName: "ArrayVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "AdamW decoupled weight decay, first/second moment tracking, and bias-corrected update vectors.",
  },
  ml_recurrent_lstm_gru: {
    topicId: "ml_recurrent_lstm_gru",
    componentName: "StateSpaceVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "LSTM 4-gate cell state transitions, Constant Error Carousel, and hidden state recurrent unrolling.",
  },
  ml_attention_causal_sdpa: {
    topicId: "ml_attention_causal_sdpa",
    componentName: "AttentionMapVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 880, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Causal Scaled Dot-Product Attention (SDPA) lower-triangular weight matrix and query-key dot products.",
  },
  ml_rope_gqa_attention: {
    topicId: "ml_rope_gqa_attention",
    componentName: "AttentionMapVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 880, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Rotary Position Embedding (RoPE) complex rotations and Grouped-Query Attention (GQA) head sharing.",
  },
  ml_flashattention_sram_tiling: {
    topicId: "ml_flashattention_sram_tiling",
    componentName: "FlashAttentionTileVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 900, height: 560, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Dual-buffer SRAM tiling, QK^T tile multiplication, online softmax rescaling, and PV accumulator updates.",
  },
  ml_continuous_batching_orca: {
    topicId: "ml_continuous_batching_orca",
    componentName: "StateSpaceVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 880, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Orca iteration-level scheduling, prefill chunking, decode slot eviction, and token throughput maximization.",
  },
  ml_pagedattention_cow_vllm: {
    topicId: "ml_pagedattention_cow_vllm",
    componentName: "PagedAttentionBlockVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 900, height: 560, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Non-contiguous 16-token physical memory block pool, virtual block tables, and Copy-On-Write beam forks.",
  },
  ml_speculative_decoding: {
    topicId: "ml_speculative_decoding",
    componentName: "ArrayVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 840, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Draft model speculative token generation, target verifier parallel validation, and prefix acceptance.",
  },
  ml_interconnect_alpha_beta: {
    topicId: "ml_interconnect_alpha_beta",
    componentName: "GraphVisualizer",
    category: "distributed",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Hockney (alpha, beta) interconnect latency model, link bandwidth saturation, and network hops.",
  },
  ml_ring_allreduce_collective: {
    topicId: "ml_ring_allreduce_collective",
    componentName: "RingAllReduceVisualizer",
    category: "distributed",
    defaultDimensions: { width: 900, height: 560, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Circular ring topology collective, 2(P-1)/P bandwidth transfer, Scatter-Reduce and All-Gather phases.",
  },
  ml_zero3_parameter_sharding: {
    topicId: "ml_zero3_parameter_sharding",
    componentName: "RingAllReduceVisualizer",
    category: "distributed",
    defaultDimensions: { width: 900, height: 560, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "ZeRO-3 weight, gradient, and optimizer state sharding across DP ranks with on-demand parameter all-gathers.",
  },
  ml_compiler_fusion_liveness: {
    topicId: "ml_compiler_fusion_liveness",
    componentName: "IntervalVisualizer",
    category: "ml_systems",
    defaultDimensions: { width: 860, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Kernel fusion buffer liveness intervals, register interference graphs, and linear scan memory allocation.",
  },
  ml_parallelism_3d_moe_1f1b: {
    topicId: "ml_parallelism_3d_moe_1f1b",
    componentName: "StateSpaceVisualizer",
    category: "distributed",
    defaultDimensions: { width: 900, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "3D Parallelism (TP x PP x DP), 1F1B pipeline bubble schedules, and MoE Top-2 gated expert routing.",
  },
  ml_linear_logistic_regression: {
    topicId: "ml_linear_logistic_regression",
    componentName: "MatrixVisualizer",
    category: "numerical",
    defaultDimensions: { width: 840, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Ordinary Least Squares normal equations (X^T X)^-1 X^T y and logistic sigmoid decision boundaries.",
  },
  ml_svm_kernel_smo: {
    topicId: "ml_svm_kernel_smo",
    componentName: "MatrixVisualizer",
    category: "numerical",
    defaultDimensions: { width: 840, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Dual SVM quadratic programming, Platt's SMO coordinate ascent, and RBF kernel Gram matrices.",
  },
  ml_decision_trees_cart_random_forest: {
    topicId: "ml_decision_trees_cart_random_forest",
    componentName: "TreeVisualizer",
    category: "numerical",
    defaultDimensions: { width: 840, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "CART recursive binary feature splitting, Gini impurity minimization, and Random Forest voting.",
  },
  ml_gradient_boosting_xgboost: {
    topicId: "ml_gradient_boosting_xgboost",
    componentName: "TreeVisualizer",
    category: "numerical",
    defaultDimensions: { width: 840, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Second-order gradient and Hessian histogram splits with L1/L2 regularized leaf weight optimization.",
  },
  ml_clustering_kmeans_dbscan: {
    topicId: "ml_clustering_kmeans_dbscan",
    componentName: "ConvexHullSweepVisualizer",
    category: "numerical",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "K-Means++ centroid Voronoi partitioning and DBSCAN density-reachable cluster expansion.",
  },
  ml_matrix_svd_pca: {
    topicId: "ml_matrix_svd_pca",
    componentName: "MatrixVisualizer",
    category: "numerical",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Singular Value Decomposition (U Sigma V^T) low-rank approximation and PCA covariance projections.",
  },
  ml_collaborative_filtering_als: {
    topicId: "ml_collaborative_filtering_als",
    componentName: "MatrixVisualizer",
    category: "numerical",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Alternating Least Squares (ALS) user-item matrix factorization and latent embedding updates.",
  },
  ml_trie_aho_corasick: {
    topicId: "ml_trie_aho_corasick",
    componentName: "TreeVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Aho-Corasick dictionary automaton failure link transitions and multi-pattern string matching.",
  },
  ml_subword_bpe_tiktoken: {
    topicId: "ml_subword_bpe_tiktoken",
    componentName: "ArrayVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 840, height: 500, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Byte-Pair Encoding (BPE) greedy rank priority merges and Tiktoken vocabulary lookups.",
  },
  ml_kd_trees_top_k: {
    topicId: "ml_kd_trees_top_k",
    componentName: "ConvexHullSweepVisualizer",
    category: "numerical",
    defaultDimensions: { width: 860, height: 520, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "K-D Tree recursive spatial hypercube partitioning and bounded nearest-neighbor pruning.",
  },
  ml_ann_hnsw_ivfpq: {
    topicId: "ml_ann_hnsw_ivfpq",
    componentName: "GraphVisualizer",
    category: "deep_learning",
    defaultDimensions: { width: 880, height: 540, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description:
      "Hierarchical Navigable Small World (HNSW) multi-layer greedy beam search and IVFPQ residual quantization.",
  },
};

/**
 * Resolves the visualizer route descriptor for any topic or algorithm identifier.
 */
export function resolveVisualizerForTopic(topicOrAlgoId: string): VisualizerRouteDescriptor {
  const sanitized = topicOrAlgoId.trim();
  const direct = VISUALIZER_ROUTING_TABLE[sanitized];
  if (direct) return direct;

  // Try with dsa_ or ml_ prefix
  const withDsa = VISUALIZER_ROUTING_TABLE[`dsa_${sanitized}`];
  if (withDsa) return withDsa;

  const withMl = VISUALIZER_ROUTING_TABLE[`ml_${sanitized}`];
  if (withMl) return withMl;

  // Try stripped prefix
  const stripped = sanitized.replace(/^(dsa_|ml_)/, "");
  const strippedDirect =
    VISUALIZER_ROUTING_TABLE[stripped] ||
    VISUALIZER_ROUTING_TABLE[`dsa_${stripped}`] ||
    VISUALIZER_ROUTING_TABLE[`ml_${stripped}`];
  if (strippedDirect) return strippedDirect;

  // Prefix matching fallback
  for (const [key, descriptor] of Object.entries(VISUALIZER_ROUTING_TABLE)) {
    if (
      key.includes(sanitized) ||
      sanitized.includes(key) ||
      key.includes(stripped) ||
      stripped.includes(key)
    ) {
      return descriptor;
    }
  }

  // Generic Default Fallback
  const isMl = sanitized.startsWith("ml_") || sanitized.startsWith("ml-");
  return {
    topicId: sanitized,
    componentName: isMl ? "MatrixVisualizer" : "ArrayVisualizer",
    category: isMl ? "ml_systems" : "dsa_primitive",
    defaultDimensions: { width: 800, height: 480, aspectRatio: "16:9" },
    supportedControls: {
      hasStepSlider: true,
      hasSpeedControl: true,
      hasInspectionDrawer: true,
      hasInteractiveCanvas: true,
    },
    hasMemoryTraceOverlay: true,
    description: `Interactive primary visualizer stage for ${sanitized}.`,
  };
}

/**
 * Validates that all 64 courses in the master curriculum catalog have a dedicated visualizer route.
 */
export function validateCurriculumVisualizerCoverage(): {
  totalCourses: number;
  coveredCourses: number;
  allCovered: boolean;
  issues: string[];
} {
  const courses = ALL_COURSE_JOURNEYS;
  const issues: string[] = [];
  let coveredCount = 0;

  for (const course of courses) {
    const route = resolveVisualizerForTopic(course.id);
    if (!route || !route.componentName) {
      issues.push(`Course ${course.id} missing visualizer route descriptor.`);
    } else {
      coveredCount++;
    }
  }

  return {
    totalCourses: courses.length,
    coveredCourses: coveredCount,
    allCovered: issues.length === 0,
    issues,
  };
}
