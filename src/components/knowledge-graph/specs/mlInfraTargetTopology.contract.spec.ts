import { describe, expect, it } from "vitest";

import { TOPIC_CATALOG } from "../../../curriculum/topics";
import { ML_INFRA_TREE_PLACEMENTS } from "../mlInfraTree";

const REQUIRED_TOPIC_IDS = [
  "ml_python_scientific_computing",
  "ml_problem_framing",
  "ml_data_contracts_splits",
  "ml_numerical_tensors",
  "ml_model_evaluation",
  "ml_training_autodiff",
  "ml_experiment_lineage",
  "ml_feature_pipelines",
  "ml_workflow_orchestration",
  "ml_training_platform",
  "ml_model_registry",
  "ml_inference_serving",
  "ml_observability_incidents",
  "ml_governance_security_cost",
  "ml_platform_capstone",
] as const;

const ELECTIVE_TOPIC_IDS = [
  "ml_accelerator_performance",
  "ml_distributed_training",
  "ml_compilation_quantization",
  "ml_transformer_internals",
  "ml_llm_serving",
  "ml_vector_retrieval",
  "ml_tree_ensemble_systems",
  "ml_vision_sequence_models",
] as const;

const TARGET_TOPIC_IDS = [...REQUIRED_TOPIC_IDS, ...ELECTIVE_TOPIC_IDS] as const;

const EXPECTED_PREREQUISITES = {
  ml_python_scientific_computing: [],
  ml_problem_framing: ["ml_python_scientific_computing"],
  ml_data_contracts_splits: ["ml_python_scientific_computing"],
  ml_numerical_tensors: ["ml_python_scientific_computing"],
  ml_model_evaluation: ["ml_problem_framing", "ml_data_contracts_splits", "ml_numerical_tensors"],
  ml_training_autodiff: ["ml_numerical_tensors", "ml_model_evaluation"],
  ml_experiment_lineage: ["ml_data_contracts_splits", "ml_model_evaluation"],
  ml_feature_pipelines: ["ml_data_contracts_splits"],
  ml_workflow_orchestration: ["ml_experiment_lineage", "ml_feature_pipelines"],
  ml_training_platform: ["ml_training_autodiff", "ml_workflow_orchestration"],
  ml_model_registry: ["ml_experiment_lineage", "ml_workflow_orchestration"],
  ml_inference_serving: ["ml_model_evaluation", "ml_model_registry"],
  ml_observability_incidents: ["ml_feature_pipelines", "ml_inference_serving"],
  ml_governance_security_cost: [
    "ml_data_contracts_splits",
    "ml_inference_serving",
    "ml_observability_incidents",
  ],
  ml_platform_capstone: [
    "ml_training_platform",
    "ml_model_registry",
    "ml_inference_serving",
    "ml_observability_incidents",
    "ml_governance_security_cost",
  ],
  ml_accelerator_performance: ["ml_numerical_tensors"],
  ml_distributed_training: [
    "ml_training_autodiff",
    "ml_training_platform",
    "ml_accelerator_performance",
  ],
  ml_compilation_quantization: [
    "ml_training_autodiff",
    "ml_model_registry",
    "ml_inference_serving",
  ],
  ml_transformer_internals: ["ml_numerical_tensors", "ml_model_evaluation"],
  ml_llm_serving: [
    "ml_inference_serving",
    "ml_accelerator_performance",
    "ml_transformer_internals",
  ],
  ml_vector_retrieval: ["ml_data_contracts_splits", "ml_inference_serving"],
  ml_tree_ensemble_systems: ["ml_model_evaluation"],
  ml_vision_sequence_models: ["ml_numerical_tensors", "ml_model_evaluation"],
} as const;

const placementById = new Map(
  ML_INFRA_TREE_PLACEMENTS.map((placement) => [placement.id, placement]),
);

function descendantsOf(startId: string): Set<string> {
  const visited = new Set<string>();
  const pending = [startId];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const placement of ML_INFRA_TREE_PLACEMENTS) {
      if (placement.prerequisites.includes(current)) pending.push(placement.id);
    }
  }
  return visited;
}

function ancestorsOf(startId: string): Set<string> {
  const visited = new Set<string>();
  const pending = [startId];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    pending.push(...(placementById.get(current)?.prerequisites ?? []));
  }
  return visited;
}

function hasCycle(): boolean {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const prerequisite of placementById.get(id)?.prerequisites ?? []) {
      if (visit(prerequisite)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  return ML_INFRA_TREE_PLACEMENTS.some((placement) => visit(placement.id));
}

describe("target ML infrastructure curriculum topology", () => {
  it("declares exactly the 23 frozen target ML infrastructure topics", () => {
    const mlCatalogIds = TOPIC_CATALOG.filter((topic) => topic.track === "ml-infra").map(
      (topic) => topic.id,
    );
    const placementTopicIds = ML_INFRA_TREE_PLACEMENTS.map((placement) => placement.topicId);

    expect(mlCatalogIds).toEqual(TARGET_TOPIC_IDS);
    expect(placementTopicIds).toEqual(TARGET_TOPIC_IDS);
  });

  it("contains 15 required placements and 8 elective placements", () => {
    const electivePlacements = ML_INFRA_TREE_PLACEMENTS.filter(
      (placement) => placement.family === "electives",
    );
    const requiredPlacements = ML_INFRA_TREE_PLACEMENTS.filter(
      (placement) => placement.family !== "electives",
    );

    expect(requiredPlacements.map((placement) => placement.id)).toEqual(REQUIRED_TOPIC_IDS);
    expect(electivePlacements.map((placement) => placement.id)).toEqual(ELECTIVE_TOPIC_IDS);
  });

  it("uses the exact ratified prerequisite edges", () => {
    expect(
      Object.fromEntries(
        ML_INFRA_TREE_PLACEMENTS.map((placement) => [placement.id, [...placement.prerequisites]]),
      ),
    ).toEqual(EXPECTED_PREREQUISITES);
  });

  it("is acyclic and makes every target reachable from R1", () => {
    const reachable = descendantsOf("ml_python_scientific_computing");

    expect(reachable).toEqual(new Set(TARGET_TOPIC_IDS));
    expect(hasCycle()).toBe(false);
  });

  it("lets every required topic reach R15 without making an elective an R15 ancestor", () => {
    for (const topicId of REQUIRED_TOPIC_IDS) {
      expect(descendantsOf(topicId)).toContain("ml_platform_capstone");
    }

    const capstoneAncestors = ancestorsOf("ml_platform_capstone");
    expect(ELECTIVE_TOPIC_IDS.filter((topicId) => capstoneAncestors.has(topicId))).toEqual([]);
  });

  it("keeps placement copy lifecycle-focused and vendor-neutral", () => {
    const vendorNames =
      /\b(?:aws|azure|cuda|databricks|gcp|kubernetes|mlflow|onnx|pytorch|sagemaker|tensorflow|tensorrt|triton|vertex|vllm|xgboost)\b/i;

    for (const placement of ML_INFRA_TREE_PLACEMENTS) {
      expect(`${placement.title} ${placement.description}`).not.toMatch(vendorNames);
    }
  });
});
