import { describe, it, expect } from "vitest";
import type { GraphEdgeItem } from "../../../types/dsa";
import {
  VIZ_OVERFLOW_BG,
  VIZ_OVERFLOW_COLOR,
  VIZ_SLOT_COUNT,
  componentTintingAddsInformation,
  deriveConnectedComponents,
  isVizSlot,
  vizSlotBg,
  vizSlotColor,
} from "../vizPalette";

describe("vizPalette slot ordering", () => {
  it("maps slots to --viz-* tokens in fixed order", () => {
    const colors = Array.from({ length: VIZ_SLOT_COUNT }, (_, slot) => vizSlotColor(slot));
    expect(colors).toEqual([
      "var(--viz-1)",
      "var(--viz-2)",
      "var(--viz-3)",
      "var(--viz-4)",
      "var(--viz-5)",
      "var(--viz-6)",
      "var(--viz-7)",
      "var(--viz-8)",
    ]);
    expect(new Set(colors).size).toBe(VIZ_SLOT_COUNT);
  });

  it("reports slot validity for in-range integers only", () => {
    expect(isVizSlot(0)).toBe(true);
    expect(isVizSlot(VIZ_SLOT_COUNT - 1)).toBe(true);
    expect(isVizSlot(VIZ_SLOT_COUNT)).toBe(false);
    expect(isVizSlot(-1)).toBe(false);
    expect(isVizSlot(1.5)).toBe(false);
    expect(isVizSlot(Number.NaN)).toBe(false);
  });

  it("mixes soft fills from the same token, with an optional opaque base", () => {
    expect(vizSlotBg(2)).toBe("color-mix(in srgb, var(--viz-3) 22%, transparent)");
    expect(vizSlotBg(2, 18, "var(--bg-elevated)")).toBe(
      "color-mix(in srgb, var(--viz-3) 18%, var(--bg-elevated))",
    );
  });
});

describe("vizPalette overflow folding", () => {
  it("folds group indices past the eighth slot into the default state token", () => {
    expect(vizSlotColor(VIZ_SLOT_COUNT)).toBe(VIZ_OVERFLOW_COLOR);
    expect(vizSlotColor(99)).toBe(VIZ_OVERFLOW_COLOR);
    expect(vizSlotBg(VIZ_SLOT_COUNT)).toBe(VIZ_OVERFLOW_BG);
    expect(vizSlotBg(99, 40, "var(--bg-elevated)")).toBe(VIZ_OVERFLOW_BG);
  });

  it("never cycles a ninth group back onto an earlier viz token", () => {
    expect(vizSlotColor(VIZ_SLOT_COUNT)).not.toBe(vizSlotColor(0));
  });

  it("folds negative and non-integer indices too", () => {
    expect(vizSlotColor(-3)).toBe(VIZ_OVERFLOW_COLOR);
    expect(vizSlotColor(2.4)).toBe(VIZ_OVERFLOW_COLOR);
    expect(vizSlotBg(Number.NaN)).toBe(VIZ_OVERFLOW_BG);
  });
});

describe("deriveConnectedComponents", () => {
  it("groups a single chain into one component", () => {
    const edges: GraphEdgeItem[] = [
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ];
    const result = deriveConnectedComponents(["a", "b", "c"], edges);

    expect(result.componentCount).toBe(1);
    expect(result.largestComponentSize).toBe(3);
    expect(result.componentOf.get("a")).toBe(0);
    expect(result.componentOf.get("c")).toBe(0);
  });

  it("indexes components by first appearance and ignores edge direction", () => {
    const edges: GraphEdgeItem[] = [
      { from: "b", to: "a" },
      { from: "d", to: "c" },
    ];
    const result = deriveConnectedComponents(["a", "b", "c", "d"], edges);

    expect(result.componentCount).toBe(2);
    expect(result.componentOf.get("a")).toBe(0);
    expect(result.componentOf.get("b")).toBe(0);
    expect(result.componentOf.get("c")).toBe(1);
    expect(result.componentOf.get("d")).toBe(1);
    expect(result.largestComponentSize).toBe(2);
  });

  it("gives isolated nodes their own component and ignores unknown endpoints", () => {
    const edges: GraphEdgeItem[] = [
      { from: "a", to: "b" },
      { from: "b", to: "ghost" },
      { from: "nobody", to: "nowhere" },
    ];
    const result = deriveConnectedComponents(["a", "b", "lonely"], edges);

    expect(result.componentCount).toBe(2);
    expect(result.componentOf.get("a")).toBe(result.componentOf.get("b"));
    expect(result.componentOf.get("lonely")).toBe(1);
    expect(result.componentOf.has("ghost")).toBe(false);
  });

  it("merges transitively across many edges regardless of insertion order", () => {
    const edges: GraphEdgeItem[] = [
      { from: "e", to: "f" },
      { from: "a", to: "b" },
      { from: "c", to: "d" },
      { from: "d", to: "a" },
      { from: "b", to: "c" },
    ];
    const result = deriveConnectedComponents(["a", "b", "c", "d", "e", "f"], edges);

    expect(result.componentCount).toBe(2);
    expect(new Set(["a", "b", "c", "d"].map((id) => result.componentOf.get(id))).size).toBe(1);
    expect(result.componentOf.get("e")).toBe(result.componentOf.get("f"));
    expect(result.componentOf.get("e")).not.toBe(result.componentOf.get("a"));
    expect(result.largestComponentSize).toBe(4);
  });

  it("handles an empty graph", () => {
    const result = deriveConnectedComponents([], []);
    expect(result.componentCount).toBe(0);
    expect(result.largestComponentSize).toBe(0);
    expect(componentTintingAddsInformation(result)).toBe(false);
  });
});

describe("componentTintingAddsInformation", () => {
  it("is false for a single connected component", () => {
    const result = deriveConnectedComponents(["a", "b"], [{ from: "a", to: "b" }]);
    expect(componentTintingAddsInformation(result)).toBe(false);
  });

  it("is false for an edgeless point cloud where every node is its own component", () => {
    const result = deriveConnectedComponents(["a", "b", "c"], []);
    expect(result.componentCount).toBe(3);
    expect(componentTintingAddsInformation(result)).toBe(false);
  });

  it("is true when several nodes cluster into more than one component", () => {
    const result = deriveConnectedComponents(
      ["a", "b", "c", "d"],
      [
        { from: "a", to: "b" },
        { from: "c", to: "d" },
      ],
    );
    expect(componentTintingAddsInformation(result)).toBe(true);
  });

  it("is false once components outnumber the validated slots", () => {
    const nodeIds = Array.from({ length: 20 }, (_, i) => `n${i}`);
    const edges: GraphEdgeItem[] = nodeIds
      .filter((_, i) => i % 2 === 0)
      .map((id, i) => ({ from: id, to: `n${i * 2 + 1}` }));
    const result = deriveConnectedComponents(nodeIds, edges);

    expect(result.componentCount).toBe(10);
    expect(result.largestComponentSize).toBe(2);
    expect(componentTintingAddsInformation(result)).toBe(false);
  });
});
