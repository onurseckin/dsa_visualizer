import { trainingLoopState } from "../training-loop-state";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(trainingLoopState, {
  id: "training-loop-state",
  kind: "debugging",
  snapshotKind: "array",
  contractTerm: "velocity",
});
