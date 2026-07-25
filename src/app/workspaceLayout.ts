/* Persisted workspace geometry (DESIGN.md R3.3).

   One versioned key holds every panel size so a shape change invalidates old
   data wholesale instead of half-applying it. Storage is user-editable and can
   throw (Safari private mode, disabled storage, quota), so every entry point
   here is defensive: reads validate and fall back to defaults, writes are
   best-effort, and nothing throws into the render path. The key is only ever
   removed by an explicit confirmed reset — that is what makes sizes survive
   reloads and dev-server restarts. */

export const WORKSPACE_LAYOUT_KEY = 'dsa_visualizer_workspace_layout_v3';

export const WORKSPACE_LAYOUT_VERSION = 3;

export interface WorkspaceLeftRows {
  visualizer: number;
  tutorial: number;
  auxiliary: number;
}

export interface WorkspaceRightRows {
  code: number;
  complexity: number;
}

export interface WorkspaceLayout {
  version: typeof WORKSPACE_LAYOUT_VERSION;
  /** Width of the left (visualizer) column as a percentage of the stage. */
  splitPercent: number;
  /** Flex weights, not pixels — the rows always fill the stage height. */
  leftRows: WorkspaceLeftRows;
  rightRows: WorkspaceRightRows;
}

export interface WorkspaceLayoutPatch {
  splitPercent?: number;
  leftRows?: Partial<WorkspaceLeftRows>;
  rightRows?: Partial<WorkspaceRightRows>;
}

export const MIN_SPLIT_PERCENT = 25;
export const MAX_SPLIT_PERCENT = 80;

/* Row weights are relative, but bounding them keeps a dragged row from
   collapsing to an unclickable sliver or swallowing its neighbours. */
export const MIN_ROW_WEIGHT = 4;
export const MAX_ROW_WEIGHT = 96;

const DEFAULT_LAYOUT: WorkspaceLayout = {
  version: WORKSPACE_LAYOUT_VERSION,
  splitPercent: 60,
  leftRows: { visualizer: 62, tutorial: 22, auxiliary: 16 },
  rightRows: { code: 70, complexity: 30 },
};

export function cloneWorkspaceLayout(layout: WorkspaceLayout): WorkspaceLayout {
  return {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: layout.splitPercent,
    leftRows: { ...layout.leftRows },
    rightRows: { ...layout.rightRows },
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

export function clampRowWeight(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_ROW_WEIGHT, Math.max(MIN_ROW_WEIGHT, value));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const readRowWeights = <TKey extends string>(
  value: unknown,
  keys: readonly TKey[],
): Record<TKey, number> | null => {
  if (!isRecord(value)) return null;
  const result = {} as Record<TKey, number>;
  for (const key of keys) {
    const weight = value[key];
    if (!isInRange(weight, MIN_ROW_WEIGHT, MAX_ROW_WEIGHT)) return null;
    result[key] = weight;
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

  const leftRows = readRowWeights(parsed.leftRows, ['visualizer', 'tutorial', 'auxiliary'] as const);
  const rightRows = readRowWeights(parsed.rightRows, ['code', 'complexity'] as const);
  if (!leftRows || !rightRows) return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  // Rebuilt field by field so unknown keys in storage never reach app state.
  return { version: WORKSPACE_LAYOUT_VERSION, splitPercent: parsed.splitPercent, leftRows, rightRows };
}

/** Merges the patch onto whatever is stored, clamps it, writes best-effort, returns the result. */
export function writeWorkspaceLayout(patch: WorkspaceLayoutPatch): WorkspaceLayout {
  const current = readWorkspaceLayout();

  const merged: WorkspaceLayout = {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: clampSplitPercent(patch.splitPercent ?? current.splitPercent),
    leftRows: {
      visualizer: clampRowWeight(
        patch.leftRows?.visualizer ?? current.leftRows.visualizer,
        DEFAULT_LAYOUT.leftRows.visualizer,
      ),
      tutorial: clampRowWeight(
        patch.leftRows?.tutorial ?? current.leftRows.tutorial,
        DEFAULT_LAYOUT.leftRows.tutorial,
      ),
      auxiliary: clampRowWeight(
        patch.leftRows?.auxiliary ?? current.leftRows.auxiliary,
        DEFAULT_LAYOUT.leftRows.auxiliary,
      ),
    },
    rightRows: {
      code: clampRowWeight(patch.rightRows?.code ?? current.rightRows.code, DEFAULT_LAYOUT.rightRows.code),
      complexity: clampRowWeight(
        patch.rightRows?.complexity ?? current.rightRows.complexity,
        DEFAULT_LAYOUT.rightRows.complexity,
      ),
    },
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
