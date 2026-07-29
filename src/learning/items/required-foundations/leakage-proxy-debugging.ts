import {
  arraySteps,
  defineDebuggingItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "find_leakage_proxies";

const code = `def find_leakage_proxies(record):
    prediction_time = record["prediction_time"]
    leaking = []
    for feature in record["features"]:
        unavailable = feature["available_at"] > prediction_time
        target_derived = feature.get("target_derived", False)
        if unavailable or target_derived:
            leaking.append(feature["name"])
    return sorted(leaking)`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return sorted feature names that are unavailable at prediction time or derived from the target.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return lexicographically sorted leaking feature names; a feature leaks when available_at > prediction_time or target_derived is true.",
  cases: [
    {
      id: "target-copy",
      label: "Direct target-derived proxy",
      input: {
        prediction_time: 10,
        features: [
          { name: "account_age", available_at: 0, target_derived: false },
          { name: "resolved_label_copy", available_at: 5, target_derived: true },
        ],
      },
      expected: ["resolved_label_copy"],
      comparison: "deep-equal",
    },
    {
      id: "clean-features",
      label: "All features available on time",
      input: {
        prediction_time: 20,
        features: [
          { name: "region", available_at: 0, target_derived: false },
          { name: "prior_count", available_at: 19, target_derived: false },
        ],
      },
      expected: [],
      comparison: "deep-equal",
    },
    {
      id: "late-and-derived",
      label: "Late feature and target-derived proxy",
      input: {
        prediction_time: 50,
        features: [
          { name: "safe_history", available_at: 40, target_derived: false },
          { name: "post_outcome_code", available_at: 45, target_derived: true },
          { name: "future_balance", available_at: 51, target_derived: false },
        ],
      },
      expected: ["future_balance", "post_outcome_code"],
      comparison: "deep-equal",
    },
  ],
});

export const leakageProxyDebugging = defineDebuggingItem({
  id: "leakage-proxy-debugging",
  title: "Leakage Proxy Debugging",
  topicIds: ["ml_problem_framing"],
  difficultyProfile: profile(2, 2, 2, 3),
  description:
    "Debug features against prediction-time availability and target derivation instead of relying on suspiciously high offline scores.",
  objective: "Identify direct and proxy leakage using a time-indexed feature contract.",
  completionEvidence:
    "A passing detector for target-derived, future-available, and clean features plus prediction-time evidence.",
  sources: [
    verifiedSource({
      label: "Scikit-learn data leakage pitfalls",
      url: "https://scikit-learn.org/stable/common_pitfalls.html#data-leakage",
    }),
    verifiedSource({
      label: "Rules of Machine Learning",
      url: "https://developers.google.com/machine-learning/guides/rules-of-ml/",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      arraySteps([
        {
          codeLine: 4,
          what: "Inspect each feature at the declared prediction time.",
          why: "Training-time presence does not imply serving-time availability.",
          values: ["safe_history", "post_outcome_code", "future_balance"],
          activeIndices: [0, 1, 2],
          variables: { predictionTime: 50 },
        },
        {
          codeLine: 5,
          what: "Mark features from the future or derived from the outcome.",
          why: "Either condition exposes information unavailable to the real decision.",
          values: ["safe", "target-derived", "future"],
          activeIndices: [1, 2],
          completedIndices: [0],
        },
        {
          codeLine: 9,
          what: "Return leaking names in canonical order.",
          why: "Stable evidence makes the contract suitable for automated promotion checks.",
          values: ["future_balance", "post_outcome_code"],
          completedIndices: [0, 1],
          variables: { leakCount: 2 },
        },
      ]),
      input,
      ["prediction_time", "features"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "prediction-time-proxy",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def find_leakage_proxies(record):
    return [feature["name"] for feature in record["features"] if feature["target_derived"]]`,
    evidence: [
      {
        label: "Offline-serving mismatch",
        content: "future_balance exists in the training export but arrives after prediction_time.",
      },
      {
        label: "Implausible offline lift",
        content: "A post-outcome field dominates feature importance.",
      },
    ],
    failingTests: [
      "Features arriving after prediction time must be rejected.",
      "Clean historical features must not be flagged.",
    ],
    hints: [
      "Evaluate availability relative to the decision timestamp.",
      "A renamed target-derived field is still leakage.",
    ],
  },
});
