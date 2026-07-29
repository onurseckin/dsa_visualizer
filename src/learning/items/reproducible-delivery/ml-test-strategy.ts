import {
  arraySteps,
  defineScenarioItem,
  functionExecution,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def validate_ml_test_plan(plan):
    change = plan["change"]
    required = {"unit"}
    if change.get("data_contract"):
        required.add("data")
    if change.get("pipeline_component"):
        required.update(("component", "integration"))
    if change.get("model_behavior"):
        required.add("regression")
    if change.get("serving_path"):
        required.add("end-to-end")
    selected = set(plan.get("selected_tests", []))
    missing = sorted(required - selected)
    return {
        "complete": not missing,
        "required": sorted(required),
        "missing": missing,
    }`;

const execution = functionExecution({
  entrypoint: "validate_ml_test_plan",
  outputContract:
    "Return complete plus sorted required and missing test layers, deriving unit/data/component/integration/regression/end-to-end coverage from the declared ML change surface.",
  cases: [
    {
      id: "pure-transform-unit",
      label: "Pure transform helper needs a unit test",
      input: {
        change: {
          data_contract: false,
          pipeline_component: false,
          model_behavior: false,
          serving_path: false,
        },
        selected_tests: ["unit"],
      },
      expected: { complete: true, required: ["unit"], missing: [] },
      comparison: "deep-equal",
    },
    {
      id: "data-component-change",
      label: "Schema and component change needs data and integration evidence",
      input: {
        change: {
          data_contract: true,
          pipeline_component: true,
          model_behavior: false,
          serving_path: false,
        },
        selected_tests: ["unit", "data", "component"],
      },
      expected: {
        complete: false,
        required: ["component", "data", "integration", "unit"],
        missing: ["integration"],
      },
      comparison: "deep-equal",
    },
    {
      id: "model-serving-change",
      label: "Model behavior and serving path need regression and end-to-end tests",
      input: {
        change: {
          data_contract: true,
          pipeline_component: true,
          model_behavior: true,
          serving_path: true,
        },
        selected_tests: ["unit", "data", "component", "integration", "regression", "end-to-end"],
      },
      expected: {
        complete: true,
        required: ["component", "data", "end-to-end", "integration", "regression", "unit"],
        missing: [],
      },
      comparison: "deep-equal",
    },
  ],
});

const starterCode = semanticStarter({
  entrypoint: "validate_ml_test_plan",
  parameters: ["plan"],
  contract:
    "Derive the required ML test layers from data, component, model-behavior, and serving-path change flags; return complete, required, and missing.",
});

function generateSteps(input: unknown) {
  const plan = input as {
    change?: Record<string, boolean>;
    selected_tests?: readonly string[];
  };
  const layers = ["unit", "data", "component", "integration", "regression", "end-to-end"];
  const selected = new Set(plan?.selected_tests ?? []);
  const change = plan?.change ?? {};
  const required = new Set(["unit"]);
  if (change.data_contract) required.add("data");
  if (change.pipeline_component) {
    required.add("component");
    required.add("integration");
  }
  if (change.model_behavior) required.add("regression");
  if (change.serving_path) required.add("end-to-end");
  return arraySteps([
    {
      codeLine: 2,
      what: "Map the changed ML surfaces before selecting test layers.",
      why: "Code, data, component, model, and serving failures require different evidence.",
      values: layers.map((layer) => `${layer}: unclassified`),
      activeIndices: [0],
    },
    {
      codeLine: 4,
      what: "Derive the minimum required layers from the change.",
      why: "A broad end-to-end test does not replace focused data, component, or model-behavior checks.",
      values: layers.map((layer) => `${layer}: ${required.has(layer) ? "required" : "optional"}`),
      activeIndices: layers
        .map((layer, index) => (required.has(layer) ? index : -1))
        .filter((index) => index >= 0),
    },
    {
      codeLine: 13,
      what: "Compare the submitted plan with the required evidence.",
      why: "CI is complete only when every risk-bearing layer has an executable check.",
      values: layers.map(
        (layer) =>
          `${layer}: ${!required.has(layer) ? "optional" : selected.has(layer) ? "covered" : "missing"}`,
      ),
      completedIndices: layers
        .map((layer, index) => (required.has(layer) && selected.has(layer) ? index : -1))
        .filter((index) => index >= 0),
      activeIndices: layers
        .map((layer, index) => (required.has(layer) && !selected.has(layer) ? index : -1))
        .filter((index) => index >= 0),
    },
  ]);
}

export const mlTestStrategy = defineScenarioItem({
  id: "ml-test-strategy",
  title: "ML test strategy",
  topicIds: ["ml_workflow_orchestration"],
  difficultyProfile: profile(2, 2, 3, 3),
  description:
    "Choose layered tests for an ML pipeline change, covering ordinary code plus data contracts, components, integration, model behavior, and serving paths.",
  objective:
    "Match each changed risk surface to focused evidence and explain why no single test layer substitutes for the others.",
  completionEvidence:
    "A rubric-supported strategy assigns ownership and failure signals, while its executable plan artifact covers every required layer for changed cases.",
  sources: [
    verifiedSource({
      label: "The ML Test Score",
      url: "https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/",
    }),
  ],
  prompt: {
    context:
      "A change modifies a feature schema, one pipeline component, expected model behavior, and the online serving adapter.",
    question:
      "Design the smallest credible unit, data, component, integration, regression, and end-to-end test strategy for CI.",
    constraints: [
      "Name the failure each selected layer can localize.",
      "Include data and model behavior assertions, not only service availability.",
      "Separate fast presubmit evidence from slower release-gate evidence.",
    ],
  },
  rubric: {
    criteria: [
      {
        id: "risk-layering",
        label: "Risk-layer mapping",
        description: "Maps each change surface to a focused test layer and failure signal.",
        points: 3,
        critical: true,
      },
      {
        id: "model-behavior",
        label: "Model behavior",
        description: "Defines regression evidence for quality or behavioral invariants.",
        points: 2,
        critical: true,
      },
      {
        id: "ci-shape",
        label: "CI shape",
        description: "Balances fast presubmit checks with slower integration and end-to-end gates.",
        points: 2,
      },
    ],
  },
  playground: { code, starterCode, execution, generateSteps },
  assessmentPayload: {
    variant: "changed-pipeline-surface",
    changedContext: true,
    isomorphicRetest: true,
    choices: [
      "Layer focused checks and reserve end-to-end for boundary evidence",
      "Use only end-to-end tests",
      "Use only unit tests around model code",
    ],
    consequences:
      "The strategy rationale remains rubric-scored; the playground validates only whether a declared test-plan artifact covers its stated change surface.",
  },
});
