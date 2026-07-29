/* ML curriculum placement data. Problem metadata belongs exclusively to the
   learning registry; these records only describe how declared topics appear here. */
import { indexPlacements } from "../../curriculum/trees";
import type { MLInfraCurriculumPlacement } from "./data/mlInfraTypes";

export {
  ML_INFRA_FAMILIES,
  mlInfraFamilyColor,
  mlInfraFamilyFill,
  mlInfraFamilyFillHover,
  mlInfraFamilyLabel,
} from "./data/mlInfraTypes";
export type {
  MLInfraCurriculumPlacement,
  MLInfraFamily,
  MLInfraFamilyId,
} from "./data/mlInfraTypes";

export const ML_INFRA_TREE_PLACEMENTS: readonly MLInfraCurriculumPlacement[] = [
  {
    id: "ml_python_scientific_computing",
    topicId: "ml_python_scientific_computing",
    title: "Python, Environments & Scientific Computing",
    description:
      "Reproducible environments, array programming, tensor boundaries, dtype and device behavior, and deterministic execution diagnosis.",
    family: "foundations",
    difficulty: "Easy",
    prerequisites: [],
    x: 900,
    y: 80,
  },
  {
    id: "ml_problem_framing",
    topicId: "ml_problem_framing",
    title: "ML Problem Framing & Success Metrics",
    description:
      "Prediction targets, decisions, labels, feedback loops, uncertainty, threshold tradeoffs, and when rules are preferable to a model.",
    family: "foundations",
    difficulty: "Easy",
    prerequisites: ["ml_python_scientific_computing"],
    x: 460,
    y: 245,
  },
  {
    id: "ml_data_contracts_splits",
    topicId: "ml_data_contracts_splits",
    title: "Data Contracts, Datasets & Splits",
    description:
      "Schema and semantic contracts, reproducible snapshots, time-aware and group-aware splits, lineage, consent, and retention evidence.",
    family: "foundations",
    difficulty: "Easy",
    prerequisites: ["ml_python_scientific_computing"],
    x: 900,
    y: 245,
  },
  {
    id: "ml_numerical_tensors",
    topicId: "ml_numerical_tensors",
    title: "Numerical Computing, Tensors & Stability",
    description:
      "Tensor shape and layout behavior, stable transformations, dtype and accumulation choices, memory tradeoffs, and implicit conversion risks.",
    family: "foundations",
    difficulty: "Medium",
    prerequisites: ["ml_python_scientific_computing"],
    x: 1340,
    y: 245,
  },
  {
    id: "ml_model_evaluation",
    topicId: "ml_model_evaluation",
    title: "Baseline Models, Evaluation & Error Analysis",
    description:
      "Baseline selection, generalization, calibration, ranking and threshold metrics, slice analysis, leakage, and evidence-based model comparison.",
    family: "foundations",
    difficulty: "Medium",
    prerequisites: ["ml_problem_framing", "ml_data_contracts_splits", "ml_numerical_tensors"],
    x: 900,
    y: 420,
  },
  {
    id: "ml_training_autodiff",
    topicId: "ml_training_autodiff",
    title: "Training Loops, Autodiff & Optimization",
    description:
      "Reverse-mode differentiation, training-loop state, gradient flow, optimization, accumulation, evaluation mode, and checkpoint tradeoffs.",
    family: "training-data-lifecycle",
    difficulty: "Medium",
    prerequisites: ["ml_numerical_tensors", "ml_model_evaluation"],
    x: 540,
    y: 600,
  },
  {
    id: "ml_experiment_lineage",
    topicId: "ml_experiment_lineage",
    title: "Experiment Reproducibility, Metadata & Lineage",
    description:
      "Code, data, configuration, environment, metric and artifact evidence needed to reproduce, compare, and audit model-selection decisions.",
    family: "training-data-lifecycle",
    difficulty: "Medium",
    prerequisites: ["ml_data_contracts_splits", "ml_model_evaluation"],
    x: 900,
    y: 600,
  },
  {
    id: "ml_feature_pipelines",
    topicId: "ml_feature_pipelines",
    title: "Feature/Data Pipelines & Offline–Online Consistency",
    description:
      "Point-in-time joins, transformation parity, freshness and clock semantics, schema evolution, and batch, streaming, or hybrid materialization.",
    family: "training-data-lifecycle",
    difficulty: "Medium",
    prerequisites: ["ml_data_contracts_splits"],
    x: 1260,
    y: 600,
  },
  {
    id: "ml_workflow_orchestration",
    topicId: "ml_workflow_orchestration",
    title: "ML Workflow Orchestration, Testing & CI",
    description:
      "Workflow dependencies, cache keys, retries, idempotence, partial failure, backfills, and tests spanning code, data, and model behavior.",
    family: "training-data-lifecycle",
    difficulty: "Medium",
    prerequisites: ["ml_experiment_lineage", "ml_feature_pipelines"],
    x: 900,
    y: 780,
  },
  {
    id: "ml_training_platform",
    topicId: "ml_training_platform",
    title: "Training Platform, Compute & Scheduling",
    description:
      "Execution topology, resource and quota sizing, scheduling, utilization, locality, checkpoint recovery, reliability, and cost-aware operation.",
    family: "production-systems",
    difficulty: "Hard",
    prerequisites: ["ml_training_autodiff", "ml_workflow_orchestration"],
    x: 600,
    y: 960,
  },
  {
    id: "ml_model_registry",
    topicId: "ml_model_registry",
    title: "Model Packaging, Registry & Release Promotion",
    description:
      "Immutable model packages, runtime signatures, deterministic checks, ancestry, lifecycle states, and evidence-based release promotion.",
    family: "production-systems",
    difficulty: "Hard",
    prerequisites: ["ml_experiment_lineage", "ml_workflow_orchestration"],
    x: 960,
    y: 960,
  },
  {
    id: "ml_inference_serving",
    topicId: "ml_inference_serving",
    title: "Inference Deployment & Serving Reliability",
    description:
      "Batch, asynchronous, online, and streaming inference; capacity, queues, latency objectives, rollout safety, fallback, and failure diagnosis.",
    family: "production-systems",
    difficulty: "Hard",
    prerequisites: ["ml_model_evaluation", "ml_model_registry"],
    x: 960,
    y: 1140,
  },
  {
    id: "ml_observability_incidents",
    topicId: "ml_observability_incidents",
    title: "Production Evaluation, Observability & Incident Response",
    description:
      "Service, data, model, slice and outcome signals; delayed labels, alert calibration, incident reconstruction, rollback, and remediation.",
    family: "operations-governance",
    difficulty: "Hard",
    prerequisites: ["ml_feature_pipelines", "ml_inference_serving"],
    x: 960,
    y: 1320,
  },
  {
    id: "ml_governance_security_cost",
    topicId: "ml_governance_security_cost",
    title: "ML Security, Governance, Privacy & Cost",
    description:
      "Lifecycle threat modeling, access and retention controls, audit and deletion duties, supply-chain evidence, and cost-quality ownership.",
    family: "operations-governance",
    difficulty: "Hard",
    prerequisites: [
      "ml_data_contracts_splits",
      "ml_inference_serving",
      "ml_observability_incidents",
    ],
    x: 960,
    y: 1500,
  },
  {
    id: "ml_platform_capstone",
    topicId: "ml_platform_capstone",
    title: "End-to-End ML Platform Capstone",
    description:
      "Integrate framing, evidence, training, release, serving, observability, governance, cost, rollback, and incident response under changed constraints.",
    family: "capstone",
    difficulty: "Hard",
    prerequisites: [
      "ml_training_platform",
      "ml_model_registry",
      "ml_inference_serving",
      "ml_observability_incidents",
      "ml_governance_security_cost",
    ],
    x: 900,
    y: 1690,
  },
  {
    id: "ml_accelerator_performance",
    topicId: "ml_accelerator_performance",
    title: "Accelerator Performance, Roofline & Kernel Fundamentals",
    description:
      "Arithmetic intensity, roofline bounds, tiled memory reuse, profiler evidence, and deciding when low-level optimization changes end-to-end outcomes.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: ["ml_numerical_tensors"],
    x: 1650,
    y: 430,
  },
  {
    id: "ml_distributed_training",
    topicId: "ml_distributed_training",
    title: "Distributed Training & Parallelism",
    description:
      "Collective communication, data and model parallelism, memory partitioning, overlap, topology, fault recovery, and scaling efficiency.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: ["ml_training_autodiff", "ml_training_platform", "ml_accelerator_performance"],
    x: 180,
    y: 1130,
  },
  {
    id: "ml_compilation_quantization",
    topicId: "ml_compilation_quantization",
    title: "Inference Compilation, Quantization & Portable Runtimes",
    description:
      "Graph transformation, operator fusion, shape contracts, quantization calibration, portability, compatibility, and accuracy validation.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: ["ml_training_autodiff", "ml_model_registry", "ml_inference_serving"],
    x: 180,
    y: 1320,
  },
  {
    id: "ml_transformer_internals",
    topicId: "ml_transformer_internals",
    title: "Transformer Internals & Tokenization",
    description:
      "Subword segmentation, attention geometry, positional representation, masking, cache behavior, and architecture-level memory tradeoffs.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: ["ml_numerical_tensors", "ml_model_evaluation"],
    x: 1650,
    y: 650,
  },
  {
    id: "ml_llm_serving",
    topicId: "ml_llm_serving",
    title: "LLM Serving Systems",
    description:
      "Memory-block allocation, iterative batching, request scheduling, prefix reuse, speculative execution, capacity objectives, and fairness.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: [
      "ml_inference_serving",
      "ml_accelerator_performance",
      "ml_transformer_internals",
    ],
    x: 1650,
    y: 1320,
  },
  {
    id: "ml_vector_retrieval",
    topicId: "ml_vector_retrieval",
    title: "Retrieval & Vector Data Systems",
    description:
      "Embedding lifecycle, exact and approximate search, index quality, filtering, freshness, evaluation, mutation, and multi-tenant operations.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: ["ml_data_contracts_splits", "ml_inference_serving"],
    x: 1650,
    y: 1130,
  },
  {
    id: "ml_tree_ensemble_systems",
    topicId: "ml_tree_ensemble_systems",
    title: "Tree-Ensemble Systems",
    description:
      "Split objectives, histogram construction, missing-value routing, inference layout, serving constraints, and model-specific monitoring.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: ["ml_model_evaluation"],
    x: 180,
    y: 540,
  },
  {
    id: "ml_vision_sequence_models",
    topicId: "ml_vision_sequence_models",
    title: "Vision & Sequence Model Internals",
    description:
      "Convolution and sequence state, layout and padding semantics, receptive fields, batching, memory, and model-family tradeoffs.",
    family: "electives",
    difficulty: "Hard",
    prerequisites: ["ml_numerical_tensors", "ml_model_evaluation"],
    x: 180,
    y: 730,
  },
];

export const ML_INFRA_TREE_PLACEMENT_MAP = indexPlacements(ML_INFRA_TREE_PLACEMENTS);
