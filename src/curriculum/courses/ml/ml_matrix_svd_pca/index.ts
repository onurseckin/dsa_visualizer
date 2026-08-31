import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_matrix_svd_pca_journey: CourseTopicJourney = {
  id: "ml_matrix_svd_pca",
  trackId: "machine-learning",
  title: "Singular Value Decomposition (SVD) & PCA",
  subtitle: "Spectral Geometry, Eckart-Young Optimality, and Randomized SVD",
  icon: "Brain",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_matrix_svd_pca = ml_matrix_svd_pca_journey;
export const topic = ml_matrix_svd_pca_journey;
