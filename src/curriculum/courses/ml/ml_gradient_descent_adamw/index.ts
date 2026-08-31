import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_gradient_descent_adamw_journey: CourseTopicJourney = {
  id: "ml_gradient_descent_adamw",
  trackId: "machine-learning",
  title: "Gradient Descent & AdamW Optimization",
  subtitle: "Momentum, Ravine Conditioning, and Decoupled Weight Decay",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_gradient_descent_adamw = ml_gradient_descent_adamw_journey;
export const topic = ml_gradient_descent_adamw_journey;
