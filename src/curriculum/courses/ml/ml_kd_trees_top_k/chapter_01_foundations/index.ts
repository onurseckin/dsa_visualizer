import type { CourseChapter } from "../../../../courseTypes";
import { page1 as page_1 } from "./page_01_core";
import { page_01_core_concepts as page_2 } from "./page_01_core_concepts";
import { page2 as page_3 } from "./page_02_systems";

export const chapter_1: CourseChapter = {
  id: "ml_kd_trees_top_k_chapter_01_foundations",
  chapterNumber: 1,
  title: "Core Mechanics",
  subtitle: "First principles and architectural foundations",
  estimatedMinutes: 45,
  sections: [],
  pages: [page_1, page_2, page_3],
};

export const chapter = chapter_1;
export const chapter_01 = chapter_1;
export const chapter_02 = chapter_1;
export const chapter1 = chapter_1;
export const chapter2 = chapter_1;
export const chapter_01_core = chapter_1;
export const chapter_N_practice_laboratory = chapter_1;
