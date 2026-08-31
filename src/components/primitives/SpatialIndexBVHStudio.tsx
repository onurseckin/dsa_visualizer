import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Compass,
  Shuffle,
  Layers,
  Crosshair,
  Zap,
  Box,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCanvasBox } from "./vizGeometry";

// ============================================================================
// 1. DATA STRUCTURES, GEOMETRIC TYPES & CONTRACTS
// ============================================================================

export type SpatialModality =
  | "kd_tree_spatial_split"
  | "knn_nearest_neighbor"
  | "rtree_bounding_box"
  | "bvh_sah_ray_traversal";

export interface Point2D {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label?: string;
  readonly color?: string;
}

export interface AABB {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface Ray2D {
  readonly origin: Point2D;
  readonly direction: { readonly x: number; readonly y: number };
  readonly length?: number;
}

// --- KD-Tree Structures ---
export type KDTreeAxis = "x" | "y";

export interface KDSplitLine {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly axis: KDTreeAxis;
  readonly value: number;
  readonly depth: number;
}

export interface KDTreeNode {
  readonly id: string;
  readonly point: Point2D;
  readonly axis: KDTreeAxis;
  readonly depth: number;
  readonly bounds: AABB;
  readonly splitLine: KDSplitLine;
  readonly left: KDTreeNode | null;
  readonly right: KDTreeNode | null;
  readonly isLeaf: boolean;
  readonly size: number;
}

export interface KDSplitStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly activeNodeId?: string;
  readonly currentAxis: KDTreeAxis;
  readonly currentDepth: number;
  readonly currentBounds: AABB;
  readonly activePoints: readonly Point2D[];
  readonly medianPoint?: Point2D;
  readonly leftPoints?: readonly Point2D[];
  readonly rightPoints?: readonly Point2D[];
  readonly splitLine?: KDSplitLine;
  readonly completedTree?: KDTreeNode | null;
  readonly activeLines: readonly KDSplitLine[];
}

// --- k-NN Search Structures ---
export interface NeighborCandidate {
  readonly point: Point2D;
  readonly distance: number;
}

export interface KNNStepTrace {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly activeNodeId: string;
  readonly visitedPoint: Point2D;
  readonly distanceToQuery: number;
  readonly currentBestDist: number;
  readonly kNeighbors: readonly NeighborCandidate[];
  readonly searchRadius: number;
  readonly action:
    | "visit_node"
    | "evaluate_point"
    | "update_queue"
    | "traverse_near"
    | "check_far_plane"
    | "prune_far_branch"
    | "traverse_far"
    | "complete";
  readonly splitAxis: KDTreeAxis;
  readonly distanceToPlane: number;
  readonly isPruned: boolean;
  readonly prunedSubtreeIds: readonly string[];
  readonly visitedNodeIds: readonly string[];
  readonly targetSubtreeId?: string;
}

export interface KNNResult {
  readonly neighbors: readonly NeighborCandidate[];
  readonly steps: readonly KNNStepTrace[];
  readonly visitedNodesCount: number;
  readonly prunedSubtreesCount: number;
  readonly distanceCalculationsCount: number;
  readonly searchRadius: number;
}

// --- R-Tree Structures ---
export interface RTreeEntry {
  readonly id: string;
  readonly label: string;
  readonly bounds: AABB;
  readonly color?: string;
  readonly payload?: unknown;
}

export interface RTreeNode {
  readonly id: string;
  readonly isLeaf: boolean;
  readonly bounds: AABB;
  readonly children?: readonly RTreeNode[];
  readonly entries?: readonly RTreeEntry[];
  readonly depth: number;
}

export interface RTreeRangeStepTrace {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly activeNodeId: string;
  readonly evaluatedBounds: AABB;
  readonly intersectsQuery: boolean;
  readonly action:
    | "inspect_mbr"
    | "match_entry"
    | "miss_entry"
    | "prune_mbr"
    | "recurse_children"
    | "complete";
  readonly matchedEntries: readonly RTreeEntry[];
  readonly visitedNodeIds: readonly string[];
  readonly prunedNodeIds: readonly string[];
  readonly matchedNodeIds: readonly string[];
}

export interface RTreeRangeResult {
  readonly matchedEntries: readonly RTreeEntry[];
  readonly steps: readonly RTreeRangeStepTrace[];
  readonly totalVisitedMBRs: number;
  readonly totalPrunedMBRs: number;
}

// --- BVH SAH Structures ---
export type BVHPrimitiveType = "box" | "circle" | "triangle";

export interface BVHPrimitive {
  readonly id: string;
  readonly type: BVHPrimitiveType;
  readonly bounds: AABB;
  readonly label: string;
  readonly color: string;
  // Specific geometric attributes
  readonly circle?: { readonly cx: number; readonly cy: number; readonly radius: number };
  readonly triangle?: {
    readonly p1: Point2D;
    readonly p2: Point2D;
    readonly p3: Point2D;
  };
}

export interface BVHNode {
  readonly id: string;
  readonly bounds: AABB;
  readonly left: BVHNode | null;
  readonly right: BVHNode | null;
  readonly primitives?: readonly BVHPrimitive[];
  readonly isLeaf: boolean;
  readonly depth: number;
  readonly splitAxis?: KDTreeAxis;
  readonly splitPos?: number;
  readonly sahCost?: number;
  readonly primitiveCount: number;
}

export interface BVHBuildOptions {
  readonly maxPrimsPerLeaf?: number;
  readonly costTraversal?: number;
  readonly costIntersection?: number;
  readonly maxDepth?: number;
}

export interface RayHit {
  readonly hit: boolean;
  readonly t: number;
  readonly point?: Point2D;
  readonly normal?: Point2D;
  readonly primitiveId?: string;
  readonly primitive?: BVHPrimitive;
}

export interface BVHRayStepTrace {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly activeNodeId: string;
  readonly aabbHit: boolean;
  readonly tNear: number;
  readonly tFar: number;
  readonly action:
    | "test_aabb"
    | "hit_aabb"
    | "miss_aabb"
    | "test_primitive"
    | "hit_primitive"
    | "miss_primitive"
    | "prune_subvolume"
    | "complete";
  readonly closestHitT: number;
  readonly currentHit?: RayHit;
  readonly visitedNodeIds: readonly string[];
  readonly prunedNodeIds: readonly string[];
  readonly testedPrimitives: readonly string[];
  readonly hitPrimitives: readonly string[];
}

export interface BVHRayResult {
  readonly hit: RayHit | null;
  readonly steps: readonly BVHRayStepTrace[];
  readonly visitedAABBCount: number;
  readonly prunedAABBCount: number;
  readonly primitiveIntersectionsCount: number;
}

// --- Presets & Studio Props ---
export interface SpatialStudioPreset {
  readonly id: string;
  readonly name: string;
  readonly modality: SpatialModality;
  readonly description: string;
  readonly category: string;
  readonly points?: readonly Point2D[];
  readonly queryPoint?: Point2D;
  readonly k?: number;
  readonly rtreeEntries?: readonly RTreeEntry[];
  readonly searchRange?: AABB;
  readonly bvhPrimitives?: readonly BVHPrimitive[];
  readonly ray?: Ray2D;
}

export interface SpatialIndexBVHStudioProps {
  readonly initialModality?: SpatialModality;
  readonly initialPreset?: string;
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onModalityChange?: (modality: SpatialModality) => void;
}

// ============================================================================
// 2. PURE MATHEMATICAL & GEOMETRIC UTILITIES
// ============================================================================

export const EPSILON = 1e-9;

/**
 * Computes standard 2D Euclidean distance L2 between two points.
 */
export function euclideanDistance2D(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Computes squared 2D Euclidean distance L2^2.
 */
export function euclideanDistanceSquared2D(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

/**
 * Computes Minimum Bounding Box (AABB) union of two bounding boxes.
 */
export function aabbUnion(a: AABB, b: AABB): AABB {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/**
 * Computes AABB bounding all given points.
 */
export function aabbFromPoints(points: readonly Point2D[], pad: number = 0): AABB {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
}

/**
 * Computes the 2D surface area (width * height) of an AABB.
 */
export function aabbArea(box: AABB): number {
  const w = Math.max(0, box.maxX - box.minX);
  const h = Math.max(0, box.maxY - box.minY);
  return w * h;
}

/**
 * Computes the 2D half-surface area (perimeter / 2 = width + height).
 * In 2D BVH SAH, half-perimeter is the proportional measure of intersection probability.
 */
export function aabbHalfArea(box: AABB): number {
  const w = Math.max(0, box.maxX - box.minX);
  const h = Math.max(0, box.maxY - box.minY);
  return w + h;
}

/**
 * Checks whether two AABBs overlap/intersect.
 */
export function aabbIntersection(a: AABB, b: AABB): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

/**
 * Computes the intersection rectangle of two AABBs, or null if disjoint.
 */
export function aabbIntersectBox(a: AABB, b: AABB): AABB | null {
  if (!aabbIntersection(a, b)) return null;
  return {
    minX: Math.max(a.minX, b.minX),
    minY: Math.max(a.minY, b.minY),
    maxX: Math.min(a.maxX, b.maxX),
    maxY: Math.min(a.maxY, b.maxY),
  };
}

/**
 * Computes the minimum Euclidean distance from a point to an AABB.
 * If the point is inside the AABB, distance is 0.
 */
export function pointToAABBDistanceMin(p: Point2D, box: AABB): number {
  const clampedX = Math.max(box.minX, Math.min(p.x, box.maxX));
  const clampedY = Math.max(box.minY, Math.min(p.y, box.maxY));
  return Math.hypot(p.x - clampedX, p.y - clampedY);
}

/**
 * Computes the maximum Euclidean distance from a point to any corner of an AABB.
 */
export function pointToAABBDistanceMax(p: Point2D, box: AABB): number {
  const farX = Math.abs(p.x - box.minX) > Math.abs(p.x - box.maxX) ? box.minX : box.maxX;
  const farY = Math.abs(p.y - box.minY) > Math.abs(p.y - box.maxY) ? box.minY : box.maxY;
  return Math.hypot(p.x - farX, p.y - farY);
}

/**
 * Ray-AABB intersection test using the Slab Method (Kay-Kajiya / Smits).
 * Returns { hit: boolean, tNear: number, tFar: number }.
 */
export function rayAABBIntersect(
  ray: Ray2D,
  aabb: AABB,
): { hit: boolean; tNear: number; tFar: number } {
  const ox = ray.origin.x;
  const oy = ray.origin.y;
  const dx = ray.direction.x;
  const dy = ray.direction.y;

  let tNear = -Infinity;
  let tFar = Infinity;

  // X slab
  if (Math.abs(dx) < EPSILON) {
    if (ox < aabb.minX || ox > aabb.maxX) {
      return { hit: false, tNear: -Infinity, tFar: Infinity };
    }
  } else {
    let t1 = (aabb.minX - ox) / dx;
    let t2 = (aabb.maxX - ox) / dx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tNear = Math.max(tNear, t1);
    tFar = Math.min(tFar, t2);
    if (tNear > tFar || tFar < 0) {
      return { hit: false, tNear, tFar };
    }
  }

  // Y slab
  if (Math.abs(dy) < EPSILON) {
    if (oy < aabb.minY || oy > aabb.maxY) {
      return { hit: false, tNear: -Infinity, tFar: Infinity };
    }
  } else {
    let t1 = (aabb.minY - oy) / dy;
    let t2 = (aabb.maxY - oy) / dy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tNear = Math.max(tNear, t1);
    tFar = Math.min(tFar, t2);
    if (tNear > tFar || tFar < 0) {
      return { hit: false, tNear, tFar };
    }
  }

  return { hit: tNear <= tFar && tFar >= 0, tNear, tFar };
}

/**
 * Ray-Circle exact intersection.
 */
export function rayCircleIntersect(ray: Ray2D, cx: number, cy: number, radius: number): RayHit {
  const ox = ray.origin.x;
  const oy = ray.origin.y;
  const dx = ray.direction.x;
  const dy = ray.direction.y;

  const mx = ox - cx;
  const my = oy - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (mx * dx + my * dy);
  const c = mx * mx + my * my - radius * radius;

  const disc = b * b - 4 * a * c;
  if (disc < 0) return { hit: false, t: Infinity };

  const sqrtDisc = Math.sqrt(disc);
  let t = (-b - sqrtDisc) / (2 * a);
  if (t < EPSILON) {
    t = (-b + sqrtDisc) / (2 * a);
  }

  if (t < EPSILON) return { hit: false, t: Infinity };

  const hitX = ox + t * dx;
  const hitY = oy + t * dy;
  const normX = (hitX - cx) / radius;
  const normY = (hitY - cy) / radius;

  return {
    hit: true,
    t,
    point: { id: "hit_pt", x: hitX, y: hitY },
    normal: { id: "hit_norm", x: normX, y: normY },
  };
}

/**
 * Ray-Line Segment intersection.
 */
export function raySegmentIntersect(ray: Ray2D, p1: Point2D, p2: Point2D): RayHit {
  const ox = ray.origin.x;
  const oy = ray.origin.y;
  const dx = ray.direction.x;
  const dy = ray.direction.y;

  const sx = p2.x - p1.x;
  const sy = p2.y - p1.y;

  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < EPSILON) return { hit: false, t: Infinity };

  const qx = p1.x - ox;
  const qy = p1.y - oy;

  const t = (qx * sy - qy * sx) / denom;
  const u = (qx * dy - qy * dx) / denom;

  if (t >= EPSILON && u >= 0 && u <= 1) {
    const hitX = ox + t * dx;
    const hitY = oy + t * dy;
    // Normal perpendicular to segment
    const segLen = Math.hypot(sx, sy);
    const normX = -sy / (segLen || 1);
    const normY = sx / (segLen || 1);
    return {
      hit: true,
      t,
      point: { id: "hit_pt", x: hitX, y: hitY },
      normal: { id: "hit_norm", x: normX, y: normY },
    };
  }

  return { hit: false, t: Infinity };
}

/**
 * Ray-Primitive intersection dispatcher.
 */
export function rayPrimitiveIntersect(ray: Ray2D, prim: BVHPrimitive): RayHit {
  if (prim.type === "circle" && prim.circle) {
    const res = rayCircleIntersect(ray, prim.circle.cx, prim.circle.cy, prim.circle.radius);
    return { ...res, primitiveId: prim.id, primitive: prim };
  }

  if (prim.type === "triangle" && prim.triangle) {
    const { p1, p2, p3 } = prim.triangle;
    const hit1 = raySegmentIntersect(ray, p1, p2);
    const hit2 = raySegmentIntersect(ray, p2, p3);
    const hit3 = raySegmentIntersect(ray, p3, p1);

    let closestHit: RayHit = { hit: false, t: Infinity };
    for (const h of [hit1, hit2, hit3]) {
      if (h.hit && h.t < closestHit.t) {
        closestHit = h;
      }
    }
    return { ...closestHit, primitiveId: prim.id, primitive: prim };
  }

  // Box / Rect Primitive
  const slab = rayAABBIntersect(ray, prim.bounds);
  if (slab.hit) {
    const t = slab.tNear >= EPSILON ? slab.tNear : slab.tFar;
    if (t >= EPSILON) {
      const hitX = ray.origin.x + t * ray.direction.x;
      const hitY = ray.origin.y + t * ray.direction.y;
      return {
        hit: true,
        t,
        point: { id: "hit_pt", x: hitX, y: hitY },
        primitiveId: prim.id,
        primitive: prim,
      };
    }
  }

  return { hit: false, t: Infinity };
}

// ============================================================================
// 3. MODALITY 1: KD-TREE SPATIAL SPLIT ALGORITHMS
// ============================================================================

/**
 * Recursively builds a 2D KD-Tree from points.
 * Alternates split axis: depth % 2 === 0 ? 'x' : 'y'.
 */
export function buildKDTree2D(
  points: readonly Point2D[],
  depth: number = 0,
  maxDepth: number = 10,
  bounds: AABB = { minX: 0, minY: 0, maxX: 100, maxY: 100 },
): KDTreeNode | null {
  if (points.length === 0) return null;

  const axis: KDTreeAxis = depth % 2 === 0 ? "x" : "y";
  const sorted = [...points].sort((a, b) => (axis === "x" ? a.x - b.x : a.y - b.y));
  const midIdx = Math.floor(sorted.length / 2);
  const medianPoint = sorted[midIdx];

  const splitValue = axis === "x" ? medianPoint.x : medianPoint.y;
  const splitLine: KDSplitLine = {
    x1: axis === "x" ? splitValue : bounds.minX,
    y1: axis === "y" ? splitValue : bounds.minY,
    x2: axis === "x" ? splitValue : bounds.maxX,
    y2: axis === "y" ? splitValue : bounds.maxY,
    axis,
    value: splitValue,
    depth,
  };

  const leftBounds: AABB =
    axis === "x" ? { ...bounds, maxX: splitValue } : { ...bounds, maxY: splitValue };

  const rightBounds: AABB =
    axis === "x" ? { ...bounds, minX: splitValue } : { ...bounds, minY: splitValue };

  const leftPoints = sorted.slice(0, midIdx);
  const rightPoints = sorted.slice(midIdx + 1);

  const leftChild =
    depth < maxDepth && leftPoints.length > 0
      ? buildKDTree2D(leftPoints, depth + 1, maxDepth, leftBounds)
      : null;

  const rightChild =
    depth < maxDepth && rightPoints.length > 0
      ? buildKDTree2D(rightPoints, depth + 1, maxDepth, rightBounds)
      : null;

  return {
    id: `kd_node_${medianPoint.id}_d${depth}`,
    point: medianPoint,
    axis,
    depth,
    bounds,
    splitLine,
    left: leftChild,
    right: rightChild,
    isLeaf: leftChild === null && rightChild === null,
    size: points.length,
  };
}

/**
 * Collects all partition split lines from a built KD-Tree.
 */
export function collectKDTreeLines(root: KDTreeNode | null): KDSplitLine[] {
  if (!root) return [];
  const lines: KDSplitLine[] = [root.splitLine];
  if (root.left) lines.push(...collectKDTreeLines(root.left));
  if (root.right) lines.push(...collectKDTreeLines(root.right));
  return lines;
}

/**
 * Generates an interactive, step-by-step trace of KD-Tree construction.
 */
export function generateKDSplitSteps(
  points: readonly Point2D[],
  bounds: AABB = { minX: 0, minY: 0, maxX: 100, maxY: 100 },
): KDSplitStep[] {
  const steps: KDSplitStep[] = [];
  const fullTree = buildKDTree2D(points, 0, 10, bounds);
  const activeLines: KDSplitLine[] = [];

  // Initial step
  steps.push({
    stepIndex: 0,
    phase: "Initialization",
    title: "Initial 2D Spatial Domain",
    description: `Loaded ${points.length} points across domain [${bounds.minX}..${bounds.maxX}] × [${bounds.minY}..${bounds.maxY}]. Ready to partition.`,
    currentAxis: "x",
    currentDepth: 0,
    currentBounds: bounds,
    activePoints: points,
    activeLines: [],
    completedTree: null,
  });

  if (points.length === 0) return steps;

  interface QueueItem {
    readonly pts: readonly Point2D[];
    readonly depth: number;
    readonly bnds: AABB;
  }

  const queue: QueueItem[] = [{ pts: points, depth: 0, bnds: bounds }];

  while (queue.length > 0) {
    const { pts, depth, bnds } = queue.shift()!;
    if (pts.length === 0) continue;

    const axis: KDTreeAxis = depth % 2 === 0 ? "x" : "y";
    const sorted = [...pts].sort((a, b) => (axis === "x" ? a.x - b.x : a.y - b.y));
    const midIdx = Math.floor(sorted.length / 2);
    const median = sorted[midIdx];
    const splitVal = axis === "x" ? median.x : median.y;

    const splitLine: KDSplitLine = {
      x1: axis === "x" ? splitVal : bnds.minX,
      y1: axis === "y" ? splitVal : bnds.minY,
      x2: axis === "x" ? splitVal : bnds.maxX,
      y2: axis === "y" ? splitVal : bnds.maxY,
      axis,
      value: splitVal,
      depth,
    };

    activeLines.push(splitLine);

    const leftPts = sorted.slice(0, midIdx);
    const rightPts = sorted.slice(midIdx + 1);

    const leftBnds: AABB = axis === "x" ? { ...bnds, maxX: splitVal } : { ...bnds, maxY: splitVal };
    const rightBnds: AABB =
      axis === "x" ? { ...bnds, minX: splitVal } : { ...bnds, minY: splitVal };

    steps.push({
      stepIndex: steps.length,
      phase: `Depth ${depth} Split (${axis.toUpperCase()}-Axis)`,
      title: `Partition at Median ${median.label ?? median.id} (${median.x}, ${median.y})`,
      description: `Sorted ${pts.length} points on ${axis.toUpperCase()}-axis. Median is ${median.label ?? median.id} at ${axis}=${splitVal}. Subdividing into Left (${leftPts.length} pts) and Right (${rightPts.length} pts).`,
      activeNodeId: `kd_node_${median.id}_d${depth}`,
      currentAxis: axis,
      currentDepth: depth,
      currentBounds: bnds,
      activePoints: pts,
      medianPoint: median,
      leftPoints: leftPts,
      rightPoints: rightPts,
      splitLine,
      activeLines: [...activeLines],
      completedTree: null,
    });

    if (leftPts.length > 0) queue.push({ pts: leftPts, depth: depth + 1, bnds: leftBnds });
    if (rightPts.length > 0) queue.push({ pts: rightPts, depth: depth + 1, bnds: rightBnds });
  }

  // Final summary step
  steps.push({
    stepIndex: steps.length,
    phase: "KD-Tree Complete",
    title: "Spatial Partition Complete",
    description: `Successfully partitioned ${points.length} points into KD-Tree hierarchy of depth ${fullTree ? getTreeDepth(fullTree) : 0}.`,
    currentAxis: "x",
    currentDepth: fullTree ? getTreeDepth(fullTree) : 0,
    currentBounds: bounds,
    activePoints: points,
    activeLines: [...activeLines],
    completedTree: fullTree,
  });

  return steps;
}

export function getTreeDepth(node: KDTreeNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}
export const getKDTreeDepth = getTreeDepth;

export function countTreeNodes(node: KDTreeNode | null): number {
  if (!node) return 0;
  return 1 + countTreeNodes(node.left) + countTreeNodes(node.right);
}
export const countKDTreeNodes = countTreeNodes;

// ============================================================================
// 4. MODALITY 2: K-NN NEAREST NEIGHBOR SEARCH WITH BRANCH PRUNING
// ============================================================================

/**
 * Pure function: Executes exact k-NN search on KD-Tree.
 */
export function findKNearestNeighbors(
  kdTree: KDTreeNode | null,
  queryPoint: Point2D,
  k: number = 3,
): KNNResult {
  const steps: KNNStepTrace[] = [];
  const neighbors: NeighborCandidate[] = [];
  const visitedNodeIds: string[] = [];
  const prunedSubtreeIds: string[] = [];
  let distCalcs = 0;

  function updateQueue(pt: Point2D, dist: number) {
    neighbors.push({ point: pt, distance: dist });
    neighbors.sort((a, b) => a.distance - b.distance);
    if (neighbors.length > k) {
      neighbors.pop();
    }
  }

  function getSearchRadius(): number {
    return neighbors.length < k ? Infinity : neighbors[neighbors.length - 1].distance;
  }

  function collectSubtreeIds(node: KDTreeNode | null): string[] {
    if (!node) return [];
    return [node.id, ...collectSubtreeIds(node.left), ...collectSubtreeIds(node.right)];
  }

  function search(node: KDTreeNode | null) {
    if (!node) return;

    visitedNodeIds.push(node.id);
    const d = euclideanDistance2D(queryPoint, node.point);
    distCalcs++;
    updateQueue(node.point, d);

    const radius = getSearchRadius();
    const axis = node.axis;
    const queryVal = axis === "x" ? queryPoint.x : queryPoint.y;
    const nodeVal = axis === "x" ? node.point.x : node.point.y;
    const distanceToPlane = Math.abs(queryVal - nodeVal);

    steps.push({
      stepIndex: steps.length,
      phase: `Visit Node ${node.point.label ?? node.point.id}`,
      title: `Evaluate Node (${node.point.x}, ${node.point.y})`,
      description: `Distance to query probe: ${d.toFixed(2)}. Current best search radius r_best = ${radius === Infinity ? "∞" : radius.toFixed(2)}.`,
      activeNodeId: node.id,
      visitedPoint: node.point,
      distanceToQuery: d,
      currentBestDist: radius,
      kNeighbors: [...neighbors],
      searchRadius: radius,
      action: "evaluate_point",
      splitAxis: axis,
      distanceToPlane,
      isPruned: false,
      prunedSubtreeIds: [...prunedSubtreeIds],
      visitedNodeIds: [...visitedNodeIds],
    });

    const nearChild = queryVal < nodeVal ? node.left : node.right;
    const farChild = queryVal < nodeVal ? node.right : node.left;

    // Traverse closer branch first
    if (nearChild) {
      search(nearChild);
    }

    // Check if far branch needs to be explored
    const currentR = getSearchRadius();
    if (farChild) {
      if (distanceToPlane < currentR) {
        steps.push({
          stepIndex: steps.length,
          phase: `Plane Check (Split ${axis.toUpperCase()}=${nodeVal})`,
          title: `Traverse Opposite Subtree`,
          description: `Plane distance |${queryVal.toFixed(1)} - ${nodeVal.toFixed(1)}| = ${distanceToPlane.toFixed(2)} < r_best (${currentR === Infinity ? "∞" : currentR.toFixed(2)}). Far branch may contain closer points.`,
          activeNodeId: node.id,
          visitedPoint: node.point,
          distanceToQuery: d,
          currentBestDist: currentR,
          kNeighbors: [...neighbors],
          searchRadius: currentR,
          action: "traverse_far",
          splitAxis: axis,
          distanceToPlane,
          isPruned: false,
          prunedSubtreeIds: [...prunedSubtreeIds],
          visitedNodeIds: [...visitedNodeIds],
          targetSubtreeId: farChild.id,
        });
        search(farChild);
      } else {
        const prunedIds = collectSubtreeIds(farChild);
        prunedSubtreeIds.push(...prunedIds);
        steps.push({
          stepIndex: steps.length,
          phase: `Prune Subtree (${farChild.point.label ?? farChild.point.id})`,
          title: `Branch Pruned: Hypersphere Bound Exceeded`,
          description: `Plane distance |${queryVal.toFixed(1)} - ${nodeVal.toFixed(1)}| = ${distanceToPlane.toFixed(2)} ≥ r_best (${currentR.toFixed(2)}). Entire opposite subtree pruned (${prunedIds.length} nodes skipped).`,
          activeNodeId: node.id,
          visitedPoint: node.point,
          distanceToQuery: d,
          currentBestDist: currentR,
          kNeighbors: [...neighbors],
          searchRadius: currentR,
          action: "prune_far_branch",
          splitAxis: axis,
          distanceToPlane,
          isPruned: true,
          prunedSubtreeIds: [...prunedSubtreeIds],
          visitedNodeIds: [...visitedNodeIds],
          targetSubtreeId: farChild.id,
        });
      }
    }
  }

  if (kdTree) {
    search(kdTree);
  }

  // Completion step
  steps.push({
    stepIndex: steps.length,
    phase: "k-NN Search Complete",
    title: `Found ${neighbors.length} Nearest Neighbors`,
    description: `Optimal ${k}-NN query finished. Visited ${visitedNodeIds.length} nodes, pruned ${prunedSubtreeIds.length} subtrees, ${distCalcs} distance evaluations.`,
    activeNodeId: "search_root",
    visitedPoint: queryPoint,
    distanceToQuery: 0,
    currentBestDist: getSearchRadius(),
    kNeighbors: [...neighbors],
    searchRadius: getSearchRadius(),
    action: "complete",
    splitAxis: "x",
    distanceToPlane: 0,
    isPruned: false,
    prunedSubtreeIds: [...prunedSubtreeIds],
    visitedNodeIds: [...visitedNodeIds],
  });

  return {
    neighbors,
    steps,
    visitedNodesCount: visitedNodeIds.length,
    prunedSubtreesCount: prunedSubtreeIds.length,
    distanceCalculationsCount: distCalcs,
    searchRadius: getSearchRadius(),
  };
}

/**
 * Generates an interactive, step-by-step trace of k-NN search.
 */
export function generateKNNSteps(
  kdTree: KDTreeNode | null,
  queryPoint: Point2D,
  k: number = 3,
): readonly KNNStepTrace[] {
  return findKNearestNeighbors(kdTree, queryPoint, k).steps;
}

// ============================================================================
// 5. MODALITY 3: R-TREE MINIMUM BOUNDING RECTANGLE & QUADRATIC SPLIT
// ============================================================================

/**
 * Guttman's Quadratic Split: PickSeeds algorithm.
 * Finds the two entries that would waste the most area if put in the same node.
 */
export function pickSeeds(entries: readonly RTreeEntry[]): [number, number] {
  let maxWaste = -Infinity;
  let seed1 = 0;
  let seed2 = 1;

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const unionMBR = aabbUnion(entries[i].bounds, entries[j].bounds);
      const unionArea = aabbArea(unionMBR);
      const area1 = aabbArea(entries[i].bounds);
      const area2 = aabbArea(entries[j].bounds);
      const waste = unionArea - area1 - area2;

      if (waste > maxWaste) {
        maxWaste = waste;
        seed1 = i;
        seed2 = j;
      }
    }
  }

  return [seed1, seed2];
}

/**
 * Guttman's Quadratic Split: PickNext algorithm.
 * Selects the next entry to be assigned to one of the groups based on maximum area preference difference.
 */
export function pickNext(
  remaining: readonly RTreeEntry[],
  group1: readonly RTreeEntry[],
  group2: readonly RTreeEntry[],
): { index: number; group: 1 | 2 } {
  const mbr1 = group1.reduce((acc, e) => aabbUnion(acc, e.bounds), group1[0].bounds);
  const mbr2 = group2.reduce((acc, e) => aabbUnion(acc, e.bounds), group2[0].bounds);
  const area1 = aabbArea(mbr1);
  const area2 = aabbArea(mbr2);

  let maxDiff = -Infinity;
  let chosenIdx = 0;
  let chosenGroup: 1 | 2 = 1;

  for (let i = 0; i < remaining.length; i++) {
    const e = remaining[i];
    const dArea1 = aabbArea(aabbUnion(mbr1, e.bounds)) - area1;
    const dArea2 = aabbArea(aabbUnion(mbr2, e.bounds)) - area2;
    const diff = Math.abs(dArea1 - dArea2);

    if (diff > maxDiff) {
      maxDiff = diff;
      chosenIdx = i;
      if (dArea1 < dArea2) {
        chosenGroup = 1;
      } else if (dArea2 < dArea1) {
        chosenGroup = 2;
      } else if (area1 < area2) {
        chosenGroup = 1;
      } else if (area2 < area1) {
        chosenGroup = 2;
      } else {
        chosenGroup = group1.length <= group2.length ? 1 : 2;
      }
    }
  }

  return { index: chosenIdx, group: chosenGroup };
}

/**
 * Splits an array of entries into two groups using Guttman's Quadratic Split.
 */
export function quadraticSplit(
  entries: readonly RTreeEntry[],
  minEntries: number = 2,
): { group1: RTreeEntry[]; group2: RTreeEntry[]; mbr1: AABB; mbr2: AABB } {
  if (entries.length <= 2) {
    const e1 = entries[0] ? [entries[0]] : [];
    const e2 = entries[1] ? [entries[1]] : [];
    const m1 = e1[0] ? e1[0].bounds : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const m2 = e2[0] ? e2[0].bounds : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { group1: e1, group2: e2, mbr1: m1, mbr2: m2 };
  }

  const [s1, s2] = pickSeeds(entries);
  const group1: RTreeEntry[] = [entries[s1]];
  const group2: RTreeEntry[] = [entries[s2]];
  const remaining = entries.filter((_, idx) => idx !== s1 && idx !== s2);

  while (remaining.length > 0) {
    if (group1.length + remaining.length === minEntries) {
      group1.push(...remaining);
      break;
    }
    if (group2.length + remaining.length === minEntries) {
      group2.push(...remaining);
      break;
    }

    const { index, group } = pickNext(remaining, group1, group2);
    const chosen = remaining.splice(index, 1)[0];
    if (group === 1) {
      group1.push(chosen);
    } else {
      group2.push(chosen);
    }
  }

  const mbr1 = group1.reduce((acc, e) => aabbUnion(acc, e.bounds), group1[0].bounds);
  const mbr2 = group2.reduce((acc, e) => aabbUnion(acc, e.bounds), group2[0].bounds);

  return { group1, group2, mbr1, mbr2 };
}

/**
 * Builds a hierarchical 2D R-Tree using recursive spatial clustering / Quadratic Split.
 */
export function buildRTree2D(
  entries: readonly RTreeEntry[],
  maxEntries: number = 4,
  minEntries: number = 2,
  depth: number = 0,
): RTreeNode | null {
  if (entries.length === 0) return null;

  if (entries.length <= maxEntries) {
    const mbr = entries.reduce((acc, e) => aabbUnion(acc, e.bounds), entries[0].bounds);
    return {
      id: `rtree_leaf_d${depth}_${entries[0].id}`,
      isLeaf: true,
      bounds: mbr,
      entries: [...entries],
      depth,
    };
  }

  // Split entries into two clusters
  const { group1, group2 } = quadraticSplit(entries, minEntries);

  const leftChild = buildRTree2D(group1, maxEntries, minEntries, depth + 1);
  const rightChild = buildRTree2D(group2, maxEntries, minEntries, depth + 1);

  const children = [leftChild, rightChild].filter((c): c is RTreeNode => c !== null);
  const mbr = children.reduce((acc, c) => aabbUnion(acc, c.bounds), children[0].bounds);

  return {
    id: `rtree_node_d${depth}_${children[0].id}`,
    isLeaf: false,
    bounds: mbr,
    children,
    depth,
  };
}

/**
 * Range window query on R-Tree with step trace recording.
 */
export function queryRTreeRange(rtreeRoot: RTreeNode | null, rangeAABB: AABB): RTreeRangeResult {
  const steps: RTreeRangeStepTrace[] = [];
  const matchedEntries: RTreeEntry[] = [];
  const visitedNodeIds: string[] = [];
  const prunedNodeIds: string[] = [];
  const matchedNodeIds: string[] = [];

  function query(node: RTreeNode | null) {
    if (!node) return;

    visitedNodeIds.push(node.id);
    const intersects = aabbIntersection(node.bounds, rangeAABB);

    if (!intersects) {
      prunedNodeIds.push(node.id);
      steps.push({
        stepIndex: steps.length,
        phase: `Prune MBR (Depth ${node.depth})`,
        title: `MBR Disjoint with Window`,
        description: `Node bounds [${node.bounds.minX.toFixed(0)}, ${node.bounds.minY.toFixed(0)}] × [${node.bounds.maxX.toFixed(0)}, ${node.bounds.maxY.toFixed(0)}] do not overlap query range. Subtree pruned.`,
        activeNodeId: node.id,
        evaluatedBounds: node.bounds,
        intersectsQuery: false,
        action: "prune_mbr",
        matchedEntries: [...matchedEntries],
        visitedNodeIds: [...visitedNodeIds],
        prunedNodeIds: [...prunedNodeIds],
        matchedNodeIds: [...matchedNodeIds],
      });
      return;
    }

    matchedNodeIds.push(node.id);

    if (node.isLeaf && node.entries) {
      steps.push({
        stepIndex: steps.length,
        phase: `Evaluate Leaf Entries`,
        title: `Leaf MBR Intersects Query`,
        description: `Inspecting ${node.entries.length} candidate primitives inside leaf node.`,
        activeNodeId: node.id,
        evaluatedBounds: node.bounds,
        intersectsQuery: true,
        action: "inspect_mbr",
        matchedEntries: [...matchedEntries],
        visitedNodeIds: [...visitedNodeIds],
        prunedNodeIds: [...prunedNodeIds],
        matchedNodeIds: [...matchedNodeIds],
      });

      for (const e of node.entries) {
        if (aabbIntersection(e.bounds, rangeAABB)) {
          matchedEntries.push(e);
          steps.push({
            stepIndex: steps.length,
            phase: `Match Item ${e.label}`,
            title: `Item Overlaps Query Range`,
            description: `Entry "${e.label}" bounds [${e.bounds.minX}, ${e.bounds.minY}] × [${e.bounds.maxX}, ${e.bounds.maxY}] intersect search window. Added to results.`,
            activeNodeId: node.id,
            evaluatedBounds: e.bounds,
            intersectsQuery: true,
            action: "match_entry",
            matchedEntries: [...matchedEntries],
            visitedNodeIds: [...visitedNodeIds],
            prunedNodeIds: [...prunedNodeIds],
            matchedNodeIds: [...matchedNodeIds],
          });
        }
      }
    } else if (node.children) {
      steps.push({
        stepIndex: steps.length,
        phase: `Recurse Children (Depth ${node.depth})`,
        title: `Internal MBR Intersects Query`,
        description: `Internal node intersects query window. Traversing ${node.children.length} child MBRs.`,
        activeNodeId: node.id,
        evaluatedBounds: node.bounds,
        intersectsQuery: true,
        action: "recurse_children",
        matchedEntries: [...matchedEntries],
        visitedNodeIds: [...visitedNodeIds],
        prunedNodeIds: [...prunedNodeIds],
        matchedNodeIds: [...matchedNodeIds],
      });

      for (const child of node.children) {
        query(child);
      }
    }
  }

  if (rtreeRoot) {
    query(rtreeRoot);
  }

  // Completion step
  steps.push({
    stepIndex: steps.length,
    phase: "Query Complete",
    title: `Matched ${matchedEntries.length} Items`,
    description: `Range query completed. Evaluated ${visitedNodeIds.length} MBRs, pruned ${prunedNodeIds.length} subtrees, retrieved ${matchedEntries.length} items.`,
    activeNodeId: "range_query_done",
    evaluatedBounds: rangeAABB,
    intersectsQuery: true,
    action: "complete",
    matchedEntries: [...matchedEntries],
    visitedNodeIds: [...visitedNodeIds],
    prunedNodeIds: [...prunedNodeIds],
    matchedNodeIds: [...matchedNodeIds],
  });

  return {
    matchedEntries,
    steps,
    totalVisitedMBRs: visitedNodeIds.length,
    totalPrunedMBRs: prunedNodeIds.length,
  };
}

/**
 * Generates an interactive, step-by-step trace of R-Tree range window search.
 */
export function generateRTreeRangeQuerySteps(
  rtreeRoot: RTreeNode | null,
  rangeAABB: AABB,
): readonly RTreeRangeStepTrace[] {
  return queryRTreeRange(rtreeRoot, rangeAABB).steps;
}

// ============================================================================
// 6. MODALITY 4: BVH SURFACE AREA HEURISTIC (SAH) & RAY CAST TRAVERSAL
// ============================================================================

/**
 * Computes SAH partition cost:
 * C(split) = C_trav + (SA(A)/SA(P))*N_A*C_isect + (SA(B)/SA(P))*N_B*C_isect
 */
export function computeSAHCost(
  primitivesA: readonly BVHPrimitive[],
  primitivesB: readonly BVHPrimitive[],
  parentBounds: AABB,
  cTrav: number = 1.0,
  cIsect: number = 1.0,
): number {
  if (primitivesA.length === 0 || primitivesB.length === 0) return Infinity;

  const mbrA = primitivesA.reduce((acc, p) => aabbUnion(acc, p.bounds), primitivesA[0].bounds);
  const mbrB = primitivesB.reduce((acc, p) => aabbUnion(acc, p.bounds), primitivesB[0].bounds);

  const saParent = aabbHalfArea(parentBounds);
  if (saParent <= EPSILON) return cTrav + (primitivesA.length + primitivesB.length) * cIsect;

  const saA = aabbHalfArea(mbrA);
  const saB = aabbHalfArea(mbrB);

  const probA = saA / saParent;
  const probB = saB / saParent;

  return cTrav + probA * primitivesA.length * cIsect + probB * primitivesB.length * cIsect;
}

/**
 * Builds a Bounding Volume Hierarchy (BVH) using Surface Area Heuristic (SAH) spatial binning.
 */
export function buildBVHWithSAH(
  primitives: readonly BVHPrimitive[],
  options: BVHBuildOptions = {},
  depth: number = 0,
): BVHNode | null {
  if (primitives.length === 0) return null;

  const maxPrims = options.maxPrimsPerLeaf ?? 2;
  const cTrav = options.costTraversal ?? 1.0;
  const cIsect = options.costIntersection ?? 1.0;
  const maxDepth = options.maxDepth ?? 12;

  const parentMBR = primitives.reduce((acc, p) => aabbUnion(acc, p.bounds), primitives[0].bounds);

  // Leaf condition
  if (primitives.length <= maxPrims || depth >= maxDepth) {
    return {
      id: `bvh_leaf_d${depth}_${primitives[0].id}`,
      bounds: parentMBR,
      left: null,
      right: null,
      primitives: [...primitives],
      isLeaf: true,
      depth,
      primitiveCount: primitives.length,
      sahCost: primitives.length * cIsect,
    };
  }

  const noSplitCost = primitives.length * cIsect;
  let bestCost = Infinity;
  let bestAxis: KDTreeAxis = "x";
  let bestSplitIndex = -1;
  let bestSortedPrims: BVHPrimitive[] = [];

  // Evaluate candidate splits along X and Y axes
  for (const axis of ["x", "y"] as const) {
    const sorted = [...primitives].sort((a, b) => {
      const ca =
        axis === "x" ? (a.bounds.minX + a.bounds.maxX) / 2 : (a.bounds.minY + a.bounds.maxY) / 2;
      const cb =
        axis === "x" ? (b.bounds.minX + b.bounds.maxX) / 2 : (b.bounds.minY + b.bounds.maxY) / 2;
      return ca - cb;
    });

    for (let i = 1; i < sorted.length; i++) {
      const leftPrims = sorted.slice(0, i);
      const rightPrims = sorted.slice(i);
      const cost = computeSAHCost(leftPrims, rightPrims, parentMBR, cTrav, cIsect);

      if (cost < bestCost) {
        bestCost = cost;
        bestAxis = axis;
        bestSplitIndex = i;
        bestSortedPrims = sorted;
      }
    }
  }

  // If splitting does not improve cost and number of primitives is small, make leaf
  if (bestCost >= noSplitCost && primitives.length <= 4) {
    return {
      id: `bvh_leaf_d${depth}_${primitives[0].id}`,
      bounds: parentMBR,
      left: null,
      right: null,
      primitives: [...primitives],
      isLeaf: true,
      depth,
      primitiveCount: primitives.length,
      sahCost: noSplitCost,
    };
  }

  const leftPrims = bestSortedPrims.slice(0, bestSplitIndex);
  const rightPrims = bestSortedPrims.slice(bestSplitIndex);

  const leftChild = buildBVHWithSAH(leftPrims, options, depth + 1);
  const rightChild = buildBVHWithSAH(rightPrims, options, depth + 1);

  return {
    id: `bvh_node_d${depth}_${primitives[0].id}`,
    bounds: parentMBR,
    left: leftChild,
    right: rightChild,
    isLeaf: false,
    depth,
    splitAxis: bestAxis,
    sahCost: bestCost,
    primitiveCount: primitives.length,
  };
}

/**
 * Traverses BVH with a Ray cast using front-to-back slab intersection ordering.
 */
export function traverseBVHRay(bvhRoot: BVHNode | null, ray: Ray2D): BVHRayResult {
  const steps: BVHRayStepTrace[] = [];
  const visitedNodeIds: string[] = [];
  const prunedNodeIds: string[] = [];
  const testedPrimitives: string[] = [];
  const hitPrimitives: string[] = [];
  const hitTracker: { current: RayHit | null } = { current: null };
  let primIsects = 0;

  function traverse(node: BVHNode | null) {
    if (!node) return;

    visitedNodeIds.push(node.id);
    const slab = rayAABBIntersect(ray, node.bounds);

    if (!slab.hit) {
      prunedNodeIds.push(node.id);
      steps.push({
        stepIndex: steps.length,
        phase: `Ray-AABB Miss (Depth ${node.depth})`,
        title: `Missed Bounding Volume`,
        description: `Ray does not intersect AABB [${node.bounds.minX.toFixed(1)}, ${node.bounds.minY.toFixed(1)}] × [${node.bounds.maxX.toFixed(1)}, ${node.bounds.maxY.toFixed(1)}]. Subtree pruned.`,
        activeNodeId: node.id,
        aabbHit: false,
        tNear: slab.tNear,
        tFar: slab.tFar,
        action: "miss_aabb",
        closestHitT: hitTracker.current ? hitTracker.current.t : Infinity,
        currentHit: hitTracker.current ?? undefined,
        visitedNodeIds: [...visitedNodeIds],
        prunedNodeIds: [...prunedNodeIds],
        testedPrimitives: [...testedPrimitives],
        hitPrimitives: [...hitPrimitives],
      });
      return;
    }

    // If slab entry is farther than closest hit, prune!
    if (hitTracker.current && slab.tNear > hitTracker.current.t) {
      prunedNodeIds.push(node.id);
      steps.push({
        stepIndex: steps.length,
        phase: `Occlusion Prune (Depth ${node.depth})`,
        title: `Subtree Occluded by Closer Hit`,
        description: `AABB entry t_near (${slab.tNear.toFixed(2)}) > closest hit t (${hitTracker.current.t.toFixed(2)}). Subtree pruned.`,
        activeNodeId: node.id,
        aabbHit: true,
        tNear: slab.tNear,
        tFar: slab.tFar,
        action: "prune_subvolume",
        closestHitT: hitTracker.current.t,
        currentHit: hitTracker.current,
        visitedNodeIds: [...visitedNodeIds],
        prunedNodeIds: [...prunedNodeIds],
        testedPrimitives: [...testedPrimitives],
        hitPrimitives: [...hitPrimitives],
      });
      return;
    }

    steps.push({
      stepIndex: steps.length,
      phase: `Ray-AABB Hit (Depth ${node.depth})`,
      title: `Intersected Bounding Volume`,
      description: `Ray entered volume at t_near=${slab.tNear.toFixed(2)}, exited at t_far=${slab.tFar.toFixed(2)}.`,
      activeNodeId: node.id,
      aabbHit: true,
      tNear: slab.tNear,
      tFar: slab.tFar,
      action: "hit_aabb",
      closestHitT: hitTracker.current ? hitTracker.current.t : Infinity,
      currentHit: hitTracker.current ?? undefined,
      visitedNodeIds: [...visitedNodeIds],
      prunedNodeIds: [...prunedNodeIds],
      testedPrimitives: [...testedPrimitives],
      hitPrimitives: [...hitPrimitives],
    });

    if (node.isLeaf && node.primitives) {
      for (const prim of node.primitives) {
        testedPrimitives.push(prim.id);
        primIsects++;
        const hit = rayPrimitiveIntersect(ray, prim);

        if (hit.hit && hit.t < (hitTracker.current ? hitTracker.current.t : Infinity)) {
          hitTracker.current = hit;
          hitPrimitives.push(prim.id);
          steps.push({
            stepIndex: steps.length,
            phase: `Primitive Hit (${prim.label})`,
            title: `New Closest Ray Hit!`,
            description: `Intersected ${prim.type} "${prim.label}" at t=${hit.t.toFixed(2)}, point (${hit.point?.x.toFixed(1)}, ${hit.point?.y.toFixed(1)}).`,
            activeNodeId: node.id,
            aabbHit: true,
            tNear: slab.tNear,
            tFar: slab.tFar,
            action: "hit_primitive",
            closestHitT: hit.t,
            currentHit: hit,
            visitedNodeIds: [...visitedNodeIds],
            prunedNodeIds: [...prunedNodeIds],
            testedPrimitives: [...testedPrimitives],
            hitPrimitives: [...hitPrimitives],
          });
        } else {
          steps.push({
            stepIndex: steps.length,
            phase: `Primitive Test (${prim.label})`,
            title: hit.hit ? `Occluded Hit Ignored` : `Primitive Miss`,
            description: hit.hit
              ? `Hit ${prim.label} at t=${hit.t.toFixed(2)} which is behind current closest hit t=${hitTracker.current?.t.toFixed(2)}.`
              : `Ray did not intersect primitive "${prim.label}".`,
            activeNodeId: node.id,
            aabbHit: true,
            tNear: slab.tNear,
            tFar: slab.tFar,
            action: "miss_primitive",
            closestHitT: hitTracker.current ? hitTracker.current.t : Infinity,
            currentHit: hitTracker.current ?? undefined,
            visitedNodeIds: [...visitedNodeIds],
            prunedNodeIds: [...prunedNodeIds],
            testedPrimitives: [...testedPrimitives],
            hitPrimitives: [...hitPrimitives],
          });
        }
      }
    } else {
      // Internal node: determine traversal order by testing slab tNear
      const leftSlab = node.left
        ? rayAABBIntersect(ray, node.left.bounds)
        : { hit: false, tNear: Infinity, tFar: -Infinity };
      const rightSlab = node.right
        ? rayAABBIntersect(ray, node.right.bounds)
        : { hit: false, tNear: Infinity, tFar: -Infinity };

      const firstChild = leftSlab.tNear <= rightSlab.tNear ? node.left : node.right;
      const secondChild = leftSlab.tNear <= rightSlab.tNear ? node.right : node.left;

      traverse(firstChild);
      traverse(secondChild);
    }
  }

  if (bvhRoot) {
    traverse(bvhRoot);
  }

  const finalHit = hitTracker.current;

  // Completion step
  steps.push({
    stepIndex: steps.length,
    phase: "Ray Traversal Complete",
    title: finalHit ? `Ray Cast Hit (${finalHit.primitive?.label})` : "Ray Cast Miss",
    description: finalHit
      ? `Ray hit ${finalHit.primitive?.type} "${finalHit.primitive?.label}" at distance t=${finalHit.t.toFixed(2)}. Tested ${testedPrimitives.length} primitives, pruned ${prunedNodeIds.length} bounding volumes.`
      : `Ray travelled through scene without intersection. Tested ${testedPrimitives.length} primitives, pruned ${prunedNodeIds.length} bounding volumes.`,
    activeNodeId: "ray_traversal_done",
    aabbHit: finalHit !== null,
    tNear: finalHit ? finalHit.t : Infinity,
    tFar: Infinity,
    action: "complete",
    closestHitT: finalHit ? finalHit.t : Infinity,
    currentHit: finalHit ?? undefined,
    visitedNodeIds: [...visitedNodeIds],
    prunedNodeIds: [...prunedNodeIds],
    testedPrimitives: [...testedPrimitives],
    hitPrimitives: [...hitPrimitives],
  });

  return {
    hit: finalHit,
    steps,
    visitedAABBCount: visitedNodeIds.length,
    prunedAABBCount: prunedNodeIds.length,
    primitiveIntersectionsCount: primIsects,
  };
}

/**
 * Generates an interactive, step-by-step trace of BVH ray cast traversal.
 */
export function generateBVHRaySteps(
  bvhRoot: BVHNode | null,
  ray: Ray2D,
): readonly BVHRayStepTrace[] {
  return traverseBVHRay(bvhRoot, ray).steps;
}

// ============================================================================
// 7. PRESETS & MODALITY METADATA
// ============================================================================

export interface SpatialModalityInfo {
  readonly id: SpatialModality;
  readonly name: string;
  readonly shortName: string;
  readonly badge: string;
  readonly formulaTeX: string;
  readonly description: string;
}

export const SPATIAL_INDEX_MODALITIES: readonly SpatialModalityInfo[] = [
  {
    id: "kd_tree_spatial_split",
    name: "2D K-D Tree Spatial Split",
    shortName: "K-D Split",
    badge: "O(N log N)",
    formulaTeX:
      "\\text{depth} \\bmod 2 == 0 \\implies \\text{split}_x, \\; \\text{else} \\; \\text{split}_y",
    description:
      "Alternating orthogonal hyperplanes splitting coordinate space at the median point into balanced binary subdivisions.",
  },
  {
    id: "knn_nearest_neighbor",
    name: "k-NN Query & Branch Pruning",
    shortName: "k-NN Search",
    badge: "O(log N) avg",
    formulaTeX:
      "d_{\\text{plane}}(q, \\text{split}) < r_{\\text{best}} \\implies \\text{explore far branch}",
    description:
      "Exact k-nearest neighbor query using priority queue and hypersphere pruning against KD-tree partition boundaries.",
  },
  {
    id: "rtree_bounding_box",
    name: "R-Tree MBR & Quadratic Split",
    shortName: "R-Tree MBR",
    badge: "O(log_M N)",
    formulaTeX: "\\Delta A = \\text{Area}(R \\cup e) - \\text{Area}(R)",
    description:
      "Hierarchical Minimum Bounding Rectangles (MBRs) with Guttman quadratic split minimizing dead space area enlargement.",
  },
  {
    id: "bvh_sah_ray_traversal",
    name: "BVH Surface Area Heuristic (SAH) Ray Cast",
    shortName: "BVH SAH Ray",
    badge: "Ray Tracing",
    formulaTeX:
      "C = C_{\\text{trav}} + \\frac{S_A}{S} N_A C_{\\text{isect}} + \\frac{S_B}{S} N_B C_{\\text{isect}}",
    description:
      "Surface Area Heuristic (SAH) bounding hierarchy with slab method (t_near ≤ t_far) ray traversal and occlusion pruning.",
  },
];

export const KD_TREE_PRESETS: Record<string, SpatialStudioPreset> = {
  uniform_grid: {
    id: "uniform_grid",
    name: "Uniform 4x4 Grid",
    modality: "kd_tree_spatial_split",
    category: "KD-Tree",
    description: "16 evenly spaced grid points demonstrating alternating x and y splits.",
    points: [
      { id: "p1", x: 20, y: 20, label: "P1" },
      { id: "p2", x: 40, y: 20, label: "P2" },
      { id: "p3", x: 60, y: 20, label: "P3" },
      { id: "p4", x: 80, y: 20, label: "P4" },
      { id: "p5", x: 20, y: 40, label: "P5" },
      { id: "p6", x: 40, y: 40, label: "P6" },
      { id: "p7", x: 60, y: 40, label: "P7" },
      { id: "p8", x: 80, y: 40, label: "P8" },
      { id: "p9", x: 20, y: 60, label: "P9" },
      { id: "p10", x: 40, y: 60, label: "P10" },
      { id: "p11", x: 60, y: 60, label: "P11" },
      { id: "p12", x: 80, y: 60, label: "P12" },
      { id: "p13", x: 20, y: 80, label: "P13" },
      { id: "p14", x: 40, y: 80, label: "P14" },
      { id: "p15", x: 60, y: 80, label: "P15" },
      { id: "p16", x: 80, y: 80, label: "P16" },
    ],
  },
  gaussian_clusters: {
    id: "gaussian_clusters",
    name: "Gaussian Bimodal Clusters",
    modality: "kd_tree_spatial_split",
    category: "KD-Tree",
    description: "Two dense point clusters showcasing adaptive depth subdivisions.",
    points: [
      { id: "c1_1", x: 22, y: 28, label: "C1a" },
      { id: "c1_2", x: 28, y: 32, label: "C1b" },
      { id: "c1_3", x: 25, y: 22, label: "C1c" },
      { id: "c1_4", x: 32, y: 25, label: "C1d" },
      { id: "c1_5", x: 18, y: 35, label: "C1e" },
      { id: "c1_6", x: 35, y: 30, label: "C1f" },
      { id: "c2_1", x: 75, y: 72, label: "C2a" },
      { id: "c2_2", x: 82, y: 78, label: "C2b" },
      { id: "c2_3", x: 70, y: 85, label: "C2c" },
      { id: "c2_4", x: 88, y: 68, label: "C2d" },
      { id: "c2_5", x: 78, y: 80, label: "C2e" },
      { id: "c2_6", x: 65, y: 70, label: "C2f" },
    ],
  },
  spiral_galaxy: {
    id: "spiral_galaxy",
    name: "Logarithmic Spiral Points",
    modality: "kd_tree_spatial_split",
    category: "KD-Tree",
    description: "Non-linear spiral curve challenging split plane orientations.",
    points: [
      { id: "s1", x: 50, y: 50, label: "Core" },
      { id: "s2", x: 55, y: 53, label: "S1" },
      { id: "s3", x: 56, y: 60, label: "S2" },
      { id: "s4", x: 48, y: 66, label: "S3" },
      { id: "s5", x: 38, y: 62, label: "S4" },
      { id: "s6", x: 33, y: 48, label: "S5" },
      { id: "s7", x: 40, y: 35, label: "S6" },
      { id: "s8", x: 58, y: 32, label: "S7" },
      { id: "s9", x: 72, y: 45, label: "S8" },
      { id: "s10", x: 74, y: 65, label: "S9" },
      { id: "s11", x: 55, y: 82, label: "S10" },
      { id: "s12", x: 26, y: 75, label: "S11" },
    ],
  },
  adversarial_diagonal: {
    id: "adversarial_diagonal",
    name: "Adversarial Diagonal Line",
    modality: "kd_tree_spatial_split",
    category: "KD-Tree",
    description: "Collinear points testing worst-case boundary containment.",
    points: [
      { id: "d1", x: 10, y: 10, label: "D1" },
      { id: "d2", x: 22, y: 22, label: "D2" },
      { id: "d3", x: 35, y: 35, label: "D3" },
      { id: "d4", x: 48, y: 48, label: "D4" },
      { id: "d5", x: 62, y: 62, label: "D5" },
      { id: "d6", x: 75, y: 75, label: "D6" },
      { id: "d7", x: 88, y: 88, label: "D7" },
    ],
  },
};

export const KNN_QUERY_PRESETS: Record<string, SpatialStudioPreset> = {
  dense_cluster_probe: {
    id: "dense_cluster_probe",
    name: "Probe Inside Dense Cluster",
    modality: "knn_nearest_neighbor",
    category: "k-NN",
    description: "Query point centered inside a tight group with small search radius.",
    points: KD_TREE_PRESETS.gaussian_clusters.points,
    queryPoint: { id: "qp", x: 26, y: 27, label: "Probe" },
    k: 3,
  },
  isolated_outlier_probe: {
    id: "isolated_outlier_probe",
    name: "Isolated Outlier Probe",
    modality: "knn_nearest_neighbor",
    category: "k-NN",
    description: "Query probe located in empty space testing wide radius expansion.",
    points: KD_TREE_PRESETS.gaussian_clusters.points,
    queryPoint: { id: "qp", x: 50, y: 50, label: "Probe" },
    k: 4,
  },
  corner_probe: {
    id: "corner_probe",
    name: "Extreme Corner Probe",
    modality: "knn_nearest_neighbor",
    category: "k-NN",
    description: "Query probe at domain corner maximizing hyperplane pruning ratio.",
    points: KD_TREE_PRESETS.uniform_grid.points,
    queryPoint: { id: "qp", x: 5, y: 5, label: "Probe" },
    k: 3,
  },
  center_grid_probe: {
    id: "center_grid_probe",
    name: "Center Grid k=5 Probe",
    modality: "knn_nearest_neighbor",
    category: "k-NN",
    description: "Query probe at center with k=5 finding symmetric nearest neighbors.",
    points: KD_TREE_PRESETS.uniform_grid.points,
    queryPoint: { id: "qp", x: 45, y: 45, label: "Probe" },
    k: 5,
  },
};

export const RTREE_PRESETS: Record<string, SpatialStudioPreset> = {
  city_parcels: {
    id: "city_parcels",
    name: "City Land Parcels",
    modality: "rtree_bounding_box",
    category: "R-Tree",
    description: "Urban planning rectangular parcels with window query.",
    rtreeEntries: [
      {
        id: "parcel_1",
        label: "Commercial Hub",
        bounds: { minX: 10, minY: 10, maxX: 35, maxY: 30 },
        color: "#38bdf8",
      },
      {
        id: "parcel_2",
        label: "Residential A",
        bounds: { minX: 15, minY: 35, maxX: 40, maxY: 60 },
        color: "#4ade80",
      },
      {
        id: "parcel_3",
        label: "City Park",
        bounds: { minX: 45, minY: 15, maxX: 65, maxY: 40 },
        color: "#a3e635",
      },
      {
        id: "parcel_4",
        label: "Industrial Zone",
        bounds: { minX: 70, minY: 10, maxX: 95, maxY: 45 },
        color: "#fb923c",
      },
      {
        id: "parcel_5",
        label: "Residential B",
        bounds: { minX: 50, minY: 55, maxX: 85, maxY: 85 },
        color: "#f472b6",
      },
      {
        id: "parcel_6",
        label: "Downtown Plaza",
        bounds: { minX: 25, minY: 65, maxX: 45, maxY: 90 },
        color: "#c084fc",
      },
      {
        id: "parcel_7",
        label: "Harbor Docks",
        bounds: { minX: 5, minY: 75, maxX: 20, maxY: 95 },
        color: "#60a5fa",
      },
      {
        id: "parcel_8",
        label: "Tech Campus",
        bounds: { minX: 68, minY: 70, maxX: 92, maxY: 95 },
        color: "#e879f9",
      },
    ],
    searchRange: { minX: 20, minY: 20, maxX: 60, maxY: 70 },
  },
  dense_overlapping_windows: {
    id: "dense_overlapping_windows",
    name: "Dense Overlapping Windows",
    modality: "rtree_bounding_box",
    category: "R-Tree",
    description: "Overlapping rectangles stressing Quadratic Split MBR union calculation.",
    rtreeEntries: [
      {
        id: "win_1",
        label: "Win 1",
        bounds: { minX: 20, minY: 20, maxX: 50, maxY: 50 },
        color: "#38bdf8",
      },
      {
        id: "win_2",
        label: "Win 2",
        bounds: { minX: 30, minY: 30, maxX: 60, maxY: 60 },
        color: "#4ade80",
      },
      {
        id: "win_3",
        label: "Win 3",
        bounds: { minX: 40, minY: 20, maxX: 70, maxY: 50 },
        color: "#f59e0b",
      },
      {
        id: "win_4",
        label: "Win 4",
        bounds: { minX: 25, minY: 45, maxX: 55, maxY: 75 },
        color: "#ec4899",
      },
      {
        id: "win_5",
        label: "Win 5",
        bounds: { minX: 50, minY: 50, maxX: 80, maxY: 80 },
        color: "#a855f7",
      },
      {
        id: "win_6",
        label: "Win 6",
        bounds: { minX: 60, minY: 30, maxX: 90, maxY: 65 },
        color: "#14b8a6",
      },
    ],
    searchRange: { minX: 35, minY: 35, maxX: 65, maxY: 65 },
  },
  hierarchical_districts: {
    id: "hierarchical_districts",
    name: "Hierarchical Districts",
    modality: "rtree_bounding_box",
    category: "R-Tree",
    description: "Clusters positioned in distinct quadrants.",
    rtreeEntries: [
      {
        id: "d_nw1",
        label: "NW Block 1",
        bounds: { minX: 10, minY: 60, maxX: 25, maxY: 85 },
        color: "#38bdf8",
      },
      {
        id: "d_nw2",
        label: "NW Block 2",
        bounds: { minX: 30, minY: 65, maxX: 45, maxY: 90 },
        color: "#60a5fa",
      },
      {
        id: "d_ne1",
        label: "NE Block 1",
        bounds: { minX: 60, minY: 60, maxX: 75, maxY: 85 },
        color: "#4ade80",
      },
      {
        id: "d_ne2",
        label: "NE Block 2",
        bounds: { minX: 80, minY: 65, maxX: 95, maxY: 90 },
        color: "#22c55e",
      },
      {
        id: "d_sw1",
        label: "SW Block 1",
        bounds: { minX: 10, minY: 15, maxX: 25, maxY: 40 },
        color: "#f59e0b",
      },
      {
        id: "d_sw2",
        label: "SW Block 2",
        bounds: { minX: 30, minY: 10, maxX: 45, maxY: 35 },
        color: "#d97706",
      },
      {
        id: "d_se1",
        label: "SE Block 1",
        bounds: { minX: 60, minY: 15, maxX: 75, maxY: 40 },
        color: "#ec4899",
      },
      {
        id: "d_se2",
        label: "SE Block 2",
        bounds: { minX: 80, minY: 10, maxX: 95, maxY: 35 },
        color: "#db2777",
      },
    ],
    searchRange: { minX: 20, minY: 30, maxX: 70, maxY: 70 },
  },
};

export const BVH_SAH_PRESETS: Record<string, SpatialStudioPreset> = {
  raytracing_cornell_box: {
    id: "raytracing_cornell_box",
    name: "Cornell Box Scene",
    modality: "bvh_sah_ray_traversal",
    category: "BVH SAH",
    description: "Classical ray tracing box setup with discs and polygons.",
    bvhPrimitives: [
      {
        id: "sphere_left",
        type: "circle",
        label: "Glass Sphere",
        color: "#38bdf8",
        bounds: { minX: 20, minY: 25, maxX: 40, maxY: 45 },
        circle: { cx: 30, cy: 35, radius: 10 },
      },
      {
        id: "box_tall",
        type: "box",
        label: "Tall Block",
        color: "#f59e0b",
        bounds: { minX: 55, minY: 20, maxX: 75, maxY: 65 },
      },
      {
        id: "sphere_right",
        type: "circle",
        label: "Mirror Sphere",
        color: "#ec4899",
        bounds: { minX: 72, minY: 68, maxX: 92, maxY: 88 },
        circle: { cx: 82, cy: 78, radius: 10 },
      },
      {
        id: "pyramid_top",
        type: "triangle",
        label: "Prism",
        color: "#4ade80",
        bounds: { minX: 25, minY: 65, maxX: 45, maxY: 85 },
        triangle: {
          p1: { id: "tp1", x: 35, y: 85 },
          p2: { id: "tp2", x: 25, y: 65 },
          p3: { id: "tp3", x: 45, y: 65 },
        },
      },
    ],
    ray: {
      origin: { id: "ro", x: 5, y: 35, label: "Camera" },
      direction: { x: 0.98, y: 0.2 },
      length: 120,
    },
  },
  asteroid_field: {
    id: "asteroid_field",
    name: "Dense Asteroid Field",
    modality: "bvh_sah_ray_traversal",
    category: "BVH SAH",
    description: "Multiple scattered circular asteroids testing SAH split minimization.",
    bvhPrimitives: [
      {
        id: "ast_1",
        type: "circle",
        label: "Asteroid Alpha",
        color: "#94a3b8",
        bounds: { minX: 18, minY: 18, maxX: 30, maxY: 30 },
        circle: { cx: 24, cy: 24, radius: 6 },
      },
      {
        id: "ast_2",
        type: "circle",
        label: "Asteroid Beta",
        color: "#64748b",
        bounds: { minX: 38, minY: 28, maxX: 52, maxY: 42 },
        circle: { cx: 45, cy: 35, radius: 7 },
      },
      {
        id: "ast_3",
        type: "circle",
        label: "Asteroid Gamma",
        color: "#cbd5e1",
        bounds: { minX: 20, minY: 60, maxX: 36, maxY: 76 },
        circle: { cx: 28, cy: 68, radius: 8 },
      },
      {
        id: "ast_4",
        type: "circle",
        label: "Asteroid Delta",
        color: "#94a3b8",
        bounds: { minX: 62, minY: 48, maxX: 74, maxY: 60 },
        circle: { cx: 68, cy: 54, radius: 6 },
      },
      {
        id: "ast_5",
        type: "circle",
        label: "Asteroid Epsilon",
        color: "#64748b",
        bounds: { minX: 75, minY: 72, maxX: 91, maxY: 88 },
        circle: { cx: 83, cy: 80, radius: 8 },
      },
      {
        id: "ast_6",
        type: "circle",
        label: "Asteroid Zeta",
        color: "#cbd5e1",
        bounds: { minX: 65, minY: 15, maxX: 81, maxY: 31 },
        circle: { cx: 73, cy: 23, radius: 8 },
      },
    ],
    ray: {
      origin: { id: "ro", x: 10, y: 15, label: "Lidar Beam" },
      direction: { x: 0.85, y: 0.52 },
      length: 120,
    },
  },
  occlusion_corridor: {
    id: "occlusion_corridor",
    name: "Occlusion Tunnel",
    modality: "bvh_sah_ray_traversal",
    category: "BVH SAH",
    description: "Aligned obstacles verifying that traversal halts early at nearest occluder.",
    bvhPrimitives: [
      {
        id: "occ_front",
        type: "box",
        label: "Front Shield",
        color: "#38bdf8",
        bounds: { minX: 35, minY: 30, maxX: 45, maxY: 70 },
      },
      {
        id: "occ_mid",
        type: "box",
        label: "Mid Barrier",
        color: "#f59e0b",
        bounds: { minX: 55, minY: 25, maxX: 65, maxY: 75 },
      },
      {
        id: "occ_back",
        type: "box",
        label: "Back Wall",
        color: "#ef4444",
        bounds: { minX: 78, minY: 20, maxX: 88, maxY: 80 },
      },
    ],
    ray: {
      origin: { id: "ro", x: 5, y: 50, label: "Laser" },
      direction: { x: 1, y: 0 },
      length: 100,
    },
  },
};

export const SPATIAL_INDEX_PRESETS: Record<string, SpatialStudioPreset> = {
  ...KD_TREE_PRESETS,
  ...KNN_QUERY_PRESETS,
  ...RTREE_PRESETS,
  ...BVH_SAH_PRESETS,
};

// ============================================================================
// 8. INTERACTIVE REACT VISUALIZER STUDIO COMPONENT
// ============================================================================

export const SpatialIndexBVHStudio: React.FC<SpatialIndexBVHStudioProps> = ({
  initialModality = "kd_tree_spatial_split",
  initialPreset = "uniform_grid",
  width = 1080,
  height = 700,
  standalone = true,
  title = "Spatial Indexing & BVH Studio",
  onModalityChange,
}) => {
  // 1. Modality & Active Preset State
  const [modality, setModality] = useState<SpatialModality>(initialModality);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset);

  // 2. Modality-specific editable datasets
  const [kdPoints, setKdPoints] = useState<Point2D[]>(() =>
    KD_TREE_PRESETS.uniform_grid.points ? [...KD_TREE_PRESETS.uniform_grid.points] : [],
  );
  const [knnProbe, setKnnProbe] = useState<Point2D>(
    () => KNN_QUERY_PRESETS.dense_cluster_probe.queryPoint ?? { id: "qp", x: 26, y: 27 },
  );
  const [knnK, setKnnK] = useState<number>(3);

  const [rtreeEntries, setRTreeEntries] = useState<RTreeEntry[]>(() =>
    RTREE_PRESETS.city_parcels.rtreeEntries ? [...RTREE_PRESETS.city_parcels.rtreeEntries] : [],
  );
  const [rtreeSearchWindow, setRTreeSearchWindow] = useState<AABB>(
    () => RTREE_PRESETS.city_parcels.searchRange ?? { minX: 20, minY: 20, maxX: 60, maxY: 70 },
  );

  const [bvhPrimitives, setBvhPrimitives] = useState<BVHPrimitive[]>(() =>
    BVH_SAH_PRESETS.raytracing_cornell_box.bvhPrimitives
      ? [...BVH_SAH_PRESETS.raytracing_cornell_box.bvhPrimitives]
      : [],
  );
  const [ray, setRay] = useState<Ray2D>(
    () =>
      BVH_SAH_PRESETS.raytracing_cornell_box.ray ?? {
        origin: { id: "ro", x: 5, y: 35 },
        direction: { x: 0.98, y: 0.2 },
        length: 120,
      },
  );

  // 3. Playback & Step State
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(600);

  // Interaction dragging states
  const [draggingTarget, setDraggingTarget] = useState<string | null>(null);

  // DOM Canvas Box
  const { ref: containerRef, box } = useCanvasBox({ width, height: Math.max(500, height - 160) });

  // Handle Preset Switching
  const handleSelectPreset = useCallback(
    (presetId: string) => {
      setSelectedPresetId(presetId);
      const preset = SPATIAL_INDEX_PRESETS[presetId];
      if (!preset) return;

      if (preset.modality !== modality) {
        setModality(preset.modality);
        onModalityChange?.(preset.modality);
      }

      if (preset.points) setKdPoints([...preset.points]);
      if (preset.queryPoint) setKnnProbe(preset.queryPoint);
      if (preset.k) setKnnK(preset.k);
      if (preset.rtreeEntries) setRTreeEntries([...preset.rtreeEntries]);
      if (preset.searchRange) setRTreeSearchWindow(preset.searchRange);
      if (preset.bvhPrimitives) setBvhPrimitives([...preset.bvhPrimitives]);
      if (preset.ray) setRay(preset.ray);

      setCurrentStepIdx(0);
      setIsPlaying(false);
    },
    [modality, onModalityChange],
  );

  // Handle Modality Tab Switching
  const handleSelectModality = (newMod: SpatialModality) => {
    setModality(newMod);
    onModalityChange?.(newMod);
    setCurrentStepIdx(0);
    setIsPlaying(false);

    // Pick first preset matching modality
    const matching = Object.values(SPATIAL_INDEX_PRESETS).find((p) => p.modality === newMod);
    if (matching) {
      handleSelectPreset(matching.id);
    }
  };

  // 4. Algorithm Step Computations (Memoized)
  const kdSplitSteps = useMemo(() => {
    return generateKDSplitSteps(kdPoints, { minX: 0, minY: 0, maxX: 100, maxY: 100 });
  }, [kdPoints]);

  const kdTree = useMemo(() => {
    return buildKDTree2D(kdPoints, 0, 10, { minX: 0, minY: 0, maxX: 100, maxY: 100 });
  }, [kdPoints]);

  const knnResult = useMemo(() => {
    return findKNearestNeighbors(kdTree, knnProbe, knnK);
  }, [kdTree, knnProbe, knnK]);

  const rtreeRoot = useMemo(() => {
    return buildRTree2D(rtreeEntries, 4, 2);
  }, [rtreeEntries]);

  const rtreeRangeResult = useMemo(() => {
    return queryRTreeRange(rtreeRoot, rtreeSearchWindow);
  }, [rtreeRoot, rtreeSearchWindow]);

  const bvhRoot = useMemo(() => {
    return buildBVHWithSAH(bvhPrimitives, { maxPrimsPerLeaf: 2 });
  }, [bvhPrimitives]);

  const bvhRayResult = useMemo(() => {
    return traverseBVHRay(bvhRoot, ray);
  }, [bvhRoot, ray]);

  // Current active step trace count
  const totalSteps = useMemo(() => {
    if (modality === "kd_tree_spatial_split") return kdSplitSteps.length;
    if (modality === "knn_nearest_neighbor") return knnResult.steps.length;
    if (modality === "rtree_bounding_box") return rtreeRangeResult.steps.length;
    if (modality === "bvh_sah_ray_traversal") return bvhRayResult.steps.length;
    return 1;
  }, [modality, kdSplitSteps, knnResult, rtreeRangeResult, bvhRayResult]);

  const safeStepIdx = Math.min(Math.max(0, currentStepIdx), Math.max(0, totalSteps - 1));

  const activeKdStep = kdSplitSteps[safeStepIdx];
  const activeKnnStep = knnResult.steps[safeStepIdx];
  const activeRtreeStep = rtreeRangeResult.steps[safeStepIdx];
  const activeBvhStep = bvhRayResult.steps[safeStepIdx];

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    if (totalSteps <= 1) return;

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeedMs);

    return () => clearInterval(interval);
  }, [isPlaying, totalSteps, playbackSpeedMs]);

  // 5. Canvas Coordinate Transforms (User [0..100] -> SVG Pixels)
  const pad = 44;
  const usableW = Math.max(10, box.width - 2 * pad);
  const usableH = Math.max(10, box.height - 2 * pad);

  const toSvgX = useCallback((x: number) => pad + (x / 100) * usableW, [pad, usableW]);
  const toSvgY = useCallback(
    (y: number) => box.height - pad - (y / 100) * usableH,
    [pad, usableH, box.height],
  );

  const fromSvgX = useCallback(
    (svgX: number) => Math.round(Math.max(0, Math.min(100, ((svgX - pad) / usableW) * 100))),
    [pad, usableW],
  );
  const fromSvgY = useCallback(
    (svgY: number) =>
      Math.round(Math.max(0, Math.min(100, ((box.height - pad - svgY) / usableH) * 100))),
    [pad, usableH, box.height],
  );

  // Mouse drag handlers
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseSvgX = e.clientX - rect.left;
    const mouseSvgY = e.clientY - rect.top;

    const nx = fromSvgX(mouseSvgX);
    const ny = fromSvgY(mouseSvgY);

    if (modality === "kd_tree_spatial_split") {
      setKdPoints((prev) =>
        prev.map((p) => (p.id === draggingTarget ? { ...p, x: nx, y: ny } : p)),
      );
    } else if (modality === "knn_nearest_neighbor") {
      if (draggingTarget === "knn_probe") {
        setKnnProbe((prev) => ({ ...prev, x: nx, y: ny }));
      } else {
        setKdPoints((prev) =>
          prev.map((p) => (p.id === draggingTarget ? { ...p, x: nx, y: ny } : p)),
        );
      }
    } else if (modality === "rtree_bounding_box") {
      if (draggingTarget === "search_range_min") {
        setRTreeSearchWindow((prev) => ({
          ...prev,
          minX: Math.min(nx, prev.maxX - 5),
          minY: Math.min(ny, prev.maxY - 5),
        }));
      } else if (draggingTarget === "search_range_max") {
        setRTreeSearchWindow((prev) => ({
          ...prev,
          maxX: Math.max(nx, prev.minX + 5),
          maxY: Math.max(ny, prev.minY + 5),
        }));
      }
    } else if (modality === "bvh_sah_ray_traversal") {
      if (draggingTarget === "ray_origin") {
        setRay((prev) => ({ ...prev, origin: { ...prev.origin, x: nx, y: ny } }));
      } else if (draggingTarget === "ray_target") {
        const dx = nx - ray.origin.x;
        const dy = ny - ray.origin.y;
        const len = Math.hypot(dx, dy) || 1;
        setRay((prev) => ({
          ...prev,
          direction: { x: dx / len, y: dy / len },
        }));
      }
    }
  };

  const handleSvgMouseUp = () => {
    setDraggingTarget(null);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = fromSvgX(e.clientX - rect.left);
    const ny = fromSvgY(e.clientY - rect.top);

    if (modality === "kd_tree_spatial_split") {
      const newPt: Point2D = {
        id: `pt_${Date.now().toString().slice(-4)}`,
        x: nx,
        y: ny,
        label: `P${kdPoints.length + 1}`,
      };
      setKdPoints((prev) => [...prev, newPt]);
    } else if (modality === "knn_nearest_neighbor") {
      setKnnProbe({ id: "qp", x: nx, y: ny, label: "Probe" });
    }
  };

  const handleRandomizePoints = () => {
    if (modality === "kd_tree_spatial_split" || modality === "knn_nearest_neighbor") {
      const count = 12;
      const pts: Point2D[] = Array.from({ length: count }, (_, i) => ({
        id: `rnd_${i + 1}`,
        x: Math.floor(10 + Math.random() * 80),
        y: Math.floor(10 + Math.random() * 80),
        label: `P${i + 1}`,
      }));
      setKdPoints(pts);
    }
  };

  const handleClear = () => {
    if (modality === "kd_tree_spatial_split") setKdPoints([]);
  };

  // Helper colors for bounding boxes per depth
  const getDepthColor = (d: number) => {
    const colors = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f472b6", "#c084fc"];
    return colors[d % colors.length];
  };

  // 6. RENDER
  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "w-full min-h-[750px]" : "w-full h-full"
      }`}
      style={{ maxWidth: width }}
    >
      {/* HEADER & TOP CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {SPATIAL_INDEX_MODALITIES.find((m) => m.id === modality)?.badge}
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {SPATIAL_INDEX_MODALITIES.find((m) => m.id === modality)?.description}
            </p>
          </div>
        </div>

        {/* MODALITY TABS */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          {SPATIAL_INDEX_MODALITIES.map((m) => {
            const isActive = modality === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectModality(m.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {m.id === "kd_tree_spatial_split" && <Layers className="w-3.5 h-3.5" />}
                {m.id === "knn_nearest_neighbor" && <Crosshair className="w-3.5 h-3.5" />}
                {m.id === "rtree_bounding_box" && <Box className="w-3.5 h-3.5" />}
                {m.id === "bvh_sah_ray_traversal" && <Zap className="w-3.5 h-3.5" />}
                <span>{m.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECONDARY ACTION & PLAYBACK TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 text-xs">
        {/* Preset Selector & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-slate-400 font-medium">Preset:</label>
          <select
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
          >
            {Object.values(SPATIAL_INDEX_PRESETS)
              .filter((p) => p.modality === modality)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>

          {modality === "knn_nearest_neighbor" && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-slate-400">k:</span>
              <input
                type="range"
                min={1}
                max={8}
                value={knnK}
                onChange={(e) => setKnnK(Number(e.target.value))}
                className="w-16 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-indigo-400 font-semibold">{knnK}</span>
            </div>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          <button
            onClick={handleRandomizePoints}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
            title="Randomize points"
          >
            <Shuffle className="w-3 h-3" />
            <span>Randomize</span>
          </button>

          {modality === "kd_tree_spatial_split" && (
            <button
              onClick={handleClear}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 transition flex items-center gap-1"
              title="Clear all points"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Step-by-Step Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStepIdx(0)}
            disabled={safeStepIdx === 0}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            title="Reset to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
            disabled={safeStepIdx === 0}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            title="Previous step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            onClick={() => setCurrentStepIdx((prev) => Math.min(totalSteps - 1, prev + 1))}
            disabled={safeStepIdx >= totalSteps - 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            title="Next step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-slate-400 text-xs ml-1">
            Step <span className="text-white font-semibold">{safeStepIdx + 1}</span> / {totalSteps}
          </span>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          <select
            value={playbackSpeedMs}
            onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
            className="bg-slate-800 text-slate-300 border border-slate-700 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
            title="Playback speed"
          >
            <option value={1200}>0.5x</option>
            <option value={600}>1.0x</option>
            <option value={300}>2.0x</option>
            <option value={150}>4.0x</option>
          </select>
        </div>
      </div>

      {/* MAIN CONTENT AREA: VISUALIZER CANVAS & HUD */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* SVG CARTESIAN CANVAS */}
        <div
          ref={containerRef}
          className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center select-none"
          style={{ minHeight: 460 }}
        >
          <svg
            className="w-full h-full cursor-crosshair"
            viewBox={`0 0 ${box.width} ${box.height}`}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onClick={handleSvgClick}
          >
            <defs>
              {/* Grid Background Pattern */}
              <pattern id="spatialGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
              {/* Radial gradient for k-NN probe highlight */}
              <radialGradient id="knnProbeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Grid */}
            <rect width={box.width} height={box.height} fill="#020617" />
            <rect
              x={pad}
              y={pad}
              width={usableW}
              height={usableH}
              fill="url(#spatialGrid)"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* DOMAIN AXIS TICKS */}
            <text x={pad} y={box.height - 15} fill="#64748b" fontSize="10" fontFamily="monospace">
              (0, 0)
            </text>
            <text
              x={box.width - pad - 40}
              y={box.height - 15}
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
            >
              (100, 0)
            </text>
            <text x={pad - 32} y={pad + 12} fill="#64748b" fontSize="10" fontFamily="monospace">
              (0, 100)
            </text>

            {/* MODALITY 1: KD-TREE SPATIAL PARTITIONS */}
            {modality === "kd_tree_spatial_split" && (
              <g id="kd-tree-layers">
                {/* Partition Split Lines */}
                {activeKdStep?.activeLines.map((line, idx) => {
                  const isLatest =
                    activeKdStep.splitLine &&
                    activeKdStep.splitLine.x1 === line.x1 &&
                    activeKdStep.splitLine.y1 === line.y1;
                  const isX = line.axis === "x";
                  const strokeColor = isX ? "#ef4444" : "#3b82f6";

                  return (
                    <g key={`kd_line_${idx}`}>
                      <line
                        x1={toSvgX(line.x1)}
                        y1={toSvgY(line.y1)}
                        x2={toSvgX(line.x2)}
                        y2={toSvgY(line.y2)}
                        stroke={strokeColor}
                        strokeWidth={isLatest ? 2.5 : 1.5}
                        strokeDasharray={isLatest ? "none" : "3 3"}
                        opacity={0.85}
                      />
                      {/* Split value label */}
                      <text
                        x={toSvgX(isX ? line.value : (line.x1 + line.x2) / 2) + 4}
                        y={toSvgY(isX ? (line.y1 + line.y2) / 2 : line.value) - 4}
                        fill={strokeColor}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {line.axis.toUpperCase()}={line.value}
                      </text>
                    </g>
                  );
                })}

                {/* Point markers */}
                {kdPoints.map((p) => {
                  const isMedian = activeKdStep?.medianPoint?.id === p.id;
                  const isLeft = activeKdStep?.leftPoints?.some((lp) => lp.id === p.id);
                  const isRight = activeKdStep?.rightPoints?.some((rp) => rp.id === p.id);

                  let fillColor = "#94a3b8";
                  if (isMedian) fillColor = "#f59e0b";
                  else if (isLeft) fillColor = "#38bdf8";
                  else if (isRight) fillColor = "#a855f7";

                  return (
                    <g
                      key={p.id}
                      className="cursor-pointer"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingTarget(p.id);
                      }}
                    >
                      {isMedian && (
                        <circle
                          cx={toSvgX(p.x)}
                          cy={toSvgY(p.y)}
                          r="12"
                          fill="#f59e0b"
                          fillOpacity="0.25"
                          className="animate-pulse"
                        />
                      )}
                      <circle
                        cx={toSvgX(p.x)}
                        cy={toSvgY(p.y)}
                        r={isMedian ? 6.5 : 5}
                        fill={fillColor}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <text
                        x={toSvgX(p.x) + 7}
                        y={toSvgY(p.y) + 3}
                        fill="#cbd5e1"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {p.label ?? p.id}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* MODALITY 2: K-NN NEAREST NEIGHBOR SEARCH */}
            {modality === "knn_nearest_neighbor" && (
              <g id="knn-layers">
                {/* KD Partition Lines in Background */}
                {collectKDTreeLines(kdTree).map((line, idx) => (
                  <line
                    key={`knn_bg_line_${idx}`}
                    x1={toSvgX(line.x1)}
                    y1={toSvgY(line.y1)}
                    x2={toSvgX(line.x2)}
                    y2={toSvgY(line.y2)}
                    stroke={line.axis === "x" ? "#ef4444" : "#3b82f6"}
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.35"
                  />
                ))}

                {/* Search Radius Hypersphere */}
                {activeKnnStep && activeKnnStep.searchRadius !== Infinity && (
                  <g>
                    <circle
                      cx={toSvgX(knnProbe.x)}
                      cy={toSvgY(knnProbe.y)}
                      r={(activeKnnStep.searchRadius / 100) * usableW}
                      fill="#818cf8"
                      fillOpacity="0.08"
                      stroke="#818cf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <line
                      x1={toSvgX(knnProbe.x)}
                      y1={toSvgY(knnProbe.y)}
                      x2={toSvgX(knnProbe.x + activeKnnStep.searchRadius)}
                      y2={toSvgY(knnProbe.y)}
                      stroke="#a5b4fc"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={toSvgX(knnProbe.x + activeKnnStep.searchRadius / 2)}
                      y={toSvgY(knnProbe.y) - 4}
                      fill="#a5b4fc"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      r={activeKnnStep.searchRadius.toFixed(1)}
                    </text>
                  </g>
                )}

                {/* Connecting lines to k-nearest neighbors */}
                {activeKnnStep?.kNeighbors.map((nb, i) => (
                  <line
                    key={`knn_edge_${i}`}
                    x1={toSvgX(knnProbe.x)}
                    y1={toSvgY(knnProbe.y)}
                    x2={toSvgX(nb.point.x)}
                    y2={toSvgY(nb.point.y)}
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                ))}

                {/* All KD points */}
                {kdPoints.map((p) => {
                  const isVisited = activeKnnStep?.visitedNodeIds.some((id) => id.includes(p.id));
                  const isNeighbor = activeKnnStep?.kNeighbors.some((nb) => nb.point.id === p.id);
                  const isCurrentActive = activeKnnStep?.visitedPoint.id === p.id;

                  let nodeColor = "#64748b";
                  if (isNeighbor) nodeColor = "#22c55e";
                  else if (isCurrentActive) nodeColor = "#f59e0b";
                  else if (isVisited) nodeColor = "#38bdf8";

                  return (
                    <g
                      key={p.id}
                      className="cursor-pointer"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingTarget(p.id);
                      }}
                    >
                      <circle
                        cx={toSvgX(p.x)}
                        cy={toSvgY(p.y)}
                        r={isNeighbor ? 6 : 4.5}
                        fill={nodeColor}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <text
                        x={toSvgX(p.x) + 6}
                        y={toSvgY(p.y) + 3}
                        fill="#cbd5e1"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {p.label ?? p.id}
                      </text>
                    </g>
                  );
                })}

                {/* Query Probe Point */}
                <g
                  className="cursor-move"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingTarget("knn_probe");
                  }}
                >
                  <circle
                    cx={toSvgX(knnProbe.x)}
                    cy={toSvgY(knnProbe.y)}
                    r="16"
                    fill="url(#knnProbeGlow)"
                  />
                  <circle
                    cx={toSvgX(knnProbe.x)}
                    cy={toSvgY(knnProbe.y)}
                    r="7"
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={toSvgX(knnProbe.x) + 10}
                    y={toSvgY(knnProbe.y) - 5}
                    fill="#818cf8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Query ({knnProbe.x}, {knnProbe.y})
                  </text>
                </g>
              </g>
            )}

            {/* MODALITY 3: R-TREE HIERARCHICAL MBRS & RANGE QUERY */}
            {modality === "rtree_bounding_box" && (
              <g id="rtree-layers">
                {/* Render Hierarchical MBRs */}
                {rtreeRoot &&
                  (function renderNodeMBRs(node: RTreeNode): React.ReactNode {
                    const color = getDepthColor(node.depth);
                    const isMatched = activeRtreeStep?.matchedNodeIds.includes(node.id);
                    const isPruned = activeRtreeStep?.prunedNodeIds.includes(node.id);

                    return (
                      <g key={node.id}>
                        <rect
                          x={toSvgX(node.bounds.minX)}
                          y={toSvgY(node.bounds.maxY)}
                          width={(node.bounds.maxX - node.bounds.minX) * (usableW / 100)}
                          height={(node.bounds.maxY - node.bounds.minY) * (usableH / 100)}
                          fill={isMatched ? color : "none"}
                          fillOpacity={isMatched ? 0.12 : 0}
                          stroke={isPruned ? "#475569" : color}
                          strokeWidth={node.depth === 0 ? 2 : 1.5}
                          strokeDasharray={isPruned ? "3 3" : "none"}
                        />
                        <text
                          x={toSvgX(node.bounds.minX) + 4}
                          y={toSvgY(node.bounds.maxY) + 12}
                          fill={color}
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          MBR d={node.depth}
                        </text>
                        {node.children?.map((c) => renderNodeMBRs(c))}
                      </g>
                    );
                  })(rtreeRoot)}

                {/* Leaf Entries */}
                {rtreeEntries.map((e) => {
                  const isHit = activeRtreeStep?.matchedEntries.some((m) => m.id === e.id);
                  return (
                    <g key={e.id}>
                      <rect
                        x={toSvgX(e.bounds.minX)}
                        y={toSvgY(e.bounds.maxY)}
                        width={(e.bounds.maxX - e.bounds.minX) * (usableW / 100)}
                        height={(e.bounds.maxY - e.bounds.minY) * (usableH / 100)}
                        fill={e.color ?? "#38bdf8"}
                        fillOpacity={isHit ? 0.45 : 0.2}
                        stroke={isHit ? "#22c55e" : (e.color ?? "#38bdf8")}
                        strokeWidth={isHit ? 2.5 : 1}
                      />
                      <text
                        x={toSvgX(e.bounds.minX) + 3}
                        y={toSvgY(e.bounds.maxY) - 3}
                        fill="#cbd5e1"
                        fontSize="9"
                        fontFamily="sans-serif"
                      >
                        {e.label}
                      </text>
                    </g>
                  );
                })}

                {/* Search Window Range Box */}
                <g>
                  <rect
                    x={toSvgX(rtreeSearchWindow.minX)}
                    y={toSvgY(rtreeSearchWindow.maxY)}
                    width={(rtreeSearchWindow.maxX - rtreeSearchWindow.minX) * (usableW / 100)}
                    height={(rtreeSearchWindow.maxY - rtreeSearchWindow.minY) * (usableH / 100)}
                    fill="#f59e0b"
                    fillOpacity="0.1"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={toSvgX(rtreeSearchWindow.minX) + 6}
                    y={toSvgY(rtreeSearchWindow.maxY) + 14}
                    fill="#f59e0b"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Query Window
                  </text>
                  {/* Window Drag Handles */}
                  <circle
                    cx={toSvgX(rtreeSearchWindow.minX)}
                    cy={toSvgY(rtreeSearchWindow.minY)}
                    r="5"
                    fill="#f59e0b"
                    className="cursor-nwse-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingTarget("search_range_min");
                    }}
                  />
                  <circle
                    cx={toSvgX(rtreeSearchWindow.maxX)}
                    cy={toSvgY(rtreeSearchWindow.maxY)}
                    r="5"
                    fill="#f59e0b"
                    className="cursor-nwse-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingTarget("search_range_max");
                    }}
                  />
                </g>
              </g>
            )}

            {/* MODALITY 4: BVH SAH RAY CAST TRAVERSAL */}
            {modality === "bvh_sah_ray_traversal" && (
              <g id="bvh-layers">
                {/* BVH Bounding Volumes */}
                {bvhRoot &&
                  (function renderBVHBoxes(node: BVHNode): React.ReactNode {
                    const color = getDepthColor(node.depth);
                    const isVisited = activeBvhStep?.visitedNodeIds.includes(node.id);
                    const isPruned = activeBvhStep?.prunedNodeIds.includes(node.id);

                    return (
                      <g key={node.id}>
                        <rect
                          x={toSvgX(node.bounds.minX)}
                          y={toSvgY(node.bounds.maxY)}
                          width={(node.bounds.maxX - node.bounds.minX) * (usableW / 100)}
                          height={(node.bounds.maxY - node.bounds.minY) * (usableH / 100)}
                          fill={isVisited && !isPruned ? color : "none"}
                          fillOpacity={isVisited ? 0.08 : 0}
                          stroke={isPruned ? "#475569" : color}
                          strokeWidth={node.depth === 0 ? 2 : 1.2}
                          strokeDasharray={isPruned ? "3 3" : "none"}
                          opacity={isPruned ? 0.4 : 0.8}
                        />
                        {node.left && renderBVHBoxes(node.left)}
                        {node.right && renderBVHBoxes(node.right)}
                      </g>
                    );
                  })(bvhRoot)}

                {/* Primitives */}
                {bvhPrimitives.map((prim) => {
                  const isHit = activeBvhStep?.hitPrimitives.includes(prim.id);

                  if (prim.type === "circle" && prim.circle) {
                    return (
                      <g key={prim.id}>
                        <circle
                          cx={toSvgX(prim.circle.cx)}
                          cy={toSvgY(prim.circle.cy)}
                          r={(prim.circle.radius / 100) * usableW}
                          fill={prim.color}
                          fillOpacity={isHit ? 0.7 : 0.3}
                          stroke={isHit ? "#22c55e" : prim.color}
                          strokeWidth={isHit ? 2.5 : 1.5}
                        />
                        <text
                          x={toSvgX(prim.circle.cx) - 12}
                          y={toSvgY(prim.circle.cy) + 3}
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="sans-serif"
                        >
                          {prim.label}
                        </text>
                      </g>
                    );
                  }

                  if (prim.type === "triangle" && prim.triangle) {
                    const { p1, p2, p3 } = prim.triangle;
                    const pts = `${toSvgX(p1.x)},${toSvgY(p1.y)} ${toSvgX(p2.x)},${toSvgY(p2.y)} ${toSvgX(p3.x)},${toSvgY(p3.y)}`;
                    return (
                      <g key={prim.id}>
                        <polygon
                          points={pts}
                          fill={prim.color}
                          fillOpacity={isHit ? 0.7 : 0.3}
                          stroke={isHit ? "#22c55e" : prim.color}
                          strokeWidth={isHit ? 2.5 : 1.5}
                        />
                        <text
                          x={toSvgX((p1.x + p2.x + p3.x) / 3) - 10}
                          y={toSvgY((p1.y + p2.y + p3.y) / 3)}
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="sans-serif"
                        >
                          {prim.label}
                        </text>
                      </g>
                    );
                  }

                  return (
                    <g key={prim.id}>
                      <rect
                        x={toSvgX(prim.bounds.minX)}
                        y={toSvgY(prim.bounds.maxY)}
                        width={(prim.bounds.maxX - prim.bounds.minX) * (usableW / 100)}
                        height={(prim.bounds.maxY - prim.bounds.minY) * (usableH / 100)}
                        fill={prim.color}
                        fillOpacity={isHit ? 0.7 : 0.3}
                        stroke={isHit ? "#22c55e" : prim.color}
                        strokeWidth={isHit ? 2.5 : 1.5}
                      />
                      <text
                        x={toSvgX(prim.bounds.minX) + 4}
                        y={toSvgY(prim.bounds.minY) + 14}
                        fill="#ffffff"
                        fontSize="9"
                        fontFamily="sans-serif"
                      >
                        {prim.label}
                      </text>
                    </g>
                  );
                })}

                {/* Ray Beam Cast */}
                {(() => {
                  const rayLen = ray.length ?? 120;
                  const hitT =
                    activeBvhStep?.closestHitT !== Infinity &&
                    activeBvhStep?.closestHitT !== undefined
                      ? activeBvhStep.closestHitT
                      : rayLen;

                  const rx1 = toSvgX(ray.origin.x);
                  const ry1 = toSvgY(ray.origin.y);
                  const rx2 = toSvgX(ray.origin.x + ray.direction.x * hitT);
                  const ry2 = toSvgY(ray.origin.y + ray.direction.y * hitT);

                  return (
                    <g>
                      {/* Ray line */}
                      <line
                        x1={rx1}
                        y1={ry1}
                        x2={rx2}
                        y2={ry2}
                        stroke="#e11d48"
                        strokeWidth="2.5"
                        strokeDasharray="none"
                      />
                      {/* Extended projected ray */}
                      <line
                        x1={rx2}
                        y1={ry2}
                        x2={toSvgX(ray.origin.x + ray.direction.x * rayLen)}
                        y2={toSvgY(ray.origin.y + ray.direction.y * rayLen)}
                        stroke="#e11d48"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.4"
                      />
                      {/* Ray Origin Handle */}
                      <circle
                        cx={rx1}
                        cy={ry1}
                        r="6"
                        fill="#fb7185"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggingTarget("ray_origin");
                        }}
                      />
                      <text
                        x={rx1 - 8}
                        y={ry1 - 10}
                        fill="#fda4af"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Ray Origin
                      </text>

                      {/* Direction Drag Handle */}
                      <circle
                        cx={toSvgX(ray.origin.x + ray.direction.x * 20)}
                        cy={toSvgY(ray.origin.y + ray.direction.y * 20)}
                        r="4.5"
                        fill="#38bdf8"
                        className="cursor-pointer"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggingTarget("ray_target");
                        }}
                      />

                      {/* Hit Point Marker */}
                      {activeBvhStep?.currentHit?.point && (
                        <g>
                          <circle
                            cx={toSvgX(activeBvhStep.currentHit.point.x)}
                            cy={toSvgY(activeBvhStep.currentHit.point.y)}
                            r="6"
                            fill="#22c55e"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="animate-ping"
                          />
                          <circle
                            cx={toSvgX(activeBvhStep.currentHit.point.x)}
                            cy={toSvgY(activeBvhStep.currentHit.point.y)}
                            r="5"
                            fill="#22c55e"
                          />
                          <text
                            x={toSvgX(activeBvhStep.currentHit.point.x) + 8}
                            y={toSvgY(activeBvhStep.currentHit.point.y) - 6}
                            fill="#4ade80"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            Hit (t={activeBvhStep.currentHit.t.toFixed(2)})
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>

        {/* TELEMETRY & DIAGNOSTICS RIGHT PANEL */}
        <div className="w-full lg:w-80 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col p-4 gap-3.5 overflow-y-auto max-h-[500px] lg:max-h-none">
          {/* Active Step Explanation Card */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {modality === "kd_tree_spatial_split" && activeKdStep?.phase}
                {modality === "knn_nearest_neighbor" && activeKnnStep?.phase}
                {modality === "rtree_bounding_box" && activeRtreeStep?.phase}
                {modality === "bvh_sah_ray_traversal" && activeBvhStep?.phase}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {safeStepIdx + 1}/{totalSteps}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              {modality === "kd_tree_spatial_split" && activeKdStep?.title}
              {modality === "knn_nearest_neighbor" && activeKnnStep?.title}
              {modality === "rtree_bounding_box" && activeRtreeStep?.title}
              {modality === "bvh_sah_ray_traversal" && activeBvhStep?.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {modality === "kd_tree_spatial_split" && activeKdStep?.description}
              {modality === "knn_nearest_neighbor" && activeKnnStep?.description}
              {modality === "rtree_bounding_box" && activeRtreeStep?.description}
              {modality === "bvh_sah_ray_traversal" && activeBvhStep?.description}
            </p>
          </div>

          {/* TELEMETRY HUD METRICS */}
          <div className="grid grid-cols-2 gap-2">
            {modality === "kd_tree_spatial_split" && (
              <>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Tree Depth</span>
                  <span className="text-base font-bold font-mono text-indigo-400">
                    {kdTree ? getTreeDepth(kdTree) : 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Nodes</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {kdTree ? countTreeNodes(kdTree) : 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 col-span-2">
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Split Axis Cycle
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    x (red vertical) ➔ y (blue horizontal)
                  </span>
                </div>
              </>
            )}

            {modality === "knn_nearest_neighbor" && (
              <>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Visited Nodes</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    {activeKnnStep?.visitedNodeIds.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Pruned Subtrees
                  </span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    {activeKnnStep?.prunedSubtreeIds.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">k Nearest</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {activeKnnStep?.kNeighbors.length ?? 0}/{knnK}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Search Radius</span>
                  <span className="text-base font-bold font-mono text-indigo-400">
                    {activeKnnStep?.searchRadius === Infinity
                      ? "∞"
                      : activeKnnStep?.searchRadius.toFixed(1)}
                  </span>
                </div>
              </>
            )}

            {modality === "rtree_bounding_box" && (
              <>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Visited MBRs</span>
                  <span className="text-base font-bold font-mono text-sky-400">
                    {activeRtreeStep?.visitedNodeIds.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Pruned MBRs</span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    {activeRtreeStep?.prunedNodeIds.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 col-span-2">
                  <span className="text-[10px] text-slate-400 block uppercase">Matched Items</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {activeRtreeStep?.matchedEntries.length ?? 0} parcels
                  </span>
                </div>
              </>
            )}

            {modality === "bvh_sah_ray_traversal" && (
              <>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Visited AABBs</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    {activeBvhStep?.visitedNodeIds.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Pruned Volumes</span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    {activeBvhStep?.prunedNodeIds.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Primitive Tests
                  </span>
                  <span className="text-base font-bold font-mono text-sky-400">
                    {activeBvhStep?.testedPrimitives.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Hit Distance t</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {activeBvhStep?.closestHitT === Infinity
                      ? "Miss"
                      : activeBvhStep?.closestHitT.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Mathematical Insights Box */}
          <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-900/50 text-xs">
            <span className="font-semibold text-indigo-300 block mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Mathematical Formulation
            </span>
            <p className="text-indigo-200 font-mono text-[11px] leading-relaxed bg-indigo-950/60 p-2 rounded border border-indigo-800/40">
              {SPATIAL_INDEX_MODALITIES.find((m) => m.id === modality)?.formulaTeX}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpatialIndexBVHStudio;
