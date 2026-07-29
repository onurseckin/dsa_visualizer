import { datasetContractValidator } from "../dataset-contract-validator";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(datasetContractValidator, {
  id: "dataset-contract-validator",
  kind: "debugging",
  snapshotKind: "matrix",
  contractTerm: "exact",
});
