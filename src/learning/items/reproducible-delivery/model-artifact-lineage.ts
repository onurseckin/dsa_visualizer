import {
  defineTraceItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def trace_model_lineage(record):
    nodes = {node["id"] for node in record["nodes"]}
    target = record["target"]
    if target not in nodes:
        raise ValueError("target is absent from the lineage graph")
    parents = {node_id: [] for node_id in nodes}
    for edge in record["edges"]:
        if edge["from"] not in nodes or edge["to"] not in nodes:
            raise ValueError("lineage edge references an unknown artifact")
        parents[edge["to"]].append(edge["from"])
    ancestry = set()
    stack = list(parents[target])
    while stack:
        node_id = stack.pop()
        if node_id in ancestry:
            continue
        ancestry.add(node_id)
        stack.extend(parents[node_id])
    return {"target": target, "ancestry": sorted(ancestry)}`;

const execution = functionExecution({
  entrypoint: "trace_model_lineage",
  outputContract:
    "Return the target model artifact and the sorted transitive set of upstream artifact/execution IDs connected by producing lineage edges.",
  cases: [
    {
      id: "full-model-ancestry",
      label: "Model with run, dataset, code, config, and environment ancestry",
      input: {
        target: "model-v17",
        nodes: [
          { id: "dataset-2026-07-15", kind: "dataset", created_at: "2026-07-15T00:00:00Z" },
          { id: "code-8ad2f17", kind: "code", created_at: "2026-07-17T18:10:00Z" },
          { id: "config-c9", kind: "configuration", created_at: "2026-07-17T18:12:00Z" },
          { id: "env-lock-44", kind: "environment", created_at: "2026-07-01T12:00:00Z" },
          { id: "run-301", kind: "execution", created_at: "2026-07-18T09:30:00Z" },
          { id: "model-v17", kind: "model", created_at: "2026-07-18T10:05:00Z" },
        ],
        edges: [
          { from: "dataset-2026-07-15", to: "run-301" },
          { from: "code-8ad2f17", to: "run-301" },
          { from: "config-c9", to: "run-301" },
          { from: "env-lock-44", to: "run-301" },
          { from: "run-301", to: "model-v17" },
        ],
      },
      expected: {
        target: "model-v17",
        ancestry: ["code-8ad2f17", "config-c9", "dataset-2026-07-15", "env-lock-44", "run-301"],
      },
      comparison: "deep-equal",
    },
    {
      id: "dataset-run-model",
      label: "Minimal dataset-to-run-to-model chain",
      input: {
        target: "model-v3",
        nodes: [
          { id: "dataset-s9", kind: "dataset", created_at: "2026-06-01T00:00:00Z" },
          { id: "run-88", kind: "execution", created_at: "2026-06-02T08:00:00Z" },
          { id: "model-v3", kind: "model", created_at: "2026-06-02T09:00:00Z" },
        ],
        edges: [
          { from: "dataset-s9", to: "run-88" },
          { from: "run-88", to: "model-v3" },
        ],
      },
      expected: { target: "model-v3", ancestry: ["dataset-s9", "run-88"] },
      comparison: "deep-equal",
    },
    {
      id: "exclude-unrelated-branch",
      label: "Unrelated experiment branch is excluded",
      input: {
        target: "model-v9",
        nodes: [
          { id: "dataset-a", kind: "dataset", created_at: "2026-05-01T00:00:00Z" },
          { id: "run-a", kind: "execution", created_at: "2026-05-02T00:00:00Z" },
          { id: "model-v9", kind: "model", created_at: "2026-05-02T01:00:00Z" },
          { id: "dataset-b", kind: "dataset", created_at: "2026-05-03T00:00:00Z" },
          { id: "run-b", kind: "execution", created_at: "2026-05-04T00:00:00Z" },
        ],
        edges: [
          { from: "dataset-a", to: "run-a" },
          { from: "run-a", to: "model-v9" },
          { from: "dataset-b", to: "run-b" },
        ],
      },
      expected: { target: "model-v9", ancestry: ["dataset-a", "run-a"] },
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "trace_model_lineage",
  parameters: ["record"],
  contract:
    "Validate the DAG references and return target plus the sorted transitive ancestry that can produce it.",
});

function generateSteps(input: unknown) {
  const record = input as {
    target?: string;
    nodes?: readonly { id: string; kind?: string; created_at?: string }[];
    edges?: readonly { from: string; to: string }[];
  };
  const target = record?.target ?? "model";
  const nodes = (record?.nodes ?? []).map((node) => ({
    id: node.id,
    label: `${node.id}\n${node.created_at ?? "time unknown"}`,
  }));
  const edges = (record?.edges ?? []).map((edge) => ({ ...edge }));
  const direct = edges.filter((edge) => edge.to === target).map((edge) => edge.from);
  const ancestry = new Set(direct);
  for (let changed = true; changed;) {
    changed = false;
    for (const edge of edges) {
      if (ancestry.has(edge.to) && !ancestry.has(edge.from)) {
        ancestry.add(edge.from);
        changed = true;
      }
    }
  }
  return graphSteps([
    {
      codeLine: 2,
      what: "Locate the requested model artifact in the timestamped lineage graph.",
      why: "Ancestry must begin from one immutable artifact identity.",
      nodes,
      edges,
      activeNodeIds: [target],
      variables: { target },
    },
    {
      codeLine: 9,
      what: "Traverse the producing execution edge.",
      why: "Direct parents establish which run or artifact produced the model.",
      nodes,
      edges,
      activeNodeIds: direct,
      completedNodeIds: [target],
      traversedEdgeIndexes: edges
        .map((edge, index) => (edge.to === target ? index : -1))
        .filter((index) => index >= 0),
    },
    {
      codeLine: 13,
      what: "Close transitively over every upstream dependency.",
      why: "Dataset, code, configuration, and environment ancestors are all required for an auditable model.",
      nodes,
      edges,
      completedNodeIds: [target, ...ancestry],
      traversedEdgeIndexes: edges
        .map((edge, index) => (ancestry.has(edge.from) ? index : -1))
        .filter((index) => index >= 0),
    },
  ]);
}

export const modelArtifactLineage = defineTraceItem({
  id: "model-artifact-lineage",
  title: "Model artifact lineage",
  topicIds: ["ml_experiment_lineage"],
  difficultyProfile: profile(2, 3, 2, 2),
  description:
    "Traverse an artifact/execution DAG backward from a model to recover the immutable dataset, code, configuration, environment, and run ancestry.",
  objective:
    "Reconstruct transitive model ancestry while excluding unrelated experiment branches and detecting broken lineage references.",
  completionEvidence:
    "The trace reaches every producing ancestor for changed DAGs, excludes disconnected work, and the canonical implementation passes all typed cases.",
  sources: [
    verifiedSource({
      label: "TensorFlow ML Metadata",
      url: "https://www.tensorflow.org/tfx/guide/mlmd",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps,
  assessmentPayload: {
    variant: "changed-lineage-branch",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict which upstream artifacts belong to the selected model's ancestry.",
    currentState: "A target model and a directed artifact/execution graph are loaded.",
    referenceNextState: "Only transitive producing ancestors are marked complete.",
  },
});
