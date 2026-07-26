import { describe, it, expect } from "vitest";
import { ellipsePoints, spreadToBox, tidyTreeSlots } from "../vizGeometry";

describe("ellipsePoints", () => {
  it("inscribes an ellipse, not a circle, so a wide box is filled horizontally", () => {
    const points = ellipsePoints(4, { width: 200, height: 100 }, 10);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    expect(Math.min(...xs)).toBeCloseTo(10, 6);
    expect(Math.max(...xs)).toBeCloseTo(190, 6);
    expect(Math.min(...ys)).toBeCloseTo(10, 6);
    expect(Math.max(...ys)).toBeCloseTo(90, 6);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(Math.max(...ys) - Math.min(...ys));
  });

  it("starts at the top and runs clockwise", () => {
    const points = ellipsePoints(4, { width: 200, height: 100 }, 10);
    expect(points[0].x).toBeCloseTo(100, 6);
    expect(points[0].y).toBeCloseTo(10, 6);
    expect(points[1].x).toBeCloseTo(190, 6);
    expect(points[2].y).toBeCloseTo(90, 6);
  });

  it("lays a pair along the box’s long axis", () => {
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

  it("centres a lone point and returns nothing for an empty graph", () => {
    expect(ellipsePoints(1, { width: 200, height: 100 }, 10)).toEqual([{ x: 100, y: 50 }]);
    expect(ellipsePoints(0, { width: 200, height: 100 }, 10)).toEqual([]);
    expect(ellipsePoints(Number.NaN, { width: 200, height: 100 }, 10)).toEqual([]);
  });

  it("keeps every point inside the box, whatever the pad", () => {
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

describe("tidyTreeSlots", () => {
  const childrenFrom =
    (edges: Record<string, string[]>) =>
    (id: string): string[] =>
      edges[id] ?? [];

  it("gives every leaf a column and centres each parent over its children", () => {
    const tidy = tidyTreeSlots(["a"], childrenFrom({ a: ["b", "c"], b: ["d", "e"] }));
    const slotOf = new Map(tidy.slots.map((slot) => [slot.id, slot]));

    expect(tidy.leafCount).toBe(3);
    expect(tidy.depth).toBe(2);
    expect(slotOf.get("d")?.slot).toBe(0);
    expect(slotOf.get("e")?.slot).toBe(1);
    expect(slotOf.get("b")?.slot).toBe(0.5);
    expect(slotOf.get("c")?.slot).toBe(2);
    expect(slotOf.get("a")?.slot).toBe(1.25);
    expect(slotOf.get("c")?.depth).toBe(1);
  });

  it("stacks a single-child chain in one column, which spreadToBox then centres", () => {
    const tidy = tidyTreeSlots(["a"], childrenFrom({ a: ["b"], b: ["c"] }));
    expect(tidy.leafCount).toBe(1);
    expect(tidy.depth).toBe(2);
    expect(tidy.slots.map((slot) => slot.slot)).toEqual([0, 0, 0]);
    expect(new Set(tidy.slots.map((slot) => slot.depth))).toEqual(new Set([0, 1, 2]));
  });

  it("places a forest side by side and never twice", () => {
    const tidy = tidyTreeSlots(["a", "x", "a", "b"], childrenFrom({ a: ["b"] }));
    expect(tidy.slots.map((slot) => slot.id)).toEqual(["b", "a", "x"]);
    expect(tidy.leafCount).toBe(2);
  });

  it("places nodes no root reaches when they are appended to the root list", () => {
    const tidy = tidyTreeSlots(["a", "a", "b", "orphan"], childrenFrom({ a: ["b"] }));
    expect(tidy.slots.map((slot) => slot.id).sort()).toEqual(["a", "b", "orphan"]);
  });

  it("terminates on a cycle instead of recursing forever", () => {
    const tidy = tidyTreeSlots(["a"], childrenFrom({ a: ["b"], b: ["a"] }));
    expect(tidy.slots.map((slot) => slot.id)).toEqual(["b", "a"]);
    expect(tidy.leafCount).toBe(1);
    expect(tidy.depth).toBe(1);
  });

  it("reports at least one column so callers can divide by leafCount", () => {
    expect(tidyTreeSlots([], childrenFrom({})).leafCount).toBe(1);
  });

  it("hands the caller abstract slots that spread to both axes of any box", () => {
    const tidy = tidyTreeSlots(["a"], childrenFrom({ a: ["b", "c"] }));
    const spread = spreadToBox(
      tidy.slots.map((slot) => ({ x: slot.slot, y: slot.depth })),
      { width: 950, height: 520 },
      40,
    );
    const ys = spread.map((point) => point.y);

    expect(Math.min(...ys)).toBe(40);
    expect(Math.max(...ys)).toBe(480);
    expect(Math.min(...spread.map((point) => point.x))).toBe(40);
    expect(Math.max(...spread.map((point) => point.x))).toBe(910);
  });
});
