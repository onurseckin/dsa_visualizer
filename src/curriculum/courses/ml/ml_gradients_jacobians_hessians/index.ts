import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_gradients_jacobians_hessians_journey: CourseTopicJourney = {
  id: "ml_gradients_jacobians_hessians",
  trackId: "machine-learning",
  title: "Gradients, Jacobians, & Hessians",
  subtitle: "Multivariate Curvature, Taylor Expansions, and Matrix-Free HVP",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_gradients_jacobians_hessians = ml_gradients_jacobians_hessians_journey;
export const topic = ml_gradients_jacobians_hessians_journey;
