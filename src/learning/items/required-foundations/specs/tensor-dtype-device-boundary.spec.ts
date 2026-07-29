import { tensorDtypeDeviceBoundary } from "../tensor-dtype-device-boundary";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(tensorDtypeDeviceBoundary, {
  id: "tensor-dtype-device-boundary",
  kind: "trace",
  snapshotKind: "matrix",
  contractTerm: "nbytes",
});
