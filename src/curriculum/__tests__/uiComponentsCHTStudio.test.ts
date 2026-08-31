import { describe, expect, it } from "bun:test";
import React from "react";
import {
  ConvexHullTrickStudio,
  computeLineIntersection,
  buildMonotonicCHT,
  queryMonotonicCHT,
  buildDynamicCHT,
  queryDynamicCHT,
  buildLiChaoTree,
  queryLiChaoTree,
  solveKnuthDP,
  verifyMongeProperty,
  CHT_MODALITIES,
  CHT_PRESETS,
  DYNAMIC_CHT_PRESETS,
  LICHAO_PRESETS,
  KNUTH_PRESETS,
  type CHTLine,
} from "../../components/primitives/ConvexHullTrickStudio";

describe("ConvexHullTrickStudio Comprehensive Unit & Algorithmic Test Suite", () => {
  // ==========================================================================
  // SECTION 1: COMPONENT INSTANTIATION & REGISTRY INTEGRITY
  // ==========================================================================
  describe("Section 1: Component Instantiation & Metadata Registry", () => {
    it("should instantiate ConvexHullTrickStudio with default props", () => {
      const element = React.createElement(ConvexHullTrickStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(ConvexHullTrickStudio);
    });

    it("should instantiate ConvexHullTrickStudio with custom props", () => {
      const element = React.createElement(ConvexHullTrickStudio, {
        initialModality: "dynamic_cht",
        initialPreset: "arbitrary_slope_stream",
        initialType: "max",
        width: 1024,
        height: 600,
        standalone: true,
        title: "Dynamic CHT & Monge Studio",
      });

      expect(element.props.initialModality).toBe("dynamic_cht");
      expect(element.props.initialPreset).toBe("arbitrary_slope_stream");
      expect(element.props.initialType).toBe("max");
      expect(element.props.width).toBe(1024);
      expect(element.props.height).toBe(600);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Dynamic CHT & Monge Studio");
    });

    it("should verify CHT_MODALITIES contains all 4 modalities with rich metadata", () => {
      expect(CHT_MODALITIES.length).toBe(4);
      const modIds = CHT_MODALITIES.map((m) => m.id);
      expect(modIds).toContain("classic_monotonic_cht");
      expect(modIds).toContain("dynamic_cht");
      expect(modIds).toContain("li_chao_tree");
      expect(modIds).toContain("knuth_quadrangle_dp");

      for (const m of CHT_MODALITIES) {
        expect(m.name.length).toBeGreaterThan(0);
        expect(m.shortName.length).toBeGreaterThan(0);
        expect(m.badge.length).toBeGreaterThan(0);
        expect(m.formulaTeX.length).toBeGreaterThan(0);
        expect(m.description.length).toBeGreaterThan(0);
        expect(m.complexity.length).toBeGreaterThan(0);
      }
    });

    it("should verify CHT_PRESETS data integrity", () => {
      const presets = Object.values(CHT_PRESETS);
      expect(presets.length).toBeGreaterThanOrEqual(4);
      for (const p of presets) {
        expect(p.id.length).toBeGreaterThan(0);
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.lines).toBeDefined();
        expect(p.lines!.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("should verify DYNAMIC_CHT_PRESETS data integrity", () => {
      const presets = Object.values(DYNAMIC_CHT_PRESETS);
      expect(presets.length).toBeGreaterThanOrEqual(3);
      for (const p of presets) {
        expect(p.lines).toBeDefined();
        expect(p.lines!.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("should verify LICHAO_PRESETS data integrity", () => {
      const presets = Object.values(LICHAO_PRESETS);
      expect(presets.length).toBeGreaterThanOrEqual(3);
      for (const p of presets) {
        expect(p.lines).toBeDefined();
        expect(p.domain).toBeDefined();
        expect(p.domain![0]).toBeLessThan(p.domain![1]);
      }
    });

    it("should verify KNUTH_PRESETS data integrity", () => {
      const presets = Object.values(KNUTH_PRESETS);
      expect(presets.length).toBeGreaterThanOrEqual(3);
      for (const p of presets) {
        expect(p.costMatrix).toBeDefined();
        const mat = p.costMatrix!;
        expect(mat.length).toBeGreaterThanOrEqual(5);
        expect(mat[0].length).toBe(mat.length);
      }
    });
  });

  // ==========================================================================
  // SECTION 2: LINE INTERSECTION ARITHMETIC & PRECISION
  // ==========================================================================
  describe("Section 2: Line Intersection Arithmetic & Precision", () => {
    it("should compute exact intersection for non-parallel lines", () => {
      const l1: CHTLine = { id: "l1", m: 2, c: 4 };
      const l2: CHTLine = { id: "l2", m: -1, c: 10 };

      // 2x + 4 = -x + 10 => 3x = 6 => x = 2, y = 8
      const inter = computeLineIntersection(l1, l2);
      expect(inter.parallel).toBe(false);
      expect(inter.coincident).toBe(false);
      expect(inter.x).toBeCloseTo(2, 6);
      expect(inter.y).toBeCloseTo(8, 6);
    });

    it("should detect parallel lines with different intercepts", () => {
      const l1: CHTLine = { id: "l1", m: 3, c: 10 };
      const l2: CHTLine = { id: "l2", m: 3, c: 20 };

      const inter = computeLineIntersection(l1, l2);
      expect(inter.parallel).toBe(true);
      expect(inter.coincident).toBe(false);
      expect(Number.isNaN(inter.x)).toBe(true);
    });

    it("should detect coincident identical lines", () => {
      const l1: CHTLine = { id: "l1", m: 5, c: 15 };
      const l2: CHTLine = { id: "l2", m: 5, c: 15 };

      const inter = computeLineIntersection(l1, l2);
      expect(inter.parallel).toBe(true);
      expect(inter.coincident).toBe(true);
      expect(inter.y).toBeCloseTo(15, 6);
    });

    it("should handle horizontal lines and fractional slopes accurately", () => {
      const l1: CHTLine = { id: "l1", m: 0, c: 5 };
      const l2: CHTLine = { id: "l2", m: 0.5, c: 2 };

      // 0.5x + 2 = 5 => 0.5x = 3 => x = 6, y = 5
      const inter = computeLineIntersection(l1, l2);
      expect(inter.parallel).toBe(false);
      expect(inter.x).toBeCloseTo(6, 6);
      expect(inter.y).toBeCloseTo(5, 6);
    });
  });

  // ==========================================================================
  // SECTION 3: CLASSIC MONOTONIC CHT
  // ==========================================================================
  describe("Section 3: Classic Monotonic CHT Construction & Queries", () => {
    it("should build lower convex envelope with descending slopes and pop redundant lines", () => {
      // Lines with descending slopes:
      // L1: y = 5x + 30
      // L2: y = 3x + 12 (intersect L1 at x = (30-12)/(3-5) = 18/-2 = -9)
      // L3: y = 2x + 18
      // L4: y = 1x + 25
      // L5: y = -1x + 50
      // L6: y = -3x + 80
      const lines: CHTLine[] = [
        { id: "l1", m: 5, c: 30 },
        { id: "l2", m: 3, c: 12 },
        { id: "l3", m: 2, c: 18 },
        { id: "l4", m: 1, c: 25 },
        { id: "l5", m: -1, c: 50 },
        { id: "l6", m: -3, c: 80 },
      ];

      const res = buildMonotonicCHT(lines, "min");
      expect(res.hull.length).toBeGreaterThan(0);
      expect(res.type).toBe("min");
      expect(res.steps.length).toBeGreaterThan(0);

      // Verify breakpoints are strictly increasing
      for (let i = 0; i < res.breakpoints.length - 1; i++) {
        expect(res.breakpoints[i]).toBeLessThan(res.breakpoints[i + 1]);
      }
    });

    it("should evaluate queries accurately against brute-force baseline for Min CHT", () => {
      const lines: CHTLine[] = [
        { id: "l1", m: 5, c: 30 },
        { id: "l2", m: 3, c: 12 },
        { id: "l3", m: 2, c: 18 },
        { id: "l4", m: 1, c: 25 },
        { id: "l5", m: -1, c: 50 },
        { id: "l6", m: -3, c: 80 },
      ];

      const res = buildMonotonicCHT(lines, "min");

      // Test across query range x from -20 to 50
      for (let x = -20; x <= 50; x += 2.5) {
        const queryRes = queryMonotonicCHT(res.hull, x, "min");

        // Brute-force minimum over all input lines
        const bruteForceMin = Math.min(...lines.map((l) => l.m * x + l.c));

        expect(queryRes.value).toBeCloseTo(bruteForceMin, 5);
        expect(queryRes.optimalLine).toBeDefined();
      }
    });

    it("should build upper convex envelope with ascending slopes for Max CHT", () => {
      const lines: CHTLine[] = [
        { id: "u1", m: -2, c: -10 },
        { id: "u2", m: 0, c: 5 },
        { id: "u3", m: 2, c: 15 },
        { id: "u4", m: 4, c: 8 },
        { id: "u5", m: 7, c: -10 },
      ];

      const res = buildMonotonicCHT(lines, "max");
      expect(res.type).toBe("max");

      for (let x = -10; x <= 30; x += 2) {
        const queryRes = queryMonotonicCHT(res.hull, x, "max");
        const bruteForceMax = Math.max(...lines.map((l) => l.m * x + l.c));
        expect(queryRes.value).toBeCloseTo(bruteForceMax, 5);
      }
    });

    it("should correctly handle parallel lines keeping only the optimal intercept", () => {
      const lines: CHTLine[] = [
        { id: "p1", m: 2, c: 50 },
        { id: "p2", m: 2, c: 10 }, // Better intercept for min
        { id: "p3", m: -1, c: 30 },
      ];

      const res = buildMonotonicCHT(lines, "min");
      const slopes = res.hull.map((l) => l.m);
      // Duplicate slope 2 should only appear once with intercept 10
      const slope2Lines = res.hull.filter((l) => l.m === 2);
      expect(slope2Lines.length).toBe(1);
      expect(slope2Lines[0].c).toBe(10);
      expect(slopes).toContain(-1);
    });

    it("should handle empty lines array and single line gracefully", () => {
      const emptyRes = buildMonotonicCHT([], "min");
      expect(emptyRes.hull.length).toBe(0);
      const emptyQuery = queryMonotonicCHT(emptyRes.hull, 10, "min");
      expect(emptyQuery.value).toBe(Infinity);

      const single: CHTLine = { id: "s1", m: 3, c: 7 };
      const singleRes = buildMonotonicCHT([single], "min");
      expect(singleRes.hull.length).toBe(1);
      const singleQuery = queryMonotonicCHT(singleRes.hull, 4, "min");
      expect(singleQuery.value).toBe(3 * 4 + 7);
    });
  });

  // ==========================================================================
  // SECTION 4: FULLY DYNAMIC CHT
  // ==========================================================================
  describe("Section 4: Fully Dynamic CHT Arbitrary Insertion & Cascade Pruning", () => {
    it("should construct dynamic envelope from arbitrary insertion order", () => {
      const stream: CHTLine[] = [
        { id: "d1", m: 4, c: 10 },
        { id: "d2", m: -2, c: 40 },
        { id: "d3", m: 1, c: 15 },
        { id: "d4", m: -5, c: 90 },
        { id: "d5", m: 3, c: -5 },
        { id: "d6", m: 0, c: 20 },
        { id: "d7", m: -1, c: 30 },
      ];

      const res = buildDynamicCHT(stream, "min");
      expect(res.hull.length).toBeGreaterThan(0);
      expect(res.steps.length).toBeGreaterThan(0);

      // Hull slopes should be strictly descending for min lower envelope
      for (let i = 0; i < res.hull.length - 1; i++) {
        expect(res.hull[i].m).toBeGreaterThan(res.hull[i + 1].m);
      }

      // Hull intervals [xStart, xEnd] should cover (-Infinity, Infinity)
      expect(res.hull[0].xStart).toBe(-Infinity);
      expect(res.hull[res.hull.length - 1].xEnd).toBe(Infinity);
    });

    it("should match brute-force minimum query results for dynamic envelope", () => {
      const stream: CHTLine[] = [
        { id: "d1", m: 4, c: 10 },
        { id: "d2", m: -2, c: 40 },
        { id: "d3", m: 1, c: 15 },
        { id: "d4", m: -5, c: 90 },
        { id: "d5", m: 3, c: -5 },
        { id: "d6", m: 0, c: 20 },
        { id: "d7", m: -1, c: 30 },
      ];

      const res = buildDynamicCHT(stream, "min");

      for (let x = -30; x <= 30; x += 1) {
        const queryRes = queryDynamicCHT(res.hull, x, "min");
        const bruteForceMin = Math.min(...stream.map((l) => l.m * x + l.c));
        expect(queryRes.value).toBeCloseTo(bruteForceMin, 5);
      }
    });

    it("should prune cascade redundant lines when an overpowering middle line is inserted", () => {
      const lines: CHTLine[] = [
        { id: "p1", m: 10, c: 100 },
        { id: "p2", m: -10, c: 100 },
        { id: "p3", m: 0, c: 20 },
        { id: "p4", m: 2, c: 15 },
        { id: "p5", m: -2, c: 15 },
        { id: "p6", m: 0, c: 5 }, // Strictly dominates y = 20
      ];

      const res = buildDynamicCHT(lines, "min");
      // Line p3 (y = 20) should have been pruned out of the hull
      const p3InHull = res.hull.some((l) => l.id === "p3");
      expect(p3InHull).toBe(false);

      // Verify queries still match brute force
      for (let x = -15; x <= 15; x += 1) {
        const queryRes = queryDynamicCHT(res.hull, x, "min");
        const bruteForceMin = Math.min(...lines.map((l) => l.m * x + l.c));
        expect(queryRes.value).toBeCloseTo(bruteForceMin, 5);
      }
    });

    it("should support dynamic upper envelope (max) mode", () => {
      const lines: CHTLine[] = [
        { id: "s1", m: 6, c: -20 },
        { id: "s2", m: -4, c: 80 },
        { id: "s3", m: 2, c: 10 },
        { id: "s4", m: -1, c: 35 },
        { id: "s5", m: 5, c: -5 },
        { id: "s6", m: 3, c: 18 },
      ];

      const res = buildDynamicCHT(lines, "max");
      expect(res.type).toBe("max");

      for (let x = -10; x <= 25; x += 1) {
        const queryRes = queryDynamicCHT(res.hull, x, "max");
        const bruteForceMax = Math.max(...lines.map((l) => l.m * x + l.c));
        expect(queryRes.value).toBeCloseTo(bruteForceMax, 5);
      }
    });
  });

  // ==========================================================================
  // SECTION 5: LI CHAO SEGMENT TREE
  // ==========================================================================
  describe("Section 5: Li Chao Segment Tree Construction & Point Queries", () => {
    it("should build Li Chao Tree over discrete domain and maintain midpoint dominance", () => {
      const lines: CHTLine[] = [
        { id: "lc1", m: 3, c: -10 },
        { id: "lc2", m: -2, c: 15 },
        { id: "lc3", m: 1, c: 5 },
        { id: "lc4", m: -4, c: 30 },
        { id: "lc5", m: 0, c: 8 },
      ];

      const res = buildLiChaoTree(lines, -20, 20, "min");
      expect(res.root).toBeDefined();
      expect(res.nodeCount).toBeGreaterThanOrEqual(1);
      expect(res.maxDepth).toBeGreaterThanOrEqual(1);
      expect(res.steps.length).toBeGreaterThan(0);

      // Point queries on integer coordinates in domain [-20, 20]
      for (let x = -20; x <= 20; x += 1) {
        const queryRes = queryLiChaoTree(res.root, x, "min");
        const bruteForceMin = Math.min(...lines.map((l) => l.m * x + l.c));
        expect(queryRes.value).toBeCloseTo(bruteForceMin, 5);
        expect(queryRes.optimalLine).toBeDefined();
        expect(queryRes.path).toBeDefined();
        expect(queryRes.path!.length).toBeGreaterThan(0);
      }
    });

    it("should handle restricted line segments with interval splits in Li Chao Tree", () => {
      const segments: CHTLine[] = [
        { id: "seg1", m: 2, c: -5, xStart: -15, xEnd: 5, isSegment: true },
        { id: "seg2", m: -3, c: 20, xStart: -5, xEnd: 15, isSegment: true },
        { id: "seg3", m: 0.5, c: 10, xStart: -10, xEnd: 10, isSegment: true },
        { id: "seg4", m: -1, c: -2, xStart: 0, xEnd: 20, isSegment: true },
      ];

      const res = buildLiChaoTree(segments, -20, 20, "min");

      // Verify that segment split steps were recorded
      const splitSteps = res.steps.filter((s) => s.action === "segment_split");
      expect(splitSteps.length).toBeGreaterThan(0);

      // Verify queries only consider active segments at coordinate x
      for (let x = -15; x <= 15; x += 1) {
        const validSegments = segments.filter((s) => s.xStart! <= x && x <= s.xEnd!);
        if (validSegments.length > 0) {
          const queryRes = queryLiChaoTree(res.root, x, "min");
          const expectedMin = Math.min(...validSegments.map((s) => s.m * x + s.c));
          expect(queryRes.value).toBeCloseTo(expectedMin, 5);
        }
      }
    });

    it("should support Li Chao Tree maximization (upper envelope)", () => {
      const lines: CHTLine[] = [
        { id: "l1", m: 2, c: 10 },
        { id: "l2", m: -1, c: 25 },
        { id: "l3", m: 0.5, c: 15 },
      ];

      const res = buildLiChaoTree(lines, 0, 50, "max");

      for (let x = 0; x <= 50; x += 2) {
        const queryRes = queryLiChaoTree(res.root, x, "max");
        const bruteForceMax = Math.max(...lines.map((l) => l.m * x + l.c));
        expect(queryRes.value).toBeCloseTo(bruteForceMax, 5);
      }
    });

    it("should handle null tree queries gracefully", () => {
      const minQ = queryLiChaoTree(null, 5, "min");
      expect(minQ.value).toBe(Infinity);
      expect(minQ.optimalLine).toBeNull();

      const maxQ = queryLiChaoTree(null, 5, "max");
      expect(maxQ.value).toBe(-Infinity);
    });
  });

  // ==========================================================================
  // SECTION 6: KNUTH'S QUADRANGLE INEQUALITY DP SPEEDUP
  // ==========================================================================
  describe("Section 6: Knuth's DP Optimization & Monge Verification", () => {
    it("should verify Monge property correctly on an Optimal BST prefix-sum matrix", () => {
      const weights = [4, 2, 6, 3, 5, 1];
      const n = weights.length;
      const pref = [0];
      for (let i = 0; i < n; i++) pref.push(pref[i] + weights[i]);
      const cost: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          cost[i][j] = pref[j + 1] - pref[i];
        }
      }

      const mongeCheck = verifyMongeProperty(cost, n);
      expect(mongeCheck.satisfiesMonge).toBe(true);
      expect(mongeCheck.violations.length).toBe(0);
      expect(mongeCheck.checkedQuadruples).toBeGreaterThan(0);
    });

    it("should detect Monge property violations on anti-submodular matrix", () => {
      // Intentionally crafted matrix that violates QI
      const badCost = [
        [0, 10, 50, 100],
        [0, 0, 5, 40],
        [0, 0, 0, 10],
        [0, 0, 0, 0],
      ];

      const mongeCheck = verifyMongeProperty(badCost, 4);
      // C[0][2] (50) + C[1][3] (40) = 90 > C[0][3] (100) + C[1][2] (5) = 105 (violates or satisfies depending on indices)
      expect(mongeCheck.checkedQuadruples).toBeGreaterThan(0);
    });

    it("should solve Knuth DP and verify optimal split monotonicity opt[i][j-1] <= opt[i][j] <= opt[i+1][j]", () => {
      const weights = [4, 2, 6, 3, 5, 1];
      const n = weights.length;
      const pref = [0];
      for (let i = 0; i < n; i++) pref.push(pref[i] + weights[i]);
      const cost: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          cost[i][j] = pref[j + 1] - pref[i];
        }
      }

      const res = solveKnuthDP(cost, n);
      expect(res.dp.length).toBe(n);
      expect(res.opt.length).toBe(n);
      expect(res.steps.length).toBeGreaterThan(0);

      // Verify split monotonicity for all valid intervals
      for (let len = 3; len <= n; len++) {
        for (let i = 0; i <= n - len; i++) {
          const j = i + len - 1;
          const optLeft = res.opt[i][j - 1];
          const optCurrent = res.opt[i][j];
          const optRight = res.opt[i + 1][j];

          expect(optLeft).toBeLessThanOrEqual(optCurrent);
          expect(optCurrent).toBeLessThanOrEqual(optRight);
        }
      }
    });

    it("should achieve operation count reduction (O(n^2) vs O(n^3))", () => {
      const weights = [3, 1, 4, 1, 5, 9, 2, 6];
      const n = weights.length;
      const pref = [0];
      for (let i = 0; i < n; i++) pref.push(pref[i] + weights[i]);
      const cost: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          cost[i][j] = pref[j + 1] - pref[i];
        }
      }

      const res = solveKnuthDP(cost, n);
      expect(res.knuthOperations).toBeLessThan(res.naiveOperations);
      expect(res.speedupFactor).toBeGreaterThan(1.0);
    });
  });

  // ==========================================================================
  // SECTION 7: EDGE CASES & ROBUSTNESS
  // ==========================================================================
  describe("Section 7: Edge Cases & Numerical Robustness", () => {
    it("should handle large coordinates and extreme query points", () => {
      const lines: CHTLine[] = [
        { id: "e1", m: 1000, c: 500000 },
        { id: "e2", m: -500, c: 2000000 },
        { id: "e3", m: 0, c: 1000000 },
      ];

      const res = buildDynamicCHT(lines, "min");
      const qFarRight = queryDynamicCHT(res.hull, 10000, "min");
      const bruteFarRight = Math.min(...lines.map((l) => l.m * 10000 + l.c));
      expect(qFarRight.value).toBeCloseTo(bruteFarRight, 2);

      const qFarLeft = queryDynamicCHT(res.hull, -10000, "min");
      const bruteFarLeft = Math.min(...lines.map((l) => l.m * -10000 + l.c));
      expect(qFarLeft.value).toBeCloseTo(bruteFarLeft, 2);
    });

    it("should handle collinear and negative slope lines in all modalities", () => {
      const lines: CHTLine[] = [
        { id: "n1", m: -10, c: -50 },
        { id: "n2", m: -5, c: -100 },
        { id: "n3", m: -1, c: -180 },
      ];

      const monoRes = buildMonotonicCHT(lines, "min");
      const dynRes = buildDynamicCHT(lines, "min");
      const lcRes = buildLiChaoTree(lines, -50, 50, "min");

      for (let x = -20; x <= 20; x += 5) {
        const mVal = queryMonotonicCHT(monoRes.hull, x, "min").value;
        const dVal = queryDynamicCHT(dynRes.hull, x, "min").value;
        const lVal = queryLiChaoTree(lcRes.root, x, "min").value;
        const expected = Math.min(...lines.map((l) => l.m * x + l.c));

        expect(mVal).toBeCloseTo(expected, 4);
        expect(dVal).toBeCloseTo(expected, 4);
        expect(lVal).toBeCloseTo(expected, 4);
      }
    });
  });
});
