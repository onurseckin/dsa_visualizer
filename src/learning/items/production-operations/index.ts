import type { LearningItem } from "../../types";
import { driftAlertCalibration } from "./drift-alert-calibration";
import { inferenceSloCapacity } from "./inference-slo-capacity";
import { inferenceTopologySelection } from "./inference-topology-selection";
import { mlCostAttribution } from "./ml-cost-attribution";
import { mlIncidentResponse } from "./ml-incident-response";
import { mlObservabilitySignals } from "./ml-observability-signals";
import { mlSystemThreatModel } from "./ml-system-threat-model";
import { modelPackageContract } from "./model-package-contract";
import { modelPromotionGate } from "./model-promotion-gate";
import { modelRegistryStateMachine } from "./model-registry-state-machine";
import { rolloutRegressionDebugging } from "./rollout-regression-debugging";
import { sensitiveDataGovernance } from "./sensitive-data-governance";
import { trainingExecutionTopology } from "./training-execution-topology";
import { trainingResourceSizing } from "./training-resource-sizing";
import { trainingSchedulerDebugging } from "./training-scheduler-debugging";

export {
  driftAlertCalibration,
  inferenceSloCapacity,
  inferenceTopologySelection,
  mlCostAttribution,
  mlIncidentResponse,
  mlObservabilitySignals,
  mlSystemThreatModel,
  modelPackageContract,
  modelPromotionGate,
  modelRegistryStateMachine,
  rolloutRegressionDebugging,
  sensitiveDataGovernance,
  trainingExecutionTopology,
  trainingResourceSizing,
  trainingSchedulerDebugging,
};

export const PRODUCTION_OPERATIONS_EXPECTATIONS = Object.freeze([
  ["training-execution-topology", "ml_training_platform", "scenario"],
  ["training-resource-sizing", "ml_training_platform", "calculator"],
  ["training-scheduler-debugging", "ml_training_platform", "debugging"],
  ["model-package-contract", "ml_model_registry", "debugging"],
  ["model-registry-state-machine", "ml_model_registry", "trace"],
  ["model-promotion-gate", "ml_model_registry", "scenario"],
  ["inference-topology-selection", "ml_inference_serving", "scenario"],
  ["inference-slo-capacity", "ml_inference_serving", "calculator"],
  ["rollout-regression-debugging", "ml_inference_serving", "debugging"],
  ["ml-observability-signals", "ml_observability_incidents", "scenario"],
  ["drift-alert-calibration", "ml_observability_incidents", "calculator"],
  ["ml-incident-response", "ml_observability_incidents", "debugging"],
  ["ml-system-threat-model", "ml_governance_security_cost", "scenario"],
  ["sensitive-data-governance", "ml_governance_security_cost", "debugging"],
  ["ml-cost-attribution", "ml_governance_security_cost", "calculator"],
] as const);

export const PRODUCTION_OPERATIONS_ITEMS = Object.freeze([
  trainingExecutionTopology,
  trainingResourceSizing,
  trainingSchedulerDebugging,
  modelPackageContract,
  modelRegistryStateMachine,
  modelPromotionGate,
  inferenceTopologySelection,
  inferenceSloCapacity,
  rolloutRegressionDebugging,
  mlObservabilitySignals,
  driftAlertCalibration,
  mlIncidentResponse,
  mlSystemThreatModel,
  sensitiveDataGovernance,
  mlCostAttribution,
] satisfies readonly LearningItem[]);
