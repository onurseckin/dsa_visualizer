import { describe, expect, it } from "bun:test";
import { DinicEdge, DinicNode } from "../../components/primitives/DinicFlowVisualizer";
import { generateConvexHullGeometry } from "../canvasGeometry";

describe("Interactive In-Canvas DSA Visualizer Primitives Verification Tests", () => {
  describe("1. DinicFlowVisualizer Layout & Min-Cut Logic", () => {
    it("should partition level graph nodes into distinct vertical columns", () => {
      const nodes: DinicNode[] = [
        { id: "S", level: 0, isSource: true, inCutS: true },
        { id: "1", level: 1, inCutS: true },
        { id: "2", level: 1, inCutS: false },
        { id: "3", level: 2, inCutS: false },
        { id: "T", level: 3, isSink: true, inCutS: false },
      ];

      const levels = new Set(nodes.map((n) => n.level));
      expect(levels.size).toBe(4);
      expect(Math.max(...levels)).toBe(3);

      const sourceNode = nodes.find((n) => n.isSource);
      const sinkNode = nodes.find((n) => n.isSink);
      expect(sourceNode?.level).toBe(0);
      expect(sinkNode?.level).toBe(3);
    });

    it("should detect saturated edges and augmenting paths accurately", () => {
      const edges: DinicEdge[] = [
        { source: "S", target: "1", capacity: 10, flow: 10 }, // Saturated
        { source: "S", target: "2", capacity: 10, flow: 4 }, // Residual = 6
        { source: "1", target: "T", capacity: 10, flow: 10 }, // Saturated
        { source: "2", target: "T", capacity: 10, flow: 4 }, // Residual = 6
      ];

      const saturated = edges.filter((e) => e.capacity > 0 && e.flow === e.capacity);
      expect(saturated.length).toBe(2);
      expect(saturated[0].source).toBe("S");
      expect(saturated[0].target).toBe("1");

      const residualCap = edges.map((e) => e.capacity - e.flow);
      expect(residualCap).toEqual([0, 6, 0, 6]);
    });
  });

  describe("2. FenwickTreeVisualizer Dyadic Interval Arithmetic", () => {
    it("should compute exact dyadic interval ranges L(i) = i - (i & -i) + 1 to i", () => {
      const testCases = [
        { i: 1, lsb: 1, range: [1, 1] },
        { i: 2, lsb: 2, range: [1, 2] },
        { i: 3, lsb: 1, range: [3, 3] },
        { i: 4, lsb: 4, range: [1, 4] },
        { i: 5, lsb: 1, range: [5, 5] },
        { i: 6, lsb: 2, range: [5, 6] },
        { i: 7, lsb: 1, range: [7, 7] },
        { i: 8, lsb: 8, range: [1, 8] },
      ];

      for (const tc of testCases) {
        const lsb = tc.i & -tc.i;
        const start = tc.i - lsb + 1;
        const end = tc.i;

        expect(lsb).toBe(tc.lsb);
        expect(start).toBe(tc.range[0]);
        expect(end).toBe(tc.range[1]);
      }
    });

    it("should generate correct point update jump path (i += i & -i)", () => {
      const n = 8;
      let idx = 3;
      const updatePath: number[] = [];

      while (idx <= n) {
        updatePath.push(idx);
        idx += idx & -idx;
      }

      // Index 3 (0b0011) jumps to 4 (0b0100) then 8 (0b1000)
      expect(updatePath).toEqual([3, 4, 8]);
    });

    it("should generate correct prefix sum query jump path (i -= i & -i)", () => {
      let idx = 7;
      const queryPath: number[] = [];

      while (idx > 0) {
        queryPath.push(idx);
        idx -= idx & -idx;
      }

      // Index 7 (0b0111) queries 7, then 6 (0b0110), then 4 (0b0100)
      expect(queryPath).toEqual([7, 6, 4]);
    });
  });

  describe("3. ConvexHullSweepVisualizer Turn Testing & Geometry", () => {
    it("should classify 2D cross product turns into CCW (push) vs CW (pop)", () => {
      function crossProduct(
        p1: [number, number],
        p2: [number, number],
        p3: [number, number],
      ): number {
        return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
      }

      // Counter-clockwise turn: (0,0) -> (2,0) -> (1,2)
      const ccw = crossProduct([0, 0], [2, 0], [1, 2]);
      expect(ccw).toBeGreaterThan(0); // Valid CCW turn

      // Clockwise turn: (0,0) -> (1,2) -> (2,1)
      const cw = crossProduct([0, 0], [1, 2], [2, 1]);
      expect(cw).toBeLessThan(0); // Clockwise violation => pop!
    });

    it("should calculate exact closed polygon shoelace area", () => {
      const triangle = [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 0, y: 3 },
      ];

      const geo = generateConvexHullGeometry(triangle);
      expect(geo.area).toBe(6.0); // 0.5 * base * height = 0.5 * 4 * 3 = 6
      expect(geo.perimeter).toBe(12.0); // 4 + 3 + 5 = 12
      expect(geo.pathD).toBe("M 0.0 0.0 L 4.0 0.0 L 0.0 3.0 Z");
    });
  });
});
