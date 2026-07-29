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
    expected_types = {"int": int, "float": float, "str": str, "bool": bool}
    errors = []
    schema = record["schema"]
    for row_index, row in enumerate(record["rows"]):
        for field, rule in schema.items():
            if field not in row:
                errors.append(f"row {row_index}: missing {field}")
                continue
            value = row[field]
            if value is None:
                if not rule["nullable"]:
                    errors.append(f"row {row_index}: {field} is not nullable")
                continue
            if type(value) is not expected_types[rule["type"]]:
                errors.append(f"row {row_index}: {field} expected {rule['type']}")
                continue
            if "min" in rule and value < rule["min"]:
                errors.append(f"row {row_index}: {field} below min")
            if "max" in rule and value > rule["max"]:
                errors.append(f"row {row_index}: {field} above max")
        for field in row:
            if field not in schema:
                errors.append(f"row {row_index}: unexpected {field}")
        for field in record.get("semantic_nonnegative", []):
            if field in row and type(row[field]) in (int, float) and row[field] < 0:
                errors.append(f"row {row_index}: {field} violates nonnegative semantic")
        for field, allowed in record.get("semantic_allowed", {}).items():
            if field in row and row[field] not in allowed:
                errors.append(f"row {row_index}: {field} violates allowed-values semantic")
    if record["freshness_days"] > record["max_freshness_days"]:
        errors.append("dataset: freshness exceeds max age")

    evolution_errors = []
    for field, old_rule in record.get("previous_schema", {}).items():
        new_rule = schema.get(field)
        if new_rule is None:
            evolution_errors.append(f"evolution: removed {field}")
        elif new_rule["type"] != old_rule["type"]:
            evolution_errors.append(f"evolution: changed type for {field}")
        elif old_rule["nullable"] and not new_rule["nullable"]:
            evolution_errors.append(f"evolution: narrowed nullability for {field}")
    for field, rule in schema.items():
        if field not in record.get("previous_schema", {}) and not rule["nullable"]:
            evolution_errors.append(f"evolution: added required {field}")
    errors.extend(evolution_errors)
    return {"valid": not errors, "errors": errors, "evolution": "breaking" if evolution_errors else "compatible"}`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Validate exact schema/type, nullability, numeric range, freshness, semantic constraints, and compatible-versus-breaking schema evolution; return {valid, errors, evolution}.",
});

const execution = functionExecution({
  entrypoint,
  outputContract:
    "Return {valid, errors, evolution}. Assess exact schema/type including unexpected fields, nullable values, numeric range, freshness, nonnegative and allowed-values semantic constraints; evolution is compatible or breaking for removals, type/nullability narrowing, and added required fields.",
  cases: [
    {
      id: "valid-compatible",
      label: "Fresh rows satisfy a compatible contract",
      input: {
        schema: {
          user_id: { type: "int", nullable: false, min: 1 },
          score: { type: "float", nullable: true, min: 0, max: 1 },
          country: { type: "str", nullable: true },
        },
        previous_schema: {
          user_id: { type: "int", nullable: false, min: 1 },
          score: { type: "float", nullable: true, min: 0, max: 1 },
        },
        rows: [
          { user_id: 1, score: 0.75, country: "US" },
          { user_id: 2, score: 0.25, country: null },
        ],
        freshness_days: 1,
        max_freshness_days: 2,
        semantic_nonnegative: ["score"],
        semantic_allowed: { country: ["US", null] },
      },
      expected: { valid: true, errors: [], evolution: "compatible" },
      comparison: "deep-equal",
    },
    {
      id: "contract-and-semantic-violations",
      label: "Rows violate type, range, nullability, freshness, and semantics",
      input: {
        schema: {
          age: { type: "int", nullable: false, min: 18, max: 100 },
          score: { type: "float", nullable: false, min: 0, max: 1 },
          country: { type: "str", nullable: false },
        },
        previous_schema: {},
        rows: [{ age: "17", score: -0.5, country: null }],
        freshness_days: 3,
        max_freshness_days: 1,
        semantic_nonnegative: ["score"],
        semantic_allowed: { country: ["US"] },
      },
      expected: {
        valid: false,
        errors: [
          "row 0: age expected int",
          "row 0: score below min",
          "row 0: country is not nullable",
          "row 0: score violates nonnegative semantic",
          "row 0: country violates allowed-values semantic",
          "dataset: freshness exceeds max age",
          "evolution: added required age",
          "evolution: added required score",
          "evolution: added required country",
        ],
        evolution: "breaking",
      },
      comparison: "deep-equal",
    },
    {
      id: "semantic-check-after-invalid-type",
      label: "A semantic numeric rule does not crash after an exact-type failure",
      input: {
        schema: { score: { type: "float", nullable: false, min: 0 } },
        previous_schema: { score: { type: "float", nullable: false, min: 0 } },
        rows: [{ score: "bad" }],
        freshness_days: 0,
        max_freshness_days: 1,
        semantic_nonnegative: ["score"],
        semantic_allowed: {},
      },
      expected: {
        valid: false,
        errors: ["row 0: score expected float"],
        evolution: "compatible",
      },
      comparison: "deep-equal",
    },
    {
      id: "breaking-evolution",
      label: "Removing a field and narrowing its type contract breaks consumers",
      input: {
        schema: { user_id: { type: "str", nullable: false } },
        previous_schema: {
          user_id: { type: "int", nullable: true },
          legacy_score: { type: "float", nullable: true },
        },
        rows: [{ user_id: "u-1" }],
        freshness_days: 0,
        max_freshness_days: 1,
        semantic_nonnegative: [],
        semantic_allowed: {},
      },
      expected: {
        valid: false,
        errors: ["evolution: changed type for user_id", "evolution: removed legacy_score"],
        evolution: "breaking",
      },
      comparison: "deep-equal",
    },
    {
      id: "unexpected-fields",
      label: "Exact schema rejects uncontracted fields in row field order",
      input: {
        schema: { user_id: { type: "int", nullable: false } },
        previous_schema: { user_id: { type: "int", nullable: false } },
        rows: [{ user_id: 1, debug_note: "manual", legacy_score: 0.9 }],
        freshness_days: 0,
        max_freshness_days: 1,
        semantic_nonnegative: [],
        semantic_allowed: {},
      },
      expected: {
        valid: false,
        errors: ["row 0: unexpected debug_note", "row 0: unexpected legacy_score"],
        evolution: "compatible",
      },
      comparison: "deep-equal",
    },
  ],
});

export const datasetContractValidator = defineDebuggingItem({
  id: "dataset-contract-validator",
  title: "Dataset Contract Validator",
  topicIds: ["ml_data_contracts_splits"],
  difficultyProfile: profile(2, 3, 3, 3),
  description:
    "Repair a deterministic dataset gate that reports exact schema/type including unexpected fields, range, nullability, freshness, semantic constraints, and evolution compatibility before training.",
  objective:
    "Turn an authored data contract into ordered, row-level and dataset-level evidence rather than silently coercing malformed data or treating breaking evolution as safe.",
  completionEvidence:
    "A passing validator distinguishes compatible from breaking evolution and returns actionable evidence for missing or unexpected schema fields, type, range, nullability, freshness, and semantic failures.",
  sources: [
    verifiedSource({
      label: "TensorFlow Data Validation",
      url: "https://www.tensorflow.org/tfx/guide/tfdv",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (value) => {
    const record = value as {
      rows: readonly Record<string, unknown>[];
      freshness_days: number;
      max_freshness_days: number;
    };
    const row = record.rows[0] ?? {};
    return matrixSteps([
      {
        codeLine: 5,
        what: "Read the authored schema rules for the supplied row.",
        why: "Type, range, and nullability are independent contract dimensions.",
        values: Object.entries(row).map(([field, fieldValue]) => [field, String(fieldValue)]),
        colHeaders: ["field", "supplied value"],
        activeCells: Object.keys(row).map((_, index) => [index, 1] as const),
      },
      {
        codeLine: 22,
        what: "Check freshness and semantic evidence after per-field validation.",
        why: "Correct representation alone cannot prove that a dataset is current or meaningful.",
        values: [
          ["freshness days", record.freshness_days],
          ["maximum days", record.max_freshness_days],
        ],
        colHeaders: ["check", "value"],
        activeCells: [
          [0, 1],
          [1, 1],
        ],
      },
      {
        codeLine: 25,
        what: "Classify the schema change as compatible or breaking.",
        why: "Consumers can safely tolerate additive nullable fields, not removed or narrowed contracts.",
        values: [["evolution", "compare previous and current schema"]],
        colHeaders: ["gate", "evidence"],
        completedCells: [[0, 1]],
      },
    ]);
  },
  assessmentPayload: {
    variant: "dataset-contract-and-evolution-repair",
    changedContext: true,
    isomorphicRetest: true,
    faultyStarter: `def validate_dataset_contract(record):
    return {"valid": True, "errors": [], "evolution": "compatible"}`,
    evidence: [
      {
        label: "Freshness breach",
        content: "A correctly typed dataset can still be too stale to train.",
      },
      {
        label: "Breaking schema",
        content:
          "Removing a consumer field or narrowing its type/nullability is not backward compatible.",
      },
    ],
    failingTests: [
      "A required field must reject null and missing values.",
      "Exact schemas must reject unexpected fields in their supplied row order.",
      "Range and semantic constraints must not be skipped after a type check.",
      "Breaking evolution must be called out even when current rows validate.",
    ],
    hints: [
      "Validate each contract dimension independently.",
      "Compare every previous field with the proposed schema before calling it compatible.",
    ],
  },
});
