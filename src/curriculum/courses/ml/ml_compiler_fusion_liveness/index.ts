import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_compiler_fusion_liveness_journey: CourseTopicJourney = {
  id: "ml_compiler_fusion_liveness",
  trackId: "machine-learning",
  title: "COMPILER FUSION LIVENESS",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_compiler_fusion_liveness = ml_compiler_fusion_liveness_journey;
export const topic = ml_compiler_fusion_liveness_journey;
