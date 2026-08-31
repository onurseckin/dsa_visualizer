import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_two_pointers_journey: CourseTopicJourney = {
  id: "dsa_two_pointers",
  trackId: "dsa",
  title: "TWO POINTERS",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_two_pointers = dsa_two_pointers_journey;
export const topic = dsa_two_pointers_journey;
