import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_tensor_strides_views_journey: CourseTopicJourney = {
  id: "ml_tensor_strides_views",
  trackId: "machine-learning",
  title: "Tensor Strides, Shapes, & Zero-Copy Views",
  subtitle: "Decoupled Storage, Affine Indexing, and Contiguity Proofs",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_tensor_strides_views = ml_tensor_strides_views_journey;
export const topic = ml_tensor_strides_views_journey;
