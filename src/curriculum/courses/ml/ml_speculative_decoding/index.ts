import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_speculative_decoding_journey: CourseTopicJourney = {
  id: "ml_speculative_decoding",
  trackId: "machine-learning",
  title: "SPECULATIVE DECODING",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_speculative_decoding = ml_speculative_decoding_journey;
export const topic = ml_speculative_decoding_journey;
