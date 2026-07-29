import {
  defineDebuggingItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "validate_dataset_contract";

const code = `def validate_dataset_contract(record):
    expected_types = {
        "int": int,
        "float": float,
        "str": str,
        "bool": bool,
    }
    errors = []
    for row_index, row in enumerate(record["rows"]):
        for field, type_name in record["schema"].items():
            if field not in row:
                errors.append(f"row {row_index}: missing {field}")
            elif type(row[field]) is not expected_types[type_name]:
                errors.append(f"row {row_index}: {field} expected {type_name}")
    return {"valid": not errors, "errors": errors}`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Validate every row against the exact int/float/str/bool schema and return {valid, errors} in row and schema order.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return {valid, errors}; errors are exact missing/type messages ordered first by row and then schema field order.",
  cases: [
    {
      id: "valid-rows",
      label: "Rows satisfy the schema",
      input: {
        schema: { user_id: "int", score: "float", active: "bool" },
        rows: [
          { user_id: 1, score: 0.75, active: true },
          { user_id: 2, score: 0.25, active: false },
        ],
      },
      expected: { valid: true, errors: [] },
      comparison: "deep-equal",
    },
    {
      id: "missing-field",
      label: "Required field is absent",
      input: {
        schema: { user_id: "int", age: "int" },
        rows: [{ user_id: 1 }],
      },
      expected: { valid: false, errors: ["row 0: missing age"] },
      comparison: "deep-equal",
    },
    {
      id: "wrong-types",
      label: "Exact types reject string and integer proxies",
      input: {
        schema: { age: "int", active: "bool" },
        rows: [
          { age: "42", active: true },
          { age: 21, active: 1 },
        ],
      },
      expected: {
        valid: false,
        errors: ["row 0: age expected int", "row 1: active expected bool"],
      },
      comparison: "deep-equal",
    },
  ],
});

export const datasetContractValidator = defineDebuggingItem({
  id: "dataset-contract-validator",
  title: "Dataset Contract Validator",
  topicIds: ["ml_data_contracts_splits"],
  difficultyProfile: profile(1, 2, 2, 2),
  description:
    "Repair a deterministic row validator that reports missing fields and exact type violations before training.",
  objective:
    "Turn an authored schema into row-level, ordered validation evidence rather than silently coercing malformed data.",
  completionEvidence:
    "A passing validator for valid, missing-field, and wrong-type datasets with row-specific evidence.",
  sources: [
    verifiedSource({
      label: "TensorFlow Data Validation",
      url: "https://www.tensorflow.org/tfx/guide/tfdv",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: () =>
    matrixSteps([
      {
        codeLine: 2,
        what: "Load the authored field-to-type contract.",
        why: "Validation requires an explicit expected representation.",
        values: [
          ["age", "int"],
          ["active", "bool"],
        ],
        activeCells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
        colHeaders: ["field", "type"],
      },
      {
        codeLine: 10,
        what: "Compare each row value with its exact contract type.",
        why: "Silent string or Boolean/integer coercion can change model behavior downstream.",
        values: [
          ["42", "true"],
          [21, 1],
        ],
        activeCells: [
          [0, 0],
          [1, 1],
        ],
        colHeaders: ["age", "active"],
      },
      {
        codeLine: 15,
        what: "Emit ordered row-level errors.",
        why: "Stable diagnostics are actionable and safe to use as a promotion gate.",
        values: [
          ["row 0", "age expected int"],
          ["row 1", "active expected bool"],
        ],
        completedCells: [
          [0, 1],
          [1, 1],
        ],
        variables: { valid: false, errorCount: 2 },
      },
    ]),
  assessmentPayload: {
    variant: "silent-coercion-repair",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def validate_dataset_contract(record):
    return {"valid": all(record["rows"]), "errors": []}`,
    evidence: [
      {
        label: "Training failure",
        content: "A later numeric operation receives the string value '42'.",
      },
      {
        label: "Ambiguous Boolean",
        content:
          "The integer 1 passes an isinstance(value, int) check but violates the bool contract.",
      },
    ],
    failingTests: [
      "Missing fields require row-specific errors.",
      "Exact Boolean contracts must reject integer proxies.",
    ],
    hints: [
      "Validate each schema field for every row.",
      "Use exact type identity for this authored contract.",
    ],
  },
});
