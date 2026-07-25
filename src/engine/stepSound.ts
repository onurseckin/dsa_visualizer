import {
  AlgorithmStep,
  AuxiliaryState,
  ElementState,
  GridCellNode,
  PrimaryVisualSnapshot,
} from '../types/dsa';

export type SoundCueKind =
  | 'advance'
  | 'compare'
  | 'swap'
  | 'push'
  | 'pop'
  | 'visit'
  | 'enqueue'
  | 'dequeue'
  | 'relax'
  | 'match'
  | 'complete';

export interface SoundCue {
  kind: SoundCueKind;
  /** 0..1 — drives pitch so stepping reads as motion, not noise. */
  pitch: number;
}

interface SnapshotEntry {
  key: string;
  state: ElementState;
  value: number | null;
}

interface SnapshotDelta {
  /** How many elements *became* each state since the previous snapshot. */
  appeared: Map<ElementState, number>;
  /** Value of the first element that changed state — lets pitch follow the data. */
  touchedValue: number | null;
  /** Largest magnitude in the current snapshot, used to normalize touchedValue. */
  maxAbsValue: number;
}

interface AuxiliaryDelta {
  stack: number;
  queue: number;
  visited: number;
  distanceChanged: boolean;
  customChanged: boolean;
}

/* Progress dominates so a long run audibly rises as it converges; the touched
   value only colors the melody within that rise. */
const PROGRESS_WEIGHT = 0.65;
const VALUE_WEIGHT = 1 - PROGRESS_WEIGHT;

/* Element states map to cues in priority order: a step that both compares and
   swaps is heard as the swap, because that is the consequential part. 'sorted'
   and 'path' are the "locked in" outcomes, so they share the match cue.
   'active' and 'default' are deliberately absent — pointer walks stay soft
   ticks so the real events stand out against them. */
const STATE_CUE_PRIORITY: ReadonlyArray<readonly [ElementState, SoundCueKind]> = [
  ['swap', 'swap'],
  ['sorted', 'match'],
  ['path', 'match'],
  ['compare', 'compare'],
  ['visited', 'visit'],
  ['in-stack', 'push'],
  ['queued', 'enqueue'],
  ['pivot', 'visit'],
];

/* Last-resort tiebreaker, only consulted when the snapshot and auxiliary state
   show no measurable change. Order matters: 'swap' before 'compare' because a
   swap sentence usually mentions both. */
const KEYWORD_CUES: ReadonlyArray<readonly [string, SoundCueKind]> = [
  ['swap', 'swap'],
  ['compar', 'compare'],
  ['dequeue', 'dequeue'],
  ['enqueue', 'enqueue'],
  ['push', 'push'],
  ['pop', 'pop'],
  ['relax', 'relax'],
  ['shorter path', 'relax'],
  ['visit', 'visit'],
  ['explor', 'visit'],
  ['match', 'match'],
  ['found', 'match'],
];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function isUsableValue(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

function gridCellState(cell: GridCellNode): ElementState {
  if (cell.state) return cell.state;
  if (cell.isPath) return 'path';
  if (cell.isVisited) return 'visited';
  return 'default';
}

function readSnapshot(snapshot: PrimaryVisualSnapshot): SnapshotEntry[] {
  switch (snapshot.kind) {
    case 'array':
      return snapshot.elements.map((element, index) => ({
        key: element.id || `a${index}`,
        state: element.state,
        value: element.value,
      }));
    case 'grid': {
      const entries: SnapshotEntry[] = [];
      snapshot.grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          entries.push({
            // Positional key, not cell.row/col: identity must survive cells
            // that were rebuilt without their coordinates set.
            key: `${rowIndex}:${colIndex}`,
            state: gridCellState(cell),
            value: cell.distance ?? null,
          });
        });
      });
      return entries;
    }
    case 'graph':
      return snapshot.nodes.map((node, index) => ({
        key: node.id || `g${index}`,
        state: node.state,
        value: node.val ?? null,
      }));
    case 'tree':
      return snapshot.nodes.map((node, index) => ({
        key: node.id || `t${index}`,
        state: node.state,
        value: node.val,
      }));
  }
}

function diffSnapshots(
  current: SnapshotEntry[],
  previous: SnapshotEntry[] | null
): SnapshotDelta {
  const previousStates = new Map<string, ElementState>();
  previous?.forEach((entry) => previousStates.set(entry.key, entry.state));

  const appeared = new Map<ElementState, number>();
  let touchedValue: number | null = null;
  let maxAbsValue = 0;

  current.forEach((entry) => {
    if (isUsableValue(entry.value)) {
      maxAbsValue = Math.max(maxAbsValue, Math.abs(entry.value));
    }

    const before = previousStates.get(entry.key) ?? 'default';
    if (entry.state === before || entry.state === 'default') return;

    appeared.set(entry.state, (appeared.get(entry.state) ?? 0) + 1);
    if (touchedValue === null && isUsableValue(entry.value)) {
      touchedValue = entry.value;
    }
  });

  return { appeared, touchedValue, maxAbsValue };
}

function listLength(list: Array<string | number> | undefined): number {
  return list ? list.length : 0;
}

function hasNumericChange(
  current: Record<string, string | number> | undefined,
  previous: Record<string, string | number> | undefined
): boolean {
  if (!current) return false;
  const before = previous ?? {};
  return Object.keys(current).some((key) => {
    const value = current[key];
    // Only numeric movement counts as a relaxation; label churn like
    // phase: 'scanning' is bookkeeping, not a value update.
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    return before[key] !== value;
  });
}

function diffAuxiliary(
  current: AuxiliaryState,
  previous: AuxiliaryState | null
): AuxiliaryDelta {
  const before: AuxiliaryState = previous ?? {};
  return {
    stack: listLength(current.stack) - listLength(before.stack),
    queue: listLength(current.queue) - listLength(before.queue),
    visited: listLength(current.visited) - listLength(before.visited),
    distanceChanged: hasNumericChange(current.distanceTable, before.distanceTable),
    customChanged: hasNumericChange(current.customState, before.customState),
  };
}

function keywordCue(what: string): SoundCueKind | null {
  const text = what.toLowerCase();
  for (const [needle, kind] of KEYWORD_CUES) {
    if (text.includes(needle)) return kind;
  }
  return null;
}

function classifyCue(
  step: AlgorithmStep,
  prevStep: AlgorithmStep | null,
  delta: SnapshotDelta
): SoundCueKind {
  for (const [state, kind] of STATE_CUE_PRIORITY) {
    if ((delta.appeared.get(state) ?? 0) > 0) return kind;
  }

  const aux = diffAuxiliary(step.auxiliaryState, prevStep ? prevStep.auxiliaryState : null);
  if (aux.stack > 0) return 'push';
  if (aux.stack < 0) return 'pop';
  if (aux.queue > 0) return 'enqueue';
  if (aux.queue < 0) return 'dequeue';
  if (aux.distanceChanged) return 'relax';
  if (aux.visited > 0) return 'visit';
  if (aux.customChanged) return 'relax';

  return keywordCue(step.explanation.what) ?? 'advance';
}

function derivePitch(progress: number, delta: SnapshotDelta): number {
  if (!isUsableValue(delta.touchedValue) || delta.maxAbsValue <= 0) {
    return progress;
  }
  const normalized = clamp01(Math.abs(delta.touchedValue) / delta.maxAbsValue);
  return clamp01(PROGRESS_WEIGHT * progress + VALUE_WEIGHT * normalized);
}

/**
 * Classifies what a step actually did so every transition gets an audible cue.
 * Pure: no audio imports, no clocks, no module state.
 */
export function deriveStepCue(
  step: AlgorithmStep,
  prevStep: AlgorithmStep | null,
  totalSteps: number
): SoundCue {
  const isFinalStep = totalSteps > 0 && step.stepIndex >= totalSteps - 1;
  if (isFinalStep) return { kind: 'complete', pitch: 1 };

  const progress = totalSteps > 1 ? clamp01(step.stepIndex / (totalSteps - 1)) : 0;
  const delta = diffSnapshots(
    readSnapshot(step.primarySnapshot),
    prevStep ? readSnapshot(prevStep.primarySnapshot) : null
  );

  return { kind: classifyCue(step, prevStep, delta), pitch: derivePitch(progress, delta) };
}
