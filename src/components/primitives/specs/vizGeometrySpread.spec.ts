import { describe, it, expect } from "vitest";
import { ellipsePoints, spreadToBox } from "../vizGeometry";

describe("spreadToBox", () => {
  const box = { width: 950, height: 520 };

  it("stretches both axes so the extremes land on the insets", () => {
    const spread = spreadToBox(
      [
        { x: 100, y: 50 },
        { x: 400, y: 150 },
      ],
      box,
      40,
    );

    expect(spread[0]).toEqual({ x: 40, y: 40 });
    expect(spread[1]).toEqual({ x: 910, y: 480 });
  });

  it("scales the axes independently, which is what fills a wide panel", () => {
    const spread = spreadToBox(
      [
        { x: 100, y: 50 },
        { x: 250, y: 100 },
        { x: 400, y: 150 },
      ],
      box,
      40,
    );

    expect(spread[1]).toEqual({ x: 475, y: 260 });
    const xs = spread.map((point) => point.x);
    const ys = spread.map((point) => point.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(870);
    expect(Math.max(...ys) - Math.min(...ys)).toBe(440);
  });

  it("centres a single point rather than dividing by a zero span", () => {
    expect(spreadToBox([{ x: 7, y: 9 }], box, 40)).toEqual([{ x: 475, y: 260 }]);
  });

  it("centres only the shared axis when one axis is degenerate", () => {
    const column = spreadToBox(
      [
        { x: 30, y: 0 },
        { x: 30, y: 10 },
      ],
      box,
      40,
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
      40,
    );
    expect(row).toEqual([
      { x: 40, y: 260 },
      { x: 910, y: 260 },
    ]);
  });

  it("keeps non-finite points in the output, centred, without poisoning the rest", () => {
    const spread = spreadToBox(
      [
        { x: 0, y: 0 },
        { x: Number.NaN, y: 5 },
        { x: 10, y: 10 },
        { x: 5, y: Infinity },
      ],
      { width: 100, height: 100 },
      10,
    );

    expect(spread).toEqual([
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 90, y: 90 },
      { x: 50, y: 50 },
    ]);
  });

  it("centres everything when no point is usable, and keeps the count", () => {
    const spread = spreadToBox(
      [
        { x: Number.NaN, y: Number.NaN },
        { x: 0, y: Number.NaN },
      ],
      { width: 200, height: 100 },
      10,
    );
    expect(spread).toEqual([
      { x: 100, y: 50 },
      { x: 100, y: 50 },
    ]);
  });

  it("treats float noise as a degenerate axis instead of magnifying it", () => {
    const pair = ellipsePoints(2, box, 40);
    expect(Math.abs(pair[0].y - pair[1].y)).toBeGreaterThan(0);

    const spread = spreadToBox(pair, box, 40);
    expect(spread[0].y).toBe(260);
    expect(spread[1].y).toBe(260);
    expect(spread[0].x).toBeCloseTo(40, 6);
    expect(spread[1].x).toBeCloseTo(910, 6);
  });

  it("keeps points inside the box even when the pad is wider than the box", () => {
    spreadToBox(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      { width: 40, height: 20 },
      500,
    ).forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(40);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(20);
    });
  });

  it("returns a fresh point per input so callers cannot alias the centre", () => {
    const spread = spreadToBox(
      [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ],
      { width: 10, height: 10 },
      1,
    );
    expect(spread[0]).not.toBe(spread[1]);
  });

  it("handles non-finite pad by treating it as zero", () => {
    const spread = spreadToBox(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      { width: 100, height: 100 },
      Number.NaN,
    );
    expect(spread[0]).toEqual({ x: 0, y: 0 });
    expect(spread[1]).toEqual({ x: 100, y: 100 });
  });
});
