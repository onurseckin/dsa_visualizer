import { describe, expect, it } from "vitest";

import { layoutResponsiveGraph } from "../responsiveGraphLayout";

const nodes = Array.from({ length: 23 }, (_, index) => ({
  id: `node-${index}`,
  x: (index % 5) * 260,
  y: Math.floor(index / 5) * 130,
}));

describe("layoutResponsiveGraph", () => {
  it.each([
    { width: 320, height: 800 },
    { width: 768, height: 900 },
    { width: 1440, height: 1000 },
  ])("keeps every node inside the canvas without overlap at $width px", (box) => {
    const layout = layoutResponsiveGraph(nodes, box);

    expect(layout.canvasHeight).toBeGreaterThanOrEqual(box.height);
    layout.nodes.forEach((node) => {
      expect(node.x - node.width / 2).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width / 2).toBeLessThanOrEqual(box.width);
      expect(node.y - node.height / 2).toBeGreaterThanOrEqual(0);
      expect(node.y + node.height / 2).toBeLessThanOrEqual(layout.canvasHeight);
    });

    for (let index = 0; index < layout.nodes.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < layout.nodes.length; otherIndex += 1) {
        const first = layout.nodes[index];
        const second = layout.nodes[otherIndex];
        const overlaps =
          Math.abs(first.x - second.x) < (first.width + second.width) / 2 &&
          Math.abs(first.y - second.y) < (first.height + second.height) / 2;

        expect(overlaps).toBe(false);
      }
    }
  });
});
