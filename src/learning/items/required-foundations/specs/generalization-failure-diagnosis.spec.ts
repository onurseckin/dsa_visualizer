import { generalizationFailureDiagnosis } from "../generalization-failure-diagnosis";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(generalizationFailureDiagnosis, {
  id: "generalization-failure-diagnosis",
  kind: "debugging",
  snapshotKind: "array",
  contractTerm: "split-shift",
});
