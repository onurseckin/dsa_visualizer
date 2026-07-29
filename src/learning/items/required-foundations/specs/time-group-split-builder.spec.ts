import { timeGroupSplitBuilder } from "../time-group-split-builder";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(timeGroupSplitBuilder, {
  id: "time-group-split-builder",
  kind: "trace",
  snapshotKind: "graph",
  contractTerm: "dropped_groups",
});
