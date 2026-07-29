import type { LearningItem } from "../../../types";
import { bpeTokenBudget } from "./bpeTokenBudget";
import { causalAttentionTrace } from "./causalAttentionTrace";
import { compilerGraphCompatibility } from "./compilerGraphCompatibility";
import { distributedMemoryStraggler } from "./distributedMemoryStraggler";
import { distributedParallelismSelection } from "./distributedParallelismSelection";
import { kvCacheMemoryPolicy } from "./kvCacheMemoryPolicy";
import { portableRuntimeSelection } from "./portableRuntimeSelection";
import { profilerOptimizationDecision } from "./profilerOptimizationDecision";
import { quantizationDeploymentPlan } from "./quantizationDeploymentPlan";
import { ringAllreduceTrace } from "./ringAllreduceTrace";
import { rooflineBoundEstimator } from "./rooflineBoundEstimator";
import { tiledGemmMemoryTrace } from "./tiledGemmMemoryTrace";

export const COMPUTE_ELECTIVE_ITEMS = Object.freeze([
  rooflineBoundEstimator,
  tiledGemmMemoryTrace,
  profilerOptimizationDecision,
  ringAllreduceTrace,
  distributedParallelismSelection,
  distributedMemoryStraggler,
  quantizationDeploymentPlan,
  compilerGraphCompatibility,
  portableRuntimeSelection,
  bpeTokenBudget,
  causalAttentionTrace,
  kvCacheMemoryPolicy,
] satisfies readonly LearningItem[]);

export const COMPUTE_ELECTIVE_EXPECTATIONS = Object.freeze(
  COMPUTE_ELECTIVE_ITEMS.map((item) => [item.id, item.topicIds[0], item.kind] as const),
);
