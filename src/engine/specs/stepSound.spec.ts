import { describe, expect, it } from 'vitest';
import { deriveStepCue, SoundCueKind } from '../stepSound';
import {
  AlgorithmStep,
  AuxiliaryState,
  ElementState,
  GridCellNode,
  PrimaryVisualSnapshot,
} from '../../types/dsa';

const TOTAL_STEPS = 20;
const NEUTRAL_WHAT = 'Move to the next element';

interface StepOptions {
  stepIndex?: number;
  what?: string;
  aux?: AuxiliaryState;
}

const makeStep = (snapshot: PrimaryVisualSnapshot, options: StepOptions = {}): AlgorithmStep => ({
  stepIndex: options.stepIndex ?? 5,
  codeLine: 1,
  explanation: { what: options.what ?? NEUTRAL_WHAT, why: 'spec fixture' },
  primarySnapshot: snapshot,
  auxiliaryState: options.aux ?? {},
  variables: {},
});

const arrayStep = (
  states: ElementState[],
  options: StepOptions & { values?: number[] } = {}
): AlgorithmStep =>
  makeStep(
    {
      kind: 'array',
      elements: states.map((state, index) => ({
        id: `e${index}`,
        value: options.values?.[index] ?? 0,
        state,
      })),
    },
    options
  );

const graphStep = (states: ElementState[], options: StepOptions = {}): AlgorithmStep =>
  makeStep(
    {
      kind: 'graph',
      nodes: states.map((state, index) => ({ id: `n${index}`, label: `n${index}`, state })),
      edges: [],
    },
    options
  );

const treeStep = (states: ElementState[], options: StepOptions = {}): AlgorithmStep =>
  makeStep(
    {
      kind: 'tree',
      nodes: states.map((state, index) => ({ id: `t${index}`, val: index, state })),
      rootId: 't0',
    },
    options
  );

const gridStep = (cells: GridCellNode[][], options: StepOptions = {}): AlgorithmStep =>
  makeStep({ kind: 'grid', grid: cells }, options);

const cell = (row: number, col: number, extra: Partial<GridCellNode> = {}): GridCellNode => ({
  row,
  col,
  ...extra,
});

const kindOf = (step: AlgorithmStep, prev: AlgorithmStep | null): SoundCueKind =>
  deriveStepCue(step, prev, TOTAL_STEPS).kind;

const idle = (): AlgorithmStep => arrayStep(['default', 'default', 'default']);

describe('deriveStepCue — element state deltas', () => {
  it('reports compare when an element newly enters the compare state', () => {
    const prev = idle();
    const step = arrayStep(['compare', 'default', 'default']);
    expect(kindOf(step, prev)).toBe('compare');
  });

  it('prefers swap over compare when both states appear in one step', () => {
    const prev = idle();
    const step = arrayStep(['swap', 'compare', 'default']);
    expect(kindOf(step, prev)).toBe('swap');
  });

  it('reports match when an element locks into sorted', () => {
    const prev = arrayStep(['compare', 'compare', 'default']);
    const step = arrayStep(['compare', 'compare', 'sorted']);
    expect(kindOf(step, prev)).toBe('match');
  });

  it('reports match when a path element appears', () => {
    const prev = graphStep(['visited', 'visited']);
    const step = graphStep(['visited', 'path']);
    expect(kindOf(step, prev)).toBe('match');
  });

  it('reports visit for a newly visited graph node', () => {
    const prev = graphStep(['default', 'default']);
    const step = graphStep(['visited', 'default']);
    expect(kindOf(step, prev)).toBe('visit');
  });

  it('reports visit for a newly chosen pivot', () => {
    const prev = idle();
    const step = arrayStep(['pivot', 'default', 'default']);
    expect(kindOf(step, prev)).toBe('visit');
  });

  it('reports push for a newly in-stack element', () => {
    const prev = idle();
    const step = arrayStep(['default', 'in-stack', 'default']);
    expect(kindOf(step, prev)).toBe('push');
  });

  it('reports enqueue for a newly queued element', () => {
    const prev = treeStep(['default', 'default']);
    const step = treeStep(['default', 'queued']);
    expect(kindOf(step, prev)).toBe('enqueue');
  });

  it('treats every non-default state as new when there is no previous step', () => {
    expect(kindOf(arrayStep(['compare', 'default', 'default']), null)).toBe('compare');
  });

  it('does not re-fire for a state that merely persists', () => {
    const prev = arrayStep(['compare', 'default', 'default']);
    const step = arrayStep(['compare', 'default', 'default']);
    expect(kindOf(step, prev)).toBe('advance');
  });

  it('ignores elements falling back to default', () => {
    const prev = arrayStep(['compare', 'compare', 'default']);
    const step = idle();
    expect(kindOf(step, prev)).toBe('advance');
  });

  it('ignores the active state so pointer walks stay soft ticks', () => {
    const prev = idle();
    const step = arrayStep(['active', 'active', 'default']);
    expect(kindOf(step, prev)).toBe('advance');
  });

  it('derives grid cell state from isVisited when no explicit state is set', () => {
    const prev = gridStep([[cell(0, 0), cell(0, 1)]]);
    const step = gridStep([[cell(0, 0), cell(0, 1, { isVisited: true })]]);
    expect(kindOf(step, prev)).toBe('visit');
  });

  it('derives grid path cells as a match', () => {
    const prev = gridStep([[cell(0, 0, { isVisited: true })]]);
    const step = gridStep([[cell(0, 0, { isVisited: true, isPath: true })]]);
    expect(kindOf(step, prev)).toBe('match');
  });
});

describe('deriveStepCue — auxiliary structure deltas', () => {
  it('reports push when the stack grows', () => {
    const prev = idle();
    const step = arrayStep(['default', 'default', 'default'], { aux: { stack: ['a'] } });
    expect(kindOf(step, prev)).toBe('push');
  });

  it('reports pop when the stack shrinks', () => {
    const prev = arrayStep(['default', 'default', 'default'], { aux: { stack: ['a', 'b'] } });
    const step = arrayStep(['default', 'default', 'default'], { aux: { stack: ['a'] } });
    expect(kindOf(step, prev)).toBe('pop');
  });

  it('reports enqueue when the queue grows', () => {
    const prev = graphStep(['default']);
    const step = graphStep(['default'], { aux: { queue: ['n0', 'n1'] } });
    expect(kindOf(step, prev)).toBe('enqueue');
  });

  it('reports dequeue when the queue shrinks', () => {
    const prev = graphStep(['default'], { aux: { queue: ['n0', 'n1'] } });
    const step = graphStep(['default'], { aux: { queue: ['n1'] } });
    expect(kindOf(step, prev)).toBe('dequeue');
  });

  it('reports advance when a stack is present but unchanged', () => {
    const prev = arrayStep(['default'], { aux: { stack: ['a', 'b'] } });
    const step = arrayStep(['default'], { aux: { stack: ['a', 'b'] } });
    expect(kindOf(step, prev)).toBe('advance');
  });

  it('reports relax when a distance table value improves', () => {
    const prev = graphStep(['default'], { aux: { distanceTable: { a: 0, b: 9 } } });
    const step = graphStep(['default'], { aux: { distanceTable: { a: 0, b: 4 } } });
    expect(kindOf(step, prev)).toBe('relax');
  });

  it('reports advance when the distance table is untouched', () => {
    const prev = graphStep(['default'], { aux: { distanceTable: { a: 0, b: 4 } } });
    const step = graphStep(['default'], { aux: { distanceTable: { a: 0, b: 4 } } });
    expect(kindOf(step, prev)).toBe('advance');
  });

  it('reports visit when only the visited list grows', () => {
    const prev = graphStep(['default'], { aux: { visited: ['n0'] } });
    const step = graphStep(['default'], { aux: { visited: ['n0', 'n1'] } });
    expect(kindOf(step, prev)).toBe('visit');
  });

  it('reports relax when a numeric custom state value changes', () => {
    const prev = arrayStep(['default'], { aux: { customState: { best: 3 } } });
    const step = arrayStep(['default'], { aux: { customState: { best: 7 } } });
    expect(kindOf(step, prev)).toBe('relax');
  });

  it('ignores label-only custom state churn', () => {
    const prev = arrayStep(['default'], { aux: { customState: { phase: 'scanning' } } });
    const step = arrayStep(['default'], { aux: { customState: { phase: 'merging' } } });
    expect(kindOf(step, prev)).toBe('advance');
  });

  it('prefers a snapshot state delta over an auxiliary delta', () => {
    const prev = arrayStep(['default', 'default']);
    const step = arrayStep(['swap', 'swap'], { aux: { stack: ['a'] } });
    expect(kindOf(step, prev)).toBe('swap');
  });
});

describe('deriveStepCue — keyword tiebreaker', () => {
  const sameSnapshot = (what: string): SoundCueKind => {
    const prev = arrayStep(['default', 'default'], { what });
    const step = arrayStep(['default', 'default'], { what });
    return kindOf(step, prev);
  };

  it.each<[string, SoundCueKind]>([
    ['Swap the neighbours', 'swap'],
    ['Compare the two halves', 'compare'],
    ['Push the index', 'push'],
    ['Pop the closing bracket', 'pop'],
    ['Enqueue the neighbour', 'enqueue'],
    ['Dequeue the front node', 'dequeue'],
    ['Relax the outgoing edge', 'relax'],
    ['Visit the child', 'visit'],
    ['Explore the branch', 'visit'],
    ['Found the target value', 'match'],
    ['Match the pattern', 'match'],
  ])('maps %s to %s when nothing measurable changed', (what, expected) => {
    expect(sameSnapshot(what)).toBe(expected);
  });

  it('falls back to advance for a neutral sentence', () => {
    expect(sameSnapshot(NEUTRAL_WHAT)).toBe('advance');
  });

  it('lets measured content beat a misleading sentence', () => {
    const prev = arrayStep(['default', 'default'], { what: 'Swap the neighbours' });
    const step = arrayStep(['compare', 'default'], { what: 'Swap the neighbours' });
    expect(kindOf(step, prev)).toBe('compare');
  });
});

describe('deriveStepCue — completion', () => {
  it('reports complete on the final index with full pitch', () => {
    const step = arrayStep(['sorted', 'sorted'], { stepIndex: TOTAL_STEPS - 1 });
    expect(deriveStepCue(step, idle(), TOTAL_STEPS)).toEqual({ kind: 'complete', pitch: 1 });
  });

  it('reports complete for a single-step run', () => {
    const step = arrayStep(['default'], { stepIndex: 0 });
    expect(kindOf(step, null)).toBe('advance');
    expect(deriveStepCue(step, null, 1).kind).toBe('complete');
  });

  it('does not report complete for an empty run', () => {
    const step = arrayStep(['default'], { stepIndex: 0 });
    expect(deriveStepCue(step, null, 0).kind).toBe('advance');
  });
});

describe('deriveStepCue — pitch', () => {
  it('stays within 0..1 across the whole run for every fixture shape', () => {
    for (let index = 0; index < TOTAL_STEPS; index++) {
      const steps = [
        arrayStep(['compare', 'swap', 'sorted'], { stepIndex: index, values: [1, 500, 3] }),
        graphStep(['visited', 'path'], { stepIndex: index }),
        gridStep([[cell(0, 0, { isVisited: true, distance: 12 })]], { stepIndex: index }),
      ];
      steps.forEach((step) => {
        const { pitch } = deriveStepCue(step, null, TOTAL_STEPS);
        expect(pitch).toBeGreaterThanOrEqual(0);
        expect(pitch).toBeLessThanOrEqual(1);
      });
    }
  });

  it('rises monotonically with run progress', () => {
    const pitches: number[] = [];
    for (let index = 0; index < TOTAL_STEPS - 1; index++) {
      const prev = arrayStep(['default', 'default'], { stepIndex: Math.max(0, index - 1) });
      const step = arrayStep(['default', 'default'], { stepIndex: index });
      pitches.push(deriveStepCue(step, prev, TOTAL_STEPS).pitch);
    }
    expect(pitches[0]).toBe(0);
    pitches.forEach((pitch, index) => {
      if (index === 0) return;
      expect(pitch).toBeGreaterThan(pitches[index - 1]);
    });
  });

  it('reaches the top of the range on the last non-final step', () => {
    const step = arrayStep(['default'], { stepIndex: TOTAL_STEPS - 2 });
    const { pitch } = deriveStepCue(step, arrayStep(['default']), TOTAL_STEPS);
    expect(pitch).toBeCloseTo((TOTAL_STEPS - 2) / (TOTAL_STEPS - 1), 6);
  });

  it('lets the touched value separate two steps at the same progress', () => {
    const prev = arrayStep(['default', 'default'], { stepIndex: 4, values: [10, 100] });
    const low = arrayStep(['compare', 'default'], { stepIndex: 5, values: [10, 100] });
    const high = arrayStep(['default', 'compare'], { stepIndex: 5, values: [10, 100] });

    const lowPitch = deriveStepCue(low, prev, TOTAL_STEPS).pitch;
    const highPitch = deriveStepCue(high, prev, TOTAL_STEPS).pitch;
    expect(highPitch).toBeGreaterThan(lowPitch);
    expect(highPitch).toBeLessThanOrEqual(1);
  });

  it('falls back to pure progress when the touched element carries no value', () => {
    const prev = graphStep(['default', 'default'], { stepIndex: 4 });
    const step = graphStep(['visited', 'default'], { stepIndex: 5 });
    expect(deriveStepCue(step, prev, TOTAL_STEPS).pitch).toBeCloseTo(5 / (TOTAL_STEPS - 1), 6);
  });
});
