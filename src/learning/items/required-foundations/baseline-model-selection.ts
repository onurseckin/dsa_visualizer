import {
  arraySteps,
  defineScenarioItem,
  functionExecution,
  inputEvidenceSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "select_baseline";

const code = `def select_baseline(record):
    feasible = [
        candidate
        for candidate in record["candidates"]
        if candidate["metric"] >= record["min_metric"]
        and candidate["latency_ms"] <= record["max_latency_ms"]
    ]
    if not feasible:
        return None
    feasible.sort(key=lambda candidate: (
        candidate["complexity"],
        -candidate["metric"],
        candidate["name"],
    ))
    return feasible[0]["name"]`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Among candidates meeting metric and latency constraints, return the lowest-complexity name, breaking ties by higher metric then name; return None if none qualify.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Filter by metric >= min_metric and latency_ms <= max_latency_ms; select minimum (complexity, -metric, name), or null when infeasible.",
  cases: [
    {
      id: "simple-wins",
      label: "Simplest feasible baseline wins",
      input: {
        min_metric: 0.8,
        max_latency_ms: 10,
        candidates: [
          { name: "linear", metric: 0.82, latency_ms: 4, complexity: 1 },
          { name: "tree", metric: 0.9, latency_ms: 8, complexity: 2 },
          { name: "rule", metric: 0.7, latency_ms: 1, complexity: 0 },
        ],
      },
      expected: "linear",
      comparison: "deep-equal",
    },
    {
      id: "none-feasible",
      label: "No candidate satisfies both constraints",
      input: {
        min_metric: 0.9,
        max_latency_ms: 5,
        candidates: [
          { name: "fast", metric: 0.7, latency_ms: 2, complexity: 1 },
          { name: "accurate", metric: 0.95, latency_ms: 20, complexity: 2 },
        ],
      },
      expected: null,
      comparison: "deep-equal",
    },
    {
      id: "metric-tiebreak",
      label: "Higher metric breaks equal-complexity tie",
      input: {
        min_metric: 0.75,
        max_latency_ms: 10,
        candidates: [
          { name: "candidate-a", metric: 0.8, latency_ms: 3, complexity: 1 },
          { name: "candidate-b", metric: 0.85, latency_ms: 5, complexity: 1 },
        ],
      },
      expected: "candidate-b",
      comparison: "deep-equal",
    },
  ],
});

export const baselineModelSelection = defineScenarioItem({
  id: "baseline-model-selection",
  title: "Baseline Model Selection",
  topicIds: ["ml_model_evaluation"],
  difficultyProfile: profile(2, 2, 3, 3),
  description:
    "Choose the simplest baseline that satisfies an authored quality floor and operational latency ceiling.",
  objective:
    "Use a non-ML or simple-model baseline as a decision gate, not merely as a number reported after model selection.",
  completionEvidence:
    "A rubric-scored baseline proposal and a passing constrained selector across feasible, infeasible, and tie cases.",
  sources: [
    verifiedSource({
      label: "Rules of Machine Learning",
      url: "https://developers.google.com/machine-learning/guides/rules-of-ml/",
    }),
    verifiedSource({
      label: "Scikit-learn model evaluation",
      url: "https://scikit-learn.org/stable/modules/model_evaluation.html",
    }),
  ],
  prompt: {
    context:
      "A new ranking service has a 10 ms budget. A rule baseline reaches the product metric floor, a linear model improves it slightly, and a large ensemble improves the offline metric most but consumes the entire latency budget.",
    question:
      "Choose the first production baseline, define the evidence required to replace it, and explain which operational and slice metrics are release gates.",
    constraints: [
      "Include a deployable non-ML or simple-model comparator.",
      "Do not select solely by the highest aggregate offline score.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "feasible-baseline",
        label: "Feasible baseline",
        description:
          "Chooses a simple comparator satisfying stated quality and latency constraints.",
        points: 3,
        critical: true,
      },
      {
        id: "replacement-evidence",
        label: "Replacement evidence",
        description: "Requires reproducible aggregate, slice, and operational improvement.",
        points: 2,
      },
      {
        id: "release-gates",
        label: "Release gates",
        description: "Defines explicit rollback or rejection thresholds.",
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
        arraySteps([
          {
            codeLine: 2,
            what: "Evaluate every candidate against quality and latency constraints.",
            why: "An infeasible candidate cannot serve as the production baseline.",
            values: ["rule", "linear", "tree"],
            activeIndices: [0, 1, 2],
          },
          {
            codeLine: 8,
            what: "Remove candidates that miss either release gate.",
            why: "The selection set contains only deployable alternatives.",
            values: ["linear", "tree"],
            activeIndices: [0, 1],
            variables: { minMetric: 0.8, maxLatencyMs: 10 },
          },
          {
            codeLine: 10,
            what: "Select the least complex feasible candidate.",
            why: "A simpler baseline makes later incremental value and failure modes easier to measure.",
            values: ["linear"],
            completedIndices: [0],
            variables: { selectedComplexity: 1 },
          },
        ]),
        input,
        ["min_metric", "max_latency_ms", "candidates"],
        execution.cases,
      ),
  },
  assessmentPayload: {
    variant: "latency-constrained-ranking",
    changedContext: true,
    isomorphicRetest: true,
    consequences:
      "Choosing the largest offline score without a feasible baseline obscures whether added complexity creates deployable value.",
  },
});
