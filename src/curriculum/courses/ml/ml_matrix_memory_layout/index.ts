import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_matrix_memory_layout_journey: CourseTopicJourney = {
  id: "ml_matrix_memory_layout",
  trackId: "machine-learning",
  title: "Matrix Memory Layout & Physical RAM",
  subtitle: "1D DRAM Addressing, Strides, and Cache Locality Mechanics",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_matrix_memory_layout = ml_matrix_memory_layout_journey;
export const topic = ml_matrix_memory_layout_journey;
