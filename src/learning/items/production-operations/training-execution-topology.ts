import {
  defineScenarioItem,
  functionExecution,
  graphSteps,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def select_training_topology(request):
    checkpoint_required = bool(request.get("preemptible") or request.get("hours", 0) >= 2)
    if request.get("gang_scheduling") or request.get("topology_control"):
        reasons = []
        if request.get("gang_scheduling"):
            reasons.append("gang-scheduling")
        if request.get("topology_control"):
            reasons.append("topology-control")
        if checkpoint_required:
            reasons.append("preemption-recovery")
        return {"topology": "kubernetes", "checkpoint_required": checkpoint_required, "reasons": reasons}
    if request.get("managed_operations"):
        return {"topology": "managed", "checkpoint_required": checkpoint_required, "reasons": ["minimal-platform-operations"]}
    if request.get("scheduled") or request.get("gpus", 0) > 1:
        return {"topology": "batch", "checkpoint_required": checkpoint_required, "reasons": ["queued-capacity"]}
    return {"topology": "local", "checkpoint_required": checkpoint_required, "reasons": ["single-host-development"]}`;

const execution = functionExecution({
  entrypoint: "select_training_topology",
  outputContract:
    "Return topology, checkpoint_required, and ordered reasons derived from execution and organizational constraints.",
  cases: [
    {
      id: "local-prototype",
      label: "Single-host prototype",
      input: { gpus: 0, hours: 0.25 },
      expected: {
        topology: "local",
        checkpoint_required: false,
        reasons: ["single-host-development"],
      },
      comparison: "deep-equal",
    },
    {
      id: "batch-training",
      label: "Queued multi-GPU training",
      input: { gpus: 4, hours: 6, scheduled: true },
      expected: {
        topology: "batch",
        checkpoint_required: true,
        reasons: ["queued-capacity"],
      },
      comparison: "deep-equal",
    },
    {
      id: "gang-scheduled",
      label: "Gang-scheduled preemptible job",
      input: {
        gpus: 8,
        hours: 12,
        gang_scheduling: true,
        topology_control: true,
        preemptible: true,
      },
      expected: {
        topology: "kubernetes",
        checkpoint_required: true,
        reasons: ["gang-scheduling", "topology-control", "preemption-recovery"],
      },
      comparison: "deep-equal",
    },
    {
      id: "managed-team",
      label: "Small team with managed operations",
      input: { gpus: 1, hours: 3, managed_operations: true },
      expected: {
        topology: "managed",
        checkpoint_required: true,
        reasons: ["minimal-platform-operations"],
      },
      comparison: "deep-equal",
    },
  ],
});

export const trainingExecutionTopology = defineScenarioItem({
  id: "training-execution-topology",
  title: "Choose a Training Execution Topology",
  topicIds: ["ml_training_platform"],
  difficultyProfile: profile(2, 2, 2, 3),
  description:
    "Choose among local, queued batch, Kubernetes, and managed execution without equating a vendor product with a workload requirement.",
  objective:
    "Translate workload scale, scheduling, topology, preemption, and team-operability constraints into a defensible execution topology.",
  completionEvidence:
    "A rationale names the selected boundary, checkpoint obligations, rejected alternatives, and the constraint that would change the choice.",
  sources: [
    verifiedSource({
      label: "Kubeflow Trainer overview",
      url: "https://www.kubeflow.org/docs/components/trainer/overview/",
    }),
  ],
  prompt: {
    context:
      "A team must run a changed training workload with explicit capacity, recovery, and platform-ownership constraints.",
    question:
      "Which execution topology fits, which alternatives fail a constraint, and what recovery contract is required?",
    constraints: [
      "Do not assume Kubernetes is required for every GPU job.",
      "Treat preemption recovery and operational ownership as first-class constraints.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "constraint-fit",
        label: "Constraint fit",
        description: "Connects the selected topology to workload and organization constraints.",
        points: 3,
        critical: true,
      },
      {
        id: "recovery",
        label: "Recovery contract",
        description: "Specifies checkpoint and retry behavior for interruption.",
        points: 2,
        critical: true,
      },
      {
        id: "counterfactual",
        label: "Counterfactual",
        description: "Names a changed constraint that would select another topology.",
        points: 1,
      },
    ],
  },
  playground: {
    code,
    starterCode: semanticStarter({
      entrypoint: "select_training_topology",
      parameters: ["request"],
      contract:
        "Return topology, checkpoint_required, and ordered reasons from the supplied constraints.",
    }),
    execution,
    generateSteps: (input) =>
      inputEvidenceSteps(
        graphSteps([
          {
            codeLine: 2,
            what: "Start from workload and recovery constraints.",
            why: "Execution topology is downstream of workload semantics.",
            nodes: [
              { id: "workload", label: "Workload" },
              { id: "recovery", label: "Recovery" },
              { id: "topology", label: "Topology" },
            ],
            edges: [
              { from: "workload", to: "topology" },
              { from: "recovery", to: "topology" },
            ],
            activeNodeIds: ["workload"],
          },
          {
            codeLine: 3,
            what: "Make checkpoint need explicit.",
            why: "Long or preemptible jobs need a restart boundary independent of platform.",
            nodes: [
              { id: "workload", label: "Workload" },
              { id: "recovery", label: "Checkpoint" },
              { id: "topology", label: "Topology" },
            ],
            edges: [
              { from: "workload", to: "topology" },
              { from: "recovery", to: "topology" },
            ],
            activeNodeIds: ["recovery"],
            traversedEdgeIndexes: [0],
          },
          {
            codeLine: 13,
            what: "Select the smallest topology satisfying all constraints.",
            why: "The invariant is constraint coverage, not platform sophistication.",
            nodes: [
              { id: "workload", label: "Workload" },
              { id: "recovery", label: "Checkpoint" },
              { id: "topology", label: "Selected" },
            ],
            edges: [
              { from: "workload", to: "topology" },
              { from: "recovery", to: "topology" },
            ],
            activeNodeIds: ["topology"],
            completedNodeIds: ["workload", "recovery"],
            traversedEdgeIndexes: [0, 1],
          },
        ]),
        input,
        ["gpus", "hours", "scheduled"],
        execution.cases,
      ),
  },
  assessmentPayload: {
    variant: "changed-execution-constraints",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["local", "batch", "kubernetes", "managed"],
    consequences:
      "A topology that misses recovery, topology placement, or operational ownership is not acceptable even if it can start the job.",
  },
});
