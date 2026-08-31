import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_graph_shortest_paths_journey: CourseTopicJourney = {
  id: "dsa_graph_shortest_paths",
  trackId: "dsa",
  title: "GRAPH SHORTEST PATHS",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_graph_shortest_paths = dsa_graph_shortest_paths_journey;
export const topic = dsa_graph_shortest_paths_journey;
