import type { CourseChapter } from "../../../../courseTypes";
import { page1 as page_1 } from "./page_01_dsa_foundations";
import { page2 as page_2 } from "./page_02_math_proofs";
import { page3 as page_3 } from "./page_03_systems_scenarios";

export const chapter_2: CourseChapter = {
  id: "dsa_binary_search_chapter_02_practice_laboratory",
  chapterNumber: 2,
  title: "Practice Laboratory",
  subtitle: "Interactive problems and stress tests",
  estimatedMinutes: 45,
  sections: [],
  pages: [page_1, page_2, page_3],
};

export const chapter = chapter_2;
export const chapter_01 = chapter_2;
export const chapter_02 = chapter_2;
export const chapter1 = chapter_2;
export const chapter2 = chapter_2;
export const chapter_01_core = chapter_2;
export const chapter_N_practice_laboratory = chapter_2;
