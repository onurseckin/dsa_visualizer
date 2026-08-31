import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_affine_quantization_int8_journey: CourseTopicJourney = {
  id: "ml_affine_quantization_int8",
  trackId: "machine-learning",
  title: "AFFINE QUANTIZATION INT8",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_affine_quantization_int8 = ml_affine_quantization_int8_journey;
export const topic = ml_affine_quantization_int8_journey;
