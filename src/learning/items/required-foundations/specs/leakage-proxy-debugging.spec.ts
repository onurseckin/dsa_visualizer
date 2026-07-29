import { leakageProxyDebugging } from "../leakage-proxy-debugging";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(leakageProxyDebugging, {
  id: "leakage-proxy-debugging",
  kind: "debugging",
  snapshotKind: "array",
  contractTerm: "target_derived",
});
