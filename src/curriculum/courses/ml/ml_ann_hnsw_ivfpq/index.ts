import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_ann_hnsw_ivfpq_journey: CourseTopicJourney = {
  id: "ml_ann_hnsw_ivfpq",
  trackId: "machine-learning",
  title: "ANN HNSW IVFPQ",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_ann_hnsw_ivfpq = ml_ann_hnsw_ivfpq_journey;
export const topic = ml_ann_hnsw_ivfpq_journey;
