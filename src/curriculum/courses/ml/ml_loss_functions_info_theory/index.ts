import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_loss_functions_info_theory_journey: CourseTopicJourney = {
  id: "ml_loss_functions_info_theory",
  trackId: "machine-learning",
  title: "Information Theory & Loss Functions",
  subtitle: "Entropy, Relative Divergence, Focal Losses, and Contrastive InfoNCE",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_loss_functions_info_theory = ml_loss_functions_info_theory_journey;
export const topic = ml_loss_functions_info_theory_journey;
