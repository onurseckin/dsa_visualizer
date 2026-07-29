import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validatePythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { ALGORITHMS, ALGORITHM_REGISTRY } from "../src/algorithms/registry";
import { ML_INFRA_TREE_PLACEMENTS } from "../src/components/knowledge-graph/mlInfraTree";
import { TOPIC_CATALOG } from "../src/curriculum/topics";
import {
  LEARNING_ITEMS,
  LEARNING_ITEM_REGISTRY,
  ML_INFRA_LEARNING_ITEMS,
} from "../src/learning/registry";
import { getLearningItemPlayground } from "../src/learning/types";

const RETIRED_ML_DIRECTORIES = [
  "ml_attention_geometry",
  "ml_autograd_dags",
  "ml_convolutions",
  "ml_distributed_systems",
  "ml_gemm_roofline",
  "ml_graph_compilers",
  "ml_hardware_kernels",
  "ml_infra",
  "ml_llm_serving",
  "ml_precision_quantization",
  "ml_recurrent_gates",
  "ml_tensor_algebra",
  "ml_tokenization",
  "ml_tree_ensembles",
  "ml_vector_search",
] as const;

const failures: string[] = [];

function check(condition: unknown, message: string): void {
  if (!condition) failures.push(message);
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function parsePython(label: string, source: string): void {
  const result = spawnSync(
    "python3",
    ["-c", "import ast, sys; ast.parse(sys.stdin.read(), filename=sys.argv[1])", label],
    { encoding: "utf8", input: source },
  );
  if (result.error) {
    failures.push(`${label}: Python parser unavailable: ${result.error.message}`);
  } else if (result.status !== 0) {
    failures.push(`${label}: invalid Python syntax: ${result.stderr.trim()}`);
  }
}

function auditCountsAndTopics(): void {
  check(ALGORITHMS.length === 123, `expected 123 DSA algorithms, received ${ALGORITHMS.length}`);
  check(
    ML_INFRA_LEARNING_ITEMS.length === 0,
    `expected 0 ML items, received ${ML_INFRA_LEARNING_ITEMS.length}`,
  );
  check(
    LEARNING_ITEMS.length === 123,
    `expected 123 learning items, received ${LEARNING_ITEMS.length}`,
  );
  check(
    Object.keys(ALGORITHM_REGISTRY).length === 123,
    "algorithm registry does not contain exactly 123 entries",
  );
  check(
    Object.keys(LEARNING_ITEM_REGISTRY).length === 123,
    "learning registry does not contain exactly 123 entries",
  );
  check(
    duplicateValues(LEARNING_ITEMS.map(({ id }) => id)).length === 0,
    "learning registry contains duplicate IDs",
  );

  const mlCatalogIds = TOPIC_CATALOG.filter(({ track }) => track === "ml-infra").map(
    ({ id }) => id,
  );
  check(mlCatalogIds.length === 23, `expected 23 ML topics, received ${mlCatalogIds.length}`);
  check(
    ML_INFRA_TREE_PLACEMENTS.length === 23,
    `expected 23 ML placements, received ${ML_INFRA_TREE_PLACEMENTS.length}`,
  );
  for (const placement of ML_INFRA_TREE_PLACEMENTS) {
    const items = ML_INFRA_LEARNING_ITEMS.filter(({ topicIds }) =>
      topicIds.includes(placement.topicId),
    );
    check(items.length === 0, `${placement.topicId}: expected 0 items, received ${items.length}`);
  }
}

function auditLearningAssets(): void {
  const normalizedCode = new Map<string, string>();
  const normalizedDescriptions = new Map<string, string>();

  for (const item of LEARNING_ITEMS) {
    check(item.sources.length > 0, `${item.id}: missing source metadata`);
    for (const source of item.sources) {
      if (source.provenance !== "verified") continue;
      try {
        const url = new URL(source.url);
        check(
          url.protocol === "https:" || url.protocol === "http:",
          `${item.id}: unsupported source URL protocol`,
        );
      } catch {
        failures.push(`${item.id}: malformed verified source URL`);
      }
    }

    const playground = getLearningItemPlayground(item);
    check(playground !== undefined, `${item.id}: missing executable playground`);
    if (!playground) continue;
    check(playground.starterCode !== playground.code, `${item.id}: starter equals reference code`);
    check(
      playground.execution.cases.length >= 3,
      `${item.id}: expected at least 3 execution cases`,
    );
    const validation = validatePythonExecutionSpec(playground.execution);
    check(validation.ok, `${item.id}: invalid Python execution contract`);
    parsePython(`${item.id}:reference`, playground.code);
    parsePython(`${item.id}:starter`, playground.starterCode);

    const codeKey = playground.code.replace(/\s+/g, " ").trim();
    const existingCodeId = normalizedCode.get(codeKey);
    check(!existingCodeId, `${item.id}: duplicates reference code from ${existingCodeId}`);
    normalizedCode.set(codeKey, item.id);

    const descriptionKey = item.description.replace(/\s+/g, " ").trim().toLowerCase();
    const existingDescriptionId = normalizedDescriptions.get(descriptionKey);
    check(
      !existingDescriptionId,
      `${item.id}: duplicates the authored description from ${existingDescriptionId}`,
    );
    normalizedDescriptions.set(descriptionKey, item.id);
  }
}

function auditRetirementLedger(): void {
  const csv = readFileSync(
    resolve(process.cwd(), "research/ml-infra-curriculum/current-problem-ledger.csv"),
    "utf8",
  );
  const rows = csv
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => row.split(","));
  check(rows.length === 232, `expected 232 retirement ledger rows, received ${rows.length}`);
  check(
    duplicateValues(rows.map(([id]) => id ?? "")).length === 0,
    "retirement ledger contains duplicate IDs",
  );
  for (const [id, disposition, targetItemId, reasonCode] of rows) {
    check(Boolean(id && disposition && targetItemId && reasonCode), "retirement ledger has gaps");
    check(
      disposition === "merge" ||
        disposition === "move" ||
        disposition === "reference" ||
        disposition === "retain" ||
        disposition === "retire" ||
        disposition === "rework",
      `${id}: unsupported retirement disposition ${disposition}`,
    );
    check(!ALGORITHM_REGISTRY[id ?? ""], `${id}: retired ID remains in algorithm registry`);
    check(!LEARNING_ITEM_REGISTRY[id ?? ""], `${id}: retired ID remains in learning registry`);
  }
  for (const directory of RETIRED_ML_DIRECTORIES) {
    check(
      !existsSync(resolve(process.cwd(), "src/algorithms", directory)),
      `${directory}: retired source directory remains active`,
    );
  }
}

auditCountsAndTopics();
auditLearningAssets();
auditRetirementLedger();

if (failures.length > 0) {
  throw new Error(`Catalog audit failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
}

console.log(
  `Catalog audit passed: ${ALGORITHMS.length} DSA + ${ML_INFRA_LEARNING_ITEMS.length} ML = ${LEARNING_ITEMS.length} active items; 232 legacy ML IDs retired.`,
);
