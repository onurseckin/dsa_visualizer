import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_dense_gemm_tiling_journey: CourseTopicJourney = {
  id: "ml_dense_gemm_tiling",
  trackId: "machine-learning",
  title: "DENSE GEMM TILING",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_dense_gemm_tiling = ml_dense_gemm_tiling_journey;
export const topic = ml_dense_gemm_tiling_journey;
