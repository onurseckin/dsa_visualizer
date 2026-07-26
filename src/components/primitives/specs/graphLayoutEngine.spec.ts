import { describe, expect, it, vi } from "vitest";
import { computeGraphLayout } from "../graph/layoutEngine";
import { GraphEdgeItem, GraphNodeItem } from "../../../types/dsa";
import * as vizGeometry from "../vizGeometry";

describe("graph layoutEngine", () => {
  const box: vizGeometry.Size = { width: 900, height: 600 };

  it("computes layout with auto-positioning on ellipse when nodes lack explicit coordinates", () => {
    const nodes: GraphNodeItem[] = [
      { id: "A", label: "Node A", state: "default" },
      { id: "B", label: "Node B", state: "default" },
      { id: "C", label: "Node C", state: "default" },
    ];
    const edges: GraphEdgeItem[] = [
      { from: "A", to: "B", weight: 5 },
      { from: "B", to: "C" },
    ];

    const metrics = computeGraphLayout(nodes, edges, box);

    expect(metrics.positioned).toHaveLength(3);
    expect(metrics.nodeRadius).toBeGreaterThan(0);
    expect(metrics.nodeMap.has("A")).toBe(true);
    expect(metrics.nodeMap.has("B")).toBe(true);
    expect(metrics.nodeMap.has("C")).toBe(true);
  });

  it("computes layout using authored coordinates when all nodes supply x and y", () => {
    const nodes: GraphNodeItem[] = [
      { id: "A", label: "A", state: "default", x: 100, y: 100 },
      { id: "B", label: "B", state: "default", x: 500, y: 500 },
    ];
    const edges: GraphEdgeItem[] = [{ from: "A", to: "B" }];

    const metrics = computeGraphLayout(nodes, edges, box);

    expect(metrics.positioned).toHaveLength(2);
    expect(metrics.positioned[0].x).toBeGreaterThan(0);
    expect(metrics.positioned[1].x).toBeGreaterThan(0);
  });

  it("handles explicit node and edge groups", () => {
    const nodes: GraphNodeItem[] = [
      { id: "A", label: "A", state: "default", group: 0 },
      { id: "B", label: "B", state: "default", group: 0 },
      { id: "C", label: "C", state: "default", group: 1 },
    ];
    const edges: GraphEdgeItem[] = [
      { from: "A", to: "B" }, // intra-group -> edgeGroup 0
      { from: "A", to: "C" }, // inter-group -> edgeGroup undefined
      { from: "B", to: "C", group: 2 }, // explicit edge group -> 2
    ];

    const metrics = computeGraphLayout(nodes, edges, box);

    expect(metrics.groupOf("A")).toBe(0);
    expect(metrics.groupOf("C")).toBe(1);
    expect(metrics.edgeGroupOf(edges[0])).toBe(0);
    expect(metrics.edgeGroupOf(edges[1])).toBeUndefined();
    expect(metrics.edgeGroupOf(edges[2])).toBe(2);

    expect(metrics.legend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "group-0", label: "Group 1" }),
        expect.objectContaining({ key: "group-1", label: "Group 2" }),
      ]),
    );
  });

  it("derives connected components when explicit groups are absent", () => {
    // Two disconnected components: {A, B} and {C, D}
    const nodes: GraphNodeItem[] = [
      { id: "A", label: "A", state: "default" },
      { id: "B", label: "B", state: "default" },
      { id: "C", label: "C", state: "default" },
      { id: "D", label: "D", state: "default" },
    ];
    const edges: GraphEdgeItem[] = [
      { from: "A", to: "B" },
      { from: "C", to: "D" },
    ];

    const metrics = computeGraphLayout(nodes, edges, box);

    expect(metrics.groupOf("A")).toBeDefined();
    expect(metrics.groupOf("C")).toBeDefined();
    expect(metrics.groupOf("A")).not.toBe(metrics.groupOf("C"));

    expect(metrics.legend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: expect.stringMatching(/^Component/) }),
      ]),
    );
  });

  it("includes traversed, path, and plain edge entries in legend", () => {
    const nodes: GraphNodeItem[] = [
      { id: "A", label: "A", state: "default" },
      { id: "B", label: "B", state: "default" },
      { id: "C", label: "C", state: "default" },
      { id: "D", label: "D", state: "default" },
    ];
    const edges: GraphEdgeItem[] = [
      { from: "A", to: "B" }, // plain
      { from: "B", to: "C", isTraversed: true }, // traversed
      { from: "C", to: "D", isPath: true }, // path
    ];

    const metrics = computeGraphLayout(nodes, edges, box);

    expect(metrics.legend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "edge-plain", label: "Unexplored" }),
        expect.objectContaining({ key: "edge-traversed", label: "Traversed" }),
        expect.objectContaining({ key: "edge-path", label: "Final path" }),
      ]),
    );
  });

  it("handles position fallback when positions array is shorter than nodes", () => {
    const spy = vi.spyOn(vizGeometry, "spreadToBox").mockReturnValue([]);
    const nodes: GraphNodeItem[] = [
      { id: "FallbackNode", label: "FallbackNode", state: "default" },
    ];
    const metrics = computeGraphLayout(nodes, [], box);
    expect(metrics.positioned[0].x).toBe(box.width / 2);
    expect(metrics.positioned[0].y).toBe(box.height / 2);
    spy.mockRestore();
  });

  it("scales down nodeRadius when nodes are closely spaced in a small bounding box", () => {
    const smallBox: vizGeometry.Size = { width: 50, height: 50 };
    const nodes: GraphNodeItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `N${i}`,
      label: `Node ${i}`,
      state: "default",
    }));

    const metrics = computeGraphLayout(nodes, [], smallBox);

    expect(metrics.nodeRadius).toBeLessThan(30); // MAX_NODE_R is 30
  });

  it("falls back to node.id when node.label is missing", () => {
    const nodes: GraphNodeItem[] = [{ id: "NoLabelNode", state: "default" }];
    const metrics = computeGraphLayout(nodes, [], box);
    expect(metrics.positioned).toHaveLength(1);
    expect(metrics.positioned[0].id).toBe("NoLabelNode");
  });
});
