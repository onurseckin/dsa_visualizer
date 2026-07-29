import type { DisplayValue } from "../../../types/dsa";

export interface CodeBlockViewerProps {
  code: string;
  activeLine?: number;
  isPinned?: boolean;
  variables?: Record<string, DisplayValue>;
  lineExplanations?: Record<number, string>;
}

export function splitIndent(line: string): { indent: string; content: string } {
  const match = /^(\s*)(.*)$/.exec(line);
  return match ? { indent: match[1], content: match[2] } : { indent: "", content: line };
}

export const EXPLAIN_LINES_STORAGE_KEY = "dsa_visualizer_explain_lines_enabled";
export const DEFAULT_EXPLAIN_LINES_ENABLED = true;

export function readExplainEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem(EXPLAIN_LINES_STORAGE_KEY);
    if (raw === null) return DEFAULT_EXPLAIN_LINES_ENABLED;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "boolean" ? parsed : DEFAULT_EXPLAIN_LINES_ENABLED;
  } catch {
    return DEFAULT_EXPLAIN_LINES_ENABLED;
  }
}

export function writeExplainEnabled(value: boolean): void {
  try {
    window.localStorage.setItem(EXPLAIN_LINES_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Best effort
  }
}
