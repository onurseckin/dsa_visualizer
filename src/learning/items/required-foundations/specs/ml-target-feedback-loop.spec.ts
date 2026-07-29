import { mlTargetFeedbackLoop } from "../ml-target-feedback-loop";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(mlTargetFeedbackLoop, {
  id: "ml-target-feedback-loop",
  kind: "scenario",
  snapshotKind: "array",
  contractTerm: "feedback_delay_days",
});
