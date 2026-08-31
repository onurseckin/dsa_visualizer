import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_activations_online_softmax_journey: CourseTopicJourney = {
  id: "ml_activations_online_softmax",
  trackId: "machine-learning",
  title: "ACTIVATIONS ONLINE SOFTMAX",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_activations_online_softmax = ml_activations_online_softmax_journey;
export const topic = ml_activations_online_softmax_journey;
