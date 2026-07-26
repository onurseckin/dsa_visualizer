import { describe, it, expect } from 'vitest';
import {
  boxViewBox,
  clamp,
  ellipsePoints,
  fitSlots,
  minPointSpacing,
  spreadToBox,
  tidyTreeSlots,
  viewBoxAttr,
} from '../vizGeometry';

describe('clamp', () => {
  it('bounds a value and substitutes the minimum for non-finite input', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-4, 1, 10)).toBe(1);
    expect(clamp(99, 1, 10)).toBe(10);
    expect(clamp(Number.NaN, 3, 10)).toBe(3);
    expect(clamp(Infinity, 3, 10)).toBe(3);
  });
});

describe('boxViewBox — the whitespace fix', () => {
  it('is literally the measured box, so user units are CSS pixels', () => {
    expect(boxViewBox({ width: 950, height: 520 })).toEqual({
      minX: 0,
      minY: 0,
      width: 950,
      height: 520,
    });
    expect(viewBoxAttr(boxViewBox({ width: 950, height: 520 }))).toBe('0 0 950 520');
  });

  it('always shares the aspect ratio of the box, so nothing can letterbox', () => {
    const boxes = [
      { width: 950, height: 520 },
      { width: 320, height: 900 },
      { width: 1, height: 1 },
      { width: 1440, height: 96 },
      { width: 733.5, height: 411.25 },
    ];

    boxes.forEach((box) => {
      const viewBox = boxViewBox(box);
      expect(viewBox.width / viewBox.height).toBeCloseTo(box.width / box.height, 10);
      expect(viewBox.minX).toBe(0);
      expect(viewBox.minY).toBe(0);
    });
  });

  it('floors a not-yet-measured axis at one unit instead of collapsing', () => {
    expect(boxViewBox({ width: 0, height: 0 })).toEqual({
      minX: 0,
      minY: 0,
      width: 1,
      height: 1,
    });
  });
});

describe('spreadToBox', () => {
  const box = { width: 950, height: 520 };

  it('stretches both axes so the extremes land on the insets', () => {
    const spread = spreadToBox(
      [
        { x: 100, y: 50 },
        { x: 400, y: 150 },
      ],
      box,
      40
    );

    expect(spread[0]).toEqual({ x: 40, y: 40 });
    expect(spread[1]).toEqual({ x: 910, y: 480 });
  });

  it('scales the axes independently, which is what fills a wide panel', () => {
    // A 300x100 authored drawing: 2.9x horizontally, 4.4x vertically.
    const spread = spreadToBox(
      [
        { x: 100, y: 50 },
        { x: 250, y: 100 },
        { x: 400, y: 150 },
      ],
      box,
      40
    );

    expect(spread[1]).toEqual({ x: 475, y: 260 });
    const xs = spread.map((point) => point.x);
    const ys = spread.map((point) => point.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(870);
    expect(Math.max(...ys) - Math.min(...ys)).toBe(440);
  });

  it('centres a single point rather than dividing by a zero span', () => {
    expect(spreadToBox([{ x: 7, y: 9 }], box, 40)).toEqual([{ x: 475, y: 260 }]);
  });

  it('centres only the shared axis when one axis is degenerate', () => {
    const column = spreadToBox(
      [
        { x: 30, y: 0 },
        { x: 30, y: 10 },
      ],
      box,
      40
    );
    expect(column).toEqual([
      { x: 475, y: 40 },
      { x: 475, y: 480 },
    ]);

    const row = spreadToBox(
      [
        { x: 0, y: 30 },
        { x: 10, y: 30 },
      ],
      box,
      40
    );
    expect(row).toEqual([
      { x: 40, y: 260 },
      { x: 910, y: 260 },
    ]);
  });

  it('keeps non-finite points in the output, centred, without poisoning the rest', () => {
    const spread = spreadToBox(
      [
        { x: 0, y: 0 },
        { x: Number.NaN, y: 5 },
        { x: 10, y: 10 },
        { x: 5, y: Infinity },
      ],
      { width: 100, height: 100 },
      10
    );

    expect(spread).toEqual([
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 90, y: 90 },
      { x: 50, y: 50 },
    ]);
  });

  it('centres everything when no point is usable, and keeps the count', () => {
    const spread = spreadToBox(
      [
        { x: Number.NaN, y: Number.NaN },
        { x: 0, y: Number.NaN },
      ],
      { width: 200, height: 100 },
      10
    );
    expect(spread).toEqual([
      { x: 100, y: 50 },
      { x: 100, y: 50 },
    ]);
  });

  it('treats float noise as a degenerate axis instead of magnifying it', () => {
    // ellipsePoints(2, wide box) puts a pair on the horizontal axis, whose y
    // differ by ~1e-14 because sin(PI) is not exactly 0. Stretching that span
    // would fling the two nodes to opposite edges of the canvas.
    const pair = ellipsePoints(2, box, 40);
    expect(Math.abs(pair[0].y - pair[1].y)).toBeGreaterThan(0);

    const spread = spreadToBox(pair, box, 40);
    expect(spread[0].y).toBe(260);
    expect(spread[1].y).toBe(260);
    expect(spread[0].x).toBeCloseTo(40, 6);
    expect(spread[1].x).toBeCloseTo(910, 6);
  });

  it('keeps points inside the box even when the pad is wider than the box', () => {
    spreadToBox(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      { width: 40, height: 20 },
      500
    ).forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(40);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(20);
    });
  });

  it('returns a fresh point per input so callers cannot alias the centre', () => {
    const spread = spreadToBox([{ x: 1, y: 1 }, { x: 1, y: 1 }], { width: 10, height: 10 }, 1);
    expect(spread[0]).not.toBe(spread[1]);
  });
});

describe('minPointSpacing', () => {
  it('reports the closest pair, which is what caps a node radius', () => {
    expect(
      minPointSpacing(
        [
          { x: 0, y: 0 },
          { x: 30, y: 40 },
          { x: 0, y: 12 },
        ],
        999
      )
    ).toBe(12);
  });

  it('falls back when there is no pair at all', () => {
    expect(minPointSpacing([{ x: 5, y: 5 }], 77)).toBe(77);
    expect(minPointSpacing([], 77)).toBe(77);
  });

  it('ignores non-finite points and reports zero for coincident ones', () => {
    expect(
      minPointSpacing(
        [
          { x: 0, y: 0 },
          { x: Number.NaN, y: 0 },
          { x: 6, y: 8 },
        ],
        99
      )
    ).toBe(10);
    expect(
      minPointSpacing(
        [
          { x: 3, y: 3 },
          { x: 3, y: 3 },
        ],
        99
      )
    ).toBe(0);
  });
});

describe('ellipsePoints', () => {
  it('inscribes an ellipse, not a circle, so a wide box is filled horizontally', () => {
    const points = ellipsePoints(4, { width: 200, height: 100 }, 10);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    expect(Math.min(...xs)).toBeCloseTo(10, 6);
    expect(Math.max(...xs)).toBeCloseTo(190, 6);
    expect(Math.min(...ys)).toBeCloseTo(10, 6);
    expect(Math.max(...ys)).toBeCloseTo(90, 6);
    // A circle would have spent 80 units on both axes; the ellipse spends 180x80.
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(Math.max(...ys) - Math.min(...ys));
  });

  it('starts at the top and runs clockwise', () => {
    const points = ellipsePoints(4, { width: 200, height: 100 }, 10);
    expect(points[0].x).toBeCloseTo(100, 6);
    expect(points[0].y).toBeCloseTo(10, 6);
    expect(points[1].x).toBeCloseTo(190, 6);
    expect(points[2].y).toBeCloseTo(90, 6);
  });

  it('lays a pair along the box’s long axis', () => {
    const wide = ellipsePoints(2, { width: 200, height: 100 }, 10);
    expect(wide[0].y).toBeCloseTo(50, 6);
    expect(wide[1].y).toBeCloseTo(50, 6);
    expect(wide[0].x).toBeCloseTo(10, 6);
    expect(wide[1].x).toBeCloseTo(190, 6);

    const tall = ellipsePoints(2, { width: 100, height: 200 }, 10);
    expect(tall[0].x).toBeCloseTo(50, 6);
    expect(tall[0].y).toBeCloseTo(10, 6);
    expect(tall[1].y).toBeCloseTo(190, 6);
  });

  it('centres a lone point and returns nothing for an empty graph', () => {
    expect(ellipsePoints(1, { width: 200, height: 100 }, 10)).toEqual([{ x: 100, y: 50 }]);
    expect(ellipsePoints(0, { width: 200, height: 100 }, 10)).toEqual([]);
    expect(ellipsePoints(Number.NaN, { width: 200, height: 100 }, 10)).toEqual([]);
  });

  it('keeps every point inside the box, whatever the pad', () => {
    [0, 10, 60, 500].forEach((pad) => {
      ellipsePoints(9, { width: 200, height: 100 }, pad).forEach((point) => {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(200);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe('fitSlots', () => {
  it('spends the whole run when the slots fit between min and max', () => {
    expect(fitSlots(4, 100, 10, 5, 50)).toEqual({ size: 17.5, gap: 10, span: 100 });
  });

  it('caps at max so a two-element run does not become absurd', () => {
    expect(fitSlots(2, 500, 10, 5, 50)).toEqual({ size: 50, gap: 10, span: 110 });
  });

  it('overshoots the run once min binds, which the caller has to detect', () => {
    const fit = fitSlots(20, 100, 10, 12, 50);
    expect(fit.size).toBe(12);
    expect(fit.span).toBeGreaterThan(100);
  });

  it('drops the gap for a single slot and survives an empty run', () => {
    expect(fitSlots(1, 100, 10, 5, 50)).toEqual({ size: 50, gap: 0, span: 50 });
    expect(fitSlots(0, 100, 10, 5, 50)).toEqual({ size: 50, gap: 0, span: 50 });
  });

  it('falls back to min on a non-finite run', () => {
    expect(fitSlots(3, Number.NaN, 4, 6, 50)).toEqual({ size: 6, gap: 4, span: 26 });
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

  it('stacks a single-child chain in one column, which spreadToBox then centres', () => {
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

  it('hands the caller abstract slots that spread to both axes of any box', () => {
    const tidy = tidyTreeSlots(['a'], childrenFrom({ a: ['b', 'c'] }));
    const spread = spreadToBox(
      tidy.slots.map((slot) => ({ x: slot.slot, y: slot.depth })),
      { width: 950, height: 520 },
      40
    );
    const ys = spread.map((point) => point.y);

    // Depth 0 sits on the top inset and the deepest level on the bottom one:
    // no leftover height for the panel to show as an empty band.
    expect(Math.min(...ys)).toBe(40);
    expect(Math.max(...ys)).toBe(480);
    expect(Math.min(...spread.map((point) => point.x))).toBe(40);
    expect(Math.max(...spread.map((point) => point.x))).toBe(910);
  });
});

describe('viewBoxAttr', () => {
  it('rounds to two decimals so re-measuring does not churn the attribute', () => {
    expect(
      viewBoxAttr({ minX: 1.006, minY: 2.129, width: 3.4449, height: 4 })
    ).toBe('1.01 2.13 3.44 4');
  });
});
