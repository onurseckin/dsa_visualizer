import {
  arraySteps,
  defineDebuggingItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "diagnose_generalization";

const code = `def diagnose_generalization(record):
    threshold = record["gap_threshold"]
    diagnoses = []
    if record["train_metric"] - record["validation_metric"] >= threshold:
        diagnoses.append("overfitting")
    if abs(record["validation_metric"] - record["test_metric"]) >= threshold:
        diagnoses.append("split-shift")
    if record.get("drift_detected") is True:
        diagnoses.append("distribution-drift")
    if record.get("leakage_suspected") is True:
        diagnoses.append("leakage-risk")
    return diagnoses`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Return diagnoses in overfitting, split-shift, distribution-drift, leakage-risk order using the authored gap threshold.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return ordered diagnoses: overfitting for train-validation gap >= threshold, split-shift for |validation-test| >= threshold, then explicit drift and leakage flags.",
  cases: [
    {
      id: "overfit-gap",
      label: "Large train-validation gap",
      input: {
        train_metric: 0.95,
        validation_metric: 0.75,
        test_metric: 0.74,
        gap_threshold: 0.1,
        drift_detected: false,
        leakage_suspected: false,
      },
      expected: ["overfitting"],
      comparison: "deep-equal",
    },
    {
      id: "shift-and-drift",
      label: "Validation-test shift with drift evidence",
      input: {
        train_metric: 0.82,
        validation_metric: 0.81,
        test_metric: 0.6,
        gap_threshold: 0.1,
        drift_detected: true,
        leakage_suspected: false,
      },
      expected: ["split-shift", "distribution-drift"],
      comparison: "deep-equal",
    },
    {
      id: "leakage-risk",
      label: "Similar splits with independent leakage evidence",
      input: {
        train_metric: 0.99,
        validation_metric: 0.98,
        test_metric: 0.97,
        gap_threshold: 0.1,
        drift_detected: false,
        leakage_suspected: true,
      },
      expected: ["leakage-risk"],
      comparison: "deep-equal",
    },
  ],
});

export const generalizationFailureDiagnosis = defineDebuggingItem({
  id: "generalization-failure-diagnosis",
  title: "Generalization Failure Diagnosis",
  topicIds: ["ml_model_evaluation"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Debug evaluation evidence by separating train-validation overfitting, validation-test shift, drift, and leakage risk.",
  objective: "Map observed metric gaps and independent data evidence to scoped failure hypotheses.",
  completionEvidence:
    "A passing diagnosis function and a written next experiment for each observed failure boundary.",
  sources: [
    verifiedSource({
      label: "Google ML overfitting",
      url: "https://developers.google.com/machine-learning/crash-course/overfitting/overfitting",
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
          codeLine: 2,
          what: "Read train, validation, and test metrics under one authored threshold.",
          why: "Different split gaps support different failure hypotheses.",
          values: ["train 0.82", "validation 0.81", "test 0.60"],
          activeIndices: [0, 1, 2],
        },
        {
          codeLine: 6,
          what: "Compare validation with the untouched test boundary.",
          why: "A large validation-test gap points to split mismatch rather than ordinary train overfit.",
          values: ["train-val 0.01", "val-test 0.21"],
          activeIndices: [1],
          variables: { gapThreshold: 0.1 },
        },
        {
          codeLine: 11,
          what: "Combine the gap with independent drift evidence.",
          why: "The ordered hypotheses guide a targeted data investigation instead of blind retuning.",
          values: ["split-shift", "distribution-drift"],
          completedIndices: [0, 1],
        },
      ]),
      input,
      ["train_metric", "validation_metric", "drift_detected"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "validation-test-collapse",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def diagnose_generalization(record):
    if record["train_metric"] > record["test_metric"]:
        return ["overfitting"]
    return []`,
    evidence: [
      {
        label: "Metric pattern",
        content: "Train and validation agree, while the untouched test metric falls by 0.21.",
      },
      {
        label: "Data evidence",
        content: "A schema-compatible feature distribution changed in the test period.",
      },
    ],
    failingTests: [
      "Validation-test gaps must not be mislabeled as train overfitting.",
      "Independent leakage risk must be retained even when aggregate gaps are small.",
    ],
    hints: [
      "Compare adjacent evaluation boundaries separately.",
      "Metric gaps are hypotheses; combine them with data evidence.",
    ],
  },
});
