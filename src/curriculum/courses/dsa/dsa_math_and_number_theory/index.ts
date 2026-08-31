import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_math_and_number_theory_journey: CourseTopicJourney = {
  id: "dsa_math_and_number_theory",
  trackId: "dsa",
  title: "MATH AND NUMBER THEORY",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_math_and_number_theory = dsa_math_and_number_theory_journey;
export const topic = dsa_math_and_number_theory_journey;
