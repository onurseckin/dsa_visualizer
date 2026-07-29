import { reproduciblePythonEnvironment } from "../reproducible-python-environment";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(reproduciblePythonEnvironment, {
  id: "reproducible-python-environment",
  kind: "debugging",
  snapshotKind: "array",
  contractTerm: "normalized",
});
