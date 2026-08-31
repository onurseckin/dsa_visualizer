import { describe, expect, it } from "bun:test";
import React from "react";
import {
  DPTreeDecompositionStudio,
  DP_TREE_MODALITIES,
  DP_TREE_PRESETS,
  TREE_DIAMETER_PRESETS,
  HLD_PRESETS,
  LCA_PRESETS,
  CHT_PRESETS,
  buildTreeFromEdges,
  computeTwoDFS,
  computeTreeDiameterDP,
  computeHLD,
  queryHLDPath,
  buildBinaryLiftingTable,
  queryLCA,
  computeLineIntersection,
  buildConvexHullTrick,
  queryCHT,
  computeTreeLayout,
} from "../../components/primitives/DPTreeDecompositionStudio";

describe("DPTreeDecompositionStudio Unit & Algorithmic Verification Tests", () => {
  // ==========================================================================
  // 1. Component Instantiation & Presets Verification
  // ==========================================================================
  describe("1. Component Instantiation & Presets Integrity", () => {
    it("should instantiate DPTreeDecompositionStudio with default props", () => {
      const element = React.createElement(DPTreeDecompositionStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(DPTreeDecompositionStudio);
    });

    it("should instantiate DPTreeDecompositionStudio with custom modality and presets", () => {
      const element = React.createElement(DPTreeDecompositionStudio, {
        initialModality: "heavy_light_decomposition",
        initialPreset: "deep_chain_tree",
        width: 1100,
        height: 650,
        standalone: true,
        title: "Advanced Heavy-Light Decomposition Visualizer",
      });

      expect(element.props.initialModality).toBe("heavy_light_decomposition");
      expect(element.props.initialPreset).toBe("deep_chain_tree");
      expect(element.props.width).toBe(1100);
      expect(element.props.height).toBe(650);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Advanced Heavy-Light Decomposition Visualizer");
    });

    it("should verify DP_TREE_MODALITIES contains all 4 modalities with valid metadata", () => {
      expect(DP_TREE_MODALITIES.length).toBe(4);
      const modIds = DP_TREE_MODALITIES.map((m) => m.id);
      expect(modIds).toContain("tree_diameter_dp");
      expect(modIds).toContain("heavy_light_decomposition");
      expect(modIds).toContain("lca_binary_lifting");
      expect(modIds).toContain("convex_hull_trick_dp");

      for (const m of DP_TREE_MODALITIES) {
        expect(m.name.length).toBeGreaterThan(0);
        expect(m.shortName.length).toBeGreaterThan(0);
        expect(m.badge.length).toBeGreaterThan(0);
        expect(m.formulaTeX.length).toBeGreaterThan(0);
      }
    });

    it("should provide valid tree structures for all diameter presets", () => {
      for (const key of Object.keys(TREE_DIAMETER_PRESETS)) {
        const p = TREE_DIAMETER_PRESETS[key];
        expect(p.tree).toBeDefined();
        expect(p.tree!.nodes.length).toBeGreaterThan(0);
        expect(p.tree!.root).toBe(0);
      }
    });

    it("should provide valid structures for all HLD presets", () => {
      for (const key of Object.keys(HLD_PRESETS)) {
        const p = HLD_PRESETS[key];
        expect(p.tree).toBeDefined();
        expect(p.tree!.nodes.length).toBeGreaterThan(0);
        expect(p.defaultU).toBeDefined();
        expect(p.defaultV).toBeDefined();
      }
    });

    it("should provide valid structures for all LCA presets", () => {
      for (const key of Object.keys(LCA_PRESETS)) {
        const p = LCA_PRESETS[key];
        expect(p.tree).toBeDefined();
        expect(p.tree!.nodes.length).toBeGreaterThan(0);
        expect(p.defaultU).toBeDefined();
        expect(p.defaultV).toBeDefined();
      }
    });

    it("should provide valid line sets for all CHT presets", () => {
      for (const key of Object.keys(CHT_PRESETS)) {
        const p = CHT_PRESETS[key];
        expect(p.lines).toBeDefined();
        expect(p.lines!.length).toBeGreaterThan(0);
        expect(p.mode).toBeDefined();
        expect(p.defaultX).toBeDefined();
      }
    });

    it("should verify DP_TREE_PRESETS aggregates all presets across modalities", () => {
      const allKeys = Object.keys(DP_TREE_PRESETS);
      expect(allKeys.length).toBe(
        Object.keys(TREE_DIAMETER_PRESETS).length +
          Object.keys(HLD_PRESETS).length +
          Object.keys(LCA_PRESETS).length +
          Object.keys(CHT_PRESETS).length,
      );
      for (const key of allKeys) {
        expect(DP_TREE_PRESETS[key]).toBeDefined();
        expect(DP_TREE_PRESETS[key].id).toBe(key);
      }
    });
  });

  // ==========================================================================
  // 2. Tree Diameter DP vs 2-DFS Equivalence
  // ==========================================================================
  describe("2. Tree Diameter DP vs 2-DFS Equivalence", () => {
    it("should compute identical diameter for balanced binary tree (15 nodes)", () => {
      const tree = TREE_DIAMETER_PRESETS.balanced_binary.tree!;
      const dpRes = computeTreeDiameterDP(tree);
      const dfsRes = computeTwoDFS(tree, 0);

      // In a 15-node complete binary tree of depth 3, diameter is 6 (from leaf in left subtree to leaf in right subtree)
      expect(dpRes.diameter).toBe(6);
      expect(dfsRes.diameter).toBe(6);
      expect(dpRes.diameter).toBe(dfsRes.diameter);
      expect(dpRes.path.length).toBe(7); // 6 edges = 7 nodes
      expect(dfsRes.pathAtoB.length).toBe(7);
    });

    it("should compute identical diameter for skewed spine tree", () => {
      const tree = TREE_DIAMETER_PRESETS.deep_skewed.tree!;
      const dpRes = computeTreeDiameterDP(tree);
      const dfsRes = computeTwoDFS(tree, 0);

      expect(dpRes.diameter).toBe(dfsRes.diameter);
      expect(dpRes.diameter).toBeGreaterThan(0);
    });

    it("should compute identical diameter for caterpillar star tree regardless of 2-DFS start node", () => {
      const tree = TREE_DIAMETER_PRESETS.caterpillar_star.tree!;
      const dpRes = computeTreeDiameterDP(tree);

      // Test 2-DFS starting from various arbitrary nodes (0, 3, 5, 11)
      for (const start of [0, 3, 5, 11]) {
        const dfsRes = computeTwoDFS(tree, start);
        expect(dfsRes.diameter).toBe(dpRes.diameter);
      }
    });

    it("should verify branch heights h1, h2 and local diameter in Bottom-Up DP", () => {
      const tree = TREE_DIAMETER_PRESETS.balanced_binary.tree!;
      const dp = computeTreeDiameterDP(tree);

      // Leaves (7, 8, 9, 10, 11, 12, 13, 14) have h1 = 0, h2 = 0
      for (const leaf of [7, 8, 9, 10, 11, 12, 13, 14]) {
        expect(dp.deepestBranch[leaf]).toBe(0);
        expect(dp.secondDeepestBranch[leaf]).toBe(0);
      }

      // Root (node 0) has children [1, 2] which each have depth 2 below them -> h1(0) = 3, h2(0) = 3
      expect(dp.deepestBranch[0]).toBe(3);
      expect(dp.secondDeepestBranch[0]).toBe(3);
      expect(dp.subtreeDiameter[0]).toBe(6);
    });

    it("should handle single node tree edge case", () => {
      const singleNodeTree = buildTreeFromEdges(1, [], 0);
      const dp = computeTreeDiameterDP(singleNodeTree);
      const dfs = computeTwoDFS(singleNodeTree, 0);

      expect(dp.diameter).toBe(0);
      expect(dfs.diameter).toBe(0);
      expect(dp.path).toEqual([0]);
      expect(dfs.pathAtoB).toEqual([0]);
    });
  });

  // ==========================================================================
  // 3. Heavy-Light Decomposition (HLD) Algorithm Tests
  // ==========================================================================
  describe("3. Heavy-Light Decomposition (HLD) Computations", () => {
    it("should compute correct subtree sizes for standard tree (16 nodes)", () => {
      const tree = HLD_PRESETS.standard_tree_16.tree!;
      const hld = computeHLD(tree);

      // Total size at root must be 16
      expect(hld.subtreeSizes[0]).toBe(16);

      // Check subtree size conservation: sz[u] = 1 + sum(sz[children])
      for (const node of tree.nodes) {
        let expectedSz = 1;
        for (const c of node.children) {
          expectedSz += hld.subtreeSizes[c];
        }
        expect(hld.subtreeSizes[node.id]).toBe(expectedSz);
      }
    });

    it("should identify heavy children maximizing subtree size", () => {
      const tree = HLD_PRESETS.standard_tree_16.tree!;
      const hld = computeHLD(tree);

      for (const node of tree.nodes) {
        if (node.children.length === 0) {
          expect(hld.heavyChild[node.id]).toBeNull();
        } else {
          const heavy = hld.heavyChild[node.id];
          expect(heavy).not.toBeNull();
          const maxSz = Math.max(...node.children.map((c) => hld.subtreeSizes[c]));
          expect(hld.subtreeSizes[heavy!]).toBe(maxSz);
        }
      }
    });

    it("should ensure heavy chains form contiguous index intervals in 1D base array", () => {
      const tree = HLD_PRESETS.standard_tree_16.tree!;
      const hld = computeHLD(tree);

      // Verify nodeAtPos is a valid permutation of 0..15
      expect(hld.nodeAtPos.length).toBe(16);
      const uniqueNodes = new Set(hld.nodeAtPos);
      expect(uniqueNodes.size).toBe(16);

      // Verify each heavy chain has contiguous posInBase indices
      for (const chain of hld.chains) {
        const positions = chain.map((u) => hld.posInBase[u]);
        for (let i = 0; i < positions.length - 1; i++) {
          expect(positions[i + 1]).toBe(positions[i] + 1);
        }
      }
    });

    it("should decompose arbitrary path (u, v) into O(log N) contiguous intervals", () => {
      const tree = HLD_PRESETS.standard_tree_16.tree!;
      const hld = computeHLD(tree);

      const query = queryHLDPath(tree, hld, 8, 15);
      expect(query.intervals.length).toBeGreaterThan(0);
      expect(query.intervals.length).toBeLessThanOrEqual(2 * Math.ceil(Math.log2(16)));

      // Every interval [fromPos, toPos] must be valid and ordered
      for (const inv of query.intervals) {
        expect(inv.fromPos).toBeLessThanOrEqual(inv.toPos);
        expect(inv.fromPos).toBeGreaterThanOrEqual(0);
        expect(inv.toPos).toBeLessThan(16);
      }

      // Reconstructed path nodes must connect 8 and 15
      expect(query.pathNodes[0]).toBe(8);
      expect(query.pathNodes[query.pathNodes.length - 1]).toBe(15);
      expect(query.lca).toBe(0);
    });

    it("should handle path query on same node (u == v)", () => {
      const tree = HLD_PRESETS.standard_tree_16.tree!;
      const hld = computeHLD(tree);

      const query = queryHLDPath(tree, hld, 4, 4);
      expect(query.lca).toBe(4);
      expect(query.intervals.length).toBe(1);
      expect(query.intervals[0].fromPos).toBe(hld.posInBase[4]);
      expect(query.intervals[0].toPos).toBe(hld.posInBase[4]);
    });
  });

  // ==========================================================================
  // 4. Binary Lifting & LCA Sparse Table Tests
  // ==========================================================================
  describe("4. Binary Lifting Sparse Jump Table & LCA Queries", () => {
    it("should build valid sparse jump table with up[u][k] power relations", () => {
      const tree = LCA_PRESETS.tournament_tree_15.tree!;
      const table = buildBinaryLiftingTable(tree);

      expect(table.nodeCount).toBe(15);
      expect(table.maxK).toBeGreaterThanOrEqual(4);

      // Base case k = 0
      for (const node of tree.nodes) {
        if (node.id === 0) {
          expect(table.up[0][0]).toBe(0);
        } else {
          expect(table.up[node.id][0]).toBe(node.parent);
        }
      }

      // Check power recurrence: up[u][k] == up[up[u][k-1]][k-1]
      for (let k = 1; k < table.maxK; k++) {
        for (let u = 0; u < 15; u++) {
          const mid = table.up[u][k - 1];
          const expected = table.up[mid][k - 1];
          expect(table.up[u][k]).toBe(expected);
        }
      }
    });

    it("should compute correct LCA across ALL pairs of nodes in tournament tree", () => {
      const tree = LCA_PRESETS.tournament_tree_15.tree!;
      const table = buildBinaryLiftingTable(tree);

      // Naive brute-force LCA finder
      const naiveLCA = (u: number, v: number): number => {
        const ancestorsU = new Set<number>();
        let currU = u;
        while (currU !== 0) {
          ancestorsU.add(currU);
          currU = tree.nodes[currU].parent!;
        }
        ancestorsU.add(0);

        let currV = v;
        while (!ancestorsU.has(currV)) {
          currV = tree.nodes[currV].parent!;
        }
        return currV;
      };

      // Test all 15x15 = 225 pairs!
      for (let u = 0; u < 15; u++) {
        for (let v = 0; v < 15; v++) {
          const lcaFast = queryLCA(table, tree, u, v);
          const lcaExpected = naiveLCA(u, v);
          expect(lcaFast.lca).toBe(lcaExpected);
        }
      }
    });

    it("should equalize depths and record binary jump sequence on deep hierarchy tree", () => {
      const tree = LCA_PRESETS.deep_hierarchy_18.tree!;
      const table = buildBinaryLiftingTable(tree);

      // Node 8 (depth 6) and Node 17 (depth 3)
      const res = queryLCA(table, tree, 8, 17);
      expect(res.lca).toBe(0);
      expect(res.depthU).toBe(6);
      expect(res.depthV).toBe(3);

      // Equalization jumps should have been performed
      expect(res.equalizingJumps.length).toBeGreaterThan(0);
      for (const j of res.equalizingJumps) {
        expect(j.stride).toBe(1 << j.k);
      }
    });
  });

  // ==========================================================================
  // 5. Convex Hull Trick (CHT) DP Tests
  // ==========================================================================
  describe("5. Convex Hull Trick (CHT) Optimization & Line Envelopes", () => {
    it("should compute correct line intersection coordinates", () => {
      // l1: y = 2x + 2, l2: y = -1x + 8
      // 2x + 2 = -x + 8 => 3x = 6 => x = 2
      const l1 = { id: "1", m: 2, c: 2 };
      const l2 = { id: "2", m: -1, c: 8 };
      const xInter = computeLineIntersection(l1, l2);
      expect(xInter).toBeCloseTo(2, 6);

      // Parallel lines
      const lParallel = { id: "3", m: 2, c: 5 };
      expect(computeLineIntersection(l1, lParallel)).toBeNull();
    });

    it("should build lower convex envelope for monotonic DP slopes", () => {
      const lines = CHT_PRESETS.classic_dp_lines.lines!;
      const envelope = buildConvexHullTrick(lines, "min");

      expect(envelope.envelopeLines.length).toBe(5);
      expect(envelope.intersections.length).toBe(4);

      // Intersection points must strictly increase: x0 < x1 < x2 < x3
      for (let i = 0; i < envelope.intersections.length - 1; i++) {
        expect(envelope.intersections[i].x).toBeLessThan(envelope.intersections[i + 1].x);
      }
    });

    it("should prune and pop redundant lines that are completely dominated", () => {
      const lines = CHT_PRESETS.redundant_lines.lines!;
      const envelope = buildConvexHullTrick(lines, "min");

      // Line R1 (y = 4x + 3) is redundant and must be popped
      expect(envelope.poppedLines.length).toBeGreaterThanOrEqual(1);
      const poppedIds = envelope.poppedLines.map((p) => p.line.id);
      expect(poppedIds).toContain("R1");

      // Active envelope should only contain surviving optimal lines
      const survivingIds = envelope.envelopeLines.map((l) => l.id);
      expect(survivingIds).not.toContain("R1");
    });

    it("should evaluate queryCHT(x) matching naive minimum across range of x values", () => {
      const lines = CHT_PRESETS.classic_dp_lines.lines!;
      const envelope = buildConvexHullTrick(lines, "min");

      const testXValues = [-4, -2, 0, 1, 2, 3, 5];
      for (const x of testXValues) {
        const naiveMin = Math.min(...lines.map((l) => l.m * x + l.c));
        const chtResult = queryCHT(envelope, x);
        expect(chtResult.optY).toBeCloseTo(naiveMin, 6);
      }
    });

    it("should evaluate upper envelope (max) optimization correctly", () => {
      const lines = CHT_PRESETS.upper_envelope_max.lines!;
      const envelope = buildConvexHullTrick(lines, "max");

      const testXValues = [-3, -1, 0, 2, 4];
      for (const x of testXValues) {
        const naiveMax = Math.max(...lines.map((l) => l.m * x + l.c));
        const chtResult = queryCHT(envelope, x);
        expect(chtResult.optY).toBeCloseTo(naiveMax, 6);
      }
    });
  });

  // ==========================================================================
  // 6. Tree Layout & Geometry Positioning
  // ==========================================================================
  describe("6. Tree Layout & Geometry Positioning", () => {
    it("should compute clean non-overlapping coordinates for tree nodes", () => {
      const tree = TREE_DIAMETER_PRESETS.balanced_binary.tree!;
      const layout = computeTreeLayout(tree, 800, 400);

      expect(layout.size).toBe(15);

      for (let i = 0; i < 15; i++) {
        const pos = layout.get(i);
        expect(pos).toBeDefined();
        expect(Number.isFinite(pos!.x)).toBe(true);
        expect(Number.isFinite(pos!.y)).toBe(true);
        expect(pos!.x).toBeGreaterThanOrEqual(0);
        expect(pos!.x).toBeLessThanOrEqual(800);
        expect(pos!.y).toBeGreaterThanOrEqual(0);
        expect(pos!.y).toBeLessThanOrEqual(400);
      }

      // Root y position should be less than child y position
      const rootPos = layout.get(0)!;
      const child1Pos = layout.get(1)!;
      expect(rootPos.y).toBeLessThan(child1Pos.y);
    });
  });
});
