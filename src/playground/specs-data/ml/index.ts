import type { PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import { foundationsClassicalMlExecutions } from "./foundations_classical_ml";
import { foundationsLinearAlgebraExecutions } from "./foundations_linear_algebra";
import { foundationsOptimizationStatsExecutions } from "./foundations_optimization_stats";
import { systemsAttentionServingExecutions } from "./systems_attention_serving";
import { systemsNlpRetrievalDlExecutions } from "./systems_nlp_retrieval_dl";
import { systemsQuantizationDistributedExecutions } from "./systems_quantization_distributed";
import type { MlExecutionEntry } from "./types";

export type { MlCaseFixture, MlExecutionAuditSeed, MlExecutionEntry } from "./types";

export const ML_EXECUTION_ENTRIES: readonly MlExecutionEntry[] = Object.freeze([
  ...foundationsLinearAlgebraExecutions,
  ...foundationsOptimizationStatsExecutions,
  ...foundationsClassicalMlExecutions,
  ...systemsAttentionServingExecutions,
  ...systemsQuantizationDistributedExecutions,
  ...systemsNlpRetrievalDlExecutions,
]);

export const ML_EXECUTION_SPECS: Record<string, PythonExecutionSpec> = Object.freeze(
  Object.fromEntries(ML_EXECUTION_ENTRIES.map((entry) => [entry.id, entry.spec])),
);

export const ML_SPECS_MAP: ReadonlyMap<string, PythonExecutionSpec> = new Map(
  ML_EXECUTION_ENTRIES.map((entry) => [entry.id, entry.spec] as const),
);

export const ML_STARTER_CODE: ReadonlyMap<string, string> = new Map(
  ML_EXECUTION_ENTRIES.map((entry) => [entry.id, entry.starterCode] as const),
);
