import { CSSProperties } from "react";
import { TOPIC_CATALOG } from "../../curriculum/topics";
import type { ProblemSource } from "../../types/dsa";
import { getSourceKind } from "../../types/dsa";

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

import type { LearningSource } from "../../learning/types";

export type SourceLike = ProblemSource | LearningSource;

export function normalizeChapterNumber(chapter: string | number | undefined): number | undefined {
  if (typeof chapter === "number" && !isNaN(chapter)) return chapter;
  if (typeof chapter === "string") {
    const match = chapter.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return undefined;
}

export function getSourceDisplayTag(source: SourceLike): string | undefined {
  const kind =
    "kind" in source && source.kind ? source.kind : getSourceKind(source as ProblemSource);
  if (kind === "book" || ("bookTitle" in source && source.bookTitle)) {
    const bookSource = source as {
      bookTitle?: string;
      chapter?: string | number;
      shortTitle?: string;
    };
    const bookTitle = bookSource.bookTitle || "Competitive Programmer's Handbook";
    const chNum = normalizeChapterNumber(bookSource.chapter);
    const shortName = bookTitle.toLowerCase().includes("competitive programmer")
      ? "CP Handbook"
      : bookSource.shortTitle || bookTitle;
    if (chNum !== undefined) {
      return `${shortName} Ch ${chNum}`;
    }
    return shortName;
  }
  if (kind === "leetcode" || "id" in source || "leetcodeId" in source) {
    const leetSource = source as { id?: number; leetcodeId?: number };
    const id = leetSource.id ?? leetSource.leetcodeId;
    return id ? `LeetCode #${id}` : "LeetCode";
  }
  if (kind === "standard") {
    return (source as { label?: string }).label || "Standard";
  }
  if (kind === "ml_infra") {
    return (source as { label?: string }).label || "ML Infra";
  }
  return undefined;
}

export function getItemDisplayTags(item: { sources?: readonly SourceLike[] }): string[] {
  const tags = new Set<string>();
  if (item.sources && item.sources.length > 0) {
    for (const source of item.sources) {
      const tag = getSourceDisplayTag(source);
      if (tag) tags.add(tag);
    }
  }
  return Array.from(tags);
}

export function getItemSearchTokens(item: { sources?: readonly SourceLike[] }): string[] {
  const tokens = new Set<string>();
  const displayTags = getItemDisplayTags(item);
  for (const tag of displayTags) {
    tokens.add(tag.toLowerCase());
  }

  if (item.sources && item.sources.length > 0) {
    for (const source of item.sources) {
      if ("bookTitle" in source && source.bookTitle) tokens.add(source.bookTitle.toLowerCase());
      if ("chapter" in source && source.chapter !== undefined) {
        const chNum = normalizeChapterNumber(source.chapter);
        if (chNum !== undefined) {
          tokens.add(`chapter ${chNum}`);
          tokens.add(`book chapter ${chNum}`);
          tokens.add(`cp handbook chapter ${chNum}`);
          tokens.add(`cp handbook ch ${chNum}`);
          tokens.add(`ch ${chNum}`);
          tokens.add(`ch${chNum}`);
        }
      }
      if ("chapterTitle" in source && source.chapterTitle)
        tokens.add(source.chapterTitle.toLowerCase());
      if ("label" in source && source.label) tokens.add(source.label.toLowerCase());
    }
  }
  return Array.from(tokens);
}

export function getAllCatalogDisplayTags(
  items: readonly { sources?: readonly SourceLike[] }[],
): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    const itemTags = getItemDisplayTags(item);
    for (const tag of itemTags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort((a, b) => {
    const matchA = a.match(/Ch (\d+)/);
    const matchB = b.match(/Ch (\d+)/);
    if (matchA && matchB) {
      return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
    }
    return a.localeCompare(b);
  });
}
