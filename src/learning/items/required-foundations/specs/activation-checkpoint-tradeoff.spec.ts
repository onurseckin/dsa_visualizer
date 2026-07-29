import { activationCheckpointTradeoff } from "../activation-checkpoint-tradeoff";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(activationCheckpointTradeoff, {
  id: "activation-checkpoint-tradeoff",
  kind: "calculator",
  snapshotKind: "array",
  contractTerm: "recomputed_layers",
});
