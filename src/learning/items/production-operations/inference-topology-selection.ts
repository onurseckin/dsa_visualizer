import {
  defineScenarioItem,
  functionExecution,
  graphSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def select_inference_topology(request):
    if request.get("continuous_stream"):
        return {"topology": "streaming", "freshness": "seconds", "delivery": "ordered-stream", "reason": "continuous-events"}
    if request.get("response_required_inline"):
        return {"topology": "online", "freshness": "milliseconds", "delivery": "request-response", "reason": "interactive-response"}
    if request.get("durable_per_request"):
        return {"topology": "asynchronous", "freshness": "minutes", "delivery": "durable-queue", "reason": "response-not-required-inline"}
    return {"topology": "batch", "freshness": "scheduled", "delivery": "materialized-output", "reason": "amortize-high-volume"}`;

const execution = functionExecution({
  entrypoint: "select_inference_topology",
  outputContract:
    "Return topology, freshness class, delivery semantics, and the dominant reason without assuming synchronous online serving.",
  cases: [
    {
      id: "nightly-batch",
      label: "Nightly portfolio scoring",
      input: { volume: 1_000_000, freshness_hours: 24 },
      expected: {
        topology: "batch",
        freshness: "scheduled",
        delivery: "materialized-output",
        reason: "amortize-high-volume",
      },
      comparison: "deep-equal",
    },
    {
      id: "durable-async",
      label: "Durable document analysis",
      input: { durable_per_request: true, response_required_inline: false },
      expected: {
        topology: "asynchronous",
        freshness: "minutes",
        delivery: "durable-queue",
        reason: "response-not-required-inline",
      },
      comparison: "deep-equal",
    },
    {
      id: "interactive-online",
      label: "Interactive fraud decision",
      input: { response_required_inline: true, p95_ms: 80 },
      expected: {
        topology: "online",
        freshness: "milliseconds",
        delivery: "request-response",
        reason: "interactive-response",
      },
      comparison: "deep-equal",
    },
    {
      id: "event-stream",
      label: "Continuous sensor inference",
      input: { continuous_stream: true, ordered: true },
      expected: {
        topology: "streaming",
        freshness: "seconds",
        delivery: "ordered-stream",
        reason: "continuous-events",
      },
      comparison: "deep-equal",
    },
  ],
});

export const inferenceTopologySelection = defineScenarioItem({
  id: "inference-topology-selection",
  title: "Choose an Inference Topology",
  topicIds: ["ml_inference_serving"],
  difficultyProfile: profile(2, 2, 2, 3),
  description:
    "Choose batch, asynchronous, online request/response, or streaming inference from freshness, response, volume, ordering, and failure semantics.",
  objective:
    "Match product delivery semantics to the least complex inference topology that satisfies freshness and durability requirements.",
  completionEvidence:
    "The rationale states delivery and failure semantics, rejects an unnecessary synchronous endpoint, and identifies the constraint that changes the topology.",
  sources: [
    verifiedSource({
      label: "Google static versus dynamic inference",
      url: "https://developers.google.com/machine-learning/crash-course/production-ml-systems/static-vs-dynamic-inference",
    }),
  ],
  prompt: {
    context:
      "A product changes from an interactive prediction to a durable, minutes-latency document-processing workflow.",
    question:
      "Which topology now fits, how are results delivered, and why are the other three modes less appropriate?",
    constraints: [
      "Failure semantics and result delivery are part of the contract.",
      "Do not put every model behind synchronous request/response.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "semantic-fit",
        label: "Semantic fit",
        description: "Connects freshness, response, ordering, and durability to the selected mode.",
        points: 3,
        critical: true,
      },
      {
        id: "failure-contract",
        label: "Failure contract",
        description: "Specifies retry, duplication, and result-delivery behavior.",
        points: 2,
        critical: true,
      },
      {
        id: "alternatives",
        label: "Rejected alternatives",
        description: "Explains why the other topologies add risk or miss a requirement.",
        points: 1,
      },
    ],
  },
  playground: {
    code,
    starterCode: semanticStarter({
      entrypoint: "select_inference_topology",
      parameters: ["request"],
      contract: "Return topology, freshness, delivery, and reason from product constraints.",
    }),
    execution,
    generateSteps: () =>
      graphSteps([
        {
          codeLine: 2,
          what: "Test continuous ordered event semantics.",
          why: "Streaming is selected by event continuity, not simply high volume.",
          nodes: [
            { id: "constraints", label: "Constraints" },
            { id: "stream", label: "Streaming" },
            { id: "online", label: "Online" },
            { id: "async", label: "Async" },
            { id: "batch", label: "Batch" },
          ],
          edges: [
            { from: "constraints", to: "stream" },
            { from: "constraints", to: "online" },
            { from: "constraints", to: "async" },
            { from: "constraints", to: "batch" },
          ],
          activeNodeIds: ["constraints", "stream"],
          traversedEdgeIndexes: [0],
        },
        {
          codeLine: 4,
          what: "Test whether the response is required inline.",
          why: "Interactive coupling creates the online latency and availability contract.",
          nodes: [
            { id: "constraints", label: "Constraints" },
            { id: "stream", label: "Streaming rejected" },
            { id: "online", label: "Online" },
            { id: "async", label: "Async" },
            { id: "batch", label: "Batch" },
          ],
          edges: [
            { from: "constraints", to: "stream" },
            { from: "constraints", to: "online" },
            { from: "constraints", to: "async" },
            { from: "constraints", to: "batch" },
          ],
          activeNodeIds: ["online"],
          completedNodeIds: ["stream"],
          traversedEdgeIndexes: [1],
        },
        {
          codeLine: 6,
          what: "Select a durable asynchronous request boundary.",
          why: "Minutes of latency and per-request durability do not require inline coupling.",
          nodes: [
            { id: "constraints", label: "Constraints" },
            { id: "stream", label: "Streaming rejected" },
            { id: "online", label: "Online rejected" },
            { id: "async", label: "Async selected" },
            { id: "batch", label: "Batch" },
          ],
          edges: [
            { from: "constraints", to: "stream" },
            { from: "constraints", to: "online" },
            { from: "constraints", to: "async" },
            { from: "constraints", to: "batch" },
          ],
          activeNodeIds: ["async"],
          completedNodeIds: ["stream", "online"],
          traversedEdgeIndexes: [2],
        },
      ]),
  },
  assessmentPayload: {
    variant: "changed-delivery-semantics",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["batch", "asynchronous", "online", "streaming"],
    consequences:
      "Choosing online serving unnecessarily couples product availability and tail latency to model execution.",
  },
});
