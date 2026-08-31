import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_autodiff_engines_journey: CourseTopicJourney = {
  id: "ml_autodiff_engines",
  trackId: "machine-learning",
  title: "Automatic Differentiation Engines",
  subtitle: "Forward Dual Numbers, DAG Adjoints, and Tensor-Level Autograd",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_autodiff_engines = ml_autodiff_engines_journey;
export const topic = ml_autodiff_engines_journey;
