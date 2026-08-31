import { describe, expect, it } from "bun:test";
import {
  generateConvexHullGeometry,
  generateCurvedArrow,
  layoutArrayGrid,
  layoutBinaryTree,
  layoutGraphForceDirected,
} from "../canvasGeometry";

describe("Interactive DSA Visualizer Canvas Geometry & Layout Builder Tests", () => {
  describe("1. Binary Tree & AVL Canvas Layout Calculators", () => {
    it("should handle empty tree gracefully", () => {
      const result = layoutBinaryTree(null, 800, 600);
      expect(result.nodes.length).toBe(0);
      expect(result.edges.length).toBe(0);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it("should compute non-overlapping coordinates for a 3-node balanced BST", () => {
      const tree = {
        id: "node_20",
        val: 20,
        balanceFactor: 0,
        left: { id: "node_10", val: 10, balanceFactor: 0 },
        right: { id: "node_30", val: 30, balanceFactor: 0 },
      };

      const result = layoutBinaryTree(tree, 800, 500, 20);
      expect(result.nodes.length).toBe(3);
      expect(result.edges.length).toBe(2);

      const rootNode = result.nodes.find((n) => n.id === "node_20")!;
      const leftNode = result.nodes.find((n) => n.id === "node_10")!;
      const rightNode = result.nodes.find((n) => n.id === "node_30")!;

      expect(rootNode).toBeDefined();
      expect(leftNode).toBeDefined();
      expect(rightNode).toBeDefined();

      // Tree geometric hierarchy invariants
      expect(leftNode.x).toBeLessThan(rootNode.x);
      expect(rootNode.x).toBeLessThan(rightNode.x);
      expect(rootNode.y).toBeLessThan(leftNode.y);
      expect(rootNode.y).toBeLessThan(rightNode.y);
      expect(leftNode.y).toBe(rightNode.y); // Same depth

      // Edge SVG path generation
      for (const edge of result.edges) {
        expect(edge.pathD.startsWith("M ")).toBe(true);
        expect(edge.fromId).toBe("node_20");
      }
    });

    it("should layout deep skewed trees with monotonic vertical progression", () => {
      const skewed = {
        id: "1",
        val: 1,
        right: {
          id: "2",
          val: 2,
          right: {
            id: "3",
            val: 3,
            right: { id: "4", val: 4 },
          },
        },
      };

      const result = layoutBinaryTree(skewed, 800, 600);
      expect(result.nodes.length).toBe(4);
      expect(result.edges.length).toBe(3);

      for (let i = 0; i < result.nodes.length - 1; i++) {
        expect(result.nodes[i].y).toBeLessThan(result.nodes[i + 1].y);
      }
    });
  });

  describe("2. Fruchterman-Reingold Force-Directed Graph Layout", () => {
    it("should handle empty graph inputs", () => {
      const result = layoutGraphForceDirected([], []);
      expect(result.nodes.length).toBe(0);
      expect(result.edges.length).toBe(0);
    });

    it("should compute bounded layout for network flow graph with back-edges", () => {
      const nodes = [
        { id: "S", label: "Source (0)" },
        { id: "1", label: "Node 1" },
        { id: "2", label: "Node 2" },
        { id: "T", label: "Sink (3)" },
      ];

      const edges = [
        { source: "S", target: "1", capacity: 10, flow: 4 },
        { source: "S", target: "2", capacity: 5, flow: 2 },
        { source: "1", target: "T", capacity: 8, flow: 4 },
        { source: "2", target: "T", capacity: 6, flow: 2 },
        { source: "1", target: "S", capacity: 0, flow: 0, isBackEdge: true },
      ];

      const result = layoutGraphForceDirected(nodes, edges, 800, 600, 50);

      expect(result.nodes.length).toBe(4);
      expect(result.edges.length).toBe(5);

      // Verify all nodes remain strictly within canvas bounds
      for (const n of result.nodes) {
        expect(n.x).toBeGreaterThanOrEqual(10);
        expect(n.x).toBeLessThanOrEqual(790);
        expect(n.y).toBeGreaterThanOrEqual(10);
        expect(n.y).toBeLessThanOrEqual(590);
      }

      // Back-edge should have curved SVG representation
      const backEdge = result.edges.find((e) => e.isBackEdge)!;
      expect(backEdge).toBeDefined();
      expect(backEdge.pathD.includes("Q")).toBe(true);
    });
  });

  describe("3. Array Memory Grid Layout & Cache Line Boundaries", () => {
    it("should compute contiguous array cells with 64-byte L1 cache line markers", () => {
      const array = [
        10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180,
      ];
      const pointers = [
        { name: "low", index: 0 },
        { name: "mid", index: 8 },
        { name: "high", index: 17 },
      ];

      const result = layoutArrayGrid(array, 50, 40, 20, 50, pointers, [8], 16);

      expect(result.cells.length).toBe(18);
      expect(result.cacheLinesCount).toBe(2);

      // Verify cell sequential coordinates
      for (let i = 0; i < result.cells.length - 1; i++) {
        expect(result.cells[i + 1].x).toBe(result.cells[i].x + 50);
      }

      // Cache line boundary invariants (Index 0 and Index 16)
      expect(result.cells[0].isCacheLineStart).toBe(true);
      expect(result.cells[1].isCacheLineStart).toBe(false);
      expect(result.cells[16].isCacheLineStart).toBe(true);

      // Pointer overlay mappings
      expect(result.cells[0].pointers).toContain("low");
      expect(result.cells[8].pointers).toContain("mid");
      expect(result.cells[8].highlighted).toBe(true);
      expect(result.cells[17].pointers).toContain("high");
    });
  });

  describe("4. SVG Path & Geometric Generators", () => {
    it("generateCurvedArrow should produce valid quadratic bezier SVG paths", () => {
      const source = { x: 100, y: 100 };
      const target = { x: 300, y: 100 };

      const path = generateCurvedArrow(source, target, { curvature: 0.25 });
      expect(path.startsWith("M ")).toBe(true);
      expect(path.includes("Q ")).toBe(true);
    });

    it("generateConvexHullGeometry should compute exact shoelace area and polygon bounds", () => {
      // Unit square: (0,0), (2,0), (2,2), (0,2) -> Area = 4.0, Perimeter = 8.0
      const squareVertices = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 },
      ];

      const result = generateConvexHullGeometry(squareVertices);
      expect(result.area).toBe(4.0);
      expect(result.perimeter).toBe(8.0);
      expect(result.svgPoints).toBe("0.0,0.0 2.0,0.0 2.0,2.0 0.0,2.0");
      expect(result.pathD).toBe("M 0.0 0.0 L 2.0 0.0 L 2.0 2.0 L 0.0 2.0 Z");
    });

    it("generateConvexHullGeometry should handle empty vertex lists", () => {
      const result = generateConvexHullGeometry([]);
      expect(result.area).toBe(0);
      expect(result.perimeter).toBe(0);
      expect(result.svgPoints).toBe("");
      expect(result.pathD).toBe("");
    });
  });
});
