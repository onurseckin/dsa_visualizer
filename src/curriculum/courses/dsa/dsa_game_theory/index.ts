import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_game_theory_journey: CourseTopicJourney = {
  id: "dsa_game_theory",
  trackId: "dsa",
  title: "GAME THEORY",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_game_theory = dsa_game_theory_journey;
export const topic = dsa_game_theory_journey;
