import { continuousBatchingTrace, llmServingPolicy, pagedKvCacheAllocation } from "./llmServing";
import {
  histogramSplitGain,
  tabularPipelineDebugging,
  treeModelSystemSelection,
} from "./treeSystems";
import {
  exactVsHnswSearch,
  retrievalRegressionDebugging,
  vectorIndexTradeoffs,
} from "./vectorRetrieval";
import {
  convolutionLoweringTrace,
  recurrentBpttTrace,
  visionSequenceSystemSelection,
} from "./visionSequence";

export const SERVING_MODEL_ELECTIVE_ITEMS = [
  pagedKvCacheAllocation,
  continuousBatchingTrace,
  llmServingPolicy,
  exactVsHnswSearch,
  vectorIndexTradeoffs,
  retrievalRegressionDebugging,
  histogramSplitGain,
  treeModelSystemSelection,
  tabularPipelineDebugging,
  convolutionLoweringTrace,
  recurrentBpttTrace,
  visionSequenceSystemSelection,
] as const;

export const SERVING_MODEL_ELECTIVE_EXPECTATIONS = SERVING_MODEL_ELECTIVE_ITEMS.map(
  (item) => [item.id, item.topicIds[0], item.kind] as const,
);
