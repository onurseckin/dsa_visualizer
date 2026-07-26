/* Persisted workspace geometry (DESIGN.md R5.2 / R5.4).

   One versioned key holds every panel size so a shape change invalidates old
   data wholesale instead of half-applying it. Storage is user-editable and can
   throw (Safari private mode, disabled storage, quota), so every entry point
   here is defensive: reads validate and fall back to defaults, writes are
   best-effort, and nothing throws into the render path. The key is only ever
   removed by an explicit confirmed reset — that is what makes sizes survive
   reloads and dev-server restarts.

   A height of `null` means the panel sizes itself (hug, or absorb the column's
   leftover space); a number means the user dragged that panel to an explicit
   height.

   v5 drops the `tutorial` and `auxiliary` heights: those strips now live inside
   the visualizer panel rather than as separately pinned rows of the left column,
   so they have no handle and no height of their own to remember. Only the panels
   that are still rows of a column keep a slot. */

export const WORKSPACE_LAYOUT_KEY = 'dsa_visualizer_workspace_layout_v5';

export const WORKSPACE_LAYOUT_VERSION = 5;

export interface WorkspacePanelHeights {
  visualizer: number | null;
  code: number | null;
  complexity: number | null;
}

export type WorkspacePanelKey = keyof WorkspacePanelHeights;

export const WORKSPACE_PANEL_KEYS: readonly WorkspacePanelKey[] = [
  'visualizer',
  'code',
  'complexity',
] as const;

export interface WorkspaceLayout {
  version: typeof WORKSPACE_LAYOUT_VERSION;
  /** Width of the left (visualizer) column as a percentage of the stage. */
  splitPercent: number;
  /** Pixel height per panel; null = automatic (hug content). */
  panelHeights: WorkspacePanelHeights;
}

/* In a patch, an absent key (or `undefined`) means "leave it alone" while an
   explicit `null` means "put this panel back on automatic". */
export interface WorkspaceLayoutPatch {
  splitPercent?: number;
  panelHeights?: Partial<WorkspacePanelHeights>;
}

export const MIN_SPLIT_PERCENT = 25;
export const MAX_SPLIT_PERCENT = 80;

/* Bounds for a user-pinned panel: small enough to be a deliberate sliver,
   large enough for a tall monitor, and the same bounds the reader validates
   against so every drag stays storable. */
export const MIN_PANEL_HEIGHT_PX = 64;
export const MAX_PANEL_HEIGHT_PX = 2000;

/* The visualizer is the stage the learner actually watches, so it gets the bulk
   of the width by default (DESIGN.md R5.2); the code column only needs enough
   room for a listing. */
const DEFAULT_SPLIT_PERCENT = 70;

const DEFAULT_LAYOUT: WorkspaceLayout = {
  version: WORKSPACE_LAYOUT_VERSION,
  splitPercent: DEFAULT_SPLIT_PERCENT,
  panelHeights: {
    visualizer: null,
    code: null,
    complexity: null,
  },
};

export function cloneWorkspaceLayout(layout: WorkspaceLayout): WorkspaceLayout {
  return {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: layout.splitPercent,
    panelHeights: { ...layout.panelHeights },
  };
}

/* Exported frozen so a caller cannot mutate the fallback that every future
   read depends on; use cloneWorkspaceLayout to get a writable copy. */
export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayout = Object.freeze(
  cloneWorkspaceLayout(DEFAULT_LAYOUT),
);

export function clampSplitPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LAYOUT.splitPercent;
  return Math.min(MAX_SPLIT_PERCENT, Math.max(MIN_SPLIT_PERCENT, value));
}

/** Automatic (null) stays automatic; an unusable number degrades to automatic. */
export function clampPanelHeight(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.min(MAX_PANEL_HEIGHT_PX, Math.max(MIN_PANEL_HEIGHT_PX, value));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const readPanelHeights = (value: unknown): WorkspacePanelHeights | null => {
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
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
};

/** Never throws: any unreadable, stale, malformed or out-of-range value yields defaults. */
export function readWorkspaceLayout(): WorkspaceLayout {
  const storage = getStorage();
  if (!storage) return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  let raw: string | null = null;
  try {
    raw = storage.getItem(WORKSPACE_LAYOUT_KEY);
  } catch {
    return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  }
  if (raw === null) return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  let parsed: unknown;
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

  // Rebuilt field by field so unknown keys in storage never reach app state.
  return { version: WORKSPACE_LAYOUT_VERSION, splitPercent: parsed.splitPercent, panelHeights };
}

/** Merges the patch onto whatever is stored, clamps it, writes best-effort, returns the result. */
export function writeWorkspaceLayout(patch: WorkspaceLayoutPatch): WorkspaceLayout {
  const current = readWorkspaceLayout();

  const panelHeights = {} as WorkspacePanelHeights;
  for (const key of WORKSPACE_PANEL_KEYS) {
    const patched = patch.panelHeights?.[key];
    panelHeights[key] =
      patched === undefined ? clampPanelHeight(current.panelHeights[key]) : clampPanelHeight(patched);
  }

  const merged: WorkspaceLayout = {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: clampSplitPercent(patch.splitPercent ?? current.splitPercent),
    panelHeights,
  };

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(WORKSPACE_LAYOUT_KEY, JSON.stringify(merged));
    } catch {
      // Storage full or blocked: the in-memory layout still applies this session.
    }
  }

  return merged;
}

/** Only ever called from a confirmed "reset layout" action. */
export function clearWorkspaceLayout(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(WORKSPACE_LAYOUT_KEY);
  } catch {
    // Nothing to recover from — the caller restores defaults in memory anyway.
  }
}
