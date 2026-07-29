import type { LearningItem } from "../../types";
import { COMPUTE_ELECTIVE_ITEMS } from "./compute";
import { SERVING_MODEL_ELECTIVE_ITEMS } from "./serving-models";

export { COMPUTE_ELECTIVE_ITEMS } from "./compute";
export { SERVING_MODEL_ELECTIVE_ITEMS } from "./serving-models";

export const ELECTIVE_LEARNING_ITEMS = Object.freeze([
  ...COMPUTE_ELECTIVE_ITEMS,
  ...SERVING_MODEL_ELECTIVE_ITEMS,
] satisfies readonly LearningItem[]);
