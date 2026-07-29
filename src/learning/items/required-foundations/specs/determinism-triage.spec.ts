import { determinismTriage } from "../determinism-triage";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(determinismTriage, {
  id: "determinism-triage",
  kind: "scenario",
  snapshotKind: "array",
  contractTerm: "missing",
});
