import { stableSoftmaxRepair } from "../stable-softmax-repair";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(stableSoftmaxRepair, {
  id: "stable-softmax-repair",
  kind: "debugging",
  snapshotKind: "array",
  contractTerm: "Subtract",
});
