import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_svm_kernel_smo_journey: CourseTopicJourney = {
  id: "ml_svm_kernel_smo",
  trackId: "machine-learning",
  title: "Support Vector Machines & Kernel Mechanics",
  subtitle: "Maximum Margin Hyperplanes, Mercer Kernels, and Platt's SMO Engine",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_svm_kernel_smo = ml_svm_kernel_smo_journey;
export const topic = ml_svm_kernel_smo_journey;
