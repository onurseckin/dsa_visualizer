import { useEffect, useRef, useState } from 'react';

/* Canvas geometry for the visualizers (DESIGN.md R5.3).

   The canvases used to letterbox. Each one built a viewBox from fixed constants
   (a 220-unit bar band, an 84-unit tree level, a 900x560 default box) and then
   rendered it into an <svg width="100%" height="100%">. Whenever that fixed
   ratio disagreed with the container's ratio — which it almost always did —
   `preserveAspectRatio="xMidYMid meet"` centred the drawing and painted the
   leftover as inset well: the empty bands above and below every visualization.

   The cure has three parts, all implemented here:
   1. layout is computed against the *measured* canvas box, so the drawing
      stretches into the space it actually has instead of a guessed ratio;
   2. the viewBox hugs real content bounds plus one small uniform padding;
   3. the <svg> element is sized to the content's own aspect ratio, so `meet`
      has nothing left to letterbox and the inset well hugs the drawing.

   Because (1) and (2) both enlarge the drawing and (3) only removes dead space,
   content always renders at the same scale or larger than before. */

export interface Size {
  width: number;
  height: number;
}

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

const isPositive = (value: number): boolean => Number.isFinite(value) && value > 0;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);

/* Two decimals is plenty for SVG user units and keeps attribute strings stable
   across re-measures, so React does not churn the DOM on sub-pixel noise. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

export const viewBoxAttr = (viewBox: ViewBox): string =>
  [viewBox.minX, viewBox.minY, viewBox.width, viewBox.height].map(round2).join(' ');

/**
 * Largest box with `content`'s aspect ratio that fits inside `box`. Scaling *up*
 * is the point: the drawing has to grow into the space the old fixed-ratio
 * viewBox wasted. Sizing the <svg> to this result makes `preserveAspectRatio` a
 * no-op, which is what removes the letterboxing.
 */
export const fitBox = (content: Size, box: Size): Size => {
  if (!isPositive(content.width) || !isPositive(content.height)) return box;
  if (!isPositive(box.width) || !isPositive(box.height)) return content;
  const scale = Math.min(box.width / content.width, box.height / content.height);
  return { width: content.width * scale, height: content.height * scale };
};

/** Tight bounds around `points`, grown by a uniform `pad` on all four sides. */
export const tightViewBox = (points: readonly Point[], pad: number, minSpan = 1): ViewBox => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach((point) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  if (!Number.isFinite(minX)) {
    const span = Math.max(minSpan, pad * 2);
    return { minX: 0, minY: 0, width: span, height: span };
  }

  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.max(maxX - minX + pad * 2, minSpan),
    height: Math.max(maxY - minY + pad * 2, minSpan),
  };
};

export interface SlotFit {
  size: number;
  gap: number;
  span: number;
}

/**
 * Split `available` px into `count` equal slots, as large as the run allows and
 * clamped to [min, max]. `span` is what the run actually occupies and is what the
 * tight viewBox is built from; it can exceed `available` once `min` binds, and
 * `fitBox` then scales the whole drawing down instead of clipping it.
 */
export const fitSlots = (
  count: number,
  available: number,
  gap: number,
  min: number,
  max: number
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
  childrenOf: (id: string) => readonly string[]
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
 * a guessed aspect ratio. jsdom implements no ResizeObserver and reports
 * zero-sized elements, so tests and the first paint keep `fallback` rather than
 * collapsing the drawing to nothing.
 */
export const useCanvasBox = (fallback: Size) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<Size>(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

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
