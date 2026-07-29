import { evaluationCalibrationSlices } from "../evaluation-calibration-slices";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(evaluationCalibrationSlices, {
  id: "evaluation-calibration-slices",
  kind: "calculator",
  snapshotKind: "matrix",
  contractTerm: "Brier",
});
