import { describe, it, expect } from 'vitest';
import {
  clamp,
  fitBox,
  fitSlots,
  tidyTreeSlots,
  tightViewBox,
  viewBoxAttr,
} from '../vizGeometry';

describe('clamp', () => {
  it('bounds a value and substitutes the minimum for non-finite input', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-4, 1, 10)).toBe(1);
    expect(clamp(99, 1, 10)).toBe(10);
    expect(clamp(Number.NaN, 3, 10)).toBe(3);
  });
});

describe('fitBox — the letterbox fix', () => {
  it('keeps the content aspect ratio so preserveAspectRatio has nothing to centre', () => {
    const fitted = fitBox({ width: 200, height: 100 }, { width: 950, height: 560 });
    expect(fitted).toEqual({ width: 950, height: 475 });
    expect(fitted.width / fitted.height).toBeCloseTo(2, 10);
  });

  it('fits the height when the content is the taller shape', () => {
    expect(fitBox({ width: 100, height: 200 }, { width: 950, height: 560 })).toEqual({
      width: 280,
      height: 560,
    });
  });

  it('scales a small drawing up into the whole box instead of leaving it pinned', () => {
    expect(fitBox({ width: 100, height: 50 }, { width: 400, height: 200 })).toEqual({
      width: 400,
      height: 200,
    });
  });

  it('never exceeds the box on either axis', () => {
    const box = { width: 300, height: 300 };
    const fitted = fitBox({ width: 1000, height: 250 }, box);
    expect(fitted.width).toBeLessThanOrEqual(box.width);
    expect(fitted.height).toBeLessThanOrEqual(box.height);
  });

  it('falls back rather than dividing by a degenerate dimension', () => {
    expect(fitBox({ width: 0, height: 100 }, { width: 400, height: 200 })).toEqual({
      width: 400,
      height: 200,
    });
    expect(fitBox({ width: 100, height: 200 }, { width: 0, height: 200 })).toEqual({
      width: 100,
      height: 200,
    });
    expect(fitBox({ width: 100, height: Number.NaN }, { width: 40, height: 20 })).toEqual({
      width: 40,
      height: 20,
    });
  });
});

describe('tightViewBox', () => {
  it('hugs the content bounds with one uniform padding', () => {
    expect(
      tightViewBox(
        [
          { x: 10, y: 20 },
          { x: 110, y: 40 },
        ],
        5
      )
    ).toEqual({ minX: 5, minY: 15, width: 110, height: 30 });
  });

  it('adds no band beyond the padding, whatever the resulting ratio', () => {
    const viewBox = tightViewBox(
      [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
      ],
      10
    );
    expect(viewBox.height).toBe(20);
    expect(viewBox.width).toBe(420);
  });

  it('applies a minimum span so a single point still has a paintable box', () => {
    expect(tightViewBox([{ x: 5, y: 5 }], 3, 20)).toEqual({
      minX: 2,
      minY: 2,
      width: 20,
      height: 20,
    });
  });

  it('ignores non-finite coordinates', () => {
    expect(
      tightViewBox(
        [
          { x: Number.NaN, y: 0 },
          { x: 10, y: 10 },
          { x: 30, y: Infinity },
        ],
        2
      )
    ).toEqual({ minX: 8, minY: 8, width: 4, height: 4 });
  });

  it('returns a padded square when there is no content at all', () => {
    expect(tightViewBox([], 6)).toEqual({ minX: 0, minY: 0, width: 12, height: 12 });
  });
});

describe('fitSlots', () => {
  it('spends the whole run when the slots fit between min and max', () => {
    expect(fitSlots(4, 100, 10, 5, 50)).toEqual({ size: 17.5, gap: 10, span: 100 });
  });

  it('caps at max so a two-element run does not become absurd', () => {
    expect(fitSlots(2, 500, 10, 5, 50)).toEqual({ size: 50, gap: 10, span: 110 });
  });

  it('reports a span past the run once min binds, leaving fitBox to scale it down', () => {
    const fit = fitSlots(20, 100, 10, 12, 50);
    expect(fit.size).toBe(12);
    expect(fit.span).toBeGreaterThan(100);
  });

  it('drops the gap for a single slot and survives an empty run', () => {
    expect(fitSlots(1, 100, 10, 5, 50)).toEqual({ size: 50, gap: 0, span: 50 });
    expect(fitSlots(0, 100, 10, 5, 50)).toEqual({ size: 50, gap: 0, span: 50 });
  });
});

describe('tidyTreeSlots', () => {
  const childrenFrom = (edges: Record<string, string[]>) => (id: string): string[] =>
    edges[id] ?? [];

  it('gives every leaf a column and centres each parent over its children', () => {
    const tidy = tidyTreeSlots(
      ['a'],
      childrenFrom({ a: ['b', 'c'], b: ['d', 'e'] })
    );
    const slotOf = new Map(tidy.slots.map((slot) => [slot.id, slot]));

    expect(tidy.leafCount).toBe(3);
    expect(tidy.depth).toBe(2);
    expect(slotOf.get('d')?.slot).toBe(0);
    expect(slotOf.get('e')?.slot).toBe(1);
    expect(slotOf.get('b')?.slot).toBe(0.5);
    expect(slotOf.get('c')?.slot).toBe(2);
    expect(slotOf.get('a')?.slot).toBe(1.25);
    expect(slotOf.get('c')?.depth).toBe(1);
  });

  it('stacks a single-child chain in one column, which is what fills the height', () => {
    const tidy = tidyTreeSlots(['a'], childrenFrom({ a: ['b'], b: ['c'] }));
    expect(tidy.leafCount).toBe(1);
    expect(tidy.depth).toBe(2);
    expect(tidy.slots.map((slot) => slot.slot)).toEqual([0, 0, 0]);
    expect(new Set(tidy.slots.map((slot) => slot.depth))).toEqual(new Set([0, 1, 2]));
  });

  it('places a forest side by side and never twice', () => {
    const tidy = tidyTreeSlots(
      ['a', 'x', 'a', 'b'],
      childrenFrom({ a: ['b'] })
    );
    expect(tidy.slots.map((slot) => slot.id)).toEqual(['b', 'a', 'x']);
    expect(tidy.leafCount).toBe(2);
  });

  it('places nodes no root reaches when they are appended to the root list', () => {
    const tidy = tidyTreeSlots(['a', 'a', 'b', 'orphan'], childrenFrom({ a: ['b'] }));
    expect(tidy.slots.map((slot) => slot.id).sort()).toEqual(['a', 'b', 'orphan']);
  });

  it('terminates on a cycle instead of recursing forever', () => {
    const tidy = tidyTreeSlots(['a'], childrenFrom({ a: ['b'], b: ['a'] }));
    expect(tidy.slots.map((slot) => slot.id)).toEqual(['b', 'a']);
    expect(tidy.leafCount).toBe(1);
    expect(tidy.depth).toBe(1);
  });

  it('reports at least one column so callers can divide by leafCount', () => {
    expect(tidyTreeSlots([], childrenFrom({})).leafCount).toBe(1);
  });
});

describe('viewBoxAttr', () => {
  it('rounds to two decimals so re-measuring does not churn the attribute', () => {
    expect(
      viewBoxAttr({ minX: 1.006, minY: 2.129, width: 3.4449, height: 4 })
    ).toBe('1.01 2.13 3.44 4');
  });
});
