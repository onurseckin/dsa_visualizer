import type { CourseChapter } from "../../../../courseTypes";
import { page_01_core_concepts as page_1 } from "./page_01_core_concepts";
import { page2 as page_2 } from "./page_02_systems";

export const chapter_1: CourseChapter = {
  id: "ml_recurrent_lstm_gru_chapter_01_foundations",
  chapterNumber: 1,
  title: "Core Mechanics: Recurrent Architectures (LSTM & GRU)",
  subtitle: "Backpropagation Through Time, Gating Equations, and Hardware Limitations",
  estimatedMinutes: 45,
  sections: [],
  pages: [page_1, page_2],
};

export const chapter = chapter_1;
export const chapter_01 = chapter_1;
export const chapter_02 = chapter_1;
export const chapter1 = chapter_1;
export const chapter2 = chapter_1;
export const chapter_01_core = chapter_1;
export const chapter_N_practice_laboratory = chapter_1;
