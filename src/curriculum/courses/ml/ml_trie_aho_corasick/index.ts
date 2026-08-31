import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_trie_aho_corasick_journey: CourseTopicJourney = {
  id: "ml_trie_aho_corasick",
  trackId: "machine-learning",
  title: "TRIE AHO CORASICK",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_trie_aho_corasick = ml_trie_aho_corasick_journey;
export const topic = ml_trie_aho_corasick_journey;
