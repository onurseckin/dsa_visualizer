import { describe, expect, it } from "bun:test";
import React from "react";
import {
  ComputationalGeometrySweepStudio,
  crossProduct2D,
  turnOrientation,
  euclideanDistance,
  euclideanDistanceSquared,
  shoelacePolygonArea,
  polygonPerimeter,
  computeMonotoneChain,
  computeGrahamScan,
  computeQuickHull,
  lineSegmentIntersection,
  computeBentleyOttmann,
  computeClosestPairBruteForce,
  computeClosestPairDC,
  isPointOnSegment,
  computeRayCastingPIP,
  computeWindingNumberPIP,
  GEOMETRY_MODALITIES,
  CONVEX_HULL_PRESETS,
  BENTLEY_OTTMANN_PRESETS,
  CLOSEST_PAIR_PRESETS,
  POINT_IN_POLYGON_PRESETS,
  GEOMETRY_STUDIO_PRESETS,
  Point2D,
  LineSegment,
} from "../../components/primitives/ComputationalGeometrySweepStudio";

describe("ComputationalGeometrySweepStudio Unit & Algorithmic Verification Tests", () => {
  // ==========================================================================
  // 1. Component Instantiation & Presets Integrity
  // ==========================================================================
  describe("1. Component Instantiation & Presets Integrity", () => {
    it("should instantiate ComputationalGeometrySweepStudio with default props", () => {
      const element = React.createElement(ComputationalGeometrySweepStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(ComputationalGeometrySweepStudio);
    });

    it("should instantiate ComputationalGeometrySweepStudio with custom props", () => {
      const element = React.createElement(ComputationalGeometrySweepStudio, {
        initialModality: "bentley_ottmann_sweep",
        initialPreset: "star_of_david",
        initialAlgorithm: "graham_scan",
        width: 1024,
        height: 600,
        standalone: true,
        title: "Advanced Sweep-Line Studio",
      });

      expect(element.props.initialModality).toBe("bentley_ottmann_sweep");
      expect(element.props.initialPreset).toBe("star_of_david");
      expect(element.props.initialAlgorithm).toBe("graham_scan");
      expect(element.props.width).toBe(1024);
      expect(element.props.height).toBe(600);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Advanced Sweep-Line Studio");
    });

    it("should verify GEOMETRY_MODALITIES contains all 4 modalities with valid metadata", () => {
      expect(GEOMETRY_MODALITIES.length).toBe(4);
      const modIds = GEOMETRY_MODALITIES.map((m) => m.id);
      expect(modIds).toContain("convex_hull_algorithms");
      expect(modIds).toContain("bentley_ottmann_sweep");
      expect(modIds).toContain("closest_pair_points");
      expect(modIds).toContain("point_in_polygon_ray_casting");

      for (const m of GEOMETRY_MODALITIES) {
        expect(m.name.length).toBeGreaterThan(0);
        expect(m.shortName.length).toBeGreaterThan(0);
        expect(m.badge.length).toBeGreaterThan(0);
        expect(m.formulaTeX.length).toBeGreaterThan(0);
        expect(m.description.length).toBeGreaterThan(0);
      }
    });

    it("should verify CONVEX_HULL_PRESETS data integrity", () => {
      for (const key of Object.keys(CONVEX_HULL_PRESETS)) {
        const p = CONVEX_HULL_PRESETS[key];
        expect(p.points).toBeDefined();
        expect(p.points!.length).toBeGreaterThanOrEqual(3);
        expect(p.modality).toBe("convex_hull_algorithms");
      }
    });

    it("should verify BENTLEY_OTTMANN_PRESETS data integrity", () => {
      for (const key of Object.keys(BENTLEY_OTTMANN_PRESETS)) {
        const p = BENTLEY_OTTMANN_PRESETS[key];
        expect(p.segments).toBeDefined();
        expect(p.segments!.length).toBeGreaterThanOrEqual(3);
        expect(p.modality).toBe("bentley_ottmann_sweep");
      }
    });

    it("should verify CLOSEST_PAIR_PRESETS data integrity", () => {
      for (const key of Object.keys(CLOSEST_PAIR_PRESETS)) {
        const p = CLOSEST_PAIR_PRESETS[key];
        expect(p.points).toBeDefined();
        expect(p.points!.length).toBeGreaterThanOrEqual(4);
        expect(p.modality).toBe("closest_pair_points");
      }
    });

    it("should verify POINT_IN_POLYGON_PRESETS data integrity", () => {
      for (const key of Object.keys(POINT_IN_POLYGON_PRESETS)) {
        const p = POINT_IN_POLYGON_PRESETS[key];
        expect(p.polygon).toBeDefined();
        expect(p.polygon!.length).toBeGreaterThanOrEqual(3);
        expect(p.queryPoint).toBeDefined();
        expect(p.modality).toBe("point_in_polygon_ray_casting");
      }
    });

    it("should verify GEOMETRY_STUDIO_PRESETS aggregates all presets", () => {
      const allKeys = Object.keys(GEOMETRY_STUDIO_PRESETS);
      expect(allKeys.length).toBe(
        Object.keys(CONVEX_HULL_PRESETS).length +
          Object.keys(BENTLEY_OTTMANN_PRESETS).length +
          Object.keys(CLOSEST_PAIR_PRESETS).length +
          Object.keys(POINT_IN_POLYGON_PRESETS).length,
      );
    });
  });

  // ==========================================================================
  // 2. Pure 2D Math Primitives & Utilities
  // ==========================================================================
  describe("2. Pure 2D Math Primitives & Utilities", () => {
    it("should compute crossProduct2D correctly for CCW, CW, and collinear turns", () => {
      const o: Point2D = { x: 0, y: 0 };
      const a: Point2D = { x: 1, y: 0 };
      const bCcw: Point2D = { x: 1, y: 1 };
      const bCw: Point2D = { x: 1, y: -1 };
      const bCollinear: Point2D = { x: 2, y: 0 };

      expect(crossProduct2D(o, a, bCcw)).toBe(1);
      expect(crossProduct2D(o, a, bCw)).toBe(-1);
      expect(crossProduct2D(o, a, bCollinear)).toBe(0);
    });

    it("should identify turnOrientation correctly", () => {
      const o: Point2D = { x: 0, y: 0 };
      const a: Point2D = { x: 2, y: 2 };

      expect(turnOrientation(o, a, { x: 1, y: 3 })).toBe("ccw");
      expect(turnOrientation(o, a, { x: 3, y: 1 })).toBe("cw");
      expect(turnOrientation(o, a, { x: 4, y: 4 })).toBe("collinear");
    });

    it("should compute euclideanDistance and euclideanDistanceSquared", () => {
      const p1: Point2D = { x: 0, y: 0 };
      const p2: Point2D = { x: 3, y: 4 };

      expect(euclideanDistance(p1, p2)).toBe(5);
      expect(euclideanDistanceSquared(p1, p2)).toBe(25);
    });

    it("should compute shoelacePolygonArea accurately", () => {
      // Unit square [0,0] -> [1,0] -> [1,1] -> [0,1]
      const unitSquare: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];
      expect(shoelacePolygonArea(unitSquare)).toBe(1);

      // Right triangle base=3, height=4 -> Area = 6
      const triangle: Point2D[] = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 4 },
      ];
      expect(shoelacePolygonArea(triangle)).toBe(6);

      // Degenerate polygon (< 3 vertices)
      expect(shoelacePolygonArea([])).toBe(0);
      expect(shoelacePolygonArea([{ x: 1, y: 1 }])).toBe(0);
      expect(
        shoelacePolygonArea([
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ]),
      ).toBe(0);
    });

    it("should compute polygonPerimeter accurately", () => {
      // Unit square
      const unitSquare: Point2D[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];
      expect(polygonPerimeter(unitSquare)).toBe(4);

      // 3-4-5 right triangle -> Perimeter = 12
      const triangle: Point2D[] = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 4 },
      ];
      expect(polygonPerimeter(triangle)).toBe(12);

      // Degenerate polygon (< 2 vertices)
      expect(polygonPerimeter([])).toBe(0);
      expect(polygonPerimeter([{ x: 0, y: 0 }])).toBe(0);
    });

    it("should test isPointOnSegment for interior, endpoints, and exterior points", () => {
      const a: Point2D = { x: 0, y: 0 };
      const b: Point2D = { x: 4, y: 4 };

      // Midpoint on segment
      expect(isPointOnSegment({ x: 2, y: 2 }, a, b)).toBe(true);
      // Endpoints
      expect(isPointOnSegment(a, a, b)).toBe(true);
      expect(isPointOnSegment(b, a, b)).toBe(true);
      // Collinear but beyond segment
      expect(isPointOnSegment({ x: 5, y: 5 }, a, b)).toBe(false);
      expect(isPointOnSegment({ x: -1, y: -1 }, a, b)).toBe(false);
      // Completely off segment
      expect(isPointOnSegment({ x: 2, y: 3 }, a, b)).toBe(false);
    });
  });

  // ==========================================================================
  // 3. Convex Hull Algorithms: Monotone Chain, Graham Scan, QuickHull
  // ==========================================================================
  describe("3. Convex Hull Algorithms", () => {
    const squareWithInterior: Point2D[] = [
      { x: 0, y: 0, label: "SW" },
      { x: 10, y: 0, label: "SE" },
      { x: 10, y: 10, label: "NE" },
      { x: 0, y: 10, label: "NW" },
      { x: 5, y: 5, label: "Center" },
      { x: 3, y: 7, label: "Inside1" },
    ];

    it("should compute Andrew's Monotone Chain convex hull correctly", () => {
      const result = computeMonotoneChain(squareWithInterior);
      expect(result.algorithm).toBe("monotone_chain");
      expect(result.hull.length).toBe(4);
      expect(result.area).toBe(100);
      expect(result.perimeter).toBe(40);
      expect(result.steps.length).toBeGreaterThan(0);

      // Verify interior points are NOT in the hull
      const labels = result.hull.map((p) => p.label);
      expect(labels).toContain("SW");
      expect(labels).toContain("SE");
      expect(labels).toContain("NE");
      expect(labels).toContain("NW");
      expect(labels).not.toContain("Center");
      expect(labels).not.toContain("Inside1");
    });

    it("should handle base cases in Monotone Chain (< 3 points)", () => {
      const emptyRes = computeMonotoneChain([]);
      expect(emptyRes.hull.length).toBe(0);
      expect(emptyRes.area).toBe(0);

      const oneRes = computeMonotoneChain([{ x: 1, y: 1 }]);
      expect(oneRes.hull.length).toBe(1);
      expect(oneRes.area).toBe(0);

      const twoRes = computeMonotoneChain([
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ]);
      expect(twoRes.hull.length).toBe(2);
      expect(twoRes.area).toBe(0);
      expect(twoRes.perimeter).toBeCloseTo(10 * Math.SQRT2, 4);
    });

    it("should compute Graham Scan convex hull correctly", () => {
      const result = computeGrahamScan(squareWithInterior);
      expect(result.algorithm).toBe("graham_scan");
      expect(result.hull.length).toBe(4);
      expect(result.area).toBe(100);
      expect(result.perimeter).toBe(40);
      expect(result.steps.length).toBeGreaterThan(0);

      const labels = result.hull.map((p) => p.label);
      expect(labels).not.toContain("Center");
    });

    it("should handle base cases in Graham Scan (< 3 points)", () => {
      const twoRes = computeGrahamScan([
        { x: 0, y: 0 },
        { x: 2, y: 2 },
      ]);
      expect(twoRes.hull.length).toBe(2);
      expect(twoRes.area).toBe(0);
    });

    it("should compute QuickHull convex hull correctly", () => {
      const result = computeQuickHull(squareWithInterior);
      expect(result.algorithm).toBe("quickhull");
      expect(result.hull.length).toBe(4);
      expect(result.area).toBe(100);
      expect(result.perimeter).toBe(40);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it("should handle base cases in QuickHull (< 3 points)", () => {
      const twoRes = computeQuickHull([
        { x: 0, y: 0 },
        { x: 2, y: 2 },
      ]);
      expect(twoRes.hull.length).toBe(2);
      expect(twoRes.area).toBe(0);
    });

    it("should produce equivalent convex hulls across all 3 algorithms on random cluster preset", () => {
      const clusterPts = CONVEX_HULL_PRESETS.random_cluster_12.points!;
      const monoRes = computeMonotoneChain(clusterPts);
      const grahamRes = computeGrahamScan(clusterPts);
      const quickRes = computeQuickHull(clusterPts);

      expect(monoRes.area).toBeCloseTo(grahamRes.area, 2);
      expect(monoRes.area).toBeCloseTo(quickRes.area, 2);
      expect(monoRes.perimeter).toBeCloseTo(grahamRes.perimeter, 2);
      expect(monoRes.perimeter).toBeCloseTo(quickRes.perimeter, 2);
      expect(monoRes.hull.length).toBe(grahamRes.hull.length);
      expect(monoRes.hull.length).toBe(quickRes.hull.length);
    });
  });

  // ==========================================================================
  // 4. Bentley-Ottmann Sweep-Line Algorithm & Line Intersections
  // ==========================================================================
  describe("4. Bentley-Ottmann Sweep Line & Segment Crossings", () => {
    it("should compute exact lineSegmentIntersection for crossing segments", () => {
      const s1: LineSegment = {
        id: "s1",
        p1: { x: 0, y: 0 },
        p2: { x: 10, y: 10 },
      };
      const s2: LineSegment = {
        id: "s2",
        p1: { x: 0, y: 10 },
        p2: { x: 10, y: 0 },
      };

      const inter = lineSegmentIntersection(s1, s2);
      expect(inter).not.toBeNull();
      expect(inter!.x).toBeCloseTo(5, 4);
      expect(inter!.y).toBeCloseTo(5, 4);
    });

    it("should return null for parallel non-intersecting segments", () => {
      const s1: LineSegment = {
        id: "s1",
        p1: { x: 0, y: 0 },
        p2: { x: 10, y: 0 },
      };
      const s2: LineSegment = {
        id: "s2",
        p1: { x: 0, y: 5 },
        p2: { x: 10, y: 5 },
      };

      expect(lineSegmentIntersection(s1, s2)).toBeNull();
    });

    it("should return null for non-parallel disjoint segments whose lines cross outside bounding boxes", () => {
      const s1: LineSegment = {
        id: "s1",
        p1: { x: 0, y: 0 },
        p2: { x: 2, y: 2 },
      };
      const s2: LineSegment = {
        id: "s2",
        p1: { x: 5, y: 10 },
        p2: { x: 10, y: 5 },
      };

      expect(lineSegmentIntersection(s1, s2)).toBeNull();
    });

    it("should run Bentley-Ottmann on grid_mesh and find 9 intersections", () => {
      const segs = BENTLEY_OTTMANN_PRESETS.grid_mesh.segments!;
      const result = computeBentleyOttmann(segs);

      expect(result.initialSegmentsCount).toBe(6);
      expect(result.intersections.length).toBe(9);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.totalEventsProcessed).toBe(result.steps.length);
    });

    it("should run Bentley-Ottmann on parallel_segments and find 0 intersections", () => {
      const segs = BENTLEY_OTTMANN_PRESETS.parallel_segments.segments!;
      const result = computeBentleyOttmann(segs);

      expect(result.intersections.length).toBe(0);
      expect(result.steps.length).toBe(segs.length * 2); // 4 start + 4 end = 8 events
    });

    it("should run Bentley-Ottmann on star_of_david and find all 12 edge and vertex intersections", () => {
      const segs = BENTLEY_OTTMANN_PRESETS.star_of_david.segments!;
      const result = computeBentleyOttmann(segs);

      expect(result.intersections.length).toBe(12);
    });
  });

  // ==========================================================================
  // 5. Closest Pair of Points (Divide and Conquer O(N log N))
  // ==========================================================================
  describe("5. Closest Pair of Points (Divide & Conquer)", () => {
    it("should compute closest pair via brute force", () => {
      const pts: Point2D[] = [
        { x: 0, y: 0, label: "A" },
        { x: 10, y: 10, label: "B" },
        { x: 3, y: 4, label: "C" },
        { x: 3, y: 5, label: "D" }, // Distance between C and D = 1
      ];

      const bf = computeClosestPairBruteForce(pts);
      expect(bf.distance).toBe(1);
      expect([bf.p1.label, bf.p2.label].sort()).toEqual(["C", "D"]);
    });

    it("should compute closest pair via Divide-and-Conquer matching Brute Force", () => {
      const pts = CLOSEST_PAIR_PRESETS.twin_near_neighbors.points!;
      const bf = computeClosestPairBruteForce(pts);
      const dc = computeClosestPairDC(pts);

      expect(dc.minDistance).toBeCloseTo(bf.distance, 4);
      expect(dc.steps.length).toBeGreaterThan(0);
    });

    it("should correctly find the strip-bridging closest pair across the midline", () => {
      const pts = CLOSEST_PAIR_PRESETS.strip_bridging_pair.points!;
      const bf = computeClosestPairBruteForce(pts);
      const dc = computeClosestPairDC(pts);

      expect(dc.minDistance).toBeCloseTo(bf.distance, 4);
      // Distance between Bridge-L (48, 50) and Bridge-R (52, 51) = sqrt(16 + 1) = sqrt(17) ≈ 4.123
      expect(dc.minDistance).toBeCloseTo(Math.sqrt((52 - 48) ** 2 + (51 - 50) ** 2), 4);
    });

    it("should handle edge cases in Closest Pair (< 2 points)", () => {
      const emptyRes = computeClosestPairDC([]);
      expect(emptyRes.minDistance).toBe(0);

      const oneRes = computeClosestPairDC([{ x: 1, y: 1 }]);
      expect(oneRes.minDistance).toBe(0);
    });
  });

  // ==========================================================================
  // 6. Point in Polygon (Ray Casting & Winding Number)
  // ==========================================================================
  describe("6. Point in Polygon: Ray Casting & Winding Number", () => {
    const hexagon = POINT_IN_POLYGON_PRESETS.regular_hexagon.polygon!;

    it("should classify interior point as inside hexagon", () => {
      const center: Point2D = { x: 50, y: 50 };
      const rayRes = computeRayCastingPIP(hexagon, center);
      const wnRes = computeWindingNumberPIP(hexagon, center);

      expect(rayRes.isInside).toBe(true);
      expect(rayRes.totalCrossings % 2).toBe(1);
      expect(wnRes.isInside).toBe(true);
      expect(wnRes.windingNumber).not.toBe(0);
    });

    it("should classify exterior point as outside hexagon", () => {
      const exterior: Point2D = { x: 95, y: 95 };
      const rayRes = computeRayCastingPIP(hexagon, exterior);
      const wnRes = computeWindingNumberPIP(hexagon, exterior);

      expect(rayRes.isInside).toBe(false);
      expect(rayRes.totalCrossings % 2).toBe(0);
      expect(wnRes.isInside).toBe(false);
      expect(wnRes.windingNumber).toBe(0);
    });

    it("should classify point in the concave pocket of C-shape as outside", () => {
      const cPoly = POINT_IN_POLYGON_PRESETS.c_shape_pocket.polygon!;
      const bayQuery = POINT_IN_POLYGON_PRESETS.c_shape_pocket.queryPoint!; // x=65, y=50

      const rayRes = computeRayCastingPIP(cPoly, bayQuery);
      const wnRes = computeWindingNumberPIP(cPoly, bayQuery);

      expect(rayRes.isInside).toBe(false);
      expect(rayRes.totalCrossings % 2).toBe(0);
      expect(wnRes.isInside).toBe(false);
      expect(wnRes.windingNumber).toBe(0);
    });

    it("should classify point on boundary as inside with isOnBoundary=true", () => {
      const boundaryPt: Point2D = { x: 50, y: 85 }; // Top vertex of hexagon
      const rayRes = computeRayCastingPIP(hexagon, boundaryPt);
      const wnRes = computeWindingNumberPIP(hexagon, boundaryPt);

      expect(rayRes.isOnBoundary).toBe(true);
      expect(rayRes.isInside).toBe(true);
      expect(wnRes.isOnBoundary).toBe(true);
    });

    it("should handle degenerate polygon (< 3 vertices)", () => {
      const rayRes = computeRayCastingPIP(
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        { x: 0.5, y: 0.5 },
      );
      expect(rayRes.isInside).toBe(false);

      const wnRes = computeWindingNumberPIP(
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        { x: 0.5, y: 0.5 },
      );
      expect(wnRes.isInside).toBe(false);
    });

    it("should agree on inside/outside verdict across all PIP presets", () => {
      for (const key of Object.keys(POINT_IN_POLYGON_PRESETS)) {
        const p = POINT_IN_POLYGON_PRESETS[key];
        const rayRes = computeRayCastingPIP(p.polygon!, p.queryPoint!);
        const wnRes = computeWindingNumberPIP(p.polygon!, p.queryPoint!);

        expect(rayRes.isInside).toBe(wnRes.isInside);
      }
    });
  });
});
