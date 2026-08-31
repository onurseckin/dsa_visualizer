import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_linear_logistic_regression_journey: CourseTopicJourney = {
  id: "ml_linear_logistic_regression",
  trackId: "machine-learning",
  title: "Linear & Logistic Regression Systems",
  subtitle: "OLS Normal Equations, Lasso Coordinate Descent, and Newton-Raphson IRLS",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_linear_logistic_regression = ml_linear_logistic_regression_journey;
export const topic = ml_linear_logistic_regression_journey;
