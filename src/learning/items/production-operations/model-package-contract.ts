import {
  defineDebuggingItem,
  functionExecution,
  inputEvidenceSteps,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const code = `def validate_model_package(package):
    required = ["signature", "preprocessing", "dependencies", "runtime", "metadata", "smoke_test"]
    missing = [field for field in required if not package.get(field)]
    smoke = package.get("smoke_test") or {}
    deterministic = "expected" in smoke and smoke.get("actual") == smoke.get("expected")
    if "smoke_test" not in missing and not deterministic:
        missing.append("deterministic_smoke_test")
    return {
        "valid": len(missing) == 0,
        "missing": missing,
        "signature": package.get("signature", ""),
        "deterministic_smoke_test": deterministic,
    }`;

const execution = functionExecution({
  entrypoint: "validate_model_package",
  outputContract:
    "Return validity, ordered missing contract fields, the public signature, and whether the smoke test is deterministic.",
  cases: [
    {
      id: "complete-package",
      label: "Complete deterministic package",
      input: {
        signature: "features:list[number]->scores:list[number]",
        preprocessing: "standardize:v2",
        dependencies: ["python==3.12"],
        runtime: "cpython",
        metadata: { training_run: "run-42" },
        smoke_test: { actual: [0.25], expected: [0.25] },
      },
      expected: {
        valid: true,
        missing: [],
        signature: "features:list[number]->scores:list[number]",
        deterministic_smoke_test: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "missing-contracts",
      label: "Package misses preprocessing and smoke test",
      input: {
        signature: "features:list[number]->scores:list[number]",
        dependencies: ["python==3.12"],
        runtime: "cpython",
        metadata: { training_run: "run-43" },
      },
      expected: {
        valid: false,
        missing: ["preprocessing", "smoke_test"],
        signature: "features:list[number]->scores:list[number]",
        deterministic_smoke_test: false,
      },
      comparison: "deep-equal",
    },
    {
      id: "nondeterministic-smoke",
      label: "Smoke output disagrees with expected output",
      input: {
        signature: "row:object->class:string",
        preprocessing: "categorical-map:v4",
        dependencies: ["python==3.12"],
        runtime: "cpython",
        metadata: { training_run: "run-44" },
        smoke_test: { actual: "fraud", expected: "legitimate" },
      },
      expected: {
        valid: false,
        missing: ["deterministic_smoke_test"],
        signature: "row:object->class:string",
        deterministic_smoke_test: false,
      },
      comparison: "deep-equal",
    },
  ],
});

export const modelPackageContract = defineDebuggingItem({
  id: "model-package-contract",
  title: "Repair a Model Package Contract",
  topicIds: ["ml_model_registry"],
  difficultyProfile: profile(2, 3, 2, 2),
  description:
    "Validate that a releasable model package carries signature, preprocessing, dependencies, runtime, lineage metadata, and a deterministic smoke test.",
  objective:
    "Distinguish an opaque weight file from a reproducible executable package with a stable input/output and preprocessing contract.",
  completionEvidence:
    "The repaired validator rejects every missing or nondeterministic contract component and passes all changed package fixtures.",
  sources: [
    verifiedSource({
      label: "MLflow model registry workflow",
      url: "https://mlflow.org/docs/latest/ml/model-registry/workflow/",
    }),
  ],
  code,
  starterCode: semanticStarter({
    entrypoint: "validate_model_package",
    parameters: ["package"],
    contract:
      "Return valid, missing, signature, and deterministic_smoke_test for a complete model package.",
  }),
  execution,
  generateSteps: (input) =>
    inputEvidenceSteps(
      matrixSteps([
        {
          codeLine: 2,
          what: "Inventory every package contract surface.",
          why: "A weights file alone does not define executable semantics.",
          values: [
            ["signature", "unchecked"],
            ["preprocessing", "unchecked"],
            ["runtime", "unchecked"],
            ["smoke", "unchecked"],
          ],
          rowHeaders: ["I/O", "transform", "environment", "behavior"],
          colHeaders: ["contract", "status"],
          activeCells: [[0, 0]],
        },
        {
          codeLine: 3,
          what: "Mark missing package metadata.",
          why: "Release must fail closed when a required contract is absent.",
          values: [
            ["signature", "present"],
            ["preprocessing", "missing"],
            ["runtime", "present"],
            ["smoke", "missing"],
          ],
          rowHeaders: ["I/O", "transform", "environment", "behavior"],
          colHeaders: ["contract", "status"],
          activeCells: [
            [1, 1],
            [3, 1],
          ],
        },
        {
          codeLine: 5,
          what: "Execute a deterministic smoke oracle.",
          why: "Presence alone cannot prove the packaged runtime reproduces expected behavior.",
          values: [
            ["signature", "present"],
            ["preprocessing", "present"],
            ["runtime", "present"],
            ["smoke", "actual=expected"],
          ],
          rowHeaders: ["I/O", "transform", "environment", "behavior"],
          colHeaders: ["contract", "status"],
          completedCells: [
            [0, 1],
            [1, 1],
            [2, 1],
          ],
          activeCells: [[3, 1]],
        },
      ]),
      input,
      ["signature", "dependencies", "smoke_test"],
      execution.cases,
    ),
  assessmentPayload: {
    variant: "changed-package-contract",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def validate_model_package(package):
    return {"valid": "weights" in package, "missing": []}`,
    evidence: [
      {
        label: "Staging log",
        content: "The model loads, but serving cannot discover preprocessing or input signature.",
      },
      {
        label: "Smoke run",
        content: "The same fixture produces a different label in the release runtime.",
      },
    ],
    failingTests: [
      "A package missing preprocessing is invalid.",
      "A smoke test must compare actual output with an authored expected output.",
    ],
    hints: [
      "List the contract fields before validating their behavior.",
      "Treat deterministic smoke-test failure as a release blocker.",
    ],
    completion: {
      variant: "complete-package-validator",
      changedContext: true,
      isomorphicRetest: true,
      prompt: "Complete the validator without hard-coding a package ID.",
      context: "The release package shape is vendor-neutral JSON metadata.",
      requiredConcepts: ["signature", "preprocessing", "runtime", "deterministic smoke test"],
      consequencePrompt:
        "Explain why a passing load test is weaker than a deterministic smoke test.",
    },
  },
});
