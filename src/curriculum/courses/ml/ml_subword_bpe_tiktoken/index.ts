import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_subword_bpe_tiktoken_journey: CourseTopicJourney = {
  id: "ml_subword_bpe_tiktoken",
  trackId: "machine-learning",
  title: "SUBWORD BPE TIKTOKEN",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_subword_bpe_tiktoken = ml_subword_bpe_tiktoken_journey;
export const topic = ml_subword_bpe_tiktoken_journey;
