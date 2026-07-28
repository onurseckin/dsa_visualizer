import { CSSProperties } from "react";
import { TOPIC_CATALOG } from "../../curriculum/topics";

export const PROBLEM_LIST_STORAGE_PREFIX = "dsa_visualizer_problem_list_";

export function readStoredProblemListValue<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  try {
    const raw = window.localStorage.getItem(PROBLEM_LIST_STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredProblemListValue(key: string, value: string): void {
  try {
    window.localStorage.setItem(PROBLEM_LIST_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort
  }
}

export type ProblemListDifficulty = "All" | "Easy" | "Medium" | "Hard";
export type ProblemListSource = "All" | "leetcode" | "book" | "standard" | "ml_infra";
export type ProblemListSortField = "title" | "difficulty" | "topic";
export type ProblemListSortOrder = "asc" | "desc";

export const isProblemListDifficulty = (value: unknown): value is ProblemListDifficulty =>
  value === "All" || value === "Easy" || value === "Medium" || value === "Hard";

export const isProblemListSource = (value: unknown): value is ProblemListSource =>
  value === "All" ||
  value === "leetcode" ||
  value === "book" ||
  value === "standard" ||
  value === "ml_infra";

export const isProblemListSortField = (value: unknown): value is ProblemListSortField =>
  value === "title" || value === "difficulty" || value === "topic";

export const isProblemListSortOrder = (value: unknown): value is ProblemListSortOrder =>
  value === "asc" || value === "desc";

export const cellPadding = "var(--space-3) var(--space-4)";
export const PANEL_BORDER: CSSProperties = { borderColor: "var(--border-default)" };
export const TOPIC_ENTRIES = TOPIC_CATALOG.map((topic) => [topic.id, topic.label] as const);
