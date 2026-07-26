import { describe, it, expect } from "vitest";
import { boxViewBox, clamp, fitSlots, minPointSpacing, viewBoxAttr } from "../vizGeometry";

describe("clamp", () => {
  it("bounds a value and substitutes the minimum for non-finite input", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-4, 1, 10)).toBe(1);
    expect(clamp(99, 1, 10)).toBe(10);
    expect(clamp(Number.NaN, 3, 10)).toBe(3);
    expect(clamp(Infinity, 3, 10)).toBe(3);
  });
});

describe("boxViewBox — the whitespace fix", () => {
  it("is literally the measured box, so user units are CSS pixels", () => {
    expect(boxViewBox({ width: 950, height: 520 })).toEqual({
      minX: 0,
      minY: 0,
      width: 950,
      height: 520,
    });
    expect(viewBoxAttr(boxViewBox({ width: 950, height: 520 }))).toBe("0 0 950 520");
  });

  it("always shares the aspect ratio of the box, so nothing can letterbox", () => {
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

  it("floors a not-yet-measured axis at one unit instead of collapsing", () => {
    expect(boxViewBox({ width: 0, height: 0 })).toEqual({
      minX: 0,
      minY: 0,
      width: 1,
      height: 1,
    });
  });
});

describe("minPointSpacing", () => {
  it("reports the closest pair, which is what caps a node radius", () => {
    expect(
      minPointSpacing(
        [
          { x: 0, y: 0 },
          { x: 30, y: 40 },
          { x: 0, y: 12 },
        ],
        999,
      ),
    ).toBe(12);
  });

  it("falls back when there is no pair at all", () => {
    expect(minPointSpacing([{ x: 5, y: 5 }], 77)).toBe(77);
    expect(minPointSpacing([], 77)).toBe(77);
  });

  it("ignores non-finite points and reports zero for coincident ones", () => {
    expect(
      minPointSpacing(
        [
          { x: 0, y: 0 },
          { x: Number.NaN, y: 0 },
          { x: 6, y: 8 },
        ],
        99,
      ),
    ).toBe(10);
    expect(
      minPointSpacing(
        [
          { x: 3, y: 3 },
          { x: 3, y: 3 },
        ],
        99,
      ),
    ).toBe(0);
  });
});

describe("fitSlots", () => {
  it("spends the whole run when the slots fit between min and max", () => {
    expect(fitSlots(4, 100, 10, 5, 50)).toEqual({ size: 17.5, gap: 10, span: 100 });
  });

  it("caps at max so a two-element run does not become absurd", () => {
    expect(fitSlots(2, 500, 10, 5, 50)).toEqual({ size: 50, gap: 10, span: 110 });
  });

  it("overshoots the run once min binds, which the caller has to detect", () => {
    const fit = fitSlots(20, 100, 10, 12, 50);
    expect(fit.size).toBe(12);
    expect(fit.span).toBeGreaterThan(100);
  });

  it("drops the gap for a single slot and survives an empty run", () => {
    expect(fitSlots(1, 100, 10, 5, 50)).toEqual({ size: 50, gap: 0, span: 50 });
    expect(fitSlots(0, 100, 10, 5, 50)).toEqual({ size: 50, gap: 0, span: 50 });
  });

  it("falls back to min on a non-finite run", () => {
    expect(fitSlots(3, Number.NaN, 4, 6, 50)).toEqual({ size: 6, gap: 4, span: 26 });
  });
});

describe("viewBoxAttr", () => {
  it("rounds to two decimals so re-measuring does not churn the attribute", () => {
    expect(viewBoxAttr({ minX: 1.006, minY: 2.129, width: 3.4449, height: 4 })).toBe(
      "1.01 2.13 3.44 4",
    );
  });
});
