import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_core";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const dsa_graph_flows_and_cuts_journey: CourseTopicJourney = {
  id: "dsa_graph_flows_and_cuts",
  trackId: "dsa",
  title: "GRAPH FLOWS AND CUTS",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Binary",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const dsa_graph_flows_and_cuts = dsa_graph_flows_and_cuts_journey;
export const topic = dsa_graph_flows_and_cuts_journey;
