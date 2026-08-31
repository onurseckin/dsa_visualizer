import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_collaborative_filtering_als_journey: CourseTopicJourney = {
  id: "ml_collaborative_filtering_als",
  trackId: "machine-learning",
  title: "Collaborative Filtering & Implicit ALS",
  subtitle: "Matrix Factorization, Implicit Feedback Confidence, and Fast Gram Acceleration",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_collaborative_filtering_als = ml_collaborative_filtering_als_journey;
export const topic = ml_collaborative_filtering_als_journey;
