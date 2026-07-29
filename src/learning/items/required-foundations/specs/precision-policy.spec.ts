import { precisionPolicy } from "../precision-policy";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(precisionPolicy, {
  id: "precision-policy",
  kind: "scenario",
  snapshotKind: "quantization",
  contractTerm: "sensitive",
});
