import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_sliding_window_journey: CourseTopicJourney = {
  id: "dsa_sliding_window",
  trackId: "dsa",
  title: "SLIDING WINDOW",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_sliding_window = dsa_sliding_window_journey;
export const topic = dsa_sliding_window_journey;
