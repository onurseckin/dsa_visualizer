import { reverseModeAutodiff } from "../reverse-mode-autodiff";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(reverseModeAutodiff, {
  id: "reverse-mode-autodiff",
  kind: "trace",
  snapshotKind: "graph",
  contractTerm: "gradients",
});
