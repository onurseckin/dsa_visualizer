import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_mle_map_naive_bayes_journey: CourseTopicJourney = {
  id: "ml_mle_map_naive_bayes",
  trackId: "machine-learning",
  title: "MLE, MAP, & Naive Bayes Estimation",
  subtitle: "Frequentist Likelihood, Bayesian Conjugate Priors, and Log-Space Inference",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_mle_map_naive_bayes = ml_mle_map_naive_bayes_journey;
export const topic = ml_mle_map_naive_bayes_journey;
