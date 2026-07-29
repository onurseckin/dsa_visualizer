import { baselineModelSelection } from "../baseline-model-selection";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(baselineModelSelection, {
  id: "baseline-model-selection",
  kind: "scenario",
  snapshotKind: "array",
  contractTerm: "complexity",
});
