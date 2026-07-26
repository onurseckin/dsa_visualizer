/* Persisted workspace state (DESIGN.md R6.5).

   One versioned key holds every manual adjustment so a shape change invalidates
   old data wholesale instead of half-applying it. Storage is user-editable and
   can throw (Safari private mode, disabled storage, quota), so every entry point
   here is defensive: reads validate and fall back to defaults, writes are
   best-effort, and nothing throws into the render path. The key is only ever
   removed by an explicit confirmed reset — that is what makes adjustments
   survive reloads and dev-server restarts.

   A height of `null` means the panel sizes itself (hug, or absorb the column's
   leftover space); a number means the user dragged that panel to an explicit
   height.

   v6 adds `detailsExpanded`: whether the problem/lesson panel is open is a
   manual adjustment like any drag, so it belongs under the same key rather than
   resetting to open on every reload.

   v7 restores `tutorial` and `auxiliary` and adds `stage`: every workspace
   section now carries a height handle, not just width (DESIGN.md R7.4). The
   tutorial and working-data strips are resizable rows inside the visualizer
   panel, and `stage` pins the whole stage so the graph area itself can be made
   taller or shorter instead of being fixed to the viewport calculation.

   v8 splits the one `detailsExpanded` flag into `problemExpanded` and
   `solutionExpanded` (TASKS.md 9.6): ProblemHeader became two independent
   panels — the short problem statement (ProblemDescriptionCard, top of the
   page) and the deep topic lesson (SolutionApproachCard, bottom of the page)
   — each collapsible on its own, so one flag can no longer represent both.
   `problem` and `solution` join `WorkspacePanelHeights` for the same reason a
   height slot exists for every other section. Because this reshapes the
   persisted record instead of just adding a key, and the version-mismatch
   read path below discards wholesale rather than partially migrating, a
   stored v7 value is not carried forward — the two panels simply reopen at
   their true default (expanded) and unpinned. */

export const WORKSPACE_LAYOUT_KEY = 'dsa_visualizer_workspace_layout_v8';

export const WORKSPACE_LAYOUT_VERSION = 8;

/* Reset is a navbar action but the layout state lives in the workspace, so the
   two are joined by a window event rather than a shared React parent: the navbar
   clears storage and announces it, every mounted reader re-reads. Exported so
   neither side can drift onto a different string. */
export const WORKSPACE_LAYOUT_RESET_EVENT = 'dsa:workspace-layout-reset';

export interface WorkspacePanelHeights {
  /** The whole stage row — how tall the graph area is allowed to be. */
  stage: number | null;
  visualizer: number | null;
  tutorial: number | null;
  auxiliary: number | null;
  code: number | null;
  complexity: number | null;
  /** ProblemDescriptionCard, above the stage. */
  problem: number | null;
  /** SolutionApproachCard, the last section of the page. */
  solution: number | null;
}

export type WorkspacePanelKey = keyof WorkspacePanelHeights;

export const WORKSPACE_PANEL_KEYS: readonly WorkspacePanelKey[] = [
  'stage',
  'visualizer',
  'tutorial',
  'auxiliary',
  'code',
  'complexity',
  'problem',
  'solution',
] as const;

export interface WorkspaceLayout {
  version: typeof WORKSPACE_LAYOUT_VERSION;
  /** Width of the left (visualizer) column as a percentage of the stage. */
  splitPercent: number;
  /** Pixel height per panel; null = automatic (hug content). */
  panelHeights: WorkspacePanelHeights;
  /** Whether the problem statement panel is open (R6.5, TASKS.md 9.6). */
  problemExpanded: boolean;
  /** Whether the solution approach panel is open (R6.5, TASKS.md 9.6). */
  solutionExpanded: boolean;
}

/* In a patch, an absent key (or `undefined`) means "leave it alone" while an
   explicit `null` means "put this panel back on automatic". */
export interface WorkspaceLayoutPatch {
  splitPercent?: number;
  panelHeights?: Partial<WorkspacePanelHeights>;
  problemExpanded?: boolean;
  solutionExpanded?: boolean;
}

export const MIN_SPLIT_PERCENT = 25;
export const MAX_SPLIT_PERCENT = 80;

/* Bounds for a user-pinned panel: small enough to be a deliberate sliver,
   large enough for a tall monitor, and the same bounds the reader validates
   against so every drag stays storable. */
export const MIN_PANEL_HEIGHT_PX = 64;
export const MAX_PANEL_HEIGHT_PX = 2000;

/* The visualizer is the stage the learner actually watches, so it gets the
   larger share of the width by default; a 60/40 split still leaves the code
   column enough room for a listing without the split feeling lopsided. */
const DEFAULT_SPLIT_PERCENT = 60;

const DEFAULT_LAYOUT: WorkspaceLayout = {
  version: WORKSPACE_LAYOUT_VERSION,
  splitPercent: DEFAULT_SPLIT_PERCENT,
  panelHeights: {
    stage: null,
    visualizer: null,
    tutorial: null,
    auxiliary: null,
    code: null,
    complexity: null,
    problem: null,
    solution: null,
  },
  // First visit opens both panels: the learner should not have to hunt for them.
  problemExpanded: true,
  solutionExpanded: true,
};

export function cloneWorkspaceLayout(layout: WorkspaceLayout): WorkspaceLayout {
  return {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: layout.splitPercent,
    panelHeights: { ...layout.panelHeights },
    problemExpanded: layout.problemExpanded,
    solutionExpanded: layout.solutionExpanded,
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

type WorkspaceValue = string | number | boolean | null | WorkspaceLayout | WorkspacePanelHeights | Record<string, number | null | string | boolean> | Array<number | string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isInRange = (value: WorkspaceValue, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

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

  if (typeof parsed.problemExpanded !== 'boolean') return cloneWorkspaceLayout(DEFAULT_LAYOUT);
  if (typeof parsed.solutionExpanded !== 'boolean') return cloneWorkspaceLayout(DEFAULT_LAYOUT);

  // Rebuilt field by field so unknown keys in storage never reach app state.
  return {
    version: WORKSPACE_LAYOUT_VERSION,
    splitPercent: parsed.splitPercent,
    panelHeights,
    problemExpanded: parsed.problemExpanded,
    solutionExpanded: parsed.solutionExpanded,
  };
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
    // `??` and not `||`: collapsing either panel patches an explicit false.
    problemExpanded: patch.problemExpanded ?? current.problemExpanded,
    solutionExpanded: patch.solutionExpanded ?? current.solutionExpanded,
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

/**
 * The whole confirmed reset: drop the stored state, then tell every mounted
 * reader to re-read it. Callers get the defaults that are now in storage, so the
 * navbar can reset a workspace it does not own without a shared React parent.
 */
export function resetWorkspaceLayout(): WorkspaceLayout {
  clearWorkspaceLayout();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(WORKSPACE_LAYOUT_RESET_EVENT));
  }
  return cloneWorkspaceLayout(DEFAULT_LAYOUT);
}
