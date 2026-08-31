import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_ring_allreduce_collective_journey: CourseTopicJourney = {
  id: "ml_ring_allreduce_collective",
  trackId: "machine-learning",
  title: "RING ALLREDUCE COLLECTIVE",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_ring_allreduce_collective = ml_ring_allreduce_collective_journey;
export const topic = ml_ring_allreduce_collective_journey;
