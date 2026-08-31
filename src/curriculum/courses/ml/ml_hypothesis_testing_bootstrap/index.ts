import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_hypothesis_testing_bootstrap_journey: CourseTopicJourney = {
  id: "ml_hypothesis_testing_bootstrap",
  trackId: "machine-learning",
  title: "Hypothesis Testing & Bootstrap Resampling",
  subtitle: "Non-Parametric Estimation, Glivenko-Cantelli Bounds, and FDR Control",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_hypothesis_testing_bootstrap = ml_hypothesis_testing_bootstrap_journey;
export const topic = ml_hypothesis_testing_bootstrap_journey;
