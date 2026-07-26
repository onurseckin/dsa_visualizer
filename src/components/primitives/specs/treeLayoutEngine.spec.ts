import { describe, expect, it, vi } from "vitest";
import { computeTreeLayout } from "../tree/layoutEngine";
import { tidyTreeSlots, Size } from "../vizGeometry";
import * as vizGeometry from "../vizGeometry";
import { TreeNodeItem } from "../../../types/dsa";

describe("tree layoutEngine", () => {
  describe("tidyTreeSlots", () => {
    it("positions tree nodes into leaf slots and depth levels", () => {
      const childrenMap: Record<string, string[]> = {
        root: ["left", "right"],
        left: [],
        right: [],
      };
      const tidy = tidyTreeSlots(["root"], (id) => childrenMap[id] || []);

      expect(tidy.leafCount).toBe(2);
      expect(tidy.depth).toBe(1);
      expect(tidy.slots).toHaveLength(3);
    });

    it("handles cyclic child references gracefully by ignoring back-edges", () => {
      const childrenMap: Record<string, string[]> = {
        A: ["B"],
        B: ["A"], // Cycle back to A
      };
      const tidy = tidyTreeSlots(["A"], (id) => childrenMap[id] || []);

      expect(tidy.slots.map((s) => s.id)).toEqual(expect.arrayContaining(["B", "A"]));
    });
  });

  describe("computeTreeLayout", () => {
    it("computes stretched tree layout when nodes do not specify explicit coordinates", () => {
      const nodes: TreeNodeItem[] = [
        { id: "1", val: 10, state: "default", leftId: "2", rightId: "3" },
        { id: "2", val: 5, state: "default" },
        { id: "3", val: 15, state: "default" },
      ];
      const box: Size = { width: 800, height: 600 };
      const groups = { "1": 0, "2": 1 };

      const metrics = computeTreeLayout(nodes, "1", box, groups);

      expect(metrics.computedNodes).toHaveLength(3);
      expect(metrics.nodeRadius).toBeGreaterThan(0);
      expect(metrics.groupOf("1")).toBe(0);
      expect(metrics.groupOf("2")).toBe(1);
      expect(metrics.groupOf("3")).toBeUndefined();

      expect(metrics.legend).toHaveLength(2);
      expect(metrics.legend[0]).toEqual({
        key: "group-0",
        label: "Group 1",
        color: expect.any(String),
      });
    });

    it("computes explicit tree layout when all nodes specify explicit x and y coordinates", () => {
      const nodes: TreeNodeItem[] = [
        { id: "1", val: 10, state: "default", x: 100, y: 100, leftId: "2" },
        { id: "2", val: 5, state: "default", x: 50, y: 200 },
      ];
      const box: Size = { width: 800, height: 600 };

      const metrics = computeTreeLayout(nodes, "1", box);

      expect(metrics.computedNodes).toHaveLength(2);
      expect(metrics.computedNodes[0].cx).toBeGreaterThan(0);
      expect(metrics.computedNodes[0].cy).toBeGreaterThan(0);
    });

    it("handles node children references that do not exist in nodeMap", () => {
      const nodes: TreeNodeItem[] = [
        { id: "1", val: 100, state: "default", leftId: "ghost-left", rightId: "ghost-right" },
      ];
      const box: Size = { width: 400, height: 400 };

      const metrics = computeTreeLayout(nodes, "1", box);

      expect(metrics.computedNodes).toHaveLength(1);
      expect(metrics.computedNodes[0].id).toBe("1");
    });

    it("handles undefined rootId by falling back to unparented nodes", () => {
      const nodes: TreeNodeItem[] = [
        { id: "A", val: 1, state: "default", leftId: "B" },
        { id: "B", val: 2, state: "default" },
      ];
      const box: Size = { width: 400, height: 400 };

      const metrics = computeTreeLayout(nodes, undefined, box);

      expect(metrics.computedNodes).toHaveLength(2);
    });

    it("adjusts font size for long text labels", () => {
      const nodes: TreeNodeItem[] = [{ id: "1", val: 9999999, state: "default" }];
      const box: Size = { width: 500, height: 500 };

      const metrics = computeTreeLayout(nodes, "1", box);

      expect(metrics.labelFont).toBeGreaterThanOrEqual(9);
      expect(metrics.labelFont).toBeLessThanOrEqual(26);
    });

    it("reduces nodeRadius in explicitLayout for closely packed nodes in a small box", () => {
      const nodes: TreeNodeItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        val: i,
        state: "default",
        x: 10 + i * 2,
        y: 10 + i * 2,
      }));
      const smallBox: Size = { width: 30, height: 30 };

      const metrics = computeTreeLayout(nodes, "0", smallBox);

      expect(metrics.nodeRadius).toBeLessThan(30); // MAX_NODE_R is 30
    });

    it("handles fallback coordinates when spreadToBox returns empty array", () => {
      const spy = vi.spyOn(vizGeometry, "spreadToBox").mockReturnValue([]);
      const box: Size = { width: 400, height: 400 };

      // Test explicit layout fallback
      const explicitNodes: TreeNodeItem[] = [{ id: "1", val: 1, state: "default", x: 10, y: 10 }];
      const expMetrics = computeTreeLayout(explicitNodes, "1", box);
      expect(expMetrics.computedNodes[0].cx).toBe(200);
      expect(expMetrics.computedNodes[0].cy).toBe(200);

      // Test stretched layout fallback
      const stretchedNodes: TreeNodeItem[] = [{ id: "1", val: 1, state: "default" }];
      const strMetrics = computeTreeLayout(stretchedNodes, "1", box);
      expect(strMetrics.computedNodes[0].cx).toBe(200);
      expect(strMetrics.computedNodes[0].cy).toBe(200);

      spy.mockRestore();
    });

    it("handles nodes with missing child entries in nodeMap", () => {
      const nodes: TreeNodeItem[] = [
        { id: "1", val: 10, state: "default", leftId: "missing-node" },
      ];
      const metrics = computeTreeLayout(nodes, "1", { width: 400, height: 400 });
      expect(metrics.computedNodes).toHaveLength(1);
    });
  });
});
