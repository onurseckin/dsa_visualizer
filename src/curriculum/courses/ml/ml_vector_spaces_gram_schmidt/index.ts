import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_vector_spaces_gram_schmidt_journey: CourseTopicJourney = {
  id: "ml_vector_spaces_gram_schmidt",
  trackId: "machine-learning",
  title: "Vector Spaces, Orthogonality, & Gram-Schmidt",
  subtitle: "Subspace Projections, MGS Stability, and QR Factorizations",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_vector_spaces_gram_schmidt = ml_vector_spaces_gram_schmidt_journey;
export const topic = ml_vector_spaces_gram_schmidt_journey;
