import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_clustering_kmeans_dbscan_journey: CourseTopicJourney = {
  id: "ml_clustering_kmeans_dbscan",
  trackId: "machine-learning",
  title: "Clustering: K-Means & DBSCAN Systems",
  subtitle: "Lloyd's Objective, K-Means++ Bounds, and Density-Connected Spatial Manifolds",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_clustering_kmeans_dbscan = ml_clustering_kmeans_dbscan_journey;
export const topic = ml_clustering_kmeans_dbscan_journey;
