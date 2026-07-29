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
    id: "ml_python_scientific_computing",
    label: "Python, Environments & Scientific Computing",
    track: "ml-infra",
  },
  {
    id: "ml_problem_framing",
    label: "ML Problem Framing & Success Metrics",
    track: "ml-infra",
  },
  {
    id: "ml_data_contracts_splits",
    label: "Data Contracts, Datasets & Splits",
    track: "ml-infra",
  },
  {
    id: "ml_numerical_tensors",
    label: "Numerical Computing, Tensors & Stability",
    track: "ml-infra",
  },
  {
    id: "ml_model_evaluation",
    label: "Baseline Models, Evaluation & Error Analysis",
    track: "ml-infra",
  },
  {
    id: "ml_training_autodiff",
    label: "Training Loops, Autodiff & Optimization",
    track: "ml-infra",
  },
  {
    id: "ml_experiment_lineage",
    label: "Experiment Reproducibility, Metadata & Lineage",
    track: "ml-infra",
  },
  {
    id: "ml_feature_pipelines",
    label: "Feature/Data Pipelines & Offline–Online Consistency",
    track: "ml-infra",
  },
  {
    id: "ml_workflow_orchestration",
    label: "ML Workflow Orchestration, Testing & CI",
    track: "ml-infra",
  },
  {
    id: "ml_training_platform",
    label: "Training Platform, Compute & Scheduling",
    track: "ml-infra",
  },
  {
    id: "ml_model_registry",
    label: "Model Packaging, Registry & Release Promotion",
    track: "ml-infra",
  },
  {
    id: "ml_inference_serving",
    label: "Inference Deployment & Serving Reliability",
    track: "ml-infra",
  },
  {
    id: "ml_observability_incidents",
    label: "Production Evaluation, Observability & Incident Response",
    track: "ml-infra",
  },
  {
    id: "ml_governance_security_cost",
    label: "ML Security, Governance, Privacy & Cost",
    track: "ml-infra",
  },
  {
    id: "ml_platform_capstone",
    label: "End-to-End ML Platform Capstone",
    track: "ml-infra",
  },
  {
    id: "ml_accelerator_performance",
    label: "Accelerator Performance, Roofline & Kernel Fundamentals",
    track: "ml-infra",
  },
  {
    id: "ml_distributed_training",
    label: "Distributed Training & Parallelism",
    track: "ml-infra",
  },
  {
    id: "ml_compilation_quantization",
    label: "Inference Compilation, Quantization & Portable Runtimes",
    track: "ml-infra",
  },
  {
    id: "ml_transformer_internals",
    label: "Transformer Internals & Tokenization",
    track: "ml-infra",
  },
  {
    id: "ml_llm_serving",
    label: "LLM Serving Systems",
    track: "ml-infra",
  },
  {
    id: "ml_vector_retrieval",
    label: "Retrieval & Vector Data Systems",
    track: "ml-infra",
  },
  {
    id: "ml_tree_ensemble_systems",
    label: "Tree-Ensemble Systems",
    track: "ml-infra",
  },
  {
    id: "ml_vision_sequence_models",
    label: "Vision & Sequence Model Internals",
    track: "ml-infra",
  },
  {
    id: "ml_tensor_algebra",
    label: "Tensor Algebra & Memory Strides",
    track: "ml-infra",
  },
  {
    id: "ml_gemm_roofline",
    label: "GEMM & Roofline Model",
    track: "ml-infra",
  },
  {
    id: "ml_autograd_dags",
    label: "Autograd & Computational Graphs",
    track: "ml-infra",
  },
  {
    id: "ml_precision_quantization",
    label: "Precision Math & Quantization",
    track: "ml-infra",
  },
  {
    id: "ml_vector_search",
    label: "Vector Search & Spatial Indexing",
    track: "ml-infra",
  },
  {
    id: "ml_tokenization",
    label: "Subword Tokenization & Tries",
    track: "ml-infra",
  },
  {
    id: "ml_tree_ensembles",
    label: "Tree Ensembles & XGBoost",
    track: "ml-infra",
  },
  {
    id: "ml_convolutions",
    label: "Convolutional Tiling & im2col",
    track: "ml-infra",
  },
  {
    id: "ml_recurrent_gates",
    label: "Recurrent Gates & Sequences",
    track: "ml-infra",
  },
  {
    id: "ml_attention_geometry",
    label: "Attention Geometry & KV-Cache",
    track: "ml-infra",
  },
  {
    id: "ml_hardware_kernels",
    label: "Hardware Kernels & GPU SRAM",
    track: "ml-infra",
  },
  {
    id: "ml_graph_compilers",
    label: "Model Compression & Compilers",
    track: "ml-infra",
  },
  {
    id: "ml_distributed_systems",
    label: "Distributed ML & Interconnects",
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
