import {
  DEFAULT_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WORKSPACE_LAYOUT_VERSION,
  WORKSPACE_PANEL_KEYS,
  WorkspaceLayout,
  WorkspaceLayoutPatch,
  WorkspacePanelHeights,
  clampPanelHeight,
  clampSplitPercent,
  cloneWorkspaceLayout,
  getWorkspaceLayoutKey,
} from "./workspaceLayoutTypes";
import { syncKeyToSqlite } from "./sqliteSync";

type WorkspaceValue =
  | string
  | number
  | boolean
  | null
  | WorkspaceLayout
  | WorkspacePanelHeights
  | Record<string, number | null | string | boolean>
  | Array<number | string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isInRange = (value: WorkspaceValue, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;

const readPanelHeights = (value: WorkspaceValue): WorkspacePanelHeights | null => {
  if (!isRecord(value)) return null;
  const result = {} as WorkspacePanelHeights;
  for (const key of WORKSPACE_PANEL_KEYS) {
    const height = value[key];
    if (height === null) {
      result[key] = null;
      continue;
    }
    if (!isInRange(height, MIN_PANEL_HEIGHT_PX, MAX_PANEL_HEIGHT_PX)) return null;
    result[key] = height;
  }
  return result;
};

const getStorage = (): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
};

/** Never throws: any unreadable, stale, malformed or out-of-range value yields defaults. */
export function readWorkspaceLayout(algorithmId?: string): WorkspaceLayout {
  const storage = getStorage();
  if (!storage) return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  const storageKey = getWorkspaceLayoutKey(algorithmId);
  let raw: string | null = null;
  try {
    raw = storage.getItem(storageKey);
  } catch {
    return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  }
  if (raw === null) return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  let parsed: WorkspaceValue;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  }

  if (!isRecord(parsed)) return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  if (parsed.version !== WORKSPACE_LAYOUT_VERSION) return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  if (!isInRange(parsed.splitPercent, MIN_SPLIT_PERCENT, MAX_SPLIT_PERCENT)) {
    return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  }

  const panelHeights = readPanelHeights(parsed.panelHeights);
  if (!panelHeights) return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  if (typeof parsed.problemExpanded !== "boolean") return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  if (typeof parsed.solutionExpanded !== "boolean") return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  return {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: parsed.splitPercent,
    panelHeights,
    problemExpanded: parsed.problemExpanded,
    solutionExpanded: parsed.solutionExpanded,
  };
}

/** Merges the patch onto whatever is stored, clamps it, writes best-effort, returns the result. */
export function writeWorkspaceLayout(
  patch: WorkspaceLayoutPatch,
  algorithmId?: string,
): WorkspaceLayout {
  const storageKey = getWorkspaceLayoutKey(algorithmId);
  const current = readWorkspaceLayout(algorithmId);

  const panelHeights = {} as WorkspacePanelHeights;
  for (const key of WORKSPACE_PANEL_KEYS) {
    const patched = patch.panelHeights?.[key];
    panelHeights[key] =
      patched === undefined
        ? clampPanelHeight(current.panelHeights[key])
        : clampPanelHeight(patched);
  }

  const merged: WorkspaceLayout = {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: clampSplitPercent(patch.splitPercent ?? current.splitPercent),
    panelHeights,
    problemExpanded: patch.problemExpanded ?? current.problemExpanded,
    solutionExpanded: patch.solutionExpanded ?? current.solutionExpanded,
  };

  const storage = getStorage();
  const value = JSON.stringify(merged);
  if (storage) {
    try {
      storage.setItem(storageKey, value);
    } catch {
      // Storage full or blocked: the in-memory layout still applies this session.
    }
  }
  void syncKeyToSqlite(storageKey, value);

  return merged;
}

/** Only ever called from a confirmed "reset layout" action. */
export function clearWorkspaceLayout(algorithmId?: string): void {
  const storageKey = getWorkspaceLayoutKey(algorithmId);
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(storageKey);
    } catch {
      // Nothing to recover from — the caller restores defaults in memory anyway.
    }
  }
  void syncKeyToSqlite(storageKey, null);
}

/**
 * The whole confirmed reset: drop the stored state, then tell every mounted
 * reader to re-read it.
 */
export function resetWorkspaceLayout(algorithmId?: string): WorkspaceLayout {
  clearWorkspaceLayout(algorithmId);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_LAYOUT_RESET_EVENT, { detail: { algorithmId } }),
    );
  }
  return cloneWorkspaceLayout(DEFAULT_LAYOUT);
}
