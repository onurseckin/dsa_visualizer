import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_rope_gqa_attention_journey: CourseTopicJourney = {
  id: "ml_rope_gqa_attention",
  trackId: "machine-learning",
  title: "ROPE GQA ATTENTION",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_rope_gqa_attention = ml_rope_gqa_attention_journey;
export const topic = ml_rope_gqa_attention_journey;
