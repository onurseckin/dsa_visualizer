import { describe, expect, it } from "vitest";
import { cellFit, computeGridLayout } from "../grid/layoutEngine";
import { Size } from "../vizGeometry";

describe("grid layoutEngine", () => {
  describe("cellFit", () => {
    it("returns standard cell size and GAP when grid fits easily within box", () => {
      const box: Size = { width: 500, height: 500 };
      const fit = cellFit(5, 5, box);
      expect(fit.gap).toBe(4);
      expect(fit.cell).toBeGreaterThan(0);
    });

    it("falls back to calculated gap and min cell size 1 when grid does not fit standard constraints", () => {
      const box: Size = { width: 40, height: 40 };
      const fit = cellFit(20, 20, box);
      expect(fit.gap).toBeLessThanOrEqual(4);
      expect(fit.cell).toBeGreaterThanOrEqual(1);
    });

    it("handles single cell grid or zero boundaries gracefully", () => {
      const box: Size = { width: 100, height: 100 };
      const fit = cellFit(1, 1, box);
      expect(fit.cell).toBeGreaterThan(0);
      expect(fit.gap).toBe(4);
    });

    it("handles non-positive rows or cols gracefully", () => {
      const box: Size = { width: 100, height: 100 };
      const fit = cellFit(0, 0, box);
      expect(fit.cell).toBeGreaterThanOrEqual(1);
    });
  });

  describe("computeGridLayout", () => {
    it("computes grid metrics with origin centering and clamped font/radius/stroke", () => {
      const box: Size = { width: 400, height: 300 };
      const metrics = computeGridLayout(4, 5, box);

      expect(metrics.cell).toBeGreaterThan(0);
      expect(metrics.gap).toBeGreaterThan(0);
      expect(metrics.gridWidth).toBeGreaterThan(0);
      expect(metrics.gridHeight).toBeGreaterThan(0);
      expect(metrics.originX).toBeGreaterThanOrEqual(0);
      expect(metrics.originY).toBeGreaterThanOrEqual(0);

      // Verify font, strokeScale, radius are clamped within defined limits
      expect(metrics.font).toBeGreaterThanOrEqual(7);
      expect(metrics.font).toBeLessThanOrEqual(28);

      expect(metrics.strokeScale).toBeGreaterThanOrEqual(1);
      expect(metrics.strokeScale).toBeLessThanOrEqual(1.8);

      expect(metrics.radius).toBeGreaterThanOrEqual(3);
      expect(metrics.radius).toBeLessThanOrEqual(12);
    });

    it("clamps font and radius for very large cells", () => {
      const box: Size = { width: 2000, height: 2000 };
      const metrics = computeGridLayout(1, 1, box);

      expect(metrics.font).toBe(28);
      expect(metrics.strokeScale).toBe(1.8);
      expect(metrics.radius).toBe(12);
    });

    it("clamps font and radius for very small cells", () => {
      const box: Size = { width: 10, height: 10 };
      const metrics = computeGridLayout(20, 20, box);

      expect(metrics.font).toBe(7);
      expect(metrics.strokeScale).toBe(1);
      expect(metrics.radius).toBe(3);
    });
  });
});
