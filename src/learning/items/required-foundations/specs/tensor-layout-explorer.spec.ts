import { tensorLayoutExplorer } from "../tensor-layout-explorer";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(tensorLayoutExplorer, {
  id: "tensor-layout-explorer",
  kind: "trace",
  snapshotKind: "matrix",
  contractTerm: "strides",
});
