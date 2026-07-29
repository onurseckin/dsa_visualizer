import {
  defineTraceItem,
  functionExecution,
  graphSteps,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def apply_registry_events(request):
    transitions = {
        "candidate": {"approve": "approved", "archive": "archived"},
        "approved": {"deploy": "deployed", "deprecate": "deprecated"},
        "deployed": {"deprecate": "deprecated"},
        "deprecated": {"archive": "archived"},
        "archived": {},
    }
    state = request.get("initial", "candidate")
    history = [state]
    for event in request["events"]:
        next_state = transitions.get(state, {}).get(event)
        if next_state is None:
            return {"state": state, "accepted": False, "history": history, "rejected_event": event}
        state = next_state
        history.append(state)
    return {"state": state, "accepted": True, "history": history, "rejected_event": None}`;

const execution = functionExecution({
  entrypoint: "apply_registry_events",
  outputContract:
    "Return final state, whether every event was accepted, the immutable-version state history, and the first rejected event.",
  cases: [
    {
      id: "deploy-approved",
      label: "Approve then deploy a candidate",
      input: { initial: "candidate", events: ["approve", "deploy"] },
      expected: {
        state: "deployed",
        accepted: true,
        history: ["candidate", "approved", "deployed"],
        rejected_event: null,
      },
      comparison: "deep-equal",
    },
    {
      id: "skip-approval",
      label: "Attempt deployment without approval",
      input: { initial: "candidate", events: ["deploy"] },
      expected: {
        state: "candidate",
        accepted: false,
        history: ["candidate"],
        rejected_event: "deploy",
      },
      comparison: "deep-equal",
    },
    {
      id: "retire-version",
      label: "Deprecate and archive a deployed version",
      input: { initial: "deployed", events: ["deprecate", "archive"] },
      expected: {
        state: "archived",
        accepted: true,
        history: ["deployed", "deprecated", "archived"],
        rejected_event: null,
      },
      comparison: "deep-equal",
    },
    {
      id: "archive-terminal",
      label: "Reject changes to an archived version",
      input: { initial: "archived", events: ["approve"] },
      expected: {
        state: "archived",
        accepted: false,
        history: ["archived"],
        rejected_event: "approve",
      },
      comparison: "deep-equal",
    },
  ],
});

export const modelRegistryStateMachine = defineTraceItem({
  id: "model-registry-state-machine",
  title: "Trace an Immutable Registry Version",
  topicIds: ["ml_model_registry"],
  difficultyProfile: profile(2, 3, 3, 2),
  description:
    "Trace explicit, auditable state transitions for one immutable model version without rewriting its identity or bypassing approval.",
  objective:
    "Apply a release-state machine and reject illegal transitions while preserving the accepted history and evidence boundary.",
  completionEvidence:
    "The learner predicts the next state, identifies the first illegal event, and explains why state changes do not mutate the version artifact.",
  sources: [
    verifiedSource({
      label: "MLflow model registry workflow",
      url: "https://mlflow.org/docs/latest/ml/model-registry/workflow/",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "apply_registry_events",
    parameters: ["request"],
    contract:
      "Return state, accepted, history, and rejected_event after applying legal registry transitions.",
  }),
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      graphSteps([
        {
          codeLine: 2,
          what: "Register an immutable candidate version.",
          why: "Lifecycle state may change, but the version identity and artifact do not.",
          nodes: [
            { id: "candidate", label: "Candidate" },
            { id: "approved", label: "Approved" },
            { id: "deployed", label: "Deployed" },
            { id: "deprecated", label: "Deprecated" },
            { id: "archived", label: "Archived" },
          ],
          edges: [
            { from: "candidate", to: "approved" },
            { from: "approved", to: "deployed" },
            { from: "deployed", to: "deprecated" },
            { from: "deprecated", to: "archived" },
          ],
          activeNodeIds: ["candidate"],
        },
        {
          codeLine: 13,
          what: "Accept approval as an explicit transition.",
          why: "Approval evidence is a gate, not an alias silently moved to any artifact.",
          nodes: [
            { id: "candidate", label: "Candidate" },
            { id: "approved", label: "Approved" },
            { id: "deployed", label: "Deployed" },
            { id: "deprecated", label: "Deprecated" },
            { id: "archived", label: "Archived" },
          ],
          edges: [
            { from: "candidate", to: "approved" },
            { from: "approved", to: "deployed" },
            { from: "deployed", to: "deprecated" },
            { from: "deprecated", to: "archived" },
          ],
          completedNodeIds: ["candidate"],
          activeNodeIds: ["approved"],
          traversedEdgeIndexes: [0],
        },
        {
          codeLine: 16,
          what: "Deploy only the approved version.",
          why: "The accepted history makes the release decision reconstructable.",
          nodes: [
            { id: "candidate", label: "Candidate" },
            { id: "approved", label: "Approved" },
            { id: "deployed", label: "Deployed" },
            { id: "deprecated", label: "Deprecated" },
            { id: "archived", label: "Archived" },
          ],
          edges: [
            { from: "candidate", to: "approved" },
            { from: "approved", to: "deployed" },
            { from: "deployed", to: "deprecated" },
            { from: "deprecated", to: "archived" },
          ],
          completedNodeIds: ["candidate", "approved"],
          activeNodeIds: ["deployed"],
          traversedEdgeIndexes: [0, 1],
        },
        {
          codeLine: 16,
          what: "Retire the deployed version through deprecation and archive.",
          why: "Terminal archival preserves audit history while preventing new promotion.",
          nodes: [
            { id: "candidate", label: "Candidate" },
            { id: "approved", label: "Approved" },
            { id: "deployed", label: "Deployed" },
            { id: "deprecated", label: "Deprecated" },
            { id: "archived", label: "Archived" },
          ],
          edges: [
            { from: "candidate", to: "approved" },
            { from: "approved", to: "deployed" },
            { from: "deployed", to: "deprecated" },
            { from: "deprecated", to: "archived" },
          ],
          completedNodeIds: ["candidate", "approved", "deployed", "deprecated"],
          activeNodeIds: ["archived"],
          traversedEdgeIndexes: [0, 1, 2, 3],
        },
      ]),
      input,
      ["initial", "events"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "changed-registry-events",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict the accepted history and first rejected registry event.",
    currentState: "candidate + [approve, deploy]",
    referenceNextState: "approved after approve; deployed after deploy",
  },
});
