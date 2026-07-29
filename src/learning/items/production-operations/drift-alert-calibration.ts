import {
  defineCalculatorItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `import math

def _psi(reference_counts, current_counts):
    reference_total = sum(reference_counts)
    current_total = sum(current_counts)
    value = 0.0
    for reference, current in zip(reference_counts, current_counts):
        reference_ratio = max(reference / reference_total, 1e-12)
        current_ratio = max(current / current_total, 1e-12)
        value += (current_ratio - reference_ratio) * math.log(current_ratio / reference_ratio)
    return value

def calibrate_drift_alert(request):
    psi = _psi(request["reference_counts"], request["current_counts"])
    sample_eligible = sum(request["current_counts"]) >= request["minimum_samples"]
    performance_ready = request["labeled_samples"] >= request["minimum_labeled_samples"]
    alerted_segments = []
    for segment in request.get("segments", []):
        segment_psi = _psi(segment["reference_counts"], segment["current_counts"])
        if sum(segment["current_counts"]) >= request["minimum_segment_samples"] and segment_psi >= request["psi_threshold"]:
            alerted_segments.append(segment["name"])
    return {
        "psi": round(psi, 6),
        "sample_eligible": sample_eligible,
        "drift_alert": sample_eligible and psi >= request["psi_threshold"],
        "performance_ready": performance_ready,
        "alerted_segments": alerted_segments,
    }`;

const execution = functionExecution({
  entrypoint: "calibrate_drift_alert",
  outputContract:
    "Return six-decimal PSI, minimum-sample eligibility, drift decision, delayed-label readiness, and independently eligible alerted segments.",
  cases: [
    {
      id: "too-few-samples",
      label: "Apparent drift before minimum sample size",
      input: {
        reference_counts: [50, 50],
        current_counts: [64, 36],
        minimum_samples: 200,
        labeled_samples: 30,
        minimum_labeled_samples: 50,
        minimum_segment_samples: 50,
        psi_threshold: 0.05,
        segments: [],
      },
      expected: {
        psi: 0.080551,
        sample_eligible: false,
        drift_alert: false,
        performance_ready: false,
        alerted_segments: [],
      },
      comparison: "deep-equal",
    },
    {
      id: "eligible-drift",
      label: "Eligible large population shift",
      input: {
        reference_counts: [500, 500],
        current_counts: [800, 200],
        minimum_samples: 500,
        labeled_samples: 300,
        minimum_labeled_samples: 200,
        minimum_segment_samples: 100,
        psi_threshold: 0.2,
        segments: [],
      },
      expected: {
        psi: 0.415888,
        sample_eligible: true,
        drift_alert: true,
        performance_ready: true,
        alerted_segments: [],
      },
      comparison: "deep-equal",
    },
    {
      id: "segment-drift",
      label: "Aggregate stable but one eligible segment drifts",
      input: {
        reference_counts: [1000, 1000],
        current_counts: [1020, 980],
        minimum_samples: 1000,
        labeled_samples: 100,
        minimum_labeled_samples: 500,
        minimum_segment_samples: 100,
        psi_threshold: 0.1,
        segments: [
          {
            name: "region-west",
            reference_counts: [100, 100],
            current_counts: [170, 30],
          },
          {
            name: "region-small",
            reference_counts: [20, 20],
            current_counts: [35, 5],
          },
        ],
      },
      expected: {
        psi: 0.0004,
        sample_eligible: true,
        drift_alert: false,
        performance_ready: false,
        alerted_segments: ["region-west"],
      },
      comparison: "deep-equal",
    },
  ],
});

export const driftAlertCalibration = defineCalculatorItem({
  id: "drift-alert-calibration",
  title: "Calibrate Drift Alerts",
  topicIds: ["ml_observability_incidents"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Calculate population stability with explicit reference/current windows, minimum sample gates, delayed-label readiness, and segment checks.",
  objective:
    "Configure a drift alert that distinguishes detectable distribution change from actionable performance degradation.",
  completionEvidence:
    "The calculation reproduces PSI independently, suppresses underpowered windows, checks eligible segments, and does not equate drift with retraining.",
  sources: [
    verifiedSource({
      label: "Google production ML monitoring",
      url: "https://developers.google.com/machine-learning/crash-course/production-ml-systems/monitoring",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "calibrate_drift_alert",
    parameters: ["request"],
    contract:
      "Return PSI, sample eligibility, drift decision, label readiness, and alerted segments.",
  }),
  execution,
  generateSteps: () =>
    matrixSteps([
      {
        codeLine: 4,
        what: "Normalize reference and current histogram counts.",
        why: "PSI compares proportions rather than raw window sizes.",
        values: [
          ["bin A", "reference proportion", "current proportion"],
          ["bin B", "reference proportion", "current proportion"],
        ],
        colHeaders: ["bin", "reference", "current"],
        activeCells: [
          [0, 1],
          [0, 2],
          [1, 1],
          [1, 2],
        ],
      },
      {
        codeLine: 10,
        what: "Sum per-bin log-ratio contributions.",
        why: "The PSI statistic measures the magnitude of the distribution shift.",
        values: [
          ["bin A", "positive contribution", "sum pending"],
          ["bin B", "positive contribution", "sum pending"],
        ],
        colHeaders: ["bin", "contribution", "PSI"],
        completedCells: [
          [0, 1],
          [1, 1],
        ],
        activeCells: [
          [0, 2],
          [1, 2],
        ],
      },
      {
        codeLine: 15,
        what: "Gate the statistic on minimum current samples.",
        why: "An unstable small window should not page operators.",
        values: [
          ["aggregate", "PSI", "sample eligible"],
          ["labels", "available", "performance ready"],
        ],
        colHeaders: ["window", "signal", "gate"],
        activeCells: [
          [0, 2],
          [1, 2],
        ],
      },
      {
        codeLine: 18,
        what: "Repeat the gate independently for each segment.",
        why: "Aggregate stability can hide an eligible slice regression.",
        values: [
          ["aggregate", "stable", "no alert"],
          ["region-west", "drift", "alert"],
          ["region-small", "drift", "underpowered"],
        ],
        colHeaders: ["scope", "PSI result", "decision"],
        completedCells: [[0, 2]],
        activeCells: [
          [1, 2],
          [2, 2],
        ],
      },
    ]),
  assessmentPayload: {
    variant: "changed-reference-window-and-segments",
    changedContext: true,
    isomorphicRetest: true,
    prompt:
      "Calculate the drift statistic, then apply minimum-sample, delayed-label, and segment gates.",
    inputs: [
      { id: "current_samples", label: "Current samples", unit: "rows", defaultValue: "100" },
      { id: "minimum_samples", label: "Minimum samples", unit: "rows", defaultValue: "200" },
      { id: "psi_threshold", label: "PSI threshold", defaultValue: "0.05" },
      { id: "labeled_samples", label: "Available labels", unit: "rows", defaultValue: "30" },
    ],
    result: { value: 0.080551, unit: "PSI", tolerance: 0.000001 },
  },
});
