import { useLayoutEffect, useRef, useState } from "react";

/* Canvas geometry for the visualizers (DESIGN.md R6.1).

   THE RULE: the viewBox IS the measured canvas box — `0 0 box.width box.height`,
   with the <svg> at width/height 100%. User units are therefore CSS pixels and
   the viewBox can never disagree with the element's aspect ratio, so
   preserveAspectRatio has nothing to letterbox. Empty bands become structurally
   impossible rather than something to tune away.

   This replaced two earlier attempts that both failed:
   1. a viewBox built from fixed constants (a 220-unit bar band, an 84-unit tree
      level) rendered into a 100%-sized <svg> — `meet` centred the drawing and
      painted the leftover as dead space INSIDE the svg;
   2. sizing the <svg> itself to the content's aspect ratio (`fitBox`) — which
      merely moved the same dead space OUTSIDE the svg, into the panel.

   Because layout now happens in real pixels against the real box, every
   visualizer is responsible for spreading its content across both axes. Where a
   shape constraint (square cells, round nodes) leaves slack, the slack must go
   HORIZONTAL and centred — never vertical, which is what reads as broken.

   Nothing here crops to the content: a helper that returns tight content bounds
   is what made failure mode 1 possible, so the only viewBox this module can
   produce is the box itself. */

export interface Size {
  width: number;
  height: number;
}
export type CanvasBox = Size;

export interface Point {
  x: number;
  y: number;
}

export interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);

/* Two decimals is plenty for SVG user units and keeps attribute strings stable
   across re-measures, so React does not churn the DOM on sub-pixel noise. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

const isFinitePoint = (point: Point): boolean =>
  Number.isFinite(point.x) && Number.isFinite(point.y);

/* An axis whose whole span is under a millionth of a pixel is not a span, it is
   float noise — two points on the horizontal axis of an ellipse differ in y by
   ~1e-14 because sin(PI) is not 0. Stretching that to the full box would fling
   them to opposite edges, so it counts as degenerate and centres instead. */
const SPAN_EPSILON = 1e-6;

/* A pad wider than half its axis would push content past the far edge, so it is
   capped to leave at least one user unit of usable extent. */
const axisPad = (pad: number, extent: number): number =>
  Math.max(Math.min(Number.isFinite(pad) ? pad : 0, (extent - 1) / 2), 0);

export const viewBoxAttr = (viewBox: ViewBox): string =>
  [viewBox.minX, viewBox.minY, viewBox.width, viewBox.height].map(round2).join(" ");

/**
 * The viewBox that makes user units equal CSS pixels. Pair it with an <svg> at
 * width/height 100% and letterboxing cannot occur, because the viewBox and the
 * element always share an aspect ratio.
 */
export const boxViewBox = (box: Size): ViewBox => ({
  minX: 0,
  minY: 0,
  width: Math.max(box.width, 1),
  height: Math.max(box.height, 1),
});

/**
 * Spread `points` across `box` in BOTH axes, inset by `pad`.
 *
 * x and y are scaled independently on purpose: it is the POSITIONS that stretch,
 * while callers keep drawing round nodes at a single uniform radius, so the
 * drawing fills its canvas without any shape being squashed. This is what lets
 * authored coordinates (a graph whose x/y are baked into the algorithm's step
 * data) reach the edges instead of floating in the middle of a wide panel.
 *
 * A degenerate axis (every point sharing an x, a single node) centres on that
 * axis rather than dividing by zero.
 */
export const spreadToBox = (points: readonly Point[], box: Size, pad: number): Point[] => {
  const width = Math.max(box.width, 1);
  const height = Math.max(box.height, 1);
  const padX = axisPad(pad, width);
  const padY = axisPad(pad, height);
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;
  const centre = (): Point => ({ x: width / 2, y: height / 2 });

  const finite = points.filter(isFinitePoint);
  if (finite.length === 0) return points.map(centre);

  const xs = finite.map((point) => point.x);
  const ys = finite.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;

  return points.map((point) => {
    if (!isFinitePoint(point)) return centre();
    return {
      x: spanX > SPAN_EPSILON ? padX + ((point.x - minX) / spanX) * usableWidth : width / 2,
      y: spanY > SPAN_EPSILON ? padY + ((point.y - minY) / spanY) * usableHeight : height / 2,
    };
  });
};

/**
 * Closest distance between any two of `points`, or `fallback` when there is no
 * pair at all. Callers size a node radius from it — that is how a drawing can
 * scale up with the box without two nodes growing into each other — so the
 * answer has to be a usable number rather than Infinity.
 */
export const minPointSpacing = (points: readonly Point[], fallback: number): number => {
  const finite = points.filter(isFinitePoint);
  let closest = Infinity;

  for (let i = 0; i < finite.length; i += 1) {
    for (let j = i + 1; j < finite.length; j += 1) {
      closest = Math.min(closest, Math.hypot(finite[i].x - finite[j].x, finite[i].y - finite[j].y));
    }
  }

  return Number.isFinite(closest) ? closest : fallback;
};

/**
 * `count` points on the ellipse INSCRIBED in `box`, inset by `pad`, first point
 * at the top going clockwise.
 *
 * An ellipse, not a circle: a circle takes the smaller axis as its diameter and
 * leaves the rest of a wide panel empty, which is the whitespace R6.1 exists to
 * remove. A lone point centres; a pair lies along the box's long axis, since two
 * nodes stacked vertically would waste the whole width of a wide panel.
 */
export const ellipsePoints = (count: number, box: Size, pad: number): Point[] => {
  const width = Math.max(box.width, 1);
  const height = Math.max(box.height, 1);
  const cx = width / 2;
  const cy = height / 2;
  const total = Math.max(Math.floor(count) || 0, 0);

  if (total <= 1) return total === 1 ? [{ x: cx, y: cy }] : [];

  const rx = cx - axisPad(pad, width);
  const ry = cy - axisPad(pad, height);
  const start = total === 2 && width >= height ? Math.PI : -Math.PI / 2;

  return Array.from({ length: total }, (_, index) => {
    const angle = start + (2 * Math.PI * index) / total;
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
};

export interface SlotFit {
  size: number;
  gap: number;
  span: number;
}

/**
 * Split `available` px into `count` equal slots, as large as the run allows and
 * clamped to [min, max]. `span` is what the run actually occupies: it falls short
 * of `available` when `max` binds (the caller spends or centres the remainder)
 * and overshoots it when `min` binds, which the caller must detect — nothing
 * scales the drawing down any more, so an overshooting run has to be re-fitted
 * rather than clipped at the canvas edge.
 */
export const fitSlots = (
  count: number,
  available: number,
  gap: number,
  min: number,
  max: number,
): SlotFit => {
  const slots = Math.max(Math.floor(count) || 0, 1);
  const gaps = slots - 1;
  const slotGap = gaps > 0 ? Math.max(gap, 0) : 0;
  const raw = (available - slotGap * gaps) / slots;
  const size = Math.min(Math.max(Number.isFinite(raw) ? raw : min, min), max);
  return { size, gap: slotGap, span: size * slots + slotGap * gaps };
};

export interface TidySlot {
  id: string;
  depth: number;
  /** Fractional column index: leaves take whole slots, parents centre over theirs. */
  slot: number;
}

export interface TidyTree {
  slots: TidySlot[];
  leafCount: number;
  depth: number;
}

/**
 * Leaf-slot tidy layout in abstract units (column index, depth) so the caller can
 * stretch it across whatever pixel box it measured — that stretch is what makes a
 * tree fill its canvas height instead of ending at a fixed 84px-per-level band.
 *
 * `roots` may list every node id after the real roots: ids already placed are
 * skipped, which is how a forest — or a node no root reaches — still gets placed
 * exactly once instead of being silently dropped.
 */
export const tidyTreeSlots = (
  roots: readonly string[],
  childrenOf: (id: string) => readonly string[],
): TidyTree => {
  const slots: TidySlot[] = [];
  const placed = new Map<string, number>();
  const visiting = new Set<string>();
  let nextLeaf = 0;
  let depth = 0;

  const visit = (id: string, level: number): number | null => {
    const settled = placed.get(id);
    if (settled !== undefined) return settled;
    // Still on the stack: the edge closes a cycle, so it contributes no column.
    if (visiting.has(id)) return null;
    visiting.add(id);
    depth = Math.max(depth, level);

    const childSlots: number[] = [];
    childrenOf(id).forEach((childId) => {
      const childSlot = visit(childId, level + 1);
      if (childSlot !== null) childSlots.push(childSlot);
    });

    const slot =
      childSlots.length === 0
        ? nextLeaf++
        : (Math.min(...childSlots) + Math.max(...childSlots)) / 2;

    placed.set(id, slot);
    slots.push({ id, depth: level, slot });
    return slot;
  };

  roots.forEach((id) => visit(id, 0));

  return { slots, leafCount: Math.max(nextLeaf, 1), depth };
};

/**
 * Measures the canvas box so a drawing can be laid out in real pixels instead of
 * a guessed aspect ratio. The measured element must be the svg's own parent with
 * no padding, so its client box IS the svg viewport and `boxViewBox` stays exact.
 *
 * Some rendering environments provide no ResizeObserver or report a zero-sized
 * container, so `fallback` prevents the drawing from collapsing to nothing.
 *
 * Layout effect, not effect: measuring after the browser has painted would show
 * one frame of the fallback box letterboxed inside the real one — a flash of
 * exactly the defect this module exists to remove.
 */
export const useCanvasBox = (fallback: Size) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<Size>(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (width <= 0 || height <= 0) return;
      setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, box };
};
