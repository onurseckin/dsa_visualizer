import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_interconnect_alpha_beta_journey: CourseTopicJourney = {
  id: "ml_interconnect_alpha_beta",
  trackId: "machine-learning",
  title: "INTERCONNECT ALPHA BETA",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_interconnect_alpha_beta = ml_interconnect_alpha_beta_journey;
export const topic = ml_interconnect_alpha_beta_journey;
