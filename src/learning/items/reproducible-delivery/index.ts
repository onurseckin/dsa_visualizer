import type { LearningItem } from "../../types";
import { experimentComparisonDebugging } from "./experiment-comparison-debugging";
import { featureMaterializationDesign } from "./feature-materialization-design";
import { mlPipelineRetryCache } from "./ml-pipeline-retry-cache";
import { mlTestStrategy } from "./ml-test-strategy";
import { modelArtifactLineage } from "./model-artifact-lineage";
import { pointInTimeFeatureJoin } from "./point-in-time-feature-join";
import { runReproductionManifest } from "./run-reproduction-manifest";
import { staleArtifactPipelineDebugging } from "./stale-artifact-pipeline-debugging";
import { trainingServingSkew } from "./training-serving-skew";

export {
  experimentComparisonDebugging,
  featureMaterializationDesign,
  mlPipelineRetryCache,
  mlTestStrategy,
  modelArtifactLineage,
  pointInTimeFeatureJoin,
  runReproductionManifest,
  staleArtifactPipelineDebugging,
  trainingServingSkew,
};

export const REPRODUCIBLE_DELIVERY_IDS = Object.freeze([
  "run-reproduction-manifest",
  "model-artifact-lineage",
  "experiment-comparison-debugging",
  "point-in-time-feature-join",
  "training-serving-skew",
  "feature-materialization-design",
  "ml-pipeline-retry-cache",
  "ml-test-strategy",
  "stale-artifact-pipeline-debugging",
] as const);

export const REPRODUCIBLE_DELIVERY_ITEMS = Object.freeze([
  runReproductionManifest,
  modelArtifactLineage,
  experimentComparisonDebugging,
  pointInTimeFeatureJoin,
  trainingServingSkew,
  featureMaterializationDesign,
  mlPipelineRetryCache,
  mlTestStrategy,
  staleArtifactPipelineDebugging,
] as const satisfies readonly LearningItem[]);
