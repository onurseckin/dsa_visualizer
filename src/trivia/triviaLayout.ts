/* Persisted trivia layout (TASKS.md 9.8 / DESIGN.md §4).

   Structurally identical to src/app/workspaceLayout.ts, deliberately: same
   versioned-key discipline (storage is user-editable and can throw, so every
   read validates and falls back to defaults, every write is best-effort, and
   nothing here ever throws into the render path), same
   validate-on-read/wholesale-discard-on-mismatch rule, same reset-by-event
   convention. Trivia gets its own module rather than reusing
   workspaceLayout.ts's key because the two pages' panels are unrelated sets —
   sharing a key would mean an unrelated reset on one page silently resets
   sizes on the other.

   Panels (TASKS.md 9.8): `sessionList` (Home), `deckBuilder` + `settings`
   (Setup, stacked single-column — deck builder above settings), `problem` +
   `puzzle` (Drill, problem above the puzzle+TileTray row). Each gets a height
   slot, following the same one-slot-per-section pattern
   `WorkspacePanelHeights` uses.

   Width: `puzzleSplitPercent` is the one width control trivia needs — the
   drill screen's puzzle+TileTray row is trivia's only genuine side-by-side
   region; Home and Setup are single-column stacks of full-width cards with
   nothing to divide horizontally, so height-only suffices there.

   v2 adds `problemExpanded`: whether the Drill screen's problem-description
   panel is open is a manual adjustment like any drag or resize, so it
   belongs under this same persisted key instead of resetting to expanded
   every session — the same reasoning workspaceLayout.ts's v6 applied to its
   own `detailsExpanded` (later split into `problemExpanded` /
   `solutionExpanded` at v8). Because this reshapes the persisted record
   instead of just adding an optional key, and the version-mismatch read path
   below discards wholesale rather than partially migrating, a stored v1
   value is not carried forward — the panel simply reopens at its true
   default (expanded). */

export const TRIVIA_LAYOUT_KEY = 'dsa_visualizer_trivia_layout_v2';

export const TRIVIA_LAYOUT_VERSION = 2;

/* Reset is a navbar action but the layout state lives in the trivia route, so
   the two are joined by a window event rather than a shared React parent —
   same convention as WORKSPACE_LAYOUT_RESET_EVENT. */
export const TRIVIA_LAYOUT_RESET_EVENT = 'dsa:trivia-layout-reset';

export interface TriviaPanelHeights {
  /** Home screen's session-card grid. */
  sessionList: number | null;
  /** Setup screen, above Drill settings. */
  deckBuilder: number | null;
  /** Setup screen, below the deck builder. */
  settings: number | null;
  /** Drill screen, above the puzzle. */
  problem: number | null;
  /** Drill screen: the code puzzle + TileTray row. */
  puzzle: number | null;
}

export type TriviaPanelKey = keyof TriviaPanelHeights;

export const TRIVIA_PANEL_KEYS: readonly TriviaPanelKey[] = [
  'sessionList',
  'deckBuilder',
  'settings',
  'problem',
  'puzzle',
] as const;

export interface TriviaLayout {
  version: typeof TRIVIA_LAYOUT_VERSION;
  /** Left (puzzle) column width as a percentage of the drill screen's
      puzzle+TileTray row. */
  puzzleSplitPercent: number;
  /** Pixel height per panel; null = automatic (hug content). */
  panelHeights: TriviaPanelHeights;
  /** Whether the Drill screen's problem-description panel is open (v2). */
  problemExpanded: boolean;
}

/* In a patch, an absent key (or `undefined`) means "leave it alone" while an
   explicit `null` means "put this panel back on automatic" — same contract
   as WorkspaceLayoutPatch. */
export interface TriviaLayoutPatch {
  puzzleSplitPercent?: number;
  panelHeights?: Partial<TriviaPanelHeights>;
  problemExpanded?: boolean;
}

export const MIN_SPLIT_PERCENT = 40;
export const MAX_SPLIT_PERCENT = 85;

/* Bounds for a user-pinned panel — identical to workspaceLayout.ts's, so a
   drag anywhere in the app stays inside the same storable range. */
export const MIN_PANEL_HEIGHT_PX = 64;
export const MAX_PANEL_HEIGHT_PX = 2000;

/* The puzzle is the thing actually being drilled, so it gets the bulk of the
   row's width by default; TileTray only needs enough room for a tile list. */
const DEFAULT_SPLIT_PERCENT = 65;

const DEFAULT_LAYOUT: TriviaLayout = {
  version: TRIVIA_LAYOUT_VERSION,
  puzzleSplitPercent: DEFAULT_SPLIT_PERCENT,
  panelHeights: {
    sessionList: null,
    deckBuilder: null,
    settings: null,
    problem: null,
    puzzle: null,
  },
  // First drill opens the panel: the learner should not have to hunt for it.
  problemExpanded: true,
};

export function cloneTriviaLayout(layout: TriviaLayout): TriviaLayout {
  return {
    version: TRIVIA_LAYOUT_VERSION,
    puzzleSplitPercent: layout.puzzleSplitPercent,
    panelHeights: { ...layout.panelHeights },
    problemExpanded: layout.problemExpanded,
  };
}

/* Exported frozen so a caller cannot mutate the fallback every future read
   depends on; use cloneTriviaLayout to get a writable copy. */
export const DEFAULT_TRIVIA_LAYOUT: TriviaLayout = Object.freeze(cloneTriviaLayout(DEFAULT_LAYOUT));

export function clampSplitPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LAYOUT.puzzleSplitPercent;
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

const readPanelHeights = (value: unknown): TriviaPanelHeights | null => {
  if (!isRecord(value)) return null;
  const result = {} as TriviaPanelHeights;
  for (const key of TRIVIA_PANEL_KEYS) {
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
export function readTriviaLayout(): TriviaLayout {
  const storage = getStorage();
  if (!storage) return cloneTriviaLayout(DEFAULT_LAYOUT);

  let raw: string | null = null;
  try {
    raw = storage.getItem(TRIVIA_LAYOUT_KEY);
  } catch {
    return cloneTriviaLayout(DEFAULT_LAYOUT);
  }
  if (raw === null) return cloneTriviaLayout(DEFAULT_LAYOUT);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return cloneTriviaLayout(DEFAULT_LAYOUT);
  }

  if (!isRecord(parsed)) return cloneTriviaLayout(DEFAULT_LAYOUT);
  if (parsed.version !== TRIVIA_LAYOUT_VERSION) return cloneTriviaLayout(DEFAULT_LAYOUT);
  if (!isInRange(parsed.puzzleSplitPercent, MIN_SPLIT_PERCENT, MAX_SPLIT_PERCENT)) {
    return cloneTriviaLayout(DEFAULT_LAYOUT);
  }

  const panelHeights = readPanelHeights(parsed.panelHeights);
  if (!panelHeights) return cloneTriviaLayout(DEFAULT_LAYOUT);

  if (typeof parsed.problemExpanded !== 'boolean') return cloneTriviaLayout(DEFAULT_LAYOUT);

  // Rebuilt field by field so unknown keys in storage never reach app state.
  return {
    version: TRIVIA_LAYOUT_VERSION,
    puzzleSplitPercent: parsed.puzzleSplitPercent,
    panelHeights,
    problemExpanded: parsed.problemExpanded,
  };
}

/** Merges the patch onto whatever is stored, clamps it, writes best-effort, returns the result. */
export function writeTriviaLayout(patch: TriviaLayoutPatch): TriviaLayout {
  const current = readTriviaLayout();

  const panelHeights = {} as TriviaPanelHeights;
  for (const key of TRIVIA_PANEL_KEYS) {
    const patched = patch.panelHeights?.[key];
    panelHeights[key] =
      patched === undefined ? clampPanelHeight(current.panelHeights[key]) : clampPanelHeight(patched);
  }

  const merged: TriviaLayout = {
    version: TRIVIA_LAYOUT_VERSION,
    puzzleSplitPercent: clampSplitPercent(patch.puzzleSplitPercent ?? current.puzzleSplitPercent),
    panelHeights,
    // `??` and not `||`: collapsing the panel patches an explicit false.
    problemExpanded: patch.problemExpanded ?? current.problemExpanded,
  };

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(TRIVIA_LAYOUT_KEY, JSON.stringify(merged));
    } catch {
      // Storage full or blocked: the in-memory layout still applies this session.
    }
  }

  return merged;
}

/** Only ever called from a confirmed "reset layout" action. */
export function clearTriviaLayout(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(TRIVIA_LAYOUT_KEY);
  } catch {
    // Nothing to recover from — the caller restores defaults in memory anyway.
  }
}

/**
 * The whole confirmed reset: drop the stored state, then tell every mounted
 * reader to re-read it — same shape as resetWorkspaceLayout.
 */
export function resetTriviaLayout(): TriviaLayout {
  clearTriviaLayout();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TRIVIA_LAYOUT_RESET_EVENT));
  }
  return cloneTriviaLayout(DEFAULT_LAYOUT);
}
