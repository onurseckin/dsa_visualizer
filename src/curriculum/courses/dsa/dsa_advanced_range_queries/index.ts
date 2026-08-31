import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_advanced_range_queries_journey: CourseTopicJourney = {
  id: "dsa_advanced_range_queries",
  trackId: "dsa",
  title: "ADVANCED RANGE QUERIES",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_advanced_range_queries = dsa_advanced_range_queries_journey;
export const topic = dsa_advanced_range_queries_journey;
