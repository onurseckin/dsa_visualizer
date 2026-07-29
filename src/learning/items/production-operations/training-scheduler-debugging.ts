import {
  defineDebuggingItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def diagnose_scheduler_events(request):
    events = set(request["events"])
    if "quota_exceeded" in events:
        return {"phase": "admission", "diagnosis": "quota-exhausted", "recovery": "reduce-request-or-raise-quota", "checkpoint_usable": False}
    if "topology_unsatisfied" in events:
        return {"phase": "placement", "diagnosis": "topology-constraint", "recovery": "change-placement-or-capacity", "checkpoint_usable": False}
    if "oom_killed" in events:
        return {"phase": "execution", "diagnosis": "memory-exhausted", "recovery": "reduce-memory-or-resize", "checkpoint_usable": bool(request.get("checkpoint_valid"))}
    if "evicted" in events:
        return {"phase": "execution", "diagnosis": "evicted", "recovery": "resume-from-checkpoint", "checkpoint_usable": bool(request.get("checkpoint_valid"))}
    if "data_locality_miss" in events:
        return {"phase": "startup", "diagnosis": "data-locality", "recovery": "stage-data-near-compute", "checkpoint_usable": False}
    return {"phase": "unknown", "diagnosis": "insufficient-evidence", "recovery": "collect-events-and-metrics", "checkpoint_usable": False}`;

const execution = functionExecution({
  entrypoint: "diagnose_scheduler_events",
  outputContract:
    "Return the earliest failing scheduler phase, evidence-backed diagnosis, safe recovery, and whether a checkpoint can be used.",
  cases: [
    {
      id: "quota-starvation",
      label: "Job rejected by quota",
      input: { events: ["pending", "quota_exceeded", "topology_unsatisfied"] },
      expected: {
        phase: "admission",
        diagnosis: "quota-exhausted",
        recovery: "reduce-request-or-raise-quota",
        checkpoint_usable: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "oom-after-start",
      label: "Workload OOM after placement",
      input: { events: ["scheduled", "started", "oom_killed"], checkpoint_valid: true },
      expected: {
        phase: "execution",
        diagnosis: "memory-exhausted",
        recovery: "reduce-memory-or-resize",
        checkpoint_usable: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "preempted",
      label: "Preemptible job evicted",
      input: { events: ["scheduled", "started", "evicted"], checkpoint_valid: true },
      expected: {
        phase: "execution",
        diagnosis: "evicted",
        recovery: "resume-from-checkpoint",
        checkpoint_usable: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "locality",
      label: "Remote data startup bottleneck",
      input: { events: ["scheduled", "data_locality_miss"] },
      expected: {
        phase: "startup",
        diagnosis: "data-locality",
        recovery: "stage-data-near-compute",
        checkpoint_usable: false,
      },
      comparison: "deep-equal",
    },
  ],
});

export const trainingSchedulerDebugging = defineDebuggingItem({
  id: "training-scheduler-debugging",
  title: "Debug Training Scheduler Evidence",
  topicIds: ["ml_training_platform"],
  difficultyProfile: profile(2, 3, 3, 2),
  description:
    "Distinguish admission, placement, startup, execution, and recovery failures from ordered scheduler and workload evidence.",
  objective:
    "Identify the earliest violated scheduling invariant and choose a recovery that preserves valid work without masking the cause.",
  completionEvidence:
    "The diagnosis cites a concrete event, separates scheduler from workload failure, and states whether a checkpoint is safe to resume.",
  sources: [
    verifiedSource({
      label: "Kubernetes scheduling GPUs",
      url: "https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "diagnose_scheduler_events",
    parameters: ["request"],
    contract: "Return phase, diagnosis, recovery, and checkpoint_usable from scheduler evidence.",
  }),
  execution,
  generateSteps: () =>
    graphSteps([
      {
        codeLine: 2,
        what: "Inspect admission evidence first.",
        why: "A rejected job never reaches placement or execution.",
        nodes: [
          { id: "admission", label: "Admission" },
          { id: "placement", label: "Placement" },
          { id: "execution", label: "Execution" },
          { id: "recovery", label: "Recovery" },
        ],
        edges: [
          { from: "admission", to: "placement" },
          { from: "placement", to: "execution" },
          { from: "execution", to: "recovery" },
        ],
        activeNodeIds: ["admission"],
      },
      {
        codeLine: 5,
        what: "Separate placement constraints from runtime failures.",
        why: "Topology and quota fixes do not repair an OOMing workload.",
        nodes: [
          { id: "admission", label: "Admitted" },
          { id: "placement", label: "Placement" },
          { id: "execution", label: "Execution" },
          { id: "recovery", label: "Recovery" },
        ],
        edges: [
          { from: "admission", to: "placement" },
          { from: "placement", to: "execution" },
          { from: "execution", to: "recovery" },
        ],
        completedNodeIds: ["admission"],
        activeNodeIds: ["placement"],
        traversedEdgeIndexes: [0],
      },
      {
        codeLine: 8,
        what: "Diagnose workload execution evidence.",
        why: "OOM and eviction have different remediations despite similar termination.",
        nodes: [
          { id: "admission", label: "Admitted" },
          { id: "placement", label: "Placed" },
          { id: "execution", label: "Failed workload" },
          { id: "recovery", label: "Recovery" },
        ],
        edges: [
          { from: "admission", to: "placement" },
          { from: "placement", to: "execution" },
          { from: "execution", to: "recovery" },
        ],
        completedNodeIds: ["admission", "placement"],
        activeNodeIds: ["execution"],
        traversedEdgeIndexes: [0, 1],
      },
      {
        codeLine: 11,
        what: "Gate resume on checkpoint evidence.",
        why: "A recovery is safe only when the checkpoint is valid for this job.",
        nodes: [
          { id: "admission", label: "Admitted" },
          { id: "placement", label: "Placed" },
          { id: "execution", label: "Failed workload" },
          { id: "recovery", label: "Verified recovery" },
        ],
        edges: [
          { from: "admission", to: "placement" },
          { from: "placement", to: "execution" },
          { from: "execution", to: "recovery" },
        ],
        completedNodeIds: ["admission", "placement", "execution"],
        activeNodeIds: ["recovery"],
        traversedEdgeIndexes: [0, 1, 2],
      },
    ]),
  assessmentPayload: {
    variant: "changed-scheduler-evidence",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def diagnose_scheduler_events(request):
    if "pending" in request["events"]:
        return {"diagnosis": "add-more-gpus"}
    return {"diagnosis": "retry"}`,
    evidence: [
      {
        label: "Admission event",
        content: "Requested accelerators exceed the namespace quota before binding.",
      },
      {
        label: "Workload event",
        content: "No container was started and no checkpoint was written.",
      },
    ],
    failingTests: [
      "Quota rejection must not be classified as topology or workload failure.",
      "Resume requires a valid checkpoint.",
    ],
    hints: [
      "Order evidence by lifecycle phase.",
      "Distinguish requested capacity from busy utilization.",
    ],
  },
});
