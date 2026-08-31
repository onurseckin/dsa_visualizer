import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_geometry_and_sweep_line_journey: CourseTopicJourney = {
  id: "dsa_geometry_and_sweep_line",
  trackId: "dsa",
  title: "GEOMETRY AND SWEEP LINE",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_geometry_and_sweep_line = dsa_geometry_and_sweep_line_journey;
export const topic = dsa_geometry_and_sweep_line_journey;
