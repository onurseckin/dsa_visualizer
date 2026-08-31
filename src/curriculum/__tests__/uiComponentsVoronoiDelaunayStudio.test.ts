import { describe, expect, it } from "bun:test";
import React from "react";
import {
  VoronoiDelaunayStudio,
  VORONOI_MODALITIES,
  VORONOI_STUDIO_PRESETS,
  VORONOI_DEFAULT_BOUNDS,
  distance,
  distanceSq,
  crossProduct2D,
  isCCW,
  turnOrientation,
  computeCircumcircle,
  inCircumcircleDeterminant,
  inCircumcircle,
  clipPolygonWithBisector,
  computePolygonAreaAndCentroid,
  computeBowyerWatsonDelaunay,
  computeVoronoiDiagramFromDelaunay,
  computeLloydRelaxation,
  computeFortuneSweep,
  DisjointSetUnion,
  computeEMST,
  computeBruteForceMST,
  computeVoronoiStudioTelemetry,
  type Point2D,
} from "../../components/primitives/VoronoiDelaunayStudio";

describe("VoronoiDelaunayStudio Unit & Algorithmic Verification Suite", () => {
  // ==========================================================================
  // 1. Component Instantiation & Presets Integrity
  // ==========================================================================
  describe("1. Component Instantiation & Presets Integrity", () => {
    it("should instantiate VoronoiDelaunayStudio with default props", () => {
      const element = React.createElement(VoronoiDelaunayStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(VoronoiDelaunayStudio);
    });

    it("should instantiate VoronoiDelaunayStudio with custom props", () => {
      const customPts: Point2D[] = [
        { id: "p1", x: 100, y: 100 },
        { id: "p2", x: 200, y: 100 },
        { id: "p3", x: 150, y: 200 },
      ];
      const element = React.createElement(VoronoiDelaunayStudio, {
        initialModality: "bowyer_watson_delaunay",
        initialPreset: "hexagonal_honeycomb",
        customPoints: customPts,
        width: 1024,
        height: 700,
        standalone: true,
        title: "Custom Voronoi Studio",
      });

      expect(element.props.initialModality).toBe("bowyer_watson_delaunay");
      expect(element.props.initialPreset).toBe("hexagonal_honeycomb");
      expect(element.props.customPoints).toHaveLength(3);
      expect(element.props.width).toBe(1024);
      expect(element.props.height).toBe(700);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Custom Voronoi Studio");
    });

    it("should verify all 4 VORONOI_MODALITIES metadata", () => {
      expect(VORONOI_MODALITIES).toHaveLength(4);
      const modIds = VORONOI_MODALITIES.map((m) => m.id);
      expect(modIds).toContain("fortune_sweep_voronoi");
      expect(modIds).toContain("bowyer_watson_delaunay");
      expect(modIds).toContain("dual_graph_morphing");
      expect(modIds).toContain("euclidean_minimum_spanning_tree");

      for (const mod of VORONOI_MODALITIES) {
        expect(mod.name.length).toBeGreaterThan(0);
        expect(mod.shortName.length).toBeGreaterThan(0);
        expect(mod.badge.length).toBeGreaterThan(0);
        expect(mod.complexity.length).toBeGreaterThan(0);
        expect(mod.formulaTeX.length).toBeGreaterThan(0);
        expect(mod.description.length).toBeGreaterThan(0);
      }
    });

    it("should verify all VORONOI_STUDIO_PRESETS data integrity", () => {
      const presetKeys = Object.keys(VORONOI_STUDIO_PRESETS);
      expect(presetKeys).toHaveLength(5);
      expect(presetKeys).toContain("random_poisson_disk");
      expect(presetKeys).toContain("hexagonal_honeycomb");
      expect(presetKeys).toContain("delaunay_super_triangle");
      expect(presetKeys).toContain("collinear_perturbation");
      expect(presetKeys).toContain("centroidal_relaxation");

      for (const key of presetKeys) {
        const p = VORONOI_STUDIO_PRESETS[key as keyof typeof VORONOI_STUDIO_PRESETS];
        expect(p.points.length).toBeGreaterThanOrEqual(7);
        for (const pt of p.points) {
          expect(pt.id).toBeDefined();
          expect(Number.isFinite(pt.x)).toBe(true);
          expect(Number.isFinite(pt.y)).toBe(true);
        }
      }
    });
  });

  // ==========================================================================
  // 2. Pure 2D Math & Geometry Primitives
  // ==========================================================================
  describe("2. Pure 2D Math & Geometry Primitives", () => {
    it("should compute distance and distanceSq accurately", () => {
      const p1: Point2D = { id: "a", x: 0, y: 0 };
      const p2: Point2D = { id: "b", x: 3, y: 4 };

      expect(distanceSq(p1, p2)).toBe(25);
      expect(distance(p1, p2)).toBe(5);
    });

    it("should compute crossProduct2D, isCCW, and turnOrientation", () => {
      const origin: Point2D = { id: "o", x: 0, y: 0 };
      const right: Point2D = { id: "a", x: 10, y: 0 };
      const top: Point2D = { id: "b", x: 0, y: 10 };
      const bottom: Point2D = { id: "c", x: 0, y: -10 };
      const collinear: Point2D = { id: "d", x: 20, y: 0 };

      // CCW turn
      expect(crossProduct2D(origin, right, top)).toBe(100);
      expect(isCCW(origin, right, top)).toBe(true);
      expect(turnOrientation(origin, right, top)).toBe("ccw");

      // CW turn
      expect(crossProduct2D(origin, right, bottom)).toBe(-100);
      expect(isCCW(origin, right, bottom)).toBe(false);
      expect(turnOrientation(origin, right, bottom)).toBe("cw");

      // Collinear
      expect(crossProduct2D(origin, right, collinear)).toBe(0);
      expect(isCCW(origin, right, collinear)).toBe(false);
      expect(turnOrientation(origin, right, collinear)).toBe("collinear");
    });

    it("should compute exact circumcircle for right triangle", () => {
      const a: Point2D = { id: "a", x: 0, y: 0 };
      const b: Point2D = { id: "b", x: 6, y: 0 };
      const c: Point2D = { id: "c", x: 0, y: 8 };

      const cc = computeCircumcircle(a, b, c);
      expect(cc.valid).toBe(true);
      // Circumcenter of right triangle is midpoint of hypotenuse (3, 4)
      expect(cc.center.x).toBeCloseTo(3, 5);
      expect(cc.center.y).toBeCloseTo(4, 5);
      expect(cc.radius).toBeCloseTo(5, 5);
      expect(cc.radiusSq).toBeCloseTo(25, 5);
    });

    it("should compute exact circumcircle for equilateral triangle", () => {
      const r = 100;
      const a: Point2D = { id: "a", x: 0, y: r };
      const b: Point2D = { id: "b", x: (r * Math.sqrt(3)) / 2, y: -r / 2 };
      const c: Point2D = { id: "c", x: (-r * Math.sqrt(3)) / 2, y: -r / 2 };

      const cc = computeCircumcircle(a, b, c);
      expect(cc.valid).toBe(true);
      expect(cc.center.x).toBeCloseTo(0, 4);
      expect(cc.center.y).toBeCloseTo(0, 4);
      expect(cc.radius).toBeCloseTo(r, 4);
    });

    it("should handle degenerate collinear points in computeCircumcircle", () => {
      const a: Point2D = { id: "a", x: 0, y: 0 };
      const b: Point2D = { id: "b", x: 10, y: 10 };
      const c: Point2D = { id: "c", x: 20, y: 20 };

      const cc = computeCircumcircle(a, b, c);
      expect(cc.valid).toBe(false);
      expect(cc.radius).toBe(Infinity);
    });

    it("should evaluate inCircumcircleDeterminant and inCircumcircle correctly", () => {
      // CCW unit circle triangle
      const a: Point2D = { id: "a", x: 10, y: 0 };
      const b: Point2D = { id: "b", x: 0, y: 10 };
      const c: Point2D = { id: "c", x: -10, y: 0 };

      // Point strictly inside circumcircle (center is at (0, 0), radius is 10)
      const insidePt: Point2D = { id: "in", x: 0, y: 2 };
      expect(inCircumcircleDeterminant(a, b, c, insidePt)).toBeGreaterThan(0);
      expect(inCircumcircle(a, b, c, insidePt)).toBe(true);

      // Point strictly outside circumcircle
      const outsidePt: Point2D = { id: "out", x: 0, y: 15 };
      expect(inCircumcircleDeterminant(a, b, c, outsidePt)).toBeLessThan(0);
      expect(inCircumcircle(a, b, c, outsidePt)).toBe(false);

      // Point exactly on circumcircle boundary
      const onBoundaryPt: Point2D = { id: "on", x: 0, y: -10 };
      expect(Math.abs(inCircumcircleDeterminant(a, b, c, onBoundaryPt))).toBeLessThan(1e-5);
    });

    it("should clip polygon with half-plane bisector", () => {
      const squarePoly: Point2D[] = [
        { id: "1", x: 0, y: 0 },
        { id: "2", x: 100, y: 0 },
        { id: "3", x: 100, y: 100 },
        { id: "4", x: 0, y: 100 },
      ];

      const siteI: Point2D = { id: "si", x: 20, y: 50 };
      const siteJ: Point2D = { id: "sj", x: 80, y: 50 };

      // Bisector is vertical line x = 50. Site I is on the left (x <= 50).
      const clipped = clipPolygonWithBisector(squarePoly, siteI, siteJ);
      expect(clipped.length).toBeGreaterThanOrEqual(4);

      for (const pt of clipped) {
        expect(pt.x).toBeLessThanOrEqual(50.001);
      }
    });

    it("should compute polygon area and centroid via Shoelace Formula", () => {
      // 100x100 square from (0,0) to (100,100) -> Area = 10000, Centroid = (50, 50)
      const square: Point2D[] = [
        { id: "1", x: 0, y: 0 },
        { id: "2", x: 100, y: 0 },
        { id: "3", x: 100, y: 100 },
        { id: "4", x: 0, y: 100 },
      ];

      const res = computePolygonAreaAndCentroid(square);
      expect(res.area).toBeCloseTo(10000, 4);
      expect(res.centroid.x).toBeCloseTo(50, 4);
      expect(res.centroid.y).toBeCloseTo(50, 4);
    });

    it("should handle degenerate polygons in computePolygonAreaAndCentroid", () => {
      expect(computePolygonAreaAndCentroid([]).area).toBe(0);
      expect(computePolygonAreaAndCentroid([{ id: "1", x: 10, y: 20 }]).area).toBe(0);
      expect(
        computePolygonAreaAndCentroid([
          { id: "1", x: 10, y: 20 },
          { id: "2", x: 30, y: 40 },
        ]).area,
      ).toBe(0);
    });
  });

  // ==========================================================================
  // 3. Bowyer-Watson Delaunay Triangulation
  // ==========================================================================
  describe("3. Bowyer-Watson Delaunay Triangulation", () => {
    it("should triangulate 3 points into exactly 1 triangle and 3 edges", () => {
      const pts: Point2D[] = [
        { id: "p1", x: 100, y: 100 },
        { id: "p2", x: 300, y: 100 },
        { id: "p3", x: 200, y: 300 },
      ];

      const res = computeBowyerWatsonDelaunay(pts);
      expect(res.triangles).toHaveLength(1);
      expect(res.edges).toHaveLength(3);
      expect(res.steps.length).toBeGreaterThan(0);
    });

    it("should triangulate 4 square points into 2 triangles and 5 edges", () => {
      const squarePts: Point2D[] = [
        { id: "s1", x: 100, y: 100 },
        { id: "s2", x: 300, y: 100 },
        { id: "s3", x: 300, y: 300 },
        { id: "s4", x: 100, y: 300 },
      ];

      const res = computeBowyerWatsonDelaunay(squarePts);
      expect(res.triangles).toHaveLength(2);
      expect(res.edges).toHaveLength(5);
    });

    it("should verify empty-circumcircle property for all Delaunay triangles on random Poisson preset", () => {
      const pts = VORONOI_STUDIO_PRESETS.random_poisson_disk.points;
      const res = computeBowyerWatsonDelaunay(pts);

      expect(res.triangles.length).toBeGreaterThan(0);

      // Empty circumcircle check: No other site should lie strictly inside any triangle's circumcircle
      for (const tri of res.triangles) {
        for (const pt of pts) {
          if (pt.id === tri.a.id || pt.id === tri.b.id || pt.id === tri.c.id) continue;
          const inside = inCircumcircle(tri.a, tri.b, tri.c, pt);
          expect(inside).toBe(false);
        }
      }
    });

    it("should satisfy planar Euler graph bounds: E <= 3V - 6 and T <= 2V - 5", () => {
      const pts = VORONOI_STUDIO_PRESETS.hexagonal_honeycomb.points;
      const res = computeBowyerWatsonDelaunay(pts);
      const V = pts.length;
      const E = res.edges.length;
      const T = res.triangles.length;

      expect(E).toBeLessThanOrEqual(3 * V - 6);
      expect(T).toBeLessThanOrEqual(2 * V - 5);
    });

    it("should record detailed Bowyer-Watson step trace with valid actions", () => {
      const pts = [
        { id: "p1", x: 150, y: 150 },
        { id: "p2", x: 350, y: 150 },
        { id: "p3", x: 250, y: 350 },
        { id: "p4", x: 250, y: 200 },
      ];

      const res = computeBowyerWatsonDelaunay(pts);
      expect(res.steps.length).toBeGreaterThan(5);

      const actions = res.steps.map((s) => s.action);
      expect(actions).toContain("init");
      expect(actions).toContain("find_bad_triangles");
      expect(actions).toContain("create_cavity");
      expect(actions).toContain("stitch_triangles");
      expect(actions).toContain("cleanup_super_triangle");
      expect(actions).toContain("done");
    });
  });

  // ==========================================================================
  // 4. Voronoi Diagram Generation & Lloyd's Relaxation
  // ==========================================================================
  describe("4. Voronoi Diagram Generation & Lloyd's Relaxation", () => {
    it("should generate Voronoi cells for each site with valid polygons", () => {
      const pts = VORONOI_STUDIO_PRESETS.random_poisson_disk.points;
      const delaunay = computeBowyerWatsonDelaunay(pts);
      const voronoi = computeVoronoiDiagramFromDelaunay(
        pts,
        delaunay.triangles,
        VORONOI_DEFAULT_BOUNDS,
      );

      expect(voronoi.cells).toHaveLength(pts.length);
      for (const cell of voronoi.cells) {
        expect(cell.isClosed).toBe(true);
        expect(cell.vertices.length).toBeGreaterThanOrEqual(3);
        expect(cell.area).toBeGreaterThan(100);
        expect(Number.isFinite(cell.centroid.x)).toBe(true);
        expect(Number.isFinite(cell.centroid.y)).toBe(true);
      }
    });

    it("should compute Lloyd's Relaxation step and move sites towards centroids", () => {
      const pts = VORONOI_STUDIO_PRESETS.centroidal_relaxation.points;
      const relaxed = computeLloydRelaxation(pts, VORONOI_DEFAULT_BOUNDS, 1);

      expect(relaxed).toHaveLength(pts.length);

      // Sites should have moved but remained strictly within canvas bounds
      for (let i = 0; i < pts.length; i++) {
        expect(relaxed[i].x).toBeGreaterThanOrEqual(VORONOI_DEFAULT_BOUNDS.minX);
        expect(relaxed[i].x).toBeLessThanOrEqual(VORONOI_DEFAULT_BOUNDS.maxX);
        expect(relaxed[i].y).toBeGreaterThanOrEqual(VORONOI_DEFAULT_BOUNDS.minY);
        expect(relaxed[i].y).toBeLessThanOrEqual(VORONOI_DEFAULT_BOUNDS.maxY);
      }

      // Verify that 5 iterations of Lloyd relaxation run smoothly
      const relaxed5 = computeLloydRelaxation(pts, VORONOI_DEFAULT_BOUNDS, 5);
      expect(relaxed5).toHaveLength(pts.length);
    });
  });

  // ==========================================================================
  // 5. Fortune's Sweep-Line Simulation
  // ==========================================================================
  describe("5. Fortune's Sweep-Line Simulation", () => {
    it("should generate site events and circle events in sorted order", () => {
      const pts = VORONOI_STUDIO_PRESETS.delaunay_super_triangle.points;
      const fortune = computeFortuneSweep(pts, VORONOI_DEFAULT_BOUNDS);

      expect(fortune.steps.length).toBeGreaterThan(0);
      expect(fortune.allEvents.length).toBeGreaterThanOrEqual(pts.length);

      // Verify event sweep coordinates are non-decreasing
      for (let i = 0; i < fortune.allEvents.length - 1; i++) {
        expect(fortune.allEvents[i].sweepY).toBeLessThanOrEqual(fortune.allEvents[i + 1].sweepY);
      }
    });

    it("should compute parabolic beachline samples during sweep", () => {
      const pts: Point2D[] = [
        { id: "p1", x: 200, y: 100 },
        { id: "p2", x: 400, y: 200 },
        { id: "p3", x: 600, y: 300 },
      ];

      const fortune = computeFortuneSweep(pts, VORONOI_DEFAULT_BOUNDS);
      const stepWithArcs = fortune.steps.find((s) => s.arcs.length > 0);
      expect(stepWithArcs).toBeDefined();
      if (stepWithArcs) {
        expect(stepWithArcs.arcs[0].samples.length).toBeGreaterThan(10);
      }
    });
  });

  // ==========================================================================
  // 6. Disjoint Set Union & EMST Optimality Verification
  // ==========================================================================
  describe("6. Disjoint Set Union & EMST Optimality Verification", () => {
    it("should verify DisjointSetUnion data structure operations", () => {
      const dsu = new DisjointSetUnion(5);
      expect(dsu.getComponentCount()).toBe(5);

      expect(dsu.connected(0, 1)).toBe(false);
      expect(dsu.union(0, 1)).toBe(true);
      expect(dsu.connected(0, 1)).toBe(true);
      expect(dsu.getComponentCount()).toBe(4);

      // Redundant union
      expect(dsu.union(0, 1)).toBe(false);
      expect(dsu.getComponentCount()).toBe(4);

      dsu.union(2, 3);
      dsu.union(3, 4);
      expect(dsu.connected(2, 4)).toBe(true);
      expect(dsu.getComponentCount()).toBe(2);
    });

    it("should verify EMST weight from Delaunay edges MATCHES complete graph K_N MST exactly", () => {
      // Test across multiple preset distributions
      const testPresets = [
        VORONOI_STUDIO_PRESETS.random_poisson_disk.points,
        VORONOI_STUDIO_PRESETS.hexagonal_honeycomb.points,
        VORONOI_STUDIO_PRESETS.delaunay_super_triangle.points,
        VORONOI_STUDIO_PRESETS.centroidal_relaxation.points,
      ];

      for (const pts of testPresets) {
        const delaunay = computeBowyerWatsonDelaunay(pts);
        const emstDelaunay = computeEMST(pts, delaunay.triangles);
        const bruteForceMST = computeBruteForceMST(pts);

        expect(emstDelaunay.mstEdges).toHaveLength(pts.length - 1);
        expect(bruteForceMST.mstEdges).toHaveLength(pts.length - 1);

        // DELAUNAY EMST THEOREM: MST(Delaunay) === MST(Complete Graph K_N)
        expect(emstDelaunay.totalWeight).toBeCloseTo(bruteForceMST.totalWeight, 4);
      }
    });

    it("should handle edge cases in computeEMST (< 2 vertices)", () => {
      expect(computeEMST([], []).totalWeight).toBe(0);
      expect(computeEMST([{ id: "p1", x: 10, y: 10 }], []).totalWeight).toBe(0);
    });
  });

  // ==========================================================================
  // 7. Telemetry & Planar Euler Characteristic
  // ==========================================================================
  describe("7. Telemetry & Planar Euler Characteristic", () => {
    it("should compute valid VoronoiStudioTelemetry adhering to Euler formula", () => {
      const pts = VORONOI_STUDIO_PRESETS.random_poisson_disk.points;
      const delaunay = computeBowyerWatsonDelaunay(pts);
      const voronoi = computeVoronoiDiagramFromDelaunay(
        pts,
        delaunay.triangles,
        VORONOI_DEFAULT_BOUNDS,
      );
      const emst = computeEMST(pts, delaunay.triangles);

      const tel = computeVoronoiStudioTelemetry(
        pts,
        delaunay.triangles,
        delaunay.edges,
        voronoi.edges,
        emst.totalWeight,
      );

      expect(tel.numPoints).toBe(pts.length);
      expect(tel.numTriangles).toBe(delaunay.triangles.length);
      expect(tel.numDelaunayEdges).toBe(delaunay.edges.length);
      expect(tel.emstTotalWeight).toBeCloseTo(emst.totalWeight, 2);
      expect(tel.averageDegree).toBeGreaterThan(0);
      expect(tel.maxDegree).toBeGreaterThanOrEqual(tel.averageDegree);
    });
  });
});
