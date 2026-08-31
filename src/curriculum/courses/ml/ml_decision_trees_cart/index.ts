import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_decision_trees_cart_journey: CourseTopicJourney = {
  id: "ml_decision_trees_cart",
  trackId: "machine-learning",
  title: "Decision Trees & CART Systems",
  subtitle: "Gini Impurity, Axis-Aligned Partitions, and Flat-Array Binary Trees",
  icon: "BinaryTree",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_decision_trees_cart = ml_decision_trees_cart_journey;
export const topic = ml_decision_trees_cart_journey;
