import { datasetLineageGraph } from "../dataset-lineage-graph";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(datasetLineageGraph, {
  id: "dataset-lineage-graph",
  kind: "scenario",
  snapshotKind: "graph",
  contractTerm: "topological",
});
