import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_kd_trees_top_k_journey: CourseTopicJourney = {
  id: "ml_kd_trees_top_k",
  trackId: "machine-learning",
  title: "KD TREES TOP K",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_kd_trees_top_k = ml_kd_trees_top_k_journey;
export const topic = ml_kd_trees_top_k_journey;
