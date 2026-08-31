import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_sampling_top_p_journey: CourseTopicJourney = {
  id: "ml_sampling_top_p",
  trackId: "machine-learning",
  title: "Autoregressive LLM Sampling Mechanics",
  subtitle: "Temperature Scaling, Top-P Nucleus Truncation, and Gumbel-Max Engines",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_sampling_top_p = ml_sampling_top_p_journey;
export const topic = ml_sampling_top_p_journey;
