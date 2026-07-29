import { activationCheckpointTradeoff } from "./activation-checkpoint-tradeoff";
import { baselineModelSelection } from "./baseline-model-selection";
import { datasetContractValidator } from "./dataset-contract-validator";
import { datasetLineageGraph } from "./dataset-lineage-graph";
import { determinismTriage } from "./determinism-triage";
import { evaluationCalibrationSlices } from "./evaluation-calibration-slices";
import { generalizationFailureDiagnosis } from "./generalization-failure-diagnosis";
import { leakageProxyDebugging } from "./leakage-proxy-debugging";
import { metricThresholdGuardrails } from "./metric-threshold-guardrails";
import { mlTargetFeedbackLoop } from "./ml-target-feedback-loop";
import { precisionPolicy } from "./precision-policy";
import { reproduciblePythonEnvironment } from "./reproducible-python-environment";
import { reverseModeAutodiff } from "./reverse-mode-autodiff";
import { stableSoftmaxRepair } from "./stable-softmax-repair";
import { tensorDtypeDeviceBoundary } from "./tensor-dtype-device-boundary";
import { tensorLayoutExplorer } from "./tensor-layout-explorer";
import { timeGroupSplitBuilder } from "./time-group-split-builder";
import { trainingLoopState } from "./training-loop-state";

export const REQUIRED_FOUNDATION_ITEMS = Object.freeze([
  reproduciblePythonEnvironment,
  tensorDtypeDeviceBoundary,
  determinismTriage,
  mlTargetFeedbackLoop,
  metricThresholdGuardrails,
  leakageProxyDebugging,
  datasetContractValidator,
  timeGroupSplitBuilder,
  datasetLineageGraph,
  tensorLayoutExplorer,
  stableSoftmaxRepair,
  precisionPolicy,
  baselineModelSelection,
  evaluationCalibrationSlices,
  generalizationFailureDiagnosis,
  reverseModeAutodiff,
  trainingLoopState,
  activationCheckpointTradeoff,
] as const);

export {
  activationCheckpointTradeoff,
  baselineModelSelection,
  datasetContractValidator,
  datasetLineageGraph,
  determinismTriage,
  evaluationCalibrationSlices,
  generalizationFailureDiagnosis,
  leakageProxyDebugging,
  metricThresholdGuardrails,
  mlTargetFeedbackLoop,
  precisionPolicy,
  reproduciblePythonEnvironment,
  reverseModeAutodiff,
  stableSoftmaxRepair,
  tensorDtypeDeviceBoundary,
  tensorLayoutExplorer,
  timeGroupSplitBuilder,
  trainingLoopState,
};
