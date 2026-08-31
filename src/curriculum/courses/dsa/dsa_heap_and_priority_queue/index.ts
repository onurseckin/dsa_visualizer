import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_heap_and_priority_queue_journey: CourseTopicJourney = {
  id: "dsa_heap_and_priority_queue",
  trackId: "dsa",
  title: "HEAP AND PRIORITY QUEUE",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_heap_and_priority_queue = dsa_heap_and_priority_queue_journey;
export const topic = dsa_heap_and_priority_queue_journey;
