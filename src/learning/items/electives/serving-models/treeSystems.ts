import {
  arraySteps,
  defineCalculatorItem,
  defineDebuggingItem,
  defineScenarioItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../../authoring";

const gainCode = `def histogram_split_gain(record):
    bins = record["bins"]
    total_pos = sum(bin_["pos"] for bin_ in bins)
    total_neg = sum(bin_["neg"] for bin_ in bins)
    def gini(pos, neg):
        total = pos + neg
        return 0 if total == 0 else 1 - (pos / total) ** 2 - (neg / total) ** 2
    parent = gini(total_pos, total_neg)
    best_gain = -1
    best_split = None
    left_pos = left_neg = 0
    for index in range(len(bins) - 1):
        left_pos += bins[index]["pos"]
        left_neg += bins[index]["neg"]
        right_pos, right_neg = total_pos - left_pos, total_neg - left_neg
        weighted = ((left_pos + left_neg) * gini(left_pos, left_neg) + (right_pos + right_neg) * gini(right_pos, right_neg)) / (total_pos + total_neg)
        gain = parent - weighted
        if gain > best_gain:
            best_gain, best_split = gain, index
    return {"parent_gini": round(parent, 6), "best_split_after_bin": best_split, "gain": round(best_gain, 6)}`;

const gainExecution = functionExecution({
  entrypoint: "histogram_split_gain",
  outputContract:
    "Return parent Gini impurity, the best histogram boundary index, and its weighted Gini gain. Bins must preserve class-count totals before a split is evaluated.",
  cases: [
    {
      id: "separable",
      label: "Separable bins gain fully",
      input: {
        bins: [
          { pos: 0, neg: 2 },
          { pos: 2, neg: 0 },
        ],
      },
      expected: { parent_gini: 0.5, best_split_after_bin: 0, gain: 0.5 },
      comparison: "deep-equal",
    },
    {
      id: "three-bin",
      label: "Best split can be later",
      input: {
        bins: [
          { pos: 0, neg: 1 },
          { pos: 1, neg: 1 },
          { pos: 3, neg: 0 },
        ],
      },
      expected: { parent_gini: 0.444444, best_split_after_bin: 1, gain: 0.222222 },
      comparison: "deep-equal",
    },
    {
      id: "mixed",
      label: "Mixed bins have small gain",
      input: {
        bins: [
          { pos: 1, neg: 1 },
          { pos: 2, neg: 2 },
        ],
      },
      expected: { parent_gini: 0.5, best_split_after_bin: 0, gain: 0 },
      comparison: "deep-equal",
    },
  ],
});

export const histogramSplitGain = defineCalculatorItem({
  id: "histogram-split-gain",
  title: "Histogram split gain",
  topicIds: ["ml_tree_ensemble_systems"],
  difficultyProfile: profile(2, 3, 2, 3),
  description:
    "Compute a decision-tree split from binned class counts using weighted Gini impurity rather than raw bin purity.",
  objective:
    "Calculate a valid split gain while retaining all class counts and recognizing that binning changes the candidate thresholds available to a tree learner.",
  completionEvidence:
    "The learner reports parent impurity, the best legal bin boundary, and gain from the weighted child impurities for multiple class distributions.",
  sources: [
    verifiedSource({
      label: "XGBoost tree model tutorial",
      url: "https://xgboost.readthedocs.io/en/stable/tutorials/model.html",
    }),
    verifiedSource({
      label: "Gradient boosting machines paper",
      url: "https://statweb.stanford.edu/~jhf/ftp/trebst.pdf",
    }),
  ],
  code: gainCode,
  starterCode: semanticStarter({
    entrypoint: "histogram_split_gain",
    parameters: ["record"],
    contract: "Compute parent Gini and the highest-gain split between adjacent histogram bins.",
  }),
  execution: gainExecution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 2,
        what: "Sum positive and negative examples across all bins.",
        why: "The parent impurity must describe the full node before any threshold partitions it.",
        values: ["bin positives", "bin negatives", "parent totals"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 4,
        what: "Compute Gini from class proportions in a node.",
        why: "Impurity is zero only when a nonempty node is pure, not merely because one count is absent from a partial calculation.",
        values: ["positive share", "negative share", "Gini"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 10,
        what: "Move one histogram bin into the left child at each legal boundary.",
        why: "Histogram training evaluates aggregate candidate boundaries without revisiting every raw feature value.",
        values: ["left counts", "right counts", "boundary"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 14,
        what: "Select the boundary with the highest weighted impurity reduction.",
        why: "Child quality must be weighted by support so a tiny pure child cannot dominate the split decision.",
        values: ["parent", "weighted children", "gain"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
    ]),
  assessmentPayload: {
    variant: "changed-class-histogram",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Calculate the best split for a changed histogram.",
    inputs: [{ id: "bins", label: "Histogram bins", defaultValue: "3" }],
    result: { value: 0.5, unit: "Gini gain", tolerance: 0.000001 },
  },
});

const selectionCode = `def validate_tabular_model_plan(plan):
    missing = []
    if plan.get("family") not in ("tree", "linear", "deep"): missing.append("family")
    if plan.get("latency_ms", float("inf")) > plan.get("latency_budget_ms", -1): missing.append("latency_budget")
    if not plan.get("evaluation_slices"): missing.append("evaluation_slices")
    if plan.get("update_cadence") not in ("batch", "online", "periodic"): missing.append("update_cadence")
    if plan.get("interpretability_required") and not plan.get("explanation_method"): missing.append("explanation_method")
    missing.sort()
    return {"valid": not missing, "missing": missing, "plan_artifact": "constraint-checklist"}`;
const selectionExecution = functionExecution({
  entrypoint: "validate_tabular_model_plan",
  outputContract:
    "Return whether a model-selection plan artifact states a family, latency comparison, evaluation slices, update cadence, and an explanation method when demanded. The validator does not declare one family universally correct.",
  cases: [
    {
      id: "tree-plan",
      label: "Tabular tree plan",
      input: {
        family: "tree",
        latency_ms: 8,
        latency_budget_ms: 15,
        evaluation_slices: ["region"],
        update_cadence: "periodic",
        interpretability_required: true,
        explanation_method: "feature attribution",
      },
      expected: { valid: true, missing: [], plan_artifact: "constraint-checklist" },
      comparison: "deep-equal",
    },
    {
      id: "deep-plan",
      label: "Deep plan can be valid",
      input: {
        family: "deep",
        latency_ms: 12,
        latency_budget_ms: 20,
        evaluation_slices: ["device"],
        update_cadence: "batch",
        interpretability_required: false,
      },
      expected: { valid: true, missing: [], plan_artifact: "constraint-checklist" },
      comparison: "deep-equal",
    },
    {
      id: "incomplete",
      label: "Artifact misses critical constraints",
      input: {
        family: "tree",
        latency_ms: 30,
        latency_budget_ms: 10,
        evaluation_slices: [],
        update_cadence: "daily",
        interpretability_required: true,
      },
      expected: {
        valid: false,
        missing: ["evaluation_slices", "explanation_method", "latency_budget", "update_cadence"],
        plan_artifact: "constraint-checklist",
      },
      comparison: "deep-equal",
    },
  ],
});
export const treeModelSystemSelection = defineScenarioItem({
  id: "tree-model-system-selection",
  title: "Tree-model system selection",
  topicIds: ["ml_tree_ensemble_systems"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Select a tree ensemble, linear model, or deep baseline from tabular data, latency, update, interpretability, and deployment evidence.",
  objective:
    "Make a falsifiable model-family decision using constraint evidence instead of treating tabular trees as a default that overrides data and system requirements.",
  completionEvidence:
    "The rubric assesses the family rationale and alternatives; the executable scratchpad validates only a quantifiable plan checklist.",
  sources: [
    verifiedSource({
      label: "XGBoost tree model tutorial",
      url: "https://xgboost.readthedocs.io/en/stable/tutorials/model.html",
    }),
  ],
  prompt: {
    context:
      "A fraud team has mixed numeric and categorical features, a tight online budget, changing labels, and a regulated explanation requirement.",
    question:
      "Choose and justify a baseline family and its operational plan; explain which evidence could reverse your choice.",
    constraints: [
      "Compare at least one tree, linear, or deep alternative.",
      "State latency, update, and slice-evaluation evidence.",
      "Use the scratchpad only for plan invariants, not as a claim that design has one answer.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "family",
        label: "Family rationale",
        description:
          "Relates data representation and baseline evidence to the selected family and alternatives.",
        points: 3,
        critical: true,
      },
      {
        id: "operations",
        label: "Operational constraints",
        description: "Addresses latency, update, deployment, and failure handling.",
        points: 3,
        critical: true,
      },
      {
        id: "evaluation",
        label: "Evaluation and explanation",
        description: "Defines slices, decision metrics, and explanation obligations.",
        points: 2,
      },
    ],
  },
  playground: {
    code: selectionCode,
    starterCode: semanticStarter({
      entrypoint: "validate_tabular_model_plan",
      parameters: ["plan"],
      contract:
        "Validate measurable plan fields while leaving the model-family rationale to the scenario rubric.",
    }),
    execution: selectionExecution,
    generateSteps: () =>
      arraySteps([
        {
          codeLine: 3,
          what: "Check that the plan makes a model-family choice explicit.",
          why: "A reviewable decision starts with an alternative that can be compared or falsified.",
          values: ["tree", "linear", "deep"],
          activeIndices: [0],
        },
        {
          codeLine: 4,
          what: "Compare measured latency with the stated deployment budget.",
          why: "Offline quality cannot erase a hard serving constraint.",
          values: ["measured latency", "budget", "within limit"],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
        {
          codeLine: 5,
          what: "Require named evaluation slices before rollout.",
          why: "Aggregate performance can conceal a regression on a consequential subpopulation.",
          values: ["overall", "slices", "guardrails"],
          activeIndices: [1],
          completedIndices: [0, 2],
        },
        {
          codeLine: 9,
          what: "Return a checklist result rather than a recommended architecture.",
          why: "Qualitative selection remains a rubric-scored engineering decision.",
          values: ["valid", "missing", "plan artifact"],
          activeIndices: [2],
          completedIndices: [0, 1],
        },
      ]),
  },
  assessmentPayload: {
    variant: "changed-data-and-latency-constraints",
    changedContext: true,
    isomorphicRetest: true,
    choices: ["Tree ensemble", "Linear model", "Deep baseline"],
    consequences:
      "No option is auto-correct; the response is evaluated against evidence and the scratchpad checks explicit artifacts only.",
  },
});

const pipelineCode = `def diagnose_tabular_pipeline(record):
    failures = []
    if record.get("train_feature_names") != record.get("serve_feature_names"): failures.append("feature_schema")
    if record.get("train_missing_policy") != record.get("serve_missing_policy"): failures.append("missingness")
    if record.get("train_category_map") != record.get("serve_category_map"): failures.append("categorical_encoding")
    if record.get("leakage_feature_present"): failures.append("leakage")
    if not record.get("feature_version"): failures.append("feature_version")
    failures.sort()
    return {"healthy": not failures, "failures": failures}`;
const pipelineExecution = functionExecution({
  entrypoint: "diagnose_tabular_pipeline",
  outputContract:
    "Return a health flag and sorted tabular-pipeline contract failures for schema, missingness, categorical encoding, leakage, and feature version evidence.",
  cases: [
    {
      id: "aligned",
      label: "Aligned offline and online pipeline",
      input: {
        train_feature_names: ["age"],
        serve_feature_names: ["age"],
        train_missing_policy: "median",
        serve_missing_policy: "median",
        train_category_map: "v2",
        serve_category_map: "v2",
        leakage_feature_present: false,
        feature_version: "f2",
      },
      expected: { healthy: true, failures: [] },
      comparison: "deep-equal",
    },
    {
      id: "encoding-skew",
      label: "Categorical and missingness skew",
      input: {
        train_feature_names: ["age"],
        serve_feature_names: ["age"],
        train_missing_policy: "median",
        serve_missing_policy: "zero",
        train_category_map: "v2",
        serve_category_map: "v1",
        leakage_feature_present: false,
        feature_version: "f2",
      },
      expected: { healthy: false, failures: ["categorical_encoding", "missingness"] },
      comparison: "deep-equal",
    },
    {
      id: "leaky-schema",
      label: "Schema and leakage failure",
      input: {
        train_feature_names: ["outcome"],
        serve_feature_names: ["age"],
        train_missing_policy: "median",
        serve_missing_policy: "median",
        train_category_map: "v2",
        serve_category_map: "v2",
        leakage_feature_present: true,
        feature_version: "",
      },
      expected: { healthy: false, failures: ["feature_schema", "feature_version", "leakage"] },
      comparison: "deep-equal",
    },
  ],
});
export const tabularPipelineDebugging = defineDebuggingItem({
  id: "tabular-pipeline-debugging",
  title: "Tabular pipeline debugging",
  topicIds: ["ml_tree_ensemble_systems"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Find feature leakage and training-serving mismatches in missing-value and categorical processing before attributing a tabular regression to a model family.",
  objective:
    "Diagnose tabular failure from feature-contract evidence so that leakage, schema drift, and encoding mismatch receive distinct repairs.",
  completionEvidence:
    "The learner identifies every broken pipeline invariant and separates offline leakage repair from online compatibility repair.",
  sources: [
    verifiedSource({
      label: "XGBoost categorical data tutorial",
      url: "https://xgboost.readthedocs.io/en/stable/tutorials/categorical.html",
    }),
  ],
  code: pipelineCode,
  starterCode: semanticStarter({
    entrypoint: "diagnose_tabular_pipeline",
    parameters: ["record"],
    contract: "Return sorted training-serving tabular contract failures.",
  }),
  execution: pipelineExecution,
  generateSteps: () =>
    arraySteps([
      {
        codeLine: 3,
        what: "Compare the feature schemas used for training and serving.",
        why: "Model inputs are only compatible when names, ordering, and meanings are governed together.",
        values: ["train schema", "serve schema", "match"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 4,
        what: "Compare missing-value policy across both paths.",
        why: "A model trained on one imputation semantic can fail when online defaults mean something different.",
        values: ["training missing", "serving missing", "match"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 5,
        what: "Compare categorical-map versions explicitly.",
        why: "Category IDs are a learned representation contract, not harmless preprocessing detail.",
        values: ["train map", "serve map", "compatible"],
        activeIndices: [2],
        completedIndices: [0, 1],
      },
      {
        codeLine: 8,
        what: "Return each independently broken invariant.",
        why: "A useful debugging result supports targeted remediation rather than an untestable model rewrite.",
        values: ["healthy", "failures", "repair"],
        activeIndices: [1],
        completedIndices: [0, 2],
      },
    ]),
  assessmentPayload: {
    variant: "changed-feature-contract-evidence",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: 'return {"healthy": True, "failures": []}',
    evidence: [
      {
        label: "Serving incident",
        content: "A newly introduced category and default value changed live scores.",
      },
    ],
    failingTests: ["encoding mismatch must be classified", "leakage must be classified"],
    hints: ["Compare representation contracts before tuning tree depth."],
  },
});
