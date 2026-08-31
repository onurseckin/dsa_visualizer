import { describe, expect, it } from "bun:test";
import React from "react";
import {
  SpatialIndexBVHStudio,
  euclideanDistance2D,
  euclideanDistanceSquared2D,
  aabbUnion,
  aabbFromPoints,
  aabbArea,
  aabbHalfArea,
  aabbIntersection,
  aabbIntersectBox,
  pointToAABBDistanceMin,
  pointToAABBDistanceMax,
  rayAABBIntersect,
  rayCircleIntersect,
  raySegmentIntersect,
  buildKDTree2D,
  collectKDTreeLines,
  generateKDSplitSteps,
  getKDTreeDepth,
  countKDTreeNodes,
  findKNearestNeighbors,
  pickSeeds,
  pickNext,
  quadraticSplit,
  buildRTree2D,
  queryRTreeRange,
  generateRTreeRangeQuerySteps,
  computeSAHCost,
  buildBVHWithSAH,
  traverseBVHRay,
  generateBVHRaySteps,
  SPATIAL_INDEX_MODALITIES,
  KD_TREE_PRESETS,
  KNN_QUERY_PRESETS,
  RTREE_PRESETS,
  BVH_SAH_PRESETS,
  SPATIAL_INDEX_PRESETS,
  SpatialPoint2D,
  SpatialAABB,
  Ray2D,
  RTreeEntry,
  BVHPrimitive,
} from "../../components/primitives/SpatialIndexBVHStudio";

describe("SpatialIndexBVHStudio Unit & Algorithmic Verification Tests", () => {
  // ==========================================================================
  // 1. Component Instantiation & Presets Integrity
  // ==========================================================================
  describe("1. Component Instantiation & Presets Integrity", () => {
    it("should instantiate SpatialIndexBVHStudio with default props", () => {
      const element = React.createElement(SpatialIndexBVHStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(SpatialIndexBVHStudio);
    });

    it("should instantiate SpatialIndexBVHStudio with custom props", () => {
      const element = React.createElement(SpatialIndexBVHStudio, {
        initialModality: "bvh_sah_ray_traversal",
        initialPreset: "asteroid_field",
        width: 1200,
        height: 800,
        standalone: true,
        title: "Advanced Spatial Indexing Studio",
      });

      expect(element.props.initialModality).toBe("bvh_sah_ray_traversal");
      expect(element.props.initialPreset).toBe("asteroid_field");
      expect(element.props.width).toBe(1200);
      expect(element.props.height).toBe(800);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Advanced Spatial Indexing Studio");
    });

    it("should verify SPATIAL_INDEX_MODALITIES contains all 4 modalities with valid metadata", () => {
      expect(SPATIAL_INDEX_MODALITIES.length).toBe(4);
      const modIds = SPATIAL_INDEX_MODALITIES.map((m) => m.id);
      expect(modIds).toContain("kd_tree_spatial_split");
      expect(modIds).toContain("knn_nearest_neighbor");
      expect(modIds).toContain("rtree_bounding_box");
      expect(modIds).toContain("bvh_sah_ray_traversal");

      for (const m of SPATIAL_INDEX_MODALITIES) {
        expect(m.name.length).toBeGreaterThan(0);
        expect(m.shortName.length).toBeGreaterThan(0);
        expect(m.badge.length).toBeGreaterThan(0);
        expect(m.formulaTeX.length).toBeGreaterThan(0);
        expect(m.description.length).toBeGreaterThan(0);
      }
    });

    it("should verify KD_TREE_PRESETS data integrity", () => {
      for (const key of Object.keys(KD_TREE_PRESETS)) {
        const p = KD_TREE_PRESETS[key];
        expect(p.points).toBeDefined();
        expect(p.points!.length).toBeGreaterThanOrEqual(4);
        expect(p.modality).toBe("kd_tree_spatial_split");
      }
    });

    it("should verify KNN_QUERY_PRESETS data integrity", () => {
      for (const key of Object.keys(KNN_QUERY_PRESETS)) {
        const p = KNN_QUERY_PRESETS[key];
        expect(p.points).toBeDefined();
        expect(p.queryPoint).toBeDefined();
        expect(p.k).toBeDefined();
        expect(p.k!).toBeGreaterThanOrEqual(1);
        expect(p.modality).toBe("knn_nearest_neighbor");
      }
    });

    it("should verify RTREE_PRESETS data integrity", () => {
      for (const key of Object.keys(RTREE_PRESETS)) {
        const p = RTREE_PRESETS[key];
        expect(p.rtreeEntries).toBeDefined();
        expect(p.rtreeEntries!.length).toBeGreaterThanOrEqual(4);
        expect(p.searchRange).toBeDefined();
        expect(p.modality).toBe("rtree_bounding_box");
      }
    });

    it("should verify BVH_SAH_PRESETS data integrity", () => {
      for (const key of Object.keys(BVH_SAH_PRESETS)) {
        const p = BVH_SAH_PRESETS[key];
        expect(p.bvhPrimitives).toBeDefined();
        expect(p.bvhPrimitives!.length).toBeGreaterThanOrEqual(3);
        expect(p.ray).toBeDefined();
        expect(p.modality).toBe("bvh_sah_ray_traversal");
      }
    });

    it("should verify SPATIAL_INDEX_PRESETS aggregates all preset categories", () => {
      const allKeys = Object.keys(SPATIAL_INDEX_PRESETS);
      expect(allKeys.length).toBe(
        Object.keys(KD_TREE_PRESETS).length +
          Object.keys(KNN_QUERY_PRESETS).length +
          Object.keys(RTREE_PRESETS).length +
          Object.keys(BVH_SAH_PRESETS).length,
      );
    });
  });

  // ==========================================================================
  // 2. Pure 2D Math Primitives & Utilities
  // ==========================================================================
  describe("2. Pure 2D Math Primitives & Utilities", () => {
    it("should compute euclideanDistance2D and euclideanDistanceSquared2D correctly", () => {
      const p1: SpatialPoint2D = { id: "a", x: 0, y: 0 };
      const p2: SpatialPoint2D = { id: "b", x: 3, y: 4 };

      expect(euclideanDistance2D(p1, p2)).toBe(5);
      expect(euclideanDistanceSquared2D(p1, p2)).toBe(25);

      const p3: SpatialPoint2D = { id: "c", x: 10, y: 20 };
      const p4: SpatialPoint2D = { id: "d", x: 10, y: 20 };
      expect(euclideanDistance2D(p3, p4)).toBe(0);
    });

    it("should compute aabbUnion correctly", () => {
      const box1: SpatialAABB = { minX: 10, minY: 15, maxX: 30, maxY: 40 };
      const box2: SpatialAABB = { minX: 25, minY: 5, maxX: 50, maxY: 35 };

      const union = aabbUnion(box1, box2);
      expect(union.minX).toBe(10);
      expect(union.minY).toBe(5);
      expect(union.maxX).toBe(50);
      expect(union.maxY).toBe(40);
    });

    it("should compute aabbFromPoints accurately", () => {
      const points: SpatialPoint2D[] = [
        { id: "1", x: 5, y: 15 },
        { id: "2", x: 25, y: 5 },
        { id: "3", x: 12, y: 45 },
      ];

      const bounds = aabbFromPoints(points, 2);
      expect(bounds.minX).toBe(3);
      expect(bounds.minY).toBe(3);
      expect(bounds.maxX).toBe(27);
      expect(bounds.maxY).toBe(47);
    });

    it("should compute aabbArea and aabbHalfArea (perimeter/2)", () => {
      const box: SpatialAABB = { minX: 10, minY: 20, maxX: 30, maxY: 50 };
      // width = 20, height = 30
      expect(aabbArea(box)).toBe(600);
      expect(aabbHalfArea(box)).toBe(50);
    });

    it("should check aabbIntersection for overlapping and disjoint boxes", () => {
      const b1: SpatialAABB = { minX: 10, minY: 10, maxX: 30, maxY: 30 };
      const b2: SpatialAABB = { minX: 20, minY: 20, maxX: 40, maxY: 40 };
      const b3: SpatialAABB = { minX: 35, minY: 35, maxX: 50, maxY: 50 };

      expect(aabbIntersection(b1, b2)).toBe(true);
      expect(aabbIntersection(b1, b3)).toBe(false);
      expect(aabbIntersection(b2, b3)).toBe(true);
    });

    it("should compute aabbIntersectBox returning intersection rect or null", () => {
      const b1: SpatialAABB = { minX: 10, minY: 10, maxX: 30, maxY: 30 };
      const b2: SpatialAABB = { minX: 20, minY: 15, maxX: 40, maxY: 35 };
      const b3: SpatialAABB = { minX: 50, minY: 50, maxX: 60, maxY: 60 };

      const inter = aabbIntersectBox(b1, b2);
      expect(inter).not.toBeNull();
      expect(inter!.minX).toBe(20);
      expect(inter!.minY).toBe(15);
      expect(inter!.maxX).toBe(30);
      expect(inter!.maxY).toBe(30);

      expect(aabbIntersectBox(b1, b3)).toBeNull();
    });

    it("should compute pointToAABBDistanceMin (interior = 0, exterior = distance)", () => {
      const box: SpatialAABB = { minX: 10, minY: 10, maxX: 30, maxY: 30 };

      // Inside point
      expect(pointToAABBDistanceMin({ id: "p1", x: 20, y: 20 }, box)).toBe(0);
      // Edge point
      expect(pointToAABBDistanceMin({ id: "p2", x: 10, y: 25 }, box)).toBe(0);
      // Outside straight left
      expect(pointToAABBDistanceMin({ id: "p3", x: 6, y: 20 }, box)).toBe(4);
      // Outside diagonal
      expect(pointToAABBDistanceMin({ id: "p4", x: 6, y: 6 }, box)).toBe(Math.hypot(4, 4));
    });

    it("should compute pointToAABBDistanceMax (distance to furthest corner)", () => {
      const box: SpatialAABB = { minX: 10, minY: 10, maxX: 30, maxY: 30 };
      // Center point (20, 20) -> all corners at dist sqrt(10^2 + 10^2) = 14.142
      const dMax = pointToAABBDistanceMax({ id: "p", x: 20, y: 20 }, box);
      expect(dMax).toBeCloseTo(Math.hypot(10, 10), 4);
    });
  });

  // ==========================================================================
  // 3. Modality 1: KD-Tree Spatial Split
  // ==========================================================================
  describe("3. Modality 1: KD-Tree Spatial Split", () => {
    it("should return null for empty point list", () => {
      const tree = buildKDTree2D([]);
      expect(tree).toBeNull();
    });

    it("should build single-node leaf KD-Tree for 1 point", () => {
      const pt: SpatialPoint2D = { id: "p1", x: 25, y: 35, label: "P1" };
      const tree = buildKDTree2D([pt]);

      expect(tree).not.toBeNull();
      expect(tree!.point.id).toBe("p1");
      expect(tree!.isLeaf).toBe(true);
      expect(tree!.depth).toBe(0);
      expect(tree!.axis).toBe("x");
      expect(tree!.left).toBeNull();
      expect(tree!.right).toBeNull();
    });

    it("should alternate split axes (x at depth 0, y at depth 1, x at depth 2)", () => {
      const pts: SpatialPoint2D[] = [
        { id: "1", x: 10, y: 50 },
        { id: "2", x: 20, y: 20 },
        { id: "3", x: 30, y: 80 },
        { id: "4", x: 40, y: 40 },
        { id: "5", x: 50, y: 60 },
        { id: "6", x: 60, y: 10 },
        { id: "7", x: 70, y: 90 },
      ];

      const tree = buildKDTree2D(pts);
      expect(tree).not.toBeNull();
      expect(tree!.axis).toBe("x");

      if (tree!.left) {
        expect(tree!.left.axis).toBe("y");
        expect(tree!.left.depth).toBe(1);
        if (tree!.left.left) {
          expect(tree!.left.left.axis).toBe("x");
          expect(tree!.left.left.depth).toBe(2);
        }
      }

      if (tree!.right) {
        expect(tree!.right.axis).toBe("y");
        expect(tree!.right.depth).toBe(1);
      }
    });

    it("should compute partition lines and tree dimensions", () => {
      const pts = KD_TREE_PRESETS.uniform_grid.points!;
      const tree = buildKDTree2D(pts);

      expect(tree).not.toBeNull();
      const lines = collectKDTreeLines(tree);
      expect(lines.length).toBe(16);

      const depth = getKDTreeDepth(tree);
      expect(depth).toBeGreaterThanOrEqual(4);

      const count = countKDTreeNodes(tree);
      expect(count).toBe(16);
    });

    it("should generate step trace for KD split construction", () => {
      const pts: SpatialPoint2D[] = [
        { id: "a", x: 10, y: 20 },
        { id: "b", x: 30, y: 40 },
        { id: "c", x: 50, y: 60 },
      ];

      const steps = generateKDSplitSteps(pts);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps[0].phase).toBe("Initialization");
      expect(steps[steps.length - 1].phase).toBe("KD-Tree Complete");
    });
  });

  // ==========================================================================
  // 4. Modality 2: k-NN Query & Branch Pruning
  // ==========================================================================
  describe("4. Modality 2: k-NN Query & Branch Pruning", () => {
    it("should find exact nearest neighbor (k=1) matching brute force", () => {
      const points = KD_TREE_PRESETS.uniform_grid.points!;
      const tree = buildKDTree2D(points);
      const query: SpatialPoint2D = { id: "q", x: 22, y: 21 };

      const knn = findKNearestNeighbors(tree, query, 1);
      expect(knn.neighbors.length).toBe(1);
      expect(knn.neighbors[0].point.id).toBe("p1"); // (20, 20)
      expect(knn.neighbors[0].distance).toBeCloseTo(Math.hypot(2, 1), 4);
    });

    it("should find exact k-nearest neighbors matching brute force for k=3", () => {
      const points = KD_TREE_PRESETS.gaussian_clusters.points!;
      const tree = buildKDTree2D(points);
      const query: SpatialPoint2D = { id: "q", x: 26, y: 27 };

      const knn = findKNearestNeighbors(tree, query, 3);
      expect(knn.neighbors.length).toBe(3);

      // Brute force calculation
      const sortedByDist = [...points]
        .map((p) => ({ point: p, dist: euclideanDistance2D(query, p) }))
        .sort((a, b) => a.dist - b.dist);

      for (let i = 0; i < 3; i++) {
        expect(knn.neighbors[i].point.id).toBe(sortedByDist[i].point.id);
        expect(knn.neighbors[i].distance).toBeCloseTo(sortedByDist[i].dist, 4);
      }
    });

    it("should correctly prune subtrees during k-NN search", () => {
      const points = KD_TREE_PRESETS.uniform_grid.points!;
      const tree = buildKDTree2D(points);
      const query: SpatialPoint2D = { id: "q", x: 5, y: 5 }; // Extreme corner

      const knn = findKNearestNeighbors(tree, query, 2);
      expect(knn.prunedSubtreesCount).toBeGreaterThan(0);
      expect(knn.visitedNodesCount).toBeLessThan(points.length);
    });

    it("should generate complete step trace for k-NN search", () => {
      const points = KD_TREE_PRESETS.gaussian_clusters.points!;
      const tree = buildKDTree2D(points);
      const query = KNN_QUERY_PRESETS.dense_cluster_probe.queryPoint!;

      const knn = findKNearestNeighbors(tree, query, 3);
      expect(knn.steps.length).toBeGreaterThan(0);

      const hasEvaluate = knn.steps.some((s) => s.action === "evaluate_point");
      const hasComplete = knn.steps.some((s) => s.action === "complete");
      expect(hasEvaluate).toBe(true);
      expect(hasComplete).toBe(true);
    });
  });

  // ==========================================================================
  // 5. Modality 3: R-Tree MBR & Quadratic Split
  // ==========================================================================
  describe("5. Modality 3: R-Tree MBR & Quadratic Split", () => {
    it("should pick seeds that maximize wasted area", () => {
      const entries: RTreeEntry[] = [
        { id: "e1", label: "E1", bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 } },
        { id: "e2", label: "E2", bounds: { minX: 80, minY: 80, maxX: 90, maxY: 90 } },
        { id: "e3", label: "E3", bounds: { minX: 2, minY: 2, maxX: 8, maxY: 8 } },
      ];

      const [s1, s2] = pickSeeds(entries);
      // e1 (0,0..10,10) and e2 (80,80..90,90) waste the most area
      expect((s1 === 0 && s2 === 1) || (s1 === 1 && s2 === 0)).toBe(true);
    });

    it("should execute pickNext and group assignment correctly", () => {
      const g1: RTreeEntry[] = [
        { id: "1", label: "G1", bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 } },
      ];
      const g2: RTreeEntry[] = [
        { id: "2", label: "G2", bounds: { minX: 80, minY: 80, maxX: 90, maxY: 90 } },
      ];
      const remaining: RTreeEntry[] = [
        { id: "3", label: "R", bounds: { minX: 1, minY: 1, maxX: 5, maxY: 5 } },
      ];

      const next = pickNext(remaining, g1, g2);
      expect(next.index).toBe(0);
      expect(next.group).toBe(1); // Closer to g1
    });

    it("should perform quadraticSplit partitioning entries into two groups", () => {
      const entries = RTREE_PRESETS.city_parcels.rtreeEntries!;
      const split = quadraticSplit(entries, 2);

      expect(split.group1.length).toBeGreaterThanOrEqual(2);
      expect(split.group2.length).toBeGreaterThanOrEqual(2);
      expect(split.group1.length + split.group2.length).toBe(entries.length);
    });

    it("should build hierarchical R-Tree structure", () => {
      const entries = RTREE_PRESETS.hierarchical_districts.rtreeEntries!;
      const rtree = buildRTree2D(entries, 4, 2);

      expect(rtree).not.toBeNull();
      expect(rtree!.isLeaf).toBe(false);
      expect(rtree!.children).toBeDefined();
      expect(rtree!.children!.length).toBeGreaterThanOrEqual(2);
    });

    it("should execute queryRTreeRange accurately retrieving overlapping items", () => {
      const entries = RTREE_PRESETS.city_parcels.rtreeEntries!;
      const rtree = buildRTree2D(entries, 4, 2);
      const window: SpatialAABB = { minX: 20, minY: 20, maxX: 60, maxY: 70 };

      const res = queryRTreeRange(rtree, window);

      // Verify each matched item really intersects search window
      for (const m of res.matchedEntries) {
        expect(aabbIntersection(m.bounds, window)).toBe(true);
      }

      // Verify no missed items
      const expectedMatches = entries.filter((e) => aabbIntersection(e.bounds, window));
      expect(res.matchedEntries.length).toBe(expectedMatches.length);

      const trace = generateRTreeRangeQuerySteps(rtree, window);
      expect(trace.length).toBe(res.steps.length);
    });
  });

  // ==========================================================================
  // 6. Modality 4: BVH SAH Ray Cast Traversal
  // ==========================================================================
  describe("6. Modality 4: BVH SAH Ray Cast Traversal", () => {
    it("should compute SAH split cost correctly", () => {
      const p1: BVHPrimitive[] = [
        {
          id: "1",
          type: "box",
          label: "B1",
          color: "#fff",
          bounds: { minX: 10, minY: 10, maxX: 20, maxY: 20 },
        },
      ];
      const p2: BVHPrimitive[] = [
        {
          id: "2",
          type: "box",
          label: "B2",
          color: "#fff",
          bounds: { minX: 80, minY: 80, maxX: 90, maxY: 90 },
        },
      ];
      const parentBounds: SpatialAABB = { minX: 10, minY: 10, maxX: 90, maxY: 90 };

      const cost = computeSAHCost(p1, p2, parentBounds, 1.0, 1.0);
      expect(Number.isFinite(cost)).toBe(true);
      expect(cost).toBeGreaterThan(1.0);
    });

    it("should build BVH hierarchy with SAH", () => {
      const prims = BVH_SAH_PRESETS.asteroid_field.bvhPrimitives!;
      const bvh = buildBVHWithSAH(prims, { maxPrimsPerLeaf: 2 });

      expect(bvh).not.toBeNull();
      expect(bvh!.primitiveCount).toBe(prims.length);
      expect(bvh!.isLeaf).toBe(false);
      expect(bvh!.left).not.toBeNull();
      expect(bvh!.right).not.toBeNull();
    });

    it("should test Ray-AABB slab intersection accurately (hit and miss)", () => {
      const box: SpatialAABB = { minX: 20, minY: 20, maxX: 40, maxY: 40 };

      // Ray through center
      const hitRay: Ray2D = {
        origin: { id: "ro", x: 0, y: 30 },
        direction: { x: 1, y: 0 },
      };
      const hitRes = rayAABBIntersect(hitRay, box);
      expect(hitRes.hit).toBe(true);
      expect(hitRes.tNear).toBe(20);
      expect(hitRes.tFar).toBe(40);

      // Ray missing box
      const missRay: Ray2D = {
        origin: { id: "ro", x: 0, y: 50 },
        direction: { x: 1, y: 0 },
      };
      const missRes = rayAABBIntersect(missRay, box);
      expect(missRes.hit).toBe(false);
    });

    it("should test rayCircleIntersect accurately", () => {
      const ray: Ray2D = {
        origin: { id: "ro", x: 0, y: 50 },
        direction: { x: 1, y: 0 },
      };
      const hit = rayCircleIntersect(ray, 50, 50, 10);
      expect(hit.hit).toBe(true);
      expect(hit.t).toBeCloseTo(40, 4);
      expect(hit.point!.x).toBeCloseTo(40, 4);
      expect(hit.point!.y).toBeCloseTo(50, 4);
    });

    it("should test raySegmentIntersect accurately", () => {
      const ray: Ray2D = {
        origin: { id: "ro", x: 0, y: 50 },
        direction: { x: 1, y: 0 },
      };
      const p1 = { id: "p1", x: 30, y: 40 };
      const p2 = { id: "p2", x: 30, y: 60 };

      const hit = raySegmentIntersect(ray, p1, p2);
      expect(hit.hit).toBe(true);
      expect(hit.t).toBeCloseTo(30, 4);
      expect(hit.point!.x).toBe(30);
      expect(hit.point!.y).toBe(50);
    });

    it("should traverse BVH with ray and report closest hit on Cornell Box Scene", () => {
      const prims = BVH_SAH_PRESETS.raytracing_cornell_box.bvhPrimitives!;
      const ray = BVH_SAH_PRESETS.raytracing_cornell_box.ray!;
      const bvh = buildBVHWithSAH(prims, { maxPrimsPerLeaf: 2 });

      const res = traverseBVHRay(bvh, ray);
      expect(res.hit).not.toBeNull();
      expect(res.hit!.hit).toBe(true);
      expect(res.steps.length).toBeGreaterThan(0);

      const stepTrace = generateBVHRaySteps(bvh, ray);
      expect(stepTrace.length).toBe(res.steps.length);
    });

    it("should occlude farther primitives and prune subvolumes in Occlusion Tunnel", () => {
      const prims = BVH_SAH_PRESETS.occlusion_corridor.bvhPrimitives!;
      const ray = BVH_SAH_PRESETS.occlusion_corridor.ray!;
      const bvh = buildBVHWithSAH(prims, { maxPrimsPerLeaf: 1 });

      const res = traverseBVHRay(bvh, ray);
      expect(res.hit).not.toBeNull();
      // Should hit Front Shield first
      expect(res.hit!.primitiveId).toBe("occ_front");
    });
  });
});
