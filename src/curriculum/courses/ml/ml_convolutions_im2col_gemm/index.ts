import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_convolutions_im2col_gemm_journey: CourseTopicJourney = {
  id: "ml_convolutions_im2col_gemm",
  trackId: "machine-learning",
  title: "CONVOLUTIONS IM2COL GEMM",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_convolutions_im2col_gemm = ml_convolutions_im2col_gemm_journey;
export const topic = ml_convolutions_im2col_gemm_journey;
