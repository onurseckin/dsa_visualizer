import {
  defineScenarioItem,
  functionExecution,
  graphSteps,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "lineage_order";

const code = `def lineage_order(record):
    artifacts = sorted(record["artifacts"])
    adjacency = {artifact: [] for artifact in artifacts}
    indegree = {artifact: 0 for artifact in artifacts}
    for upstream, downstream in record["edges"]:
        adjacency[upstream].append(downstream)
        indegree[downstream] += 1
    ready = sorted(artifact for artifact in artifacts if indegree[artifact] == 0)
    order = []
    while ready:
        artifact = ready.pop(0)
        order.append(artifact)
        for downstream in sorted(adjacency[artifact]):
            indegree[downstream] -= 1
            if indegree[downstream] == 0:
                ready.append(downstream)
                ready.sort()
    return order if len(order) == len(artifacts) else []`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return a deterministic lexicographically tie-broken topological artifact order, or [] when lineage contains a cycle.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return the lexicographically tie-broken topological order for all artifacts; return [] if no complete acyclic order exists.",
  cases: [
    {
      id: "linear-lineage",
      label: "Dataset to model chain",
      input: {
        artifacts: ["model", "features", "dataset"],
        edges: [
          ["dataset", "features"],
          ["features", "model"],
        ],
      },
      expected: ["dataset", "features", "model"],
      comparison: "deep-equal",
    },
    {
      id: "branching-lineage",
      label: "Two roots feed one model",
      input: {
        artifacts: ["model", "schema", "features", "dataset"],
        edges: [
          ["dataset", "features"],
          ["features", "model"],
          ["schema", "model"],
        ],
      },
      expected: ["dataset", "features", "schema", "model"],
      comparison: "deep-equal",
    },
    {
      id: "cyclic-lineage",
      label: "Invalid cyclic lineage",
      input: {
        artifacts: ["a", "b", "c"],
        edges: [
          ["a", "b"],
          ["b", "c"],
          ["c", "a"],
        ],
      },
      expected: [],
      comparison: "deep-equal",
    },
  ],
});

const lineageNodes = [
  { id: "dataset", label: "Dataset" },
  { id: "schema", label: "Schema" },
  { id: "features", label: "Features" },
  { id: "model", label: "Model" },
] as const;
const lineageEdges = [
  { from: "dataset", to: "features" },
  { from: "features", to: "model" },
  { from: "schema", to: "model" },
] as const;

export const datasetLineageGraph = defineScenarioItem({
  id: "dataset-lineage-graph",
  title: "Dataset Lineage Graph",
  topicIds: ["ml_data_contracts_splits"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Reason about artifact provenance as an acyclic production graph with explicit producing and consuming edges.",
  objective:
    "Design lineage evidence that answers which inputs, schemas, and transformations produced a model artifact.",
  completionEvidence:
    "A rubric-scored lineage repair and a passing deterministic graph validator for chain, branch, and cycle cases.",
  sources: [
    verifiedSource({
      label: "ML Metadata",
      url: "https://www.tensorflow.org/tfx/guide/mlmd",
    }),
  ],
  prompt: {
    context:
      "A model in the registry has a training run ID but no links to the dataset snapshot, schema, or feature transformation artifact. A retry also overwrote one mutable output path.",
    question:
      "Design the minimum lineage graph and immutable identities needed to reproduce and audit this model. Explain how you would detect a cycle or overwritten artifact.",
    constraints: [
      "Distinguish artifacts from executions.",
      "Every promoted model must reach immutable upstream inputs.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "artifact-execution-boundary",
        label: "Artifact and execution boundary",
        description: "Separates immutable artifact identities from producing executions.",
        points: 3,
        critical: true,
      },
      {
        id: "complete-upstream-path",
        label: "Complete upstream path",
        description: "Connects model, features, schema, and dataset snapshot.",
        points: 2,
      },
      {
        id: "graph-integrity",
        label: "Graph integrity",
        description: "Rejects cycles and mutable identity reuse.",
        points: 2,
        critical: true,
      },
    ],
  },
  playground: {
    code,
    starterCode,
    execution,
    generateSteps: (input) =>
      inputEvidenceSteps(
        graphSteps([
          {
            codeLine: 2,
            what: "Register each immutable artifact as a lineage node.",
            why: "Stable artifact identity is required before provenance edges are meaningful.",
            nodes: lineageNodes,
            edges: [],
            activeNodeIds: ["dataset", "schema"],
          },
          {
            codeLine: 5,
            what: "Add directed producing and consuming edges.",
            why: "Edges establish which exact upstream evidence generated each downstream artifact.",
            nodes: lineageNodes,
            edges: lineageEdges,
            activeNodeIds: ["features"],
            traversedEdgeIndexes: [0],
          },
          {
            codeLine: 18,
            what: "Complete an acyclic topological audit order.",
            why: "Failure to visit every artifact exposes a cycle in the claimed provenance.",
            nodes: lineageNodes,
            edges: lineageEdges,
            completedNodeIds: ["dataset", "schema", "features", "model"],
            traversedEdgeIndexes: [0, 1, 2],
            variables: { invariant: "every model reaches immutable roots" },
          },
        ]),
        input,
        ["artifacts", "edges"],
        execution.cases,
      ),
  },
  assessmentPayload: {
    variant: "orphaned-model-artifact",
    changedContext: true,
    isomorphicRetest: true,
    consequences:
      "A run ID without immutable upstream edges cannot establish which data and transformations produced the promoted model.",
  },
});
