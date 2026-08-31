import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_zero3_parameter_sharding_journey: CourseTopicJourney = {
  id: "ml_zero3_parameter_sharding",
  trackId: "machine-learning",
  title: "ZERO3 PARAMETER SHARDING",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_zero3_parameter_sharding = ml_zero3_parameter_sharding_journey;
export const topic = ml_zero3_parameter_sharding_journey;
