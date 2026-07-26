import { describe, expect, it } from "vitest";
import { barRun, computeArrayLayout } from "../array/layoutEngine";
import { ArrayElement } from "../../../types/dsa";
import { Size } from "../vizGeometry";

describe("array layoutEngine", () => {
  describe("barRun", () => {
    it("handles roomy span <= avail when count is 1 (no gaps)", () => {
      const run = barRun(1, 300);
      expect(run.gap).toBe(0);
      expect(run.size).toBeGreaterThan(0);
      expect(run.span).toBe(run.size);
    });

    it("handles roomy span <= avail with multiple items (clamped gap)", () => {
      const run = barRun(5, 500);
      expect(run.gap).toBeGreaterThan(0);
      expect(run.span).toBeLessThanOrEqual(500);
    });

    it("handles roomy span > avail when available space is tight", () => {
      const run = barRun(50, 100);
      expect(run.span).toBe(100);
      expect(run.size).toBeGreaterThanOrEqual(1);
    });

    it("handles roomy span > avail when count is 1 (no gaps)", () => {
      const run = barRun(1, 2);
      expect(run.gap).toBe(0);
      expect(run.size).toBeGreaterThanOrEqual(1);
    });

    it("handles count <= 0 gracefully", () => {
      const run = barRun(0, 200);
      expect(run.size).toBeGreaterThan(0);
      expect(run.gap).toBe(0);
    });
  });

  describe("computeArrayLayout", () => {
    it("computes layout metrics for bar mode with pointers", () => {
      const elements: ArrayElement[] = [
        { id: "1", value: 10, state: "default", pointers: ["head", "i"] },
        { id: "2", value: 20, state: "default", pointers: ["j"] },
        { id: "3", value: 5, state: "default" },
      ];
      const box: Size = { width: 600, height: 300 };

      const metrics = computeArrayLayout(elements, box, "bar");

      expect(metrics.isBoxMode).toBe(false);
      expect(metrics.maxVal).toBe(20);
      expect(metrics.barWidth).toBeGreaterThan(0);
      expect(metrics.topPad).toBeGreaterThan(4);
      expect(metrics.baselineY).toBeGreaterThan(metrics.topPad);
      expect(metrics.bandHeight).toBeGreaterThan(0);
    });

    it("computes layout metrics for box mode without pointers", () => {
      const elements: ArrayElement[] = [
        { id: "1", value: -5, state: "default" },
        { id: "2", value: 0, state: "default" },
      ];
      const box: Size = { width: 400, height: 200 };

      const metrics = computeArrayLayout(elements, box, "box");

      expect(metrics.isBoxMode).toBe(true);
      expect(metrics.maxVal).toBe(1); // negative values fallback to maxVal 1
      expect(metrics.topPad).toBe(4);
      expect(metrics.boxSize).toBeGreaterThan(0);
    });

    it("handles zero or narrow box width safely", () => {
      const elements: ArrayElement[] = [{ id: "1", value: 42, state: "default" }];
      const box: Size = { width: 10, height: 10 };

      const metrics = computeArrayLayout(elements, box, "bar");

      expect(metrics.barWidth).toBeGreaterThanOrEqual(1);
      expect(metrics.bandHeight).toBeGreaterThanOrEqual(1);
      expect(metrics.minBarHeight).toBe(4);
    });

    it("handles empty elements array gracefully", () => {
      const elements: ArrayElement[] = [];
      const box: Size = { width: 400, height: 200 };

      const metrics = computeArrayLayout(elements, box, "bar");

      expect(metrics.maxVal).toBe(1);
      expect(metrics.barWidth).toBeGreaterThan(0);
    });
  });
});
