import type { CourseTopicJourney } from "../../../courseTypes";
import { chapter_1 } from "./chapter_01_foundations";
import { chapter_2 } from "./chapter_02_practice_laboratory";

export const ml_recurrent_lstm_gru_journey: CourseTopicJourney = {
  id: "ml_recurrent_lstm_gru",
  trackId: "machine-learning",
  title: "RECURRENT LSTM GRU",
  subtitle: "University-Grade Masterclass Depth",
  icon: "Cpu",
  difficulty: "Hard",
  estimatedMinutes: 90,
  chapters: [chapter_1, chapter_2],
};

export const ml_recurrent_lstm_gru = ml_recurrent_lstm_gru_journey;
export const topic = ml_recurrent_lstm_gru_journey;
