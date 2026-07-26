export const WORKSPACE_LAYOUT_KEY = "dsa_visualizer_workspace_layout_v8";

export const WORKSPACE_LAYOUT_VERSION = 8;

/* Reset is a navbar action but the layout state lives in the workspace, so the
   two are joined by a window event rather than a shared React parent: the navbar
   clears storage and announces it, every mounted reader re-reads. Exported so
   neither side can drift onto a different string. */
export const WORKSPACE_LAYOUT_RESET_EVENT = "dsa:workspace-layout-reset";

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
  "stage",
  "visualizer",
  "tutorial",
  "auxiliary",
  "code",
  "complexity",
  "problem",
  "solution",
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
export const DEFAULT_SPLIT_PERCENT = 60;

export const DEFAULT_LAYOUT: WorkspaceLayout = {
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
