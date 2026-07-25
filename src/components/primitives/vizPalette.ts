import type { GraphEdgeItem } from '../../types/dsa';

/* Categorical group coloring for the visualizers.

   The --viz-1..8 tokens in theme.css passed their colorblind-separation gates as
   an ordered set, so slots are handed out in fixed order and nothing past slot 8
   ever borrows a viz color — extras fold into --state-default instead of cycling,
   which would make two different groups share a hue. */

export const VIZ_SLOT_COUNT = 8;

/** What a group index outside the 8 validated slots renders as. */
export const VIZ_OVERFLOW_COLOR = 'var(--state-default)';
export const VIZ_OVERFLOW_BG = 'var(--state-default-bg)';

/** True when `slot` maps onto one of the validated --viz-* tokens. */
export const isVizSlot = (slot: number): boolean =>
  Number.isInteger(slot) && slot >= 0 && slot < VIZ_SLOT_COUNT;

/** Zero-based group index → `var(--viz-N)`, clamped with overflow folding. */
export const vizSlotColor = (slot: number): string =>
  isVizSlot(slot) ? `var(--viz-${slot + 1})` : VIZ_OVERFLOW_COLOR;

/** Translucent companion of `vizSlotColor`, for node/panel fills. Mixed from the
   token rather than hardcoded so the palette stays single-source; pass `base` a
   surface token when the fill sits on an opaque panel instead of the canvas. */
export const vizSlotBg = (slot: number, percent = 22, base = 'transparent'): string =>
  isVizSlot(slot)
    ? `color-mix(in srgb, var(--viz-${slot + 1}) ${percent}%, ${base})`
    : VIZ_OVERFLOW_BG;

export interface ConnectedComponents {
  /** node id → zero-based component index, ordered by first appearance in `nodeIds`. */
  componentOf: Map<string, number>;
  componentCount: number;
  /** Largest number of nodes in any single component (1 when the graph is edgeless). */
  largestComponentSize: number;
}

/**
 * Weakly-connected components (edge direction ignored) via union-find, so a
 * graph with no explicit `group` can still be tinted by structure.
 * Edges naming unknown nodes are ignored; isolated nodes form their own component.
 */
export const deriveConnectedComponents = (
  nodeIds: readonly string[],
  edges: readonly GraphEdgeItem[]
): ConnectedComponents => {
  const parent = new Map<string, string>();
  nodeIds.forEach((id) => parent.set(id, id));

  const find = (id: string): string => {
    let root = id;
    let next = parent.get(root);
    while (next !== undefined && next !== root) {
      root = next;
      next = parent.get(root);
    }
    // Path compression keeps repeated lookups flat on dense graphs.
    let walk = id;
    let step = parent.get(walk);
    while (step !== undefined && step !== walk) {
      parent.set(walk, root);
      walk = step;
      step = parent.get(walk);
    }
    return root;
  };

  edges.forEach((edge) => {
    if (!parent.has(edge.from) || !parent.has(edge.to)) return;
    const a = find(edge.from);
    const b = find(edge.to);
    if (a !== b) parent.set(a, b);
  });

  const indexByRoot = new Map<string, number>();
  const componentOf = new Map<string, number>();
  const sizes: number[] = [];

  nodeIds.forEach((id) => {
    const root = find(id);
    let index = indexByRoot.get(root);
    if (index === undefined) {
      index = indexByRoot.size;
      indexByRoot.set(root, index);
      sizes.push(0);
    }
    sizes[index] += 1;
    componentOf.set(id, index);
  });

  return {
    componentOf,
    componentCount: indexByRoot.size,
    largestComponentSize: sizes.length > 0 ? Math.max(...sizes) : 0,
  };
};

/**
 * Whether component-derived tinting is worth showing: more than one component,
 * at least one of them holding several nodes (an edgeless point cloud would just
 * become confetti), and few enough components to stay inside the validated slots.
 */
export const componentTintingAddsInformation = (components: ConnectedComponents): boolean =>
  components.componentCount > 1 &&
  components.componentCount <= VIZ_SLOT_COUNT &&
  components.largestComponentSize > 1;
