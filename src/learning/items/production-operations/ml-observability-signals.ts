import {
  defineScenarioItem,
  functionExecution,
  inputEvidenceSteps,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def separate_ml_signals(request):
    categories = {"service": [], "data": [], "model": [], "fairness": [], "business": []}
    immediate = 0
    delayed = 0
    for signal in request["signals"]:
        categories[signal["category"]].append(signal["name"])
        if signal["delay_hours"] <= 1:
            immediate += 1
        else:
            delayed += 1
    return {**categories, "immediate": immediate, "delayed": delayed}`;

const execution = functionExecution({
  entrypoint: "separate_ml_signals",
  outputContract:
    "Return signal names grouped into service, data, model, fairness, and business categories plus immediate and delayed counts.",
  cases: [
    {
      id: "full-stack",
      label: "Full service-to-business signal set",
      input: {
        signals: [
          { name: "p99_latency", category: "service", owner: "sre", delay_hours: 0 },
          {
            name: "missing_feature_rate",
            category: "data",
            owner: "data-platform",
            delay_hours: 0.5,
          },
          {
            name: "delayed_precision",
            category: "model",
            owner: "ml",
            delay_hours: 24,
          },
          {
            name: "slice_false_negative_rate",
            category: "fairness",
            owner: "risk",
            delay_hours: 48,
          },
          {
            name: "approved_application_rate",
            category: "business",
            owner: "product",
            delay_hours: 12,
          },
        ],
      },
      expected: {
        service: ["p99_latency"],
        data: ["missing_feature_rate"],
        model: ["delayed_precision"],
        fairness: ["slice_false_negative_rate"],
        business: ["approved_application_rate"],
        immediate: 2,
        delayed: 3,
      },
      comparison: "deep-equal",
    },
    {
      id: "service-only",
      label: "Service health is not model quality",
      input: {
        signals: [
          { name: "error_rate", category: "service", owner: "sre", delay_hours: 0 },
          { name: "queue_depth", category: "service", owner: "sre", delay_hours: 0 },
        ],
      },
      expected: {
        service: ["error_rate", "queue_depth"],
        data: [],
        model: [],
        fairness: [],
        business: [],
        immediate: 2,
        delayed: 0,
      },
      comparison: "deep-equal",
    },
    {
      id: "delayed-outcomes",
      label: "Delayed labels and business outcomes",
      input: {
        signals: [
          {
            name: "thirty_day_default",
            category: "model",
            owner: "ml",
            delay_hours: 720,
          },
          {
            name: "retention",
            category: "business",
            owner: "product",
            delay_hours: 168,
          },
          {
            name: "region_recall",
            category: "fairness",
            owner: "risk",
            delay_hours: 720,
          },
        ],
      },
      expected: {
        service: [],
        data: [],
        model: ["thirty_day_default"],
        fairness: ["region_recall"],
        business: ["retention"],
        immediate: 0,
        delayed: 3,
      },
      comparison: "deep-equal",
    },
  ],
});

export const mlObservabilitySignals = defineScenarioItem({
  id: "ml-observability-signals",
  title: "Separate ML Observability Signals",
  topicIds: ["ml_observability_incidents"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Separate service health, data quality, model quality, fairness slices, and business outcomes by owner and evidence latency.",
  objective:
    "Design an observability map that does not confuse a successful HTTP response with a correct, fair, or valuable prediction.",
  completionEvidence:
    "The response assigns each signal an owner and delay, identifies blind periods, and names a service/model counterexample.",
  sources: [
    verifiedSource({
      label: "Google production ML monitoring",
      url: "https://developers.google.com/machine-learning/crash-course/production-ml-systems/monitoring",
    }),
    verifiedSource({
      label: "OpenTelemetry signals",
      url: "https://opentelemetry.io/docs/concepts/signals/",
    }),
  ],
  prompt: {
    context:
      "A prediction endpoint returns HTTP 200 with low latency, while delayed labels and one protected slice are degrading.",
    question:
      "Which signals prove service, data, model, fairness, and business health, who owns each, and when can each be known?",
    constraints: [
      "Service success is not evidence of prediction correctness.",
      "Delayed labels create an explicit observability blind period.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "signal-separation",
        label: "Signal separation",
        description: "Separates all five signal classes without proxying model quality by uptime.",
        points: 3,
        critical: true,
      },
      {
        id: "owners-latency",
        label: "Owners and latency",
        description: "Assigns ownership and evidence delay to each class.",
        points: 2,
        critical: true,
      },
      {
        id: "blind-period",
        label: "Blind-period controls",
        description: "Adds safe leading indicators without mislabeling them as outcomes.",
        points: 1,
      },
    ],
  },
  playground: {
    code,
    starterCode: semanticStarter({
      entrypoint: "separate_ml_signals",
      parameters: ["request"],
      contract:
        "Return five category lists plus immediate and delayed counts from authored signal records.",
    }),
    execution,
    generateSteps: (input) =>
      inputEvidenceSteps(
        matrixSteps([
          {
            codeLine: 2,
            what: "Create distinct service, data, model, fairness, and business lanes.",
            why: "Each lane answers a different health question.",
            values: [
              ["service", "unassigned"],
              ["data", "unassigned"],
              ["model", "unassigned"],
              ["fairness", "unassigned"],
              ["business", "unassigned"],
            ],
            colHeaders: ["signal class", "owner/evidence"],
            activeCells: [[0, 0]],
          },
          {
            codeLine: 6,
            what: "Assign each signal to exactly one semantic class.",
            why: "Clear ownership prevents a green service dashboard from hiding model harm.",
            values: [
              ["service", "SRE"],
              ["data", "data platform"],
              ["model", "ML"],
              ["fairness", "risk"],
              ["business", "product"],
            ],
            colHeaders: ["signal class", "owner/evidence"],
            activeCells: [
              [0, 1],
              [1, 1],
              [2, 1],
              [3, 1],
              [4, 1],
            ],
          },
          {
            codeLine: 7,
            what: "Separate immediate leading signals from delayed outcomes.",
            why: "Alert policy must represent when ground truth becomes available.",
            values: [
              ["service", "immediate"],
              ["data", "immediate"],
              ["model", "delayed labels"],
              ["fairness", "delayed slices"],
              ["business", "delayed outcome"],
            ],
            colHeaders: ["signal class", "latency"],
            completedCells: [
              [0, 1],
              [1, 1],
            ],
            activeCells: [
              [2, 1],
              [3, 1],
              [4, 1],
            ],
          },
        ]),
        input,
        ["signals"],
        execution.cases,
      ),
  },
  assessmentPayload: {
    variant: "changed-signal-delay",
    changedContext: true,
    isomorphicRetest: true,
    choices: [
      "service-health-only",
      "separate-owned-signal-lanes",
      "retrain-on-every-distribution-change",
    ],
    consequences:
      "Collapsing signal classes creates false confidence and can trigger remediation before outcome evidence exists.",
  },
});
