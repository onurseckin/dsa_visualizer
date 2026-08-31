import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_parallelism_3d_moe_1f1b_journey: CourseTopicJourney = {
  id: "ml_parallelism_3d_moe_1f1b",
  trackId: "machine-learning",
  title: "PARALLELISM 3D MOE 1F1B",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_parallelism_3d_moe_1f1b = ml_parallelism_3d_moe_1f1b_journey;
export const topic = ml_parallelism_3d_moe_1f1b_journey;
