import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_distributions_covariance_journey: CourseTopicJourney = {
  id: "ml_distributions_covariance",
  trackId: "machine-learning",
  title: "Multivariate Distributions & Covariance Mechanics",
  subtitle: "Gaussian Geometry, Mahalanobis Metric, and Cholesky Factorization",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_distributions_covariance = ml_distributions_covariance_journey;
export const topic = ml_distributions_covariance_journey;
