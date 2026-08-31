import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_dp_1d_journey: CourseTopicJourney = {
  id: "dsa_dp_1d",
  trackId: "dsa",
  title: "DP 1D",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_dp_1d = dsa_dp_1d_journey;
export const topic = dsa_dp_1d_journey;
