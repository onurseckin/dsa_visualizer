import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_ensemble_xgboost_journey: CourseTopicJourney = {
  id: "ml_ensemble_xgboost",
  trackId: "machine-learning",
  title: "Ensemble Learning & XGBoost Systems",
  subtitle: "Bagging, Boosting, and 2nd-Order Taylor Objective Formulations",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_ensemble_xgboost = ml_ensemble_xgboost_journey;
export const topic = ml_ensemble_xgboost_journey;
