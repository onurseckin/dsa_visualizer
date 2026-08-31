import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_stack_and_queue_journey: CourseTopicJourney = {
  id: "dsa_stack_and_queue",
  trackId: "dsa",
  title: "STACK AND QUEUE",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_stack_and_queue = dsa_stack_and_queue_journey;
export const topic = dsa_stack_and_queue_journey;
