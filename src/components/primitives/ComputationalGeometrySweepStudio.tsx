import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Activity,
  Info,
  Plus,
  Move,
  Compass,
  Shuffle,
  Layers,
} from "lucide-react";
import { useCanvasBox } from "./vizGeometry";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type GeometryStudioModality =
  | "convex_hull_algorithms"
  | "bentley_ottmann_sweep"
  | "closest_pair_points"
  | "point_in_polygon_ray_casting";

export type ConvexHullAlgorithmId = "monotone_chain" | "graham_scan" | "quickhull";

export interface Point2D {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
  readonly id?: string;
}

export interface LineSegment {
  readonly id: string;
  readonly p1: Point2D;
  readonly p2: Point2D;
  readonly color?: string;
  readonly label?: string;
}

export type TurnOrientation = "ccw" | "cw" | "collinear";

// --- Convex Hull Contracts ---
export interface ConvexHullStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly currentStack: readonly Point2D[];
  readonly candidatePoint?: Point2D;
  readonly prevPoint1?: Point2D;
  readonly prevPoint2?: Point2D;
  readonly crossProduct?: number;
  readonly turnOrientation?: TurnOrientation;
  readonly action: "push" | "pop" | "inspect" | "init" | "done" | "partition" | "extremal";
  readonly lowerHull?: readonly Point2D[];
  readonly upperHull?: readonly Point2D[];
  readonly finalHull?: readonly Point2D[];
  readonly area?: number;
  readonly perimeter?: number;
  readonly activeSet?: readonly Point2D[];
  readonly partitionLeft?: readonly Point2D[];
  readonly partitionRight?: readonly Point2D[];
  readonly lineSegment?: readonly [Point2D, Point2D];
}

export interface ConvexHullAlgorithmResult {
  readonly algorithm: ConvexHullAlgorithmId;
  readonly hull: readonly Point2D[];
  readonly steps: readonly ConvexHullStep[];
  readonly area: number;
  readonly perimeter: number;
  readonly lowerHull: readonly Point2D[];
  readonly upperHull: readonly Point2D[];
  readonly executionTimeMs?: number;
}

// --- Bentley-Ottmann Sweep Contracts ---
export type BentleyOttmannEventType = "start" | "end" | "intersection";

export interface SweepEvent {
  readonly id: string;
  readonly type: BentleyOttmannEventType;
  readonly x: number;
  readonly y: number;
  readonly point: Point2D;
  readonly segment?: LineSegment;
  readonly segments?: readonly [LineSegment, LineSegment];
}

export interface IntersectionPoint {
  readonly id: string;
  readonly point: Point2D;
  readonly segments: readonly [LineSegment, LineSegment];
  readonly stepIndex?: number;
}

export interface BentleyOttmannStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly sweepX: number;
  readonly currentEvent: SweepEvent;
  readonly activeSegments: readonly LineSegment[];
  readonly testedPairs: readonly (readonly [LineSegment, LineSegment])[];
  readonly newlyDiscoveredIntersections: readonly IntersectionPoint[];
  readonly allDiscoveredIntersections: readonly IntersectionPoint[];
  readonly remainingEventsCount: number;
}

export interface BentleyOttmannResult {
  readonly intersections: readonly IntersectionPoint[];
  readonly steps: readonly BentleyOttmannStep[];
  readonly totalEventsProcessed: number;
  readonly initialSegmentsCount: number;
}

// --- Closest Pair Divide-and-Conquer Contracts ---
export interface ClosestPairCandidate {
  readonly p1: Point2D;
  readonly p2: Point2D;
  readonly distance: number;
}

export interface ClosestPairStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly depth: number;
  readonly range: readonly [number, number];
  readonly midX?: number;
  readonly midPoint?: Point2D;
  readonly leftBest?: ClosestPairCandidate;
  readonly rightBest?: ClosestPairCandidate;
  readonly currentDelta: number;
  readonly stripRange?: readonly [number, number];
  readonly stripPoints?: readonly Point2D[];
  readonly comparedPair?: readonly [Point2D, Point2D];
  readonly comparedDistance?: number;
  readonly bestPairSoFar?: ClosestPairCandidate;
  readonly isStripComparison?: boolean;
}

export interface ClosestPairDCResult {
  readonly closestPair: readonly [Point2D, Point2D];
  readonly minDistance: number;
  readonly steps: readonly ClosestPairStep[];
  readonly sortedPoints: readonly Point2D[];
}

export interface ClosestPairResult {
  readonly p1: Point2D;
  readonly p2: Point2D;
  readonly distance: number;
}

// --- Point in Polygon Contracts ---
export interface RayCastingEdgeTrace {
  readonly edgeIndex: number;
  readonly v1: Point2D;
  readonly v2: Point2D;
  readonly crossesHorizontalRay: boolean;
  readonly intersectionX?: number;
  readonly intersectsRayToRight: boolean;
  readonly isOnEdge: boolean;
}

export interface PIPStepTrace {
  readonly stepIndex: number;
  readonly edgeIndex: number;
  readonly edge: readonly [Point2D, Point2D];
  readonly queryPoint: Point2D;
  readonly phase: string;
  readonly description: string;
  readonly isIntersecting: boolean;
  readonly currentCrossingsCount: number;
  readonly currentWindingNumber: number;
}

export interface RayCastingPIPResult {
  readonly isInside: boolean;
  readonly isOnBoundary: boolean;
  readonly totalCrossings: number;
  readonly edgeTraces: readonly RayCastingEdgeTrace[];
  readonly queryPoint: Point2D;
  readonly polygon: readonly Point2D[];
  readonly steps: readonly PIPStepTrace[];
}

export interface WindingNumberEdgeTrace {
  readonly edgeIndex: number;
  readonly v1: Point2D;
  readonly v2: Point2D;
  readonly orientation: number;
  readonly deltaWinding: number;
}

export interface WindingNumberPIPResult {
  readonly windingNumber: number;
  readonly isInside: boolean;
  readonly isOnBoundary: boolean;
  readonly edgeTraces: readonly WindingNumberEdgeTrace[];
  readonly queryPoint: Point2D;
  readonly polygon: readonly Point2D[];
}

// --- Presets & Studio Props ---
export interface GeometryStudioPreset {
  readonly id: string;
  readonly name: string;
  readonly modality: GeometryStudioModality;
  readonly description: string;
  readonly category: string;
  readonly points?: readonly Point2D[];
  readonly segments?: readonly LineSegment[];
  readonly polygon?: readonly Point2D[];
  readonly queryPoint?: Point2D;
  readonly recommendedAlgorithm?: string;
}

export interface ComputationalGeometrySweepStudioProps {
  readonly initialModality?: GeometryStudioModality;
  readonly initialPreset?: string;
  readonly initialAlgorithm?: ConvexHullAlgorithmId;
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onModalityChange?: (modality: GeometryStudioModality) => void;
}

// ============================================================================
// 2. PURE MATHEMATICAL & ALGORITHMIC UTILITIES
// ============================================================================

const EPSILON = 1e-9;

/**
 * Computes the 2D cross product of vector OA and OB:
 * (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
 * Positive -> Counter-Clockwise (Left turn)
 * Negative -> Clockwise (Right turn)
 * Zero -> Collinear
 */
export function crossProduct2D(o: Point2D, a: Point2D, b: Point2D): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Returns the turn orientation for triangle (o -> a -> b).
 */
export function turnOrientation(
  o: Point2D,
  a: Point2D,
  b: Point2D,
  eps: number = EPSILON,
): TurnOrientation {
  const cp = crossProduct2D(o, a, b);
  if (Math.abs(cp) <= eps) return "collinear";
  return cp > 0 ? "ccw" : "cw";
}

/**
 * Euclidean distance between two 2D points.
 */
export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Squared Euclidean distance between two 2D points.
 */
export function euclideanDistanceSquared(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

/**
 * Shoelace Formula for polygon area:
 * Area = 0.5 * |sum_{i=0}^{n-1} (x_i * y_{i+1} - x_{i+1} * y_i)|
 */
export function shoelacePolygonArea(points: readonly Point2D[]): number {
  const n = points.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) / 2.0;
}

/**
 * Calculates the perimeter of a polygon or closed point loop.
 */
export function polygonPerimeter(points: readonly Point2D[]): number {
  const n = points.length;
  if (n < 2) return 0;
  let perim = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perim += euclideanDistance(points[i], points[j]);
  }
  return perim;
}

/**
 * Andrew's Monotone Chain Convex Hull Algorithm (O(N log N)).
 * Constructs lower and upper hulls step-by-step.
 */
export function computeMonotoneChain(
  points: readonly Point2D[],
  allowCollinear: boolean = false,
): ConvexHullAlgorithmResult {
  const steps: ConvexHullStep[] = [];
  if (points.length <= 1) {
    return {
      algorithm: "monotone_chain",
      hull: [...points],
      steps: [
        {
          stepIndex: 0,
          phase: "Initialization",
          title: "Trivial Set",
          description: `Trivial point set with ${points.length} points.`,
          currentStack: [...points],
          action: "done",
          finalHull: [...points],
          area: 0,
          perimeter: 0,
          lowerHull: [...points],
          upperHull: [],
        },
      ],
      area: 0,
      perimeter: 0,
      lowerHull: [...points],
      upperHull: [],
    };
  }

  // 1. Sort points lexicographically by x, then by y
  const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  // Deduplicate points with identical coordinates
  const uniquePoints: Point2D[] = [];
  for (const p of sorted) {
    if (
      uniquePoints.length === 0 ||
      Math.abs(uniquePoints[uniquePoints.length - 1].x - p.x) > EPSILON ||
      Math.abs(uniquePoints[uniquePoints.length - 1].y - p.y) > EPSILON
    ) {
      uniquePoints.push(p);
    }
  }

  if (uniquePoints.length <= 2) {
    const area = 0;
    const perim = polygonPerimeter(uniquePoints);
    return {
      algorithm: "monotone_chain",
      hull: uniquePoints,
      steps: [
        {
          stepIndex: 0,
          phase: "Initialization",
          title: "Base Case",
          description: `Point set has ${uniquePoints.length} distinct points. Hull is the segment itself.`,
          currentStack: uniquePoints,
          action: "done",
          finalHull: uniquePoints,
          area,
          perimeter: perim,
          lowerHull: uniquePoints,
          upperHull: [],
        },
      ],
      area,
      perimeter: perim,
      lowerHull: uniquePoints,
      upperHull: [],
    };
  }

  steps.push({
    stepIndex: 0,
    phase: "Sorting",
    title: "Lexicographical Sort",
    description: `Sorted ${uniquePoints.length} points left-to-right by x-coordinate (tiebreak by y).`,
    currentStack: [],
    action: "init",
    activeSet: uniquePoints,
  });

  // 2. Build Lower Hull
  const lower: Point2D[] = [];
  for (let i = 0; i < uniquePoints.length; i++) {
    const p = uniquePoints[i];
    while (lower.length >= 2) {
      const p1 = lower[lower.length - 2];
      const p2 = lower[lower.length - 1];
      const cp = crossProduct2D(p1, p2, p);
      const turn = turnOrientation(p1, p2, p);

      const isNonLeft = allowCollinear ? cp < -EPSILON : cp <= EPSILON;
      if (isNonLeft) {
        steps.push({
          stepIndex: steps.length,
          phase: "Lower Hull",
          title: `Pop from Lower Hull (Turn: ${turn})`,
          description: `Cross product (${p1.label ?? "A"} -> ${p2.label ?? "B"} -> ${p.label ?? "C"}) = ${cp.toFixed(2)} (${turn}). Not a strict CCW left turn. Popping ${p2.label ?? "point"}.`,
          currentStack: [...lower],
          candidatePoint: p,
          prevPoint1: p1,
          prevPoint2: p2,
          crossProduct: cp,
          turnOrientation: turn,
          action: "pop",
          lowerHull: [...lower],
        });
        lower.pop();
      } else {
        break;
      }
    }
    lower.push(p);
    steps.push({
      stepIndex: steps.length,
      phase: "Lower Hull",
      title: `Push to Lower Hull: ${p.label ?? `(${p.x}, ${p.y})`}`,
      description: `Added point ${p.label ?? `(${p.x}, ${p.y})`} to the lower hull stack (depth: ${lower.length}).`,
      currentStack: [...lower],
      candidatePoint: p,
      action: "push",
      lowerHull: [...lower],
    });
  }

  // 3. Build Upper Hull
  const upper: Point2D[] = [];
  for (let i = uniquePoints.length - 1; i >= 0; i--) {
    const p = uniquePoints[i];
    while (upper.length >= 2) {
      const p1 = upper[upper.length - 2];
      const p2 = upper[upper.length - 1];
      const cp = crossProduct2D(p1, p2, p);
      const turn = turnOrientation(p1, p2, p);

      const isNonLeft = allowCollinear ? cp < -EPSILON : cp <= EPSILON;
      if (isNonLeft) {
        steps.push({
          stepIndex: steps.length,
          phase: "Upper Hull",
          title: `Pop from Upper Hull (Turn: ${turn})`,
          description: `Cross product (${p1.label ?? "A"} -> ${p2.label ?? "B"} -> ${p.label ?? "C"}) = ${cp.toFixed(2)} (${turn}). Popping ${p2.label ?? "point"}.`,
          currentStack: [...upper],
          candidatePoint: p,
          prevPoint1: p1,
          prevPoint2: p2,
          crossProduct: cp,
          turnOrientation: turn,
          action: "pop",
          lowerHull: [...lower],
          upperHull: [...upper],
        });
        upper.pop();
      } else {
        break;
      }
    }
    upper.push(p);
    steps.push({
      stepIndex: steps.length,
      phase: "Upper Hull",
      title: `Push to Upper Hull: ${p.label ?? `(${p.x}, ${p.y})`}`,
      description: `Added point ${p.label ?? `(${p.x}, ${p.y})`} to the upper hull stack (depth: ${upper.length}).`,
      currentStack: [...upper],
      candidatePoint: p,
      action: "push",
      lowerHull: [...lower],
      upperHull: [...upper],
    });
  }

  // Merge hulls: remove duplicate endpoints
  // lower has p0 ... pn; upper has pn ... p0
  const hull: Point2D[] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  const finalArea = shoelacePolygonArea(hull);
  const finalPerimeter = polygonPerimeter(hull);

  steps.push({
    stepIndex: steps.length,
    phase: "Completion",
    title: "Convex Hull Complete",
    description: `Constructed convex hull with ${hull.length} vertices. Area = ${finalArea.toFixed(2)}, Perimeter = ${finalPerimeter.toFixed(2)}.`,
    currentStack: hull,
    action: "done",
    lowerHull: [...lower],
    upperHull: [...upper],
    finalHull: hull,
    area: finalArea,
    perimeter: finalPerimeter,
  });

  return {
    algorithm: "monotone_chain",
    hull,
    steps,
    area: finalArea,
    perimeter: finalPerimeter,
    lowerHull: lower,
    upperHull: upper,
  };
}

/**
 * Graham Scan Convex Hull Algorithm (O(N log N)).
 * Sorts points radially around bottom-left pivot point and builds hull using CCW stack.
 */
export function computeGrahamScan(
  points: readonly Point2D[],
  allowCollinear: boolean = false,
): ConvexHullAlgorithmResult {
  const steps: ConvexHullStep[] = [];
  if (points.length <= 2) {
    const area = 0;
    const perim = polygonPerimeter(points);
    return {
      algorithm: "graham_scan",
      hull: [...points],
      steps: [
        {
          stepIndex: 0,
          phase: "Initialization",
          title: "Base Case",
          description: `Point set has ${points.length} points.`,
          currentStack: [...points],
          action: "done",
          finalHull: [...points],
          area,
          perimeter: perim,
          lowerHull: [...points],
          upperHull: [],
        },
      ],
      area,
      perimeter: perim,
      lowerHull: [...points],
      upperHull: [],
    };
  }

  // 1. Find pivot point P0 (lowest y, then lowest x)
  let pivotIndex = 0;
  for (let i = 1; i < points.length; i++) {
    if (
      points[i].y < points[pivotIndex].y ||
      (Math.abs(points[i].y - points[pivotIndex].y) <= EPSILON &&
        points[i].x < points[pivotIndex].x)
    ) {
      pivotIndex = i;
    }
  }
  const p0 = points[pivotIndex];
  const rest = points.filter((_, idx) => idx !== pivotIndex);

  steps.push({
    stepIndex: 0,
    phase: "Pivot Selection",
    title: `Selected Pivot P0: ${p0.label ?? `(${p0.x}, ${p0.y})`}`,
    description: `P0 is the point with minimum y-coordinate (and min x on ties).`,
    currentStack: [p0],
    action: "init",
    candidatePoint: p0,
  });

  // 2. Sort rest by polar angle with respect to P0
  const sortedRest = [...rest].sort((a, b) => {
    const cp = crossProduct2D(p0, a, b);
    if (Math.abs(cp) > EPSILON) {
      return cp > 0 ? -1 : 1; // CCW comes first
    }
    // Collinear: closer point comes first
    return euclideanDistanceSquared(p0, a) - euclideanDistanceSquared(p0, b);
  });

  // 3. Graham Scan Stack traversal
  const stack: Point2D[] = [p0];
  for (let i = 0; i < sortedRest.length; i++) {
    const p = sortedRest[i];
    while (stack.length >= 2) {
      const p1 = stack[stack.length - 2];
      const p2 = stack[stack.length - 1];
      const cp = crossProduct2D(p1, p2, p);
      const turn = turnOrientation(p1, p2, p);

      const isNonLeft = allowCollinear ? cp < -EPSILON : cp <= EPSILON;
      if (isNonLeft) {
        steps.push({
          stepIndex: steps.length,
          phase: "Scan Stack",
          title: `Pop from Stack (Turn: ${turn})`,
          description: `Cross product (${p1.label ?? "A"} -> ${p2.label ?? "B"} -> ${p.label ?? "C"}) = ${cp.toFixed(2)} (${turn}). Popping ${p2.label ?? "point"}.`,
          currentStack: [...stack],
          candidatePoint: p,
          prevPoint1: p1,
          prevPoint2: p2,
          crossProduct: cp,
          turnOrientation: turn,
          action: "pop",
        });
        stack.pop();
      } else {
        break;
      }
    }
    stack.push(p);
    steps.push({
      stepIndex: steps.length,
      phase: "Scan Stack",
      title: `Push to Stack: ${p.label ?? `(${p.x}, ${p.y})`}`,
      description: `Pushed point ${p.label ?? `(${p.x}, ${p.y})`} to Graham Scan stack (depth: ${stack.length}).`,
      currentStack: [...stack],
      candidatePoint: p,
      action: "push",
    });
  }

  const finalArea = shoelacePolygonArea(stack);
  const finalPerimeter = polygonPerimeter(stack);

  steps.push({
    stepIndex: steps.length,
    phase: "Completion",
    title: "Graham Scan Complete",
    description: `Constructed convex hull with ${stack.length} vertices. Area = ${finalArea.toFixed(2)}, Perimeter = ${finalPerimeter.toFixed(2)}.`,
    currentStack: stack,
    action: "done",
    finalHull: stack,
    area: finalArea,
    perimeter: finalPerimeter,
    lowerHull: stack,
    upperHull: [],
  });

  return {
    algorithm: "graham_scan",
    hull: stack,
    steps,
    area: finalArea,
    perimeter: finalPerimeter,
    lowerHull: stack,
    upperHull: [],
  };
}

/**
 * QuickHull Convex Hull Algorithm (Divide-and-Conquer).
 */
export function computeQuickHull(points: readonly Point2D[]): ConvexHullAlgorithmResult {
  const steps: ConvexHullStep[] = [];
  if (points.length <= 2) {
    const area = 0;
    const perim = polygonPerimeter(points);
    return {
      algorithm: "quickhull",
      hull: [...points],
      steps: [
        {
          stepIndex: 0,
          phase: "Initialization",
          title: "Base Case",
          description: `Point set has ${points.length} points.`,
          currentStack: [...points],
          action: "done",
          finalHull: [...points],
          area,
          perimeter: perim,
          lowerHull: [...points],
          upperHull: [],
        },
      ],
      area,
      perimeter: perim,
      lowerHull: [...points],
      upperHull: [],
    };
  }

  // 1. Find min-x and max-x points
  let minXPt = points[0];
  let maxXPt = points[0];
  for (const p of points) {
    if (p.x < minXPt.x) minXPt = p;
    if (p.x > maxXPt.x) maxXPt = p;
  }

  steps.push({
    stepIndex: 0,
    phase: "Extremal Baseline",
    title: `Find Extremal Points: ${minXPt.label ?? "P_min"} and ${maxXPt.label ?? "P_max"}`,
    description: `Established baseline line segment connecting leftmost (${minXPt.x}, ${minXPt.y}) and rightmost (${maxXPt.x}, ${maxXPt.y}) points.`,
    currentStack: [minXPt, maxXPt],
    action: "extremal",
    lineSegment: [minXPt, maxXPt],
  });

  const leftSet: Point2D[] = [];
  const rightSet: Point2D[] = [];

  for (const p of points) {
    if (p === minXPt || p === maxXPt) continue;
    const cp = crossProduct2D(minXPt, maxXPt, p);
    if (cp > EPSILON) {
      leftSet.push(p);
    } else if (cp < -EPSILON) {
      rightSet.push(p);
    }
  }

  const hullSet: Point2D[] = [minXPt, maxXPt];

  function findHull(set: Point2D[], p1: Point2D, p2: Point2D, sideName: string) {
    if (set.length === 0) return;

    // Find point farthest from line (p1 -> p2)
    let maxDist = -1;
    let farthestPt: Point2D = set[0];

    for (const p of set) {
      const dist = Math.abs(crossProduct2D(p1, p2, p));
      if (dist > maxDist) {
        maxDist = dist;
        farthestPt = p;
      }
    }

    hullSet.push(farthestPt);

    steps.push({
      stepIndex: steps.length,
      phase: `QuickHull ${sideName}`,
      title: `Extremal Vertex: ${farthestPt.label ?? `(${farthestPt.x}, ${farthestPt.y})`}`,
      description: `Found point maximizing triangle area with baseline (${p1.label ?? "P1"} -> ${p2.label ?? "P2"}). Added to hull.`,
      currentStack: [...hullSet],
      candidatePoint: farthestPt,
      lineSegment: [p1, p2],
      action: "partition",
      activeSet: set,
    });

    // Partition remaining points for sub-segments (p1 -> farthestPt) and (farthestPt -> p2)
    const set1: Point2D[] = [];
    const set2: Point2D[] = [];

    for (const p of set) {
      if (p === farthestPt) continue;
      if (crossProduct2D(p1, farthestPt, p) > EPSILON) {
        set1.push(p);
      } else if (crossProduct2D(farthestPt, p2, p) > EPSILON) {
        set2.push(p);
      }
    }

    findHull(set1, p1, farthestPt, `${sideName} Left`);
    findHull(set2, farthestPt, p2, `${sideName} Right`);
  }

  findHull(leftSet, minXPt, maxXPt, "Upper/Left");
  findHull(rightSet, maxXPt, minXPt, "Lower/Right");

  // Sort hull points in counter-clockwise order around centroid
  const cx = hullSet.reduce((acc, p) => acc + p.x, 0) / hullSet.length;
  const cy = hullSet.reduce((acc, p) => acc + p.y, 0) / hullSet.length;
  const sortedHull = [...hullSet].sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });

  const finalArea = shoelacePolygonArea(sortedHull);
  const finalPerimeter = polygonPerimeter(sortedHull);

  steps.push({
    stepIndex: steps.length,
    phase: "Completion",
    title: "QuickHull Complete",
    description: `Constructed convex hull with ${sortedHull.length} vertices. Area = ${finalArea.toFixed(2)}, Perimeter = ${finalPerimeter.toFixed(2)}.`,
    currentStack: sortedHull,
    action: "done",
    finalHull: sortedHull,
    area: finalArea,
    perimeter: finalPerimeter,
  });

  return {
    algorithm: "quickhull",
    hull: sortedHull,
    steps,
    area: finalArea,
    perimeter: finalPerimeter,
    lowerHull: sortedHull,
    upperHull: [],
  };
}

// ----------------------------------------------------------------------------
// Bentley-Ottmann Line Segment Intersection Utilities
// ----------------------------------------------------------------------------

/**
 * Computes the exact 2D intersection point between two line segments, if any.
 * Uses cross-product parametric solving:
 * P + t*R = Q + u*S where t, u in [0, 1].
 */
export function lineSegmentIntersection(
  s1: LineSegment,
  s2: LineSegment,
  eps: number = EPSILON,
): Point2D | null {
  const p = s1.p1;
  const r = { x: s1.p2.x - s1.p1.x, y: s1.p2.y - s1.p1.y };
  const q = s2.p1;
  const s = { x: s2.p2.x - s2.p1.x, y: s2.p2.y - s2.p1.y };

  const rxs = r.x * s.y - r.y * s.x;
  const q_minus_p = { x: q.x - p.x, y: q.y - p.y };
  const qpxr = q_minus_p.x * r.y - q_minus_p.y * r.x;

  // Parallel or collinear
  if (Math.abs(rxs) <= eps) {
    if (Math.abs(qpxr) <= eps) {
      // Collinear: check if projections overlap
      const rDotR = r.x * r.x + r.y * r.y;
      if (rDotR <= eps) return null;
      const t0 = (q_minus_p.x * r.x + q_minus_p.y * r.y) / rDotR;
      const t1 = t0 + (s.x * r.x + s.y * r.y) / rDotR;
      const minT = Math.min(t0, t1);
      const maxT = Math.max(t0, t1);
      if (maxT >= 0 && minT <= 1) {
        // Return mid-overlap point
        const overlapT = Math.max(0, minT);
        return {
          x: p.x + overlapT * r.x,
          y: p.y + overlapT * r.y,
        };
      }
    }
    return null;
  }

  const qpxs = q_minus_p.x * s.y - q_minus_p.y * s.x;
  const t = qpxs / rxs;
  const u = qpxr / rxs;

  if (t >= -eps && t <= 1 + eps && u >= -eps && u <= 1 + eps) {
    return {
      x: p.x + t * r.x,
      y: p.y + t * r.y,
    };
  }

  return null;
}

/**
 * Computes the y-coordinate of a line segment at sweep x.
 */
function getSegmentYAtX(seg: LineSegment, x: number): number {
  const dx = seg.p2.x - seg.p1.x;
  if (Math.abs(dx) <= EPSILON) {
    return (seg.p1.y + seg.p2.y) / 2.0;
  }
  const t = (x - seg.p1.x) / dx;
  return seg.p1.y + t * (seg.p2.y - seg.p1.y);
}

/**
 * Bentley-Ottmann Sweep-Line Algorithm for line segment intersections (O((N + K) log N)).
 */
export function computeBentleyOttmann(segments: readonly LineSegment[]): BentleyOttmannResult {
  // Normalize segments so that p1 has x <= p2.x
  const normalizedSegs: LineSegment[] = segments.map((seg, idx) => {
    let p1 = seg.p1;
    let p2 = seg.p2;
    if (p1.x > p2.x || (Math.abs(p1.x - p2.x) <= EPSILON && p1.y > p2.y)) {
      [p1, p2] = [p2, p1];
    }
    return {
      ...seg,
      id: seg.id || `seg_${idx + 1}`,
      p1,
      p2,
    };
  });

  // Event queue
  const events: SweepEvent[] = [];
  for (const seg of normalizedSegs) {
    events.push({
      id: `ev_start_${seg.id}`,
      type: "start",
      x: seg.p1.x,
      y: seg.p1.y,
      point: seg.p1,
      segment: seg,
    });
    events.push({
      id: `ev_end_${seg.id}`,
      type: "end",
      x: seg.p2.x,
      y: seg.p2.y,
      point: seg.p2,
      segment: seg,
    });
  }

  // Sort events by x ascending (tiebreak by y ascending, then start before intersection before end)
  const eventTypeRank: Record<BentleyOttmannEventType, number> = {
    start: 0,
    intersection: 1,
    end: 2,
  };

  const sortEvents = (list: SweepEvent[]) => {
    list.sort((a, b) => {
      if (Math.abs(a.x - b.x) > EPSILON) return a.x - b.x;
      if (Math.abs(a.y - b.y) > EPSILON) return a.y - b.y;
      return eventTypeRank[a.type] - eventTypeRank[b.type];
    });
  };

  sortEvents(events);

  const discoveredIntersections: IntersectionPoint[] = [];
  const recordedIntersectionsKey = new Set<string>();
  const steps: BentleyOttmannStep[] = [];

  let activeSegments: LineSegment[] = [];

  let eventIdx = 0;
  while (eventIdx < events.length) {
    const ev = events[eventIdx];
    eventIdx++;

    const sweepX = ev.x;

    // Helper: sort active segments by current sweep y (with small delta for intersection swaps)
    const sortActive = (evalX: number) => {
      activeSegments.sort((a, b) => {
        const yA = getSegmentYAtX(a, evalX);
        const yB = getSegmentYAtX(b, evalX);
        if (Math.abs(yA - yB) > EPSILON) return yA - yB;
        // Tiebreak by segment slopes
        const slopeA = (a.p2.y - a.p1.y) / Math.max(EPSILON, a.p2.x - a.p1.x);
        const slopeB = (b.p2.y - b.p1.y) / Math.max(EPSILON, b.p2.x - b.p1.x);
        return slopeA - slopeB;
      });
    };

    const testedPairs: [LineSegment, LineSegment][] = [];
    const newlyDiscoveredThisStep: IntersectionPoint[] = [];

    const testPair = (sA: LineSegment, sB: LineSegment) => {
      if (sA.id === sB.id) return;
      testedPairs.push([sA, sB]);
      const inter = lineSegmentIntersection(sA, sB);
      if (inter) {
        // If intersection is at or ahead of current sweep x
        if (inter.x >= sweepX - EPSILON) {
          const idPair = [sA.id, sB.id].sort().join("<->");
          const key = `${idPair}_${inter.x.toFixed(4)}_${inter.y.toFixed(4)}`;

          if (!recordedIntersectionsKey.has(key)) {
            recordedIntersectionsKey.add(key);
            const interObj: IntersectionPoint = {
              id: `inter_${discoveredIntersections.length + 1}`,
              point: inter,
              segments: [sA, sB],
              stepIndex: steps.length,
            };
            discoveredIntersections.push(interObj);
            newlyDiscoveredThisStep.push(interObj);

            // Add intersection event to queue if strictly ahead of sweep
            if (inter.x > sweepX + EPSILON) {
              events.push({
                id: `ev_inter_${interObj.id}`,
                type: "intersection",
                x: inter.x,
                y: inter.y,
                point: inter,
                segments: [sA, sB],
              });
              sortEvents(events);
            }
          }
        }
      }
    };

    if (ev.type === "start" && ev.segment) {
      const seg = ev.segment;
      activeSegments.push(seg);
      sortActive(sweepX);

      const idxInActive = activeSegments.findIndex((s) => s.id === seg.id);
      if (idxInActive > 0) {
        testPair(activeSegments[idxInActive - 1], seg);
      }
      if (idxInActive < activeSegments.length - 1) {
        testPair(seg, activeSegments[idxInActive + 1]);
      }

      steps.push({
        stepIndex: steps.length,
        phase: "Start Endpoint",
        title: `Left Endpoint of ${seg.label ?? seg.id}`,
        description: `Sweep line x=${sweepX.toFixed(2)} encountered left endpoint of ${seg.label ?? seg.id}. Inserted into active BST status. Tested neighbors.`,
        sweepX,
        currentEvent: ev,
        activeSegments: [...activeSegments],
        testedPairs,
        newlyDiscoveredIntersections: newlyDiscoveredThisStep,
        allDiscoveredIntersections: [...discoveredIntersections],
        remainingEventsCount: events.length - eventIdx,
      });
    } else if (ev.type === "end" && ev.segment) {
      const seg = ev.segment;
      sortActive(sweepX);
      const idxInActive = activeSegments.findIndex((s) => s.id === seg.id);
      if (idxInActive > 0 && idxInActive < activeSegments.length - 1) {
        // Test neighbor segments that will become adjacent after removal
        testPair(activeSegments[idxInActive - 1], activeSegments[idxInActive + 1]);
      }
      activeSegments = activeSegments.filter((s) => s.id !== seg.id);

      steps.push({
        stepIndex: steps.length,
        phase: "End Endpoint",
        title: `Right Endpoint of ${seg.label ?? seg.id}`,
        description: `Sweep line x=${sweepX.toFixed(2)} reached right endpoint of ${seg.label ?? seg.id}. Removed from active status. Tested newly adjacent neighbors.`,
        sweepX,
        currentEvent: ev,
        activeSegments: [...activeSegments],
        testedPairs,
        newlyDiscoveredIntersections: newlyDiscoveredThisStep,
        allDiscoveredIntersections: [...discoveredIntersections],
        remainingEventsCount: events.length - eventIdx,
      });
    } else if (ev.type === "intersection" && ev.segments) {
      const [s1, s2] = ev.segments;
      // Re-sort active segments slightly past intersection x to simulate swap
      sortActive(sweepX + EPSILON * 10);

      const idx1 = activeSegments.findIndex((s) => s.id === s1.id);
      const idx2 = activeSegments.findIndex((s) => s.id === s2.id);

      if (idx1 >= 0 && idx2 >= 0) {
        const lowerIdx = Math.min(idx1, idx2);
        const upperIdx = Math.max(idx1, idx2);

        if (lowerIdx > 0) {
          testPair(activeSegments[lowerIdx - 1], activeSegments[lowerIdx]);
        }
        if (upperIdx < activeSegments.length - 1) {
          testPair(activeSegments[upperIdx], activeSegments[upperIdx + 1]);
        }
      }

      steps.push({
        stepIndex: steps.length,
        phase: "Intersection Event",
        title: `Crossing of ${s1.label ?? s1.id} ✕ ${s2.label ?? s2.id}`,
        description: `Sweep line x=${sweepX.toFixed(2)} reached intersection point (${ev.x.toFixed(2)}, ${ev.y.toFixed(2)}). Swapped vertical order in status.`,
        sweepX,
        currentEvent: ev,
        activeSegments: [...activeSegments],
        testedPairs,
        newlyDiscoveredIntersections: newlyDiscoveredThisStep,
        allDiscoveredIntersections: [...discoveredIntersections],
        remainingEventsCount: events.length - eventIdx,
      });
    }
  }

  return {
    intersections: discoveredIntersections,
    steps,
    totalEventsProcessed: steps.length,
    initialSegmentsCount: segments.length,
  };
}

// ----------------------------------------------------------------------------
// Closest Pair of Points (Divide and Conquer O(N log N))
// ----------------------------------------------------------------------------

/**
 * Brute force closest pair for base cases.
 */
export function computeClosestPairBruteForce(points: readonly Point2D[]): ClosestPairResult {
  let minDist = Infinity;
  let p1: Point2D = points[0] || { x: 0, y: 0 };
  let p2: Point2D = points[1] || { x: 0, y: 0 };

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = euclideanDistance(points[i], points[j]);
      if (d < minDist) {
        minDist = d;
        p1 = points[i];
        p2 = points[j];
      }
    }
  }

  return { p1, p2, distance: minDist };
}

/**
 * Divide-and-Conquer Closest Pair Algorithm (O(N log N)).
 */
export function computeClosestPairDC(points: readonly Point2D[]): ClosestPairDCResult {
  if (points.length < 2) {
    const p = points[0] || { x: 0, y: 0 };
    return {
      closestPair: [p, p],
      minDistance: 0,
      steps: [
        {
          stepIndex: 0,
          phase: "Base Case",
          title: "Insufficient Points",
          description: "Need at least 2 points to compute closest pair.",
          depth: 0,
          range: [0, points.length],
          currentDelta: 0,
        },
      ],
      sortedPoints: [...points],
    };
  }

  // Pre-sort points by x-coordinate
  const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));
  const steps: ClosestPairStep[] = [];

  let globalBest: ClosestPairCandidate = {
    p1: sorted[0],
    p2: sorted[1],
    distance: euclideanDistance(sorted[0], sorted[1]),
  };

  steps.push({
    stepIndex: 0,
    phase: "Initialization",
    title: "Presort by X-Coordinate",
    description: `Sorted ${sorted.length} points along the x-axis for divide-and-conquer recursion.`,
    depth: 0,
    range: [0, sorted.length],
    currentDelta: globalBest.distance,
    bestPairSoFar: globalBest,
  });

  function closestPairRec(l: number, r: number, depth: number): ClosestPairCandidate {
    const count = r - l;

    if (count <= 3) {
      const subPoints = sorted.slice(l, r);
      const bf = computeClosestPairBruteForce(subPoints);
      if (bf.distance < globalBest.distance) {
        globalBest = { p1: bf.p1, p2: bf.p2, distance: bf.distance };
      }

      steps.push({
        stepIndex: steps.length,
        phase: `Base Case (Depth ${depth})`,
        title: `Direct Pairwise Check (${count} points)`,
        description: `Sub-array [${l}..${r - 1}] evaluated directly. Minimum local distance = ${bf.distance.toFixed(3)}.`,
        depth,
        range: [l, r],
        currentDelta: globalBest.distance,
        comparedPair: [bf.p1, bf.p2],
        comparedDistance: bf.distance,
        bestPairSoFar: { ...globalBest },
      });

      return { p1: bf.p1, p2: bf.p2, distance: bf.distance };
    }

    const mid = Math.floor((l + r) / 2);
    const midPoint = sorted[mid];
    const midX = midPoint.x;

    steps.push({
      stepIndex: steps.length,
      phase: `Divide (Depth ${depth})`,
      title: `Split at Midline x = ${midX.toFixed(2)}`,
      description: `Dividing range [${l}..${r - 1}] into left subset [${l}..${mid - 1}] and right subset [${mid}..${r - 1}].`,
      depth,
      range: [l, r],
      midX,
      midPoint,
      currentDelta: globalBest.distance,
      bestPairSoFar: { ...globalBest },
    });

    const leftBest = closestPairRec(l, mid, depth + 1);
    const rightBest = closestPairRec(mid, r, depth + 1);

    let delta = Math.min(leftBest.distance, rightBest.distance);
    let bestLocal = leftBest.distance <= rightBest.distance ? leftBest : rightBest;

    if (bestLocal.distance < globalBest.distance) {
      globalBest = { ...bestLocal };
    }

    // Strip Phase: points with |p.x - midX| < delta
    const strip: Point2D[] = [];
    for (let i = l; i < r; i++) {
      if (Math.abs(sorted[i].x - midX) < delta) {
        strip.push(sorted[i]);
      }
    }

    // Sort strip points by y-coordinate
    strip.sort((a, b) => a.y - b.y);

    steps.push({
      stepIndex: steps.length,
      phase: `Strip Combine (Depth ${depth})`,
      title: `Strip Examination [x_mid - δ, x_mid + δ]`,
      description: `Current δ = ${delta.toFixed(3)}. Found ${strip.length} candidate points in the strip region.`,
      depth,
      range: [l, r],
      midX,
      midPoint,
      leftBest,
      rightBest,
      currentDelta: delta,
      stripRange: [midX - delta, midX + delta],
      stripPoints: [...strip],
      bestPairSoFar: { ...globalBest },
    });

    // 7-neighbor comparison in strip
    for (let i = 0; i < strip.length; i++) {
      for (let j = i + 1; j < strip.length && strip[j].y - strip[i].y < delta && j <= i + 7; j++) {
        const d = euclideanDistance(strip[i], strip[j]);
        if (d < delta) {
          delta = d;
          bestLocal = { p1: strip[i], p2: strip[j], distance: d };
          if (d < globalBest.distance) {
            globalBest = { p1: strip[i], p2: strip[j], distance: d };
          }

          steps.push({
            stepIndex: steps.length,
            phase: `Strip Improvement (Depth ${depth})`,
            title: `New Closer Pair in Strip! (d = ${d.toFixed(3)})`,
            description: `Found cross-boundary closer pair between ${strip[i].label ?? "P1"} and ${strip[j].label ?? "P2"} with d=${d.toFixed(3)} < δ.`,
            depth,
            range: [l, r],
            midX,
            midPoint,
            currentDelta: delta,
            stripRange: [midX - delta, midX + delta],
            stripPoints: [...strip],
            comparedPair: [strip[i], strip[j]],
            comparedDistance: d,
            bestPairSoFar: { ...globalBest },
            isStripComparison: true,
          });
        }
      }
    }

    return bestLocal;
  }

  const finalResult = closestPairRec(0, sorted.length, 0);

  steps.push({
    stepIndex: steps.length,
    phase: "Completion",
    title: "Closest Pair Determined",
    description: `Optimal closest pair is (${finalResult.p1.label ?? "P1"}, ${finalResult.p2.label ?? "P2"}) with minimal Euclidean distance = ${finalResult.distance.toFixed(3)}.`,
    depth: 0,
    range: [0, sorted.length],
    currentDelta: finalResult.distance,
    comparedPair: [finalResult.p1, finalResult.p2],
    comparedDistance: finalResult.distance,
    bestPairSoFar: finalResult,
  });

  return {
    closestPair: [finalResult.p1, finalResult.p2],
    minDistance: finalResult.distance,
    steps,
    sortedPoints: sorted,
  };
}

// ----------------------------------------------------------------------------
// Point-in-Polygon (Ray Casting & Winding Number)
// ----------------------------------------------------------------------------

/**
 * Checks if a point lies exactly on a line segment.
 */
export function isPointOnSegment(p: Point2D, a: Point2D, b: Point2D, eps: number = 1e-6): boolean {
  const cross = crossProduct2D(a, b, p);
  if (Math.abs(cross) > eps) return false;
  const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
  if (dot < -eps) return false;
  const sqLen = euclideanDistanceSquared(a, b);
  if (dot > sqLen + eps) return false;
  return true;
}

/**
 * Computes Point-in-Polygon test using Horizontal Ray Casting (Jordan Curve Parity).
 */
export function computeRayCastingPIP(
  polygon: readonly Point2D[],
  queryPoint: Point2D,
): RayCastingPIPResult {
  const n = polygon.length;
  if (n < 3) {
    return {
      isInside: false,
      isOnBoundary: false,
      totalCrossings: 0,
      edgeTraces: [],
      queryPoint,
      polygon,
      steps: [],
    };
  }

  let totalCrossings = 0;
  let isOnBoundary = false;
  const edgeTraces: RayCastingEdgeTrace[] = [];
  const steps: PIPStepTrace[] = [];

  for (let i = 0; i < n; i++) {
    const v1 = polygon[i];
    const v2 = polygon[(i + 1) % n];

    // Check if query point is on edge
    if (isPointOnSegment(queryPoint, v1, v2)) {
      isOnBoundary = true;
    }

    // Ray casting condition:
    // Edge crosses horizontal line y = queryPoint.y
    const conditionY = v1.y > queryPoint.y !== v2.y > queryPoint.y;
    let crossesHoriz = false;
    let interX: number | undefined = undefined;
    let toRight = false;

    if (conditionY) {
      crossesHoriz = true;
      interX = v1.x + ((queryPoint.y - v1.y) * (v2.x - v1.x)) / (v2.y - v1.y);
      if (interX > queryPoint.x) {
        toRight = true;
        totalCrossings++;
      }
    }

    const trace: RayCastingEdgeTrace = {
      edgeIndex: i,
      v1,
      v2,
      crossesHorizontalRay: crossesHoriz,
      intersectionX: interX,
      intersectsRayToRight: toRight,
      isOnEdge: isPointOnSegment(queryPoint, v1, v2),
    };
    edgeTraces.push(trace);

    steps.push({
      stepIndex: i,
      edgeIndex: i,
      edge: [v1, v2],
      queryPoint,
      phase: `Edge ${i + 1}/${n}`,
      description: toRight
        ? `Edge [${v1.label ?? "V1"} -> ${v2.label ?? "V2"}] intersects horizontal ray to right at x=${interX?.toFixed(2)}. Total crossings: ${totalCrossings}.`
        : `Edge [${v1.label ?? "V1"} -> ${v2.label ?? "V2"}] does not cross ray to right. Total crossings: ${totalCrossings}.`,
      isIntersecting: toRight,
      currentCrossingsCount: totalCrossings,
      currentWindingNumber: 0,
    });
  }

  const isInside = isOnBoundary || totalCrossings % 2 === 1;

  return {
    isInside,
    isOnBoundary,
    totalCrossings,
    edgeTraces,
    queryPoint,
    polygon,
    steps,
  };
}

/**
 * Computes Point-in-Polygon test using Winding Number Algorithm.
 */
export function computeWindingNumberPIP(
  polygon: readonly Point2D[],
  queryPoint: Point2D,
): WindingNumberPIPResult {
  const n = polygon.length;
  if (n < 3) {
    return {
      windingNumber: 0,
      isInside: false,
      isOnBoundary: false,
      edgeTraces: [],
      queryPoint,
      polygon,
    };
  }

  let wn = 0;
  let isOnBoundary = false;
  const edgeTraces: WindingNumberEdgeTrace[] = [];

  for (let i = 0; i < n; i++) {
    const v1 = polygon[i];
    const v2 = polygon[(i + 1) % n];

    if (isPointOnSegment(queryPoint, v1, v2)) {
      isOnBoundary = true;
    }

    let delta = 0;
    const cp = crossProduct2D(v1, v2, queryPoint);

    if (v1.y <= queryPoint.y) {
      // Upward edge
      if (v2.y > queryPoint.y && cp > EPSILON) {
        wn += 1;
        delta = 1;
      }
    } else {
      // Downward edge
      if (v2.y <= queryPoint.y && cp < -EPSILON) {
        wn -= 1;
        delta = -1;
      }
    }

    edgeTraces.push({
      edgeIndex: i,
      v1,
      v2,
      orientation: cp,
      deltaWinding: delta,
    });
  }

  return {
    windingNumber: wn,
    isInside: isOnBoundary || wn !== 0,
    isOnBoundary,
    edgeTraces,
    queryPoint,
    polygon,
  };
}

// ============================================================================
// 3. PRESETS & MODALITY METADATA
// ============================================================================

export const GEOMETRY_MODALITIES: readonly {
  readonly id: GeometryStudioModality;
  readonly name: string;
  readonly shortName: string;
  readonly badge: string;
  readonly formulaTeX: string;
  readonly description: string;
}[] = [
  {
    id: "convex_hull_algorithms",
    name: "Convex Hull Algorithms",
    shortName: "Convex Hull",
    badge: "O(N log N)",
    formulaTeX: "\\text{Cross}(O, A, B) = (A_x - O_x)(B_y - O_y) - (A_y - O_y)(B_x - O_x)",
    description:
      "Andrew's Monotone Chain, Graham Polar Angle Scan, and QuickHull divide-and-conquer envelope builder.",
  },
  {
    id: "bentley_ottmann_sweep",
    name: "Bentley-Ottmann Sweep Line",
    shortName: "Sweep Line",
    badge: "O((N+K) log N)",
    formulaTeX: "x = x_e \\implies T \\text{ active BST sorted by } y(x_e)",
    description:
      "Event-driven sweep-line intersection engine discovering all line crossings in sub-quadratic time.",
  },
  {
    id: "closest_pair_points",
    name: "Closest Pair of Points (D&C)",
    shortName: "Closest Pair",
    badge: "O(N log N)",
    formulaTeX:
      "\\delta = \\min(\\delta_L, \\delta_R), \\quad \\text{Strip } |x_i - x_{mid}| < \\delta",
    description:
      "Divide-and-conquer geometric distance minimizer with 7-neighbor strip verification.",
  },
  {
    id: "point_in_polygon_ray_casting",
    name: "Point-in-Polygon & Ray Casting",
    shortName: "Point in Polygon",
    badge: "O(N) Jordan Parity",
    formulaTeX: "\\text{Crossings} \\equiv 1 \\pmod 2 \\iff \\text{Inside}, \\quad WN \\neq 0",
    description:
      "Jordan Curve Theorem ray-casting parity checker and winding number topological classifier.",
  },
];

export const CONVEX_HULL_PRESETS: Readonly<Record<string, GeometryStudioPreset>> = {
  random_cluster_12: {
    id: "random_cluster_12",
    name: "Random Cluster (12 Points)",
    modality: "convex_hull_algorithms",
    category: "Standard",
    description: "12 non-collinear points with both interior vertices and outer convex boundaries.",
    points: [
      { id: "p1", x: 15, y: 25, label: "P1" },
      { id: "p2", x: 30, y: 70, label: "P2" },
      { id: "p3", x: 50, y: 85, label: "P3" },
      { id: "p4", x: 75, y: 75, label: "P4" },
      { id: "p5", x: 85, y: 35, label: "P5" },
      { id: "p6", x: 65, y: 15, label: "P6" },
      { id: "p7", x: 35, y: 10, label: "P7" },
      { id: "p8", x: 40, y: 40, label: "P8" },
      { id: "p9", x: 55, y: 55, label: "P9" },
      { id: "p10", x: 45, y: 65, label: "P10" },
      { id: "p11", x: 70, y: 45, label: "P11" },
      { id: "p12", x: 25, y: 45, label: "P12" },
    ],
  },
  collinear_outliers: {
    id: "collinear_outliers",
    name: "Collinear Edges & Outliers",
    modality: "convex_hull_algorithms",
    category: "Degenerate",
    description: "Demonstrates popping collinear points on horizontal and vertical boundary lines.",
    points: [
      { id: "c1", x: 10, y: 20, label: "C1" },
      { id: "c2", x: 30, y: 20, label: "C2" },
      { id: "c3", x: 50, y: 20, label: "C3" },
      { id: "c4", x: 70, y: 20, label: "C4" },
      { id: "c5", x: 90, y: 20, label: "C5" },
      { id: "c6", x: 90, y: 50, label: "C6" },
      { id: "c7", x: 90, y: 80, label: "C7" },
      { id: "c8", x: 50, y: 80, label: "C8" },
      { id: "c9", x: 10, y: 80, label: "C9" },
      { id: "c10", x: 50, y: 50, label: "C10" },
    ],
  },
  concentric_rings: {
    id: "concentric_rings",
    name: "Concentric Double Ring (16 Points)",
    modality: "convex_hull_algorithms",
    category: "Circular",
    description: "Outer circular boundary completely shielding inner circular vertices.",
    points: [
      { id: "o1", x: 50, y: 90, label: "O1" },
      { id: "o2", x: 78, y: 78, label: "O2" },
      { id: "o3", x: 90, y: 50, label: "O3" },
      { id: "o4", x: 78, y: 22, label: "O4" },
      { id: "o5", x: 50, y: 10, label: "O5" },
      { id: "o6", x: 22, y: 22, label: "O6" },
      { id: "o7", x: 10, y: 50, label: "O7" },
      { id: "o8", x: 22, y: 78, label: "O8" },
      { id: "i1", x: 50, y: 70, label: "I1" },
      { id: "i2", x: 64, y: 64, label: "I2" },
      { id: "i3", x: 70, y: 50, label: "I3" },
      { id: "i4", x: 64, y: 36, label: "I4" },
      { id: "i5", x: 50, y: 30, label: "I5" },
      { id: "i6", x: 36, y: 36, label: "I6" },
      { id: "i7", x: 30, y: 50, label: "I7" },
      { id: "i8", x: 36, y: 64, label: "I8" },
    ],
  },
  star_polygon: {
    id: "star_polygon",
    name: "Non-Convex Star Constellation",
    modality: "convex_hull_algorithms",
    category: "Concave",
    description: "5-pointed star where inner valleys get bridged by outer convex edges.",
    points: [
      { id: "s1", x: 50, y: 90, label: "Tip1" },
      { id: "s2", x: 60, y: 65, label: "Val1" },
      { id: "s3", x: 88, y: 65, label: "Tip2" },
      { id: "s4", x: 66, y: 48, label: "Val2" },
      { id: "s5", x: 74, y: 20, label: "Tip3" },
      { id: "s6", x: 50, y: 38, label: "Val3" },
      { id: "s7", x: 26, y: 20, label: "Tip4" },
      { id: "s8", x: 34, y: 48, label: "Val4" },
      { id: "s9", x: 12, y: 65, label: "Tip5" },
      { id: "s10", x: 40, y: 65, label: "Val5" },
    ],
  },
};

export const BENTLEY_OTTMANN_PRESETS: Readonly<Record<string, GeometryStudioPreset>> = {
  classic_crossroads: {
    id: "classic_crossroads",
    name: "Classic Crossroads (4 Segments)",
    modality: "bentley_ottmann_sweep",
    category: "Standard",
    description: "4 segments intersecting at 3 distinct internal points.",
    segments: [
      { id: "s1", p1: { x: 10, y: 20 }, p2: { x: 90, y: 80 }, color: "#38bdf8", label: "S1" },
      { id: "s2", p1: { x: 10, y: 80 }, p2: { x: 90, y: 20 }, color: "#f43f5e", label: "S2" },
      { id: "s3", p1: { x: 30, y: 10 }, p2: { x: 70, y: 90 }, color: "#10b981", label: "S3" },
      { id: "s4", p1: { x: 20, y: 50 }, p2: { x: 80, y: 50 }, color: "#f59e0b", label: "S4" },
    ],
  },
  grid_mesh: {
    id: "grid_mesh",
    name: "Intersecting Grid Mesh (6 Segments)",
    modality: "bentley_ottmann_sweep",
    category: "Mesh",
    description: "3 horizontal and 3 diagonal segments producing 9 crossing points.",
    segments: [
      { id: "h1", p1: { x: 10, y: 25 }, p2: { x: 90, y: 25 }, color: "#60a5fa", label: "H1" },
      { id: "h2", p1: { x: 10, y: 50 }, p2: { x: 90, y: 50 }, color: "#38bdf8", label: "H2" },
      { id: "h3", p1: { x: 10, y: 75 }, p2: { x: 90, y: 75 }, color: "#818cf8", label: "H3" },
      { id: "d1", p1: { x: 20, y: 10 }, p2: { x: 40, y: 90 }, color: "#fb7185", label: "D1" },
      { id: "d2", p1: { x: 45, y: 10 }, p2: { x: 65, y: 90 }, color: "#f43f5e", label: "D2" },
      { id: "d3", p1: { x: 70, y: 10 }, p2: { x: 90, y: 90 }, color: "#e11d48", label: "D3" },
    ],
  },
  star_of_david: {
    id: "star_of_david",
    name: "Hexagram Star (6 Segments)",
    modality: "bentley_ottmann_sweep",
    category: "Geometry",
    description: "Two interlocking triangles forming 6 edge intersection events.",
    segments: [
      { id: "t1_a", p1: { x: 20, y: 35 }, p2: { x: 80, y: 35 }, color: "#34d399", label: "T1-A" },
      { id: "t1_b", p1: { x: 80, y: 35 }, p2: { x: 50, y: 85 }, color: "#10b981", label: "T1-B" },
      { id: "t1_c", p1: { x: 50, y: 85 }, p2: { x: 20, y: 35 }, color: "#059669", label: "T1-C" },
      { id: "t2_a", p1: { x: 20, y: 65 }, p2: { x: 80, y: 65 }, color: "#fbbf24", label: "T2-A" },
      { id: "t2_b", p1: { x: 80, y: 65 }, p2: { x: 50, y: 15 }, color: "#f59e0b", label: "T2-B" },
      { id: "t2_c", p1: { x: 50, y: 15 }, p2: { x: 20, y: 65 }, color: "#d97706", label: "T2-C" },
    ],
  },
  parallel_segments: {
    id: "parallel_segments",
    name: "Parallel Non-Intersecting (4 Segments)",
    modality: "bentley_ottmann_sweep",
    category: "Disjoint",
    description: "4 parallel segments with zero intersections to verify event queue lifecycle.",
    segments: [
      { id: "p1", p1: { x: 15, y: 20 }, p2: { x: 85, y: 20 }, color: "#38bdf8", label: "P1" },
      { id: "p2", p1: { x: 20, y: 40 }, p2: { x: 80, y: 40 }, color: "#818cf8", label: "P2" },
      { id: "p3", p1: { x: 10, y: 60 }, p2: { x: 90, y: 60 }, color: "#c084fc", label: "P3" },
      { id: "p4", p1: { x: 25, y: 80 }, p2: { x: 75, y: 80 }, color: "#f472b6", label: "P4" },
    ],
  },
};

export const CLOSEST_PAIR_PRESETS: Readonly<Record<string, GeometryStudioPreset>> = {
  twin_near_neighbors: {
    id: "twin_near_neighbors",
    name: "Twin Near Neighbors (12 Points)",
    modality: "closest_pair_points",
    category: "Standard",
    description: "12 scattered points with two tightly clustered twins at distance ~2.24.",
    points: [
      { id: "p1", x: 10, y: 15, label: "P1" },
      { id: "p2", x: 25, y: 60, label: "P2" },
      { id: "p3", x: 42, y: 82, label: "P3" },
      { id: "p4", x: 43, y: 84, label: "P4-Twin" }, // Distance ~ 2.24
      { id: "p5", x: 65, y: 70, label: "P5" },
      { id: "p6", x: 85, y: 85, label: "P6" },
      { id: "p7", x: 80, y: 25, label: "P7" },
      { id: "p8", x: 55, y: 30, label: "P8" },
      { id: "p9", x: 35, y: 10, label: "P9" },
      { id: "p10", x: 20, y: 35, label: "P10" },
      { id: "p11", x: 70, y: 45, label: "P11" },
      { id: "p12", x: 90, y: 55, label: "P12" },
    ],
  },
  strip_bridging_pair: {
    id: "strip_bridging_pair",
    name: "Strip-Bridging Closest Pair (10 Points)",
    modality: "closest_pair_points",
    category: "Adversarial",
    description:
      "Closest pair spans across the midline in the strip phase, demonstrating why strip checking is vital.",
    points: [
      { id: "l1", x: 15, y: 20, label: "L1" },
      { id: "l2", x: 20, y: 75, label: "L2" },
      { id: "l3", x: 35, y: 45, label: "L3" },
      { id: "l4", x: 48, y: 50, label: "Bridge-L" }, // Close across midline x=50
      { id: "r1", x: 52, y: 51, label: "Bridge-R" }, // Distance = sqrt(4 + 1) = 2.236
      { id: "r2", x: 65, y: 25, label: "R2" },
      { id: "r3", x: 80, y: 70, label: "R3" },
      { id: "r4", x: 85, y: 20, label: "R4" },
      { id: "l5", x: 10, y: 50, label: "L5" },
      { id: "r5", x: 90, y: 50, label: "R5" },
    ],
  },
  uniform_grid: {
    id: "uniform_grid",
    name: "Jittered 4x4 Grid (16 Points)",
    modality: "closest_pair_points",
    category: "Grid",
    description: "16 points on a regular grid with randomized sub-pixel jitter.",
    points: [
      { id: "g1", x: 20, y: 20, label: "G1" },
      { id: "g2", x: 40, y: 20, label: "G2" },
      { id: "g3", x: 60, y: 20, label: "G3" },
      { id: "g4", x: 80, y: 20, label: "G4" },
      { id: "g5", x: 20, y: 40, label: "G5" },
      { id: "g6", x: 39, y: 41, label: "G6" },
      { id: "g7", x: 42, y: 42, label: "G7-Close" }, // Distance ~ 3.16
      { id: "g8", x: 80, y: 40, label: "G8" },
      { id: "g9", x: 20, y: 60, label: "G9" },
      { id: "g10", x: 40, y: 60, label: "G10" },
      { id: "g11", x: 60, y: 60, label: "G11" },
      { id: "g12", x: 80, y: 60, label: "G12" },
      { id: "g13", x: 20, y: 80, label: "G13" },
      { id: "g14", x: 40, y: 80, label: "G14" },
      { id: "g15", x: 60, y: 80, label: "G15" },
      { id: "g16", x: 80, y: 80, label: "G16" },
    ],
  },
};

export const POINT_IN_POLYGON_PRESETS: Readonly<Record<string, GeometryStudioPreset>> = {
  concave_star: {
    id: "concave_star",
    name: "Concave Star Polygon",
    modality: "point_in_polygon_ray_casting",
    category: "Concave",
    description: "10-vertex star with interior query point demonstrating multi-edge ray crossings.",
    polygon: [
      { id: "v1", x: 50, y: 90, label: "V1" },
      { id: "v2", x: 62, y: 62, label: "V2" },
      { id: "v3", x: 92, y: 62, label: "V3" },
      { id: "v4", x: 68, y: 44, label: "V4" },
      { id: "v5", x: 78, y: 15, label: "V5" },
      { id: "v6", x: 50, y: 35, label: "V6" },
      { id: "v7", x: 22, y: 15, label: "V7" },
      { id: "v8", x: 32, y: 44, label: "V8" },
      { id: "v9", x: 8, y: 62, label: "V9" },
      { id: "v10", x: 38, y: 62, label: "V10" },
    ],
    queryPoint: { x: 50, y: 55, label: "Q" },
  },
  c_shape_pocket: {
    id: "c_shape_pocket",
    name: "C-Shape Concave Pocket",
    modality: "point_in_polygon_ray_casting",
    category: "Pocket",
    description:
      "C-shaped polygon with query point resting inside the outer concave bay (Outside).",
    polygon: [
      { id: "c1", x: 20, y: 20, label: "C1" },
      { id: "c2", x: 80, y: 20, label: "C2" },
      { id: "c3", x: 80, y: 40, label: "C3" },
      { id: "c4", x: 45, y: 40, label: "C4" },
      { id: "c5", x: 45, y: 60, label: "C5" },
      { id: "c6", x: 80, y: 60, label: "C6" },
      { id: "c7", x: 80, y: 80, label: "C7" },
      { id: "c8", x: 20, y: 80, label: "C8" },
    ],
    queryPoint: { x: 65, y: 50, label: "Q" },
  },
  spiral_labyrinth: {
    id: "spiral_labyrinth",
    name: "Spiral Labyrinth (12 Vertices)",
    modality: "point_in_polygon_ray_casting",
    category: "Spiral",
    description:
      "Interlocking spiral arms testing odd/even ray crossing parity through multiple walls.",
    polygon: [
      { id: "s1", x: 10, y: 10, label: "S1" },
      { id: "s2", x: 90, y: 10, label: "S2" },
      { id: "s3", x: 90, y: 90, label: "S3" },
      { id: "s4", x: 25, y: 90, label: "S4" },
      { id: "s5", x: 25, y: 25, label: "S5" },
      { id: "s6", x: 75, y: 25, label: "S6" },
      { id: "s7", x: 75, y: 75, label: "S7" },
      { id: "s8", x: 40, y: 75, label: "S8" },
      { id: "s9", x: 40, y: 40, label: "S9" },
      { id: "s10", x: 60, y: 40, label: "S10" },
      { id: "s11", x: 60, y: 60, label: "S11" },
      { id: "s12", x: 10, y: 60, label: "S12" },
    ],
    queryPoint: { x: 50, y: 50, label: "Q" },
  },
  regular_hexagon: {
    id: "regular_hexagon",
    name: "Convex Regular Hexagon",
    modality: "point_in_polygon_ray_casting",
    category: "Convex",
    description: "Standard 6-vertex convex polygon testing boundary cases and vertex hits.",
    polygon: [
      { id: "h1", x: 50, y: 85, label: "H1" },
      { id: "h2", x: 85, y: 65, label: "H2" },
      { id: "h3", x: 85, y: 35, label: "H3" },
      { id: "h4", x: 50, y: 15, label: "H4" },
      { id: "h5", x: 15, y: 35, label: "H5" },
      { id: "h6", x: 15, y: 65, label: "H6" },
    ],
    queryPoint: { x: 50, y: 50, label: "Q" },
  },
};

export const GEOMETRY_STUDIO_PRESETS: Readonly<Record<string, GeometryStudioPreset>> = {
  ...CONVEX_HULL_PRESETS,
  ...BENTLEY_OTTMANN_PRESETS,
  ...CLOSEST_PAIR_PRESETS,
  ...POINT_IN_POLYGON_PRESETS,
};

// ============================================================================
// 4. MAIN REACT COMPONENT: COMPUTATIONAL GEOMETRY SWEEP STUDIO
// ============================================================================

export const ComputationalGeometrySweepStudio: React.FC<ComputationalGeometrySweepStudioProps> = ({
  initialModality = "convex_hull_algorithms",
  initialPreset = "random_cluster_12",
  initialAlgorithm = "monotone_chain",
  width = 980,
  height = 580,
  standalone = false,
  title = "Computational Geometry & Sweep-Line Studio",
  onModalityChange,
}) => {
  const { ref: containerRef, box } = useCanvasBox({ width, height });

  // 1. Studio Modality & Algorithm State
  const [modality, setModality] = useState<GeometryStudioModality>(initialModality);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset);
  const [hullAlgorithm, setHullAlgorithm] = useState<ConvexHullAlgorithmId>(initialAlgorithm);
  const [allowCollinear, setAllowCollinear] = useState<boolean>(false);
  const [pipAlgorithm, setPipAlgorithm] = useState<"ray_casting" | "winding_number">("ray_casting");

  // 2. Geometric Data State
  const [customPoints, setCustomPoints] = useState<Point2D[]>(() => {
    return CONVEX_HULL_PRESETS.random_cluster_12.points
      ? [...CONVEX_HULL_PRESETS.random_cluster_12.points]
      : [];
  });
  const [customSegments, setCustomSegments] = useState<LineSegment[]>(() => {
    return BENTLEY_OTTMANN_PRESETS.classic_crossroads.segments
      ? [...BENTLEY_OTTMANN_PRESETS.classic_crossroads.segments]
      : [];
  });
  const [customPolygon, setCustomPolygon] = useState<Point2D[]>(() => {
    return POINT_IN_POLYGON_PRESETS.concave_star.polygon
      ? [...POINT_IN_POLYGON_PRESETS.concave_star.polygon]
      : [];
  });
  const [queryPoint, setQueryPoint] = useState<Point2D>(() => {
    return POINT_IN_POLYGON_PRESETS.concave_star.queryPoint || { x: 50, y: 55, label: "Q" };
  });

  // 3. Playback & Animation Scrubber State
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(600);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);

  // Sync modality changes with parent
  const handleModalitySelect = (m: GeometryStudioModality) => {
    setModality(m);
    setIsPlaying(false);
    setCurrentStepIdx(0);
    if (onModalityChange) onModalityChange(m);

    // Pick first preset of new modality
    if (m === "convex_hull_algorithms") {
      setSelectedPresetId("random_cluster_12");
      setCustomPoints([...CONVEX_HULL_PRESETS.random_cluster_12.points!]);
    } else if (m === "bentley_ottmann_sweep") {
      setSelectedPresetId("classic_crossroads");
      setCustomSegments([...BENTLEY_OTTMANN_PRESETS.classic_crossroads.segments!]);
    } else if (m === "closest_pair_points") {
      setSelectedPresetId("twin_near_neighbors");
      setCustomPoints([...CLOSEST_PAIR_PRESETS.twin_near_neighbors.points!]);
    } else if (m === "point_in_polygon_ray_casting") {
      setSelectedPresetId("concave_star");
      setCustomPolygon([...POINT_IN_POLYGON_PRESETS.concave_star.polygon!]);
      setQueryPoint(POINT_IN_POLYGON_PRESETS.concave_star.queryPoint!);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    setIsPlaying(false);
    setCurrentStepIdx(0);

    const p = GEOMETRY_STUDIO_PRESETS[presetId];
    if (!p) return;

    if (p.points) setCustomPoints([...p.points]);
    if (p.segments) setCustomSegments([...p.segments]);
    if (p.polygon) setCustomPolygon([...p.polygon]);
    if (p.queryPoint) setQueryPoint({ ...p.queryPoint });
  };

  // 4. Algorithmic Computation Results (Memoized)
  const hullResult = useMemo<ConvexHullAlgorithmResult>(() => {
    if (modality !== "convex_hull_algorithms") {
      return {
        algorithm: hullAlgorithm,
        hull: [],
        steps: [],
        area: 0,
        perimeter: 0,
        lowerHull: [],
        upperHull: [],
      };
    }
    if (hullAlgorithm === "monotone_chain") {
      return computeMonotoneChain(customPoints, allowCollinear);
    } else if (hullAlgorithm === "graham_scan") {
      return computeGrahamScan(customPoints, allowCollinear);
    } else {
      return computeQuickHull(customPoints);
    }
  }, [modality, hullAlgorithm, customPoints, allowCollinear]);

  const bentleyResult = useMemo<BentleyOttmannResult>(() => {
    if (modality !== "bentley_ottmann_sweep") {
      return {
        intersections: [],
        steps: [],
        totalEventsProcessed: 0,
        initialSegmentsCount: 0,
      };
    }
    return computeBentleyOttmann(customSegments);
  }, [modality, customSegments]);

  const closestPairResult = useMemo<ClosestPairDCResult>(() => {
    if (modality !== "closest_pair_points") {
      return {
        closestPair: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        minDistance: 0,
        steps: [],
        sortedPoints: [],
      };
    }
    return computeClosestPairDC(customPoints);
  }, [modality, customPoints]);

  const pipRayResult = useMemo<RayCastingPIPResult>(() => {
    if (modality !== "point_in_polygon_ray_casting") {
      return {
        isInside: false,
        isOnBoundary: false,
        totalCrossings: 0,
        edgeTraces: [],
        queryPoint,
        polygon: customPolygon,
        steps: [],
      };
    }
    return computeRayCastingPIP(customPolygon, queryPoint);
  }, [modality, customPolygon, queryPoint]);

  const pipWindingResult = useMemo<WindingNumberPIPResult>(() => {
    if (modality !== "point_in_polygon_ray_casting") {
      return {
        windingNumber: 0,
        isInside: false,
        isOnBoundary: false,
        edgeTraces: [],
        queryPoint,
        polygon: customPolygon,
      };
    }
    return computeWindingNumberPIP(customPolygon, queryPoint);
  }, [modality, customPolygon, queryPoint]);

  // Current Total Steps
  const totalSteps = useMemo(() => {
    if (modality === "convex_hull_algorithms") return hullResult.steps.length;
    if (modality === "bentley_ottmann_sweep") return bentleyResult.steps.length;
    if (modality === "closest_pair_points") return closestPairResult.steps.length;
    if (modality === "point_in_polygon_ray_casting") return pipRayResult.steps.length;
    return 1;
  }, [modality, hullResult, bentleyResult, closestPairResult, pipRayResult]);

  // Clamp current step index
  const safeStepIdx = Math.min(Math.max(0, currentStepIdx), Math.max(0, totalSteps - 1));

  // Current Active Step
  const activeHullStep = hullResult.steps[safeStepIdx];
  const activeBentleyStep = bentleyResult.steps[safeStepIdx];
  const activeClosestStep = closestPairResult.steps[safeStepIdx];
  const activePipStep = pipRayResult.steps[safeStepIdx];

  // Animation Timer
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

  // 5. Canvas Coordinate System Transforms (User [0..100] -> Screen Pixels)
  const pad = 40;
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

  // Drag-and-drop point handler
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingPointId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseSvgX = e.clientX - rect.left;
    const mouseSvgY = e.clientY - rect.top;

    const newX = fromSvgX(mouseSvgX);
    const newY = fromSvgY(mouseSvgY);

    if (modality === "convex_hull_algorithms" || modality === "closest_pair_points") {
      setCustomPoints((prev) =>
        prev.map((p) => (p.id === draggingPointId ? { ...p, x: newX, y: newY } : p)),
      );
    } else if (modality === "point_in_polygon_ray_casting") {
      if (draggingPointId === "query_point") {
        setQueryPoint((prev) => ({ ...prev, x: newX, y: newY }));
      } else {
        setCustomPolygon((prev) =>
          prev.map((p) => (p.id === draggingPointId ? { ...p, x: newX, y: newY } : p)),
        );
      }
    } else if (modality === "bentley_ottmann_sweep") {
      const [segId, ptType] = draggingPointId.split("_");
      setCustomSegments((prev) =>
        prev.map((seg) => {
          if (seg.id !== segId) return seg;
          if (ptType === "p1") {
            return { ...seg, p1: { ...seg.p1, x: newX, y: newY } };
          } else {
            return { ...seg, p2: { ...seg.p2, x: newX, y: newY } };
          }
        }),
      );
    }
  };

  const handleSvgMouseUp = () => {
    setDraggingPointId(null);
  };

  // Randomize Points
  const handleRandomize = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
    if (modality === "convex_hull_algorithms" || modality === "closest_pair_points") {
      const randomized: Point2D[] = Array.from({ length: 12 }, (_, i) => ({
        id: `rnd_${i + 1}`,
        x: Math.floor(10 + Math.random() * 80),
        y: Math.floor(10 + Math.random() * 80),
        label: `P${i + 1}`,
      }));
      setCustomPoints(randomized);
    } else if (modality === "point_in_polygon_ray_casting") {
      setQueryPoint({
        x: Math.floor(20 + Math.random() * 60),
        y: Math.floor(20 + Math.random() * 60),
        label: "Q",
      });
    }
  };

  // Add Point
  const handleAddPoint = () => {
    if (modality === "convex_hull_algorithms" || modality === "closest_pair_points") {
      const newPt: Point2D = {
        id: `pt_${customPoints.length + 1}`,
        x: Math.floor(20 + Math.random() * 60),
        y: Math.floor(20 + Math.random() * 60),
        label: `P${customPoints.length + 1}`,
      };
      setCustomPoints((prev) => [...prev, newPt]);
    }
  };

  // Available Presets for active modality
  const currentPresets = useMemo(() => {
    return Object.values(GEOMETRY_STUDIO_PRESETS).filter((p) => p.modality === modality);
  }, [modality]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl ${
        standalone ? "min-h-[860px]" : ""
      }`}
      style={{ width: "100%", height: "100%" }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* HEADER & MODALITY TABS */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">{title}</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                Interactive Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 2D geometric sweep algorithms, convex hulls, line crossings, and
              topological tests.
            </p>
          </div>
        </div>

        {/* Modality Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
          {GEOMETRY_MODALITIES.map((mod) => {
            const isActive = modality === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleModalitySelect(mod.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span>{mod.shortName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-indigo-800/80 text-indigo-200" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {mod.badge.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SECONDARY TOOLBAR: PRESET SELECTOR & MODALITY OPTIONS */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-900/50 border-b border-slate-800/80 text-xs">
        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" /> Presets:
          </span>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 font-medium hover:border-slate-700 focus:outline-none focus:border-indigo-500"
          >
            {currentPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRandomize}
            title="Randomize Points"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {(modality === "convex_hull_algorithms" || modality === "closest_pair_points") && (
            <button
              onClick={handleAddPoint}
              title="Add Point"
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/80 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Point
            </button>
          )}
        </div>

        {/* Modality Specific Algorithm Controls */}
        <div className="flex items-center gap-3">
          {modality === "convex_hull_algorithms" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Algorithm:</span>
              <div className="flex rounded bg-slate-950 border border-slate-800 p-0.5">
                {(
                  [
                    { id: "monotone_chain", label: "Andrew's Monotone" },
                    { id: "graham_scan", label: "Graham Scan" },
                    { id: "quickhull", label: "QuickHull" },
                  ] as const
                ).map((alg) => (
                  <button
                    key={alg.id}
                    onClick={() => {
                      setHullAlgorithm(alg.id);
                      setCurrentStepIdx(0);
                    }}
                    className={`px-2 py-0.5 text-[11px] rounded ${
                      hullAlgorithm === alg.id
                        ? "bg-indigo-600 text-white font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {alg.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={allowCollinear}
                  onChange={(e) => setAllowCollinear(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                Keep Collinear
              </label>
            </div>
          )}

          {modality === "point_in_polygon_ray_casting" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Test Mode:</span>
              <div className="flex rounded bg-slate-950 border border-slate-800 p-0.5">
                <button
                  onClick={() => setPipAlgorithm("ray_casting")}
                  className={`px-2 py-0.5 text-[11px] rounded ${
                    pipAlgorithm === "ray_casting"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Ray Casting (Jordan)
                </button>
                <button
                  onClick={() => setPipAlgorithm("winding_number")}
                  className={`px-2 py-0.5 text-[11px] rounded ${
                    pipAlgorithm === "winding_number"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Winding Number
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA: CANVAS & TELEMETRY HUD */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 relative">
        {/* SVG Drawing Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 flex items-center justify-center p-2 relative overflow-hidden select-none">
          <svg
            className="w-full h-full cursor-crosshair"
            viewBox={`0 0 ${box.width} ${box.height}`}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
          >
            <defs>
              {/* Grid Background Pattern */}
              <pattern id="geomGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
                <circle cx="0" cy="0" r="1.2" fill="#334155" opacity="0.5" />
              </pattern>

              {/* Glow Filters */}
              <filter id="glowIndigo" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowRose" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Laser Marker & Gradients */}
              <linearGradient id="hullGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.10" />
              </linearGradient>
              <linearGradient id="pipInsideGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.10" />
              </linearGradient>
              <linearGradient id="pipOutsideGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#be123c" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="stripGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.05" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#geomGrid)" />

            {/* Cartesian Axes */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(100)}
              y2={toSvgY(0)}
              stroke="#334155"
              strokeWidth="1.5"
            />
            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(0)}
              y2={toSvgY(100)}
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Axis Tick Numbers */}
            {[0, 25, 50, 75, 100].map((val) => (
              <g key={`tick-${val}`}>
                <text
                  x={toSvgX(val)}
                  y={toSvgY(0) + 16}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {val}
                </text>
                <text
                  x={toSvgX(0) - 10}
                  y={toSvgY(val) + 3}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* ============================================================= */}
            {/* MODALITY 1: CONVEX HULL DRAWINGS */}
            {/* ============================================================= */}
            {modality === "convex_hull_algorithms" && (
              <g>
                {/* Completed or Step Convex Hull Polygon */}
                {activeHullStep?.finalHull && activeHullStep.finalHull.length >= 3 && (
                  <polygon
                    points={activeHullStep.finalHull
                      .map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`)
                      .join(" ")}
                    fill="url(#hullGradient)"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    filter="url(#glowIndigo)"
                  />
                )}

                {/* QuickHull Baseline Segment */}
                {activeHullStep?.lineSegment && (
                  <line
                    x1={toSvgX(activeHullStep.lineSegment[0].x)}
                    y1={toSvgY(activeHullStep.lineSegment[0].y)}
                    x2={toSvgX(activeHullStep.lineSegment[1].x)}
                    y2={toSvgY(activeHullStep.lineSegment[1].y)}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Current Lower Hull Path */}
                {activeHullStep?.lowerHull && activeHullStep.lowerHull.length >= 2 && (
                  <polyline
                    points={activeHullStep.lowerHull
                      .map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`)
                      .join(" ")}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="none"
                  />
                )}

                {/* Current Upper Hull Path */}
                {activeHullStep?.upperHull && activeHullStep.upperHull.length >= 2 && (
                  <polyline
                    points={activeHullStep.upperHull
                      .map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`)
                      .join(" ")}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray="none"
                  />
                )}

                {/* Turn Inspection Triangle (p1 -> p2 -> candidate) */}
                {activeHullStep?.prevPoint1 &&
                  activeHullStep.prevPoint2 &&
                  activeHullStep.candidatePoint && (
                    <g>
                      <polygon
                        points={`${toSvgX(activeHullStep.prevPoint1.x)},${toSvgY(
                          activeHullStep.prevPoint1.y,
                        )} ${toSvgX(activeHullStep.prevPoint2.x)},${toSvgY(
                          activeHullStep.prevPoint2.y,
                        )} ${toSvgX(activeHullStep.candidatePoint.x)},${toSvgY(
                          activeHullStep.candidatePoint.y,
                        )}`}
                        fill={
                          activeHullStep.turnOrientation === "ccw"
                            ? "rgba(16, 185, 129, 0.18)"
                            : "rgba(244, 63, 94, 0.18)"
                        }
                        stroke={activeHullStep.turnOrientation === "ccw" ? "#10b981" : "#f43f5e"}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={toSvgX(activeHullStep.prevPoint2.x)}
                        y1={toSvgY(activeHullStep.prevPoint2.y)}
                        x2={toSvgX(activeHullStep.candidatePoint.x)}
                        y2={toSvgY(activeHullStep.candidatePoint.y)}
                        stroke={activeHullStep.turnOrientation === "ccw" ? "#10b981" : "#f43f5e"}
                        strokeWidth="2"
                      />
                    </g>
                  )}

                {/* All Points */}
                {customPoints.map((p) => {
                  const isCandidate = activeHullStep?.candidatePoint?.id === p.id;
                  const isHullVertex = activeHullStep?.currentStack?.some(
                    (v) => Math.abs(v.x - p.x) <= EPSILON && Math.abs(v.y - p.y) <= EPSILON,
                  );

                  return (
                    <g
                      key={p.id || `pt-${p.x}-${p.y}`}
                      transform={`translate(${toSvgX(p.x)}, ${toSvgY(p.y)})`}
                      className="cursor-move group"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingPointId(p.id || null);
                      }}
                    >
                      <circle
                        r={isCandidate ? 8 : isHullVertex ? 6 : 4.5}
                        fill={isCandidate ? "#fbbf24" : isHullVertex ? "#6366f1" : "#475569"}
                        stroke={isCandidate ? "#ffffff" : isHullVertex ? "#c7d2fe" : "#94a3b8"}
                        strokeWidth={isCandidate ? 2.5 : 1.5}
                        filter={isCandidate ? "url(#glowAmber)" : undefined}
                      />
                      <text
                        y="-10"
                        textAnchor="middle"
                        fill={isCandidate ? "#fbbf24" : isHullVertex ? "#a5b4fc" : "#94a3b8"}
                        fontSize="10"
                        fontWeight={isCandidate || isHullVertex ? "700" : "500"}
                      >
                        {p.label || `(${p.x}, ${p.y})`}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* ============================================================= */}
            {/* MODALITY 2: BENTLEY-OTTMANN SWEEP DRAWINGS */}
            {/* ============================================================= */}
            {modality === "bentley_ottmann_sweep" && (
              <g>
                {/* Segments */}
                {customSegments.map((seg) => {
                  const isActive = activeBentleyStep?.activeSegments.some((s) => s.id === seg.id);
                  const isTested = activeBentleyStep?.testedPairs.some(
                    ([sA, sB]) => sA.id === seg.id || sB.id === seg.id,
                  );

                  return (
                    <g key={seg.id}>
                      <line
                        x1={toSvgX(seg.p1.x)}
                        y1={toSvgY(seg.p1.y)}
                        x2={toSvgX(seg.p2.x)}
                        y2={toSvgY(seg.p2.y)}
                        stroke={
                          isTested ? "#fbbf24" : isActive ? "#38bdf8" : seg.color || "#64748b"
                        }
                        strokeWidth={isTested ? 3.5 : isActive ? 2.8 : 2}
                        strokeOpacity={isActive || isTested ? 1.0 : 0.65}
                        filter={
                          isTested ? "url(#glowAmber)" : isActive ? "url(#glowCyan)" : undefined
                        }
                      />
                      {/* Segment Endpoints (Draggable) */}
                      <circle
                        cx={toSvgX(seg.p1.x)}
                        cy={toSvgY(seg.p1.y)}
                        r="5"
                        fill="#0f172a"
                        stroke={seg.color || "#38bdf8"}
                        strokeWidth="2"
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggingPointId(`${seg.id}_p1`);
                        }}
                      />
                      <circle
                        cx={toSvgX(seg.p2.x)}
                        cy={toSvgY(seg.p2.y)}
                        r="5"
                        fill="#0f172a"
                        stroke={seg.color || "#38bdf8"}
                        strokeWidth="2"
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggingPointId(`${seg.id}_p2`);
                        }}
                      />
                      <text
                        x={(toSvgX(seg.p1.x) + toSvgX(seg.p2.x)) / 2}
                        y={(toSvgY(seg.p1.y) + toSvgY(seg.p2.y)) / 2 - 8}
                        fill={seg.color || "#38bdf8"}
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {seg.label || seg.id}
                      </text>
                    </g>
                  );
                })}

                {/* Sweep Laser Line x = sweepX */}
                {activeBentleyStep && (
                  <g>
                    <line
                      x1={toSvgX(activeBentleyStep.sweepX)}
                      y1={pad - 10}
                      x2={toSvgX(activeBentleyStep.sweepX)}
                      y2={box.height - pad + 10}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      filter="url(#glowAmber)"
                    />
                    <rect
                      x={toSvgX(activeBentleyStep.sweepX) - 28}
                      y={pad - 28}
                      width="56"
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                    />
                    <text
                      x={toSvgX(activeBentleyStep.sweepX)}
                      y={pad - 16}
                      fill="#fbbf24"
                      fontSize="9"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      x = {activeBentleyStep.sweepX.toFixed(1)}
                    </text>
                  </g>
                )}

                {/* Discovered Intersections */}
                {activeBentleyStep?.allDiscoveredIntersections.map((inter) => (
                  <g
                    key={inter.id}
                    transform={`translate(${toSvgX(inter.point.x)}, ${toSvgY(inter.point.y)})`}
                  >
                    <circle
                      r="7"
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="2"
                      filter="url(#glowRose)"
                    />
                    <rect
                      x="10"
                      y="-12"
                      width="75"
                      height="20"
                      rx="3"
                      fill="#0f172a"
                      stroke="#f43f5e"
                      strokeWidth="1"
                    />
                    <text x="14" y="2" fill="#fda4af" fontSize="9" fontWeight="700">
                      ({inter.point.x.toFixed(1)}, {inter.point.y.toFixed(1)})
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* ============================================================= */}
            {/* MODALITY 3: CLOSEST PAIR OF POINTS DRAWINGS */}
            {/* ============================================================= */}
            {modality === "closest_pair_points" && (
              <g>
                {/* Midline x = midX */}
                {activeClosestStep?.midX !== undefined && (
                  <g>
                    <line
                      x1={toSvgX(activeClosestStep.midX)}
                      y1={pad}
                      x2={toSvgX(activeClosestStep.midX)}
                      y2={box.height - pad}
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={toSvgX(activeClosestStep.midX) + 6}
                      y={pad + 12}
                      fill="#818cf8"
                      fontSize="10"
                      fontWeight="700"
                    >
                      x_mid = {activeClosestStep.midX.toFixed(1)}
                    </text>
                  </g>
                )}

                {/* Strip Band [midX - delta, midX + delta] */}
                {activeClosestStep?.stripRange && (
                  <rect
                    x={toSvgX(Math.max(0, activeClosestStep.stripRange[0]))}
                    y={pad}
                    width={Math.max(
                      0,
                      toSvgX(Math.min(100, activeClosestStep.stripRange[1])) -
                        toSvgX(Math.max(0, activeClosestStep.stripRange[0])),
                    )}
                    height={box.height - 2 * pad}
                    fill="url(#stripGradient)"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Compared Pair Line */}
                {activeClosestStep?.comparedPair && (
                  <line
                    x1={toSvgX(activeClosestStep.comparedPair[0].x)}
                    y1={toSvgY(activeClosestStep.comparedPair[0].y)}
                    x2={toSvgX(activeClosestStep.comparedPair[1].x)}
                    y2={toSvgY(activeClosestStep.comparedPair[1].y)}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                    filter="url(#glowAmber)"
                  />
                )}

                {/* Global Best Pair Line */}
                {activeClosestStep?.bestPairSoFar && (
                  <g>
                    <line
                      x1={toSvgX(activeClosestStep.bestPairSoFar.p1.x)}
                      y1={toSvgY(activeClosestStep.bestPairSoFar.p1.y)}
                      x2={toSvgX(activeClosestStep.bestPairSoFar.p2.x)}
                      y2={toSvgY(activeClosestStep.bestPairSoFar.p2.y)}
                      stroke="#10b981"
                      strokeWidth="3.5"
                      filter="url(#glowIndigo)"
                    />
                    <circle
                      cx={toSvgX(activeClosestStep.bestPairSoFar.p1.x)}
                      cy={toSvgY(activeClosestStep.bestPairSoFar.p1.y)}
                      r="8"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <circle
                      cx={toSvgX(activeClosestStep.bestPairSoFar.p2.x)}
                      cy={toSvgY(activeClosestStep.bestPairSoFar.p2.y)}
                      r="8"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* All Points */}
                {customPoints.map((p) => {
                  const isStripPoint = activeClosestStep?.stripPoints?.some(
                    (sp) => Math.abs(sp.x - p.x) <= EPSILON && Math.abs(sp.y - p.y) <= EPSILON,
                  );
                  const isBestPt =
                    activeClosestStep?.bestPairSoFar?.p1.id === p.id ||
                    activeClosestStep?.bestPairSoFar?.p2.id === p.id;

                  return (
                    <g
                      key={p.id || `cp-${p.x}-${p.y}`}
                      transform={`translate(${toSvgX(p.x)}, ${toSvgY(p.y)})`}
                      className="cursor-move"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingPointId(p.id || null);
                      }}
                    >
                      <circle
                        r={isBestPt ? 7 : isStripPoint ? 6 : 4.5}
                        fill={isBestPt ? "#10b981" : isStripPoint ? "#38bdf8" : "#64748b"}
                        stroke={isBestPt ? "#ffffff" : isStripPoint ? "#e0f2fe" : "#94a3b8"}
                        strokeWidth="1.5"
                      />
                      <text
                        y="-9"
                        textAnchor="middle"
                        fill={isBestPt ? "#34d399" : isStripPoint ? "#7dd3fc" : "#94a3b8"}
                        fontSize="9"
                        fontWeight={isBestPt ? "700" : "500"}
                      >
                        {p.label || `(${p.x}, ${p.y})`}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* ============================================================= */}
            {/* MODALITY 4: POINT IN POLYGON & RAY CASTING DRAWINGS */}
            {/* ============================================================= */}
            {modality === "point_in_polygon_ray_casting" && (
              <g>
                {/* Polygon Fill & Boundary */}
                <polygon
                  points={customPolygon.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" ")}
                  fill={pipRayResult.isInside ? "url(#pipInsideGrad)" : "url(#pipOutsideGrad)"}
                  stroke={pipRayResult.isInside ? "#10b981" : "#f43f5e"}
                  strokeWidth="2.5"
                />

                {/* Ray Casting Laser Line to the right */}
                {pipAlgorithm === "ray_casting" && (
                  <g>
                    <line
                      x1={toSvgX(queryPoint.x)}
                      y1={toSvgY(queryPoint.y)}
                      x2={toSvgX(100) + 20}
                      y2={toSvgY(queryPoint.y)}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      filter="url(#glowAmber)"
                    />
                    {/* Edge Intersection Collision Dots */}
                    {pipRayResult.edgeTraces.map(
                      (tr) =>
                        tr.intersectsRayToRight &&
                        tr.intersectionX !== undefined && (
                          <g
                            key={`inter-edge-${tr.edgeIndex}`}
                            transform={`translate(${toSvgX(tr.intersectionX)}, ${toSvgY(queryPoint.y)})`}
                          >
                            <circle r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                            <text
                              y="-9"
                              textAnchor="middle"
                              fill="#fda4af"
                              fontSize="9"
                              fontWeight="700"
                            >
                              Hit #{tr.edgeIndex + 1}
                            </text>
                          </g>
                        ),
                    )}
                  </g>
                )}

                {/* Polygon Vertices (Draggable) */}
                {customPolygon.map((v) => (
                  <g
                    key={v.id || `poly-v-${v.x}-${v.y}`}
                    transform={`translate(${toSvgX(v.x)}, ${toSvgY(v.y)})`}
                    className="cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingPointId(v.id || null);
                    }}
                  >
                    <circle r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    <text y="-8" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="600">
                      {v.label || `(${v.x}, ${v.y})`}
                    </text>
                  </g>
                ))}

                {/* Query Point Q (Draggable with Reticle) */}
                <g
                  transform={`translate(${toSvgX(queryPoint.x)}, ${toSvgY(queryPoint.y)})`}
                  className="cursor-move"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingPointId("query_point");
                  }}
                >
                  <circle
                    r="9"
                    fill={pipRayResult.isInside ? "#10b981" : "#f43f5e"}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    filter={pipRayResult.isInside ? "url(#glowIndigo)" : "url(#glowRose)"}
                  />
                  <line x1="-14" y1="0" x2="14" y2="0" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#ffffff" strokeWidth="1.5" />
                  <rect
                    x="14"
                    y="-12"
                    width="60"
                    height="20"
                    rx="3"
                    fill="#0f172a"
                    stroke={pipRayResult.isInside ? "#10b981" : "#f43f5e"}
                    strokeWidth="1"
                  />
                  <text
                    x="18"
                    y="2"
                    fill={pipRayResult.isInside ? "#6ee7b7" : "#fda4af"}
                    fontSize="9"
                    fontWeight="700"
                  >
                    Q({queryPoint.x}, {queryPoint.y})
                  </text>
                </g>
              </g>
            )}
          </svg>

          {/* Interactive Drag Hint */}
          <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 backdrop-blur rounded px-2 py-1 text-[10px] text-slate-400 flex items-center gap-1.5 pointer-events-none">
            <Move className="w-3 h-3 text-indigo-400" />
            <span>Drag points on canvas to dynamically re-solve</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TELEMETRY & THEORY SIDEBAR HUD (4 cols) */}
        {/* ------------------------------------------------------------------ */}
        <div className="lg:col-span-4 bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col p-4 gap-3.5 overflow-y-auto">
          {/* Top Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Live Telemetry
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Step {safeStepIdx + 1} / {Math.max(1, totalSteps)}
            </span>
          </div>

          {/* Modality Specific Telemetry Cards */}
          {modality === "convex_hull_algorithms" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Vertices:</span>
                  <span className="font-bold text-white">{customPoints.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Hull Vertices:</span>
                  <span className="font-bold text-indigo-400">{hullResult.hull.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Shoelace Area:</span>
                  <span className="font-bold text-emerald-400">
                    {hullResult.area.toFixed(2)} units²
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Perimeter:</span>
                  <span className="font-bold text-cyan-400">
                    {hullResult.perimeter.toFixed(2)} units
                  </span>
                </div>
              </div>

              {/* Cross Product Breakdown */}
              {activeHullStep?.crossProduct !== undefined && (
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50 space-y-1.5 text-xs">
                  <div className="font-semibold text-indigo-300 flex items-center justify-between">
                    <span>2D Cross Product:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        activeHullStep.turnOrientation === "ccw"
                          ? "bg-emerald-900/60 text-emerald-300"
                          : "bg-rose-900/60 text-rose-300"
                      }`}
                    >
                      {activeHullStep.turnOrientation?.toUpperCase()} (
                      {activeHullStep.crossProduct > 0 ? "+Left" : "-Right"})
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300">
                    (a_x - o_x)(b_y - o_y) - (a_y - o_y)(b_x - o_x) ={" "}
                    <span className="font-bold text-white">
                      {activeHullStep.crossProduct.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {modality === "bentley_ottmann_sweep" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Line Segments:</span>
                  <span className="font-bold text-white">{customSegments.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Intersections Discovered:</span>
                  <span className="font-bold text-rose-400">
                    {activeBentleyStep?.allDiscoveredIntersections.length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active BST Segments:</span>
                  <span className="font-bold text-cyan-400">
                    {activeBentleyStep?.activeSegments.length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sweep Position:</span>
                  <span className="font-bold text-amber-400">
                    x = {activeBentleyStep?.sweepX.toFixed(2) ?? "0.00"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {modality === "closest_pair_points" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Points:</span>
                  <span className="font-bold text-white">{customPoints.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Delta δ:</span>
                  <span className="font-bold text-emerald-400">
                    {activeClosestStep?.currentDelta.toFixed(3) ?? "0.000"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Strip Points in Window:</span>
                  <span className="font-bold text-cyan-400">
                    {activeClosestStep?.stripPoints?.length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Recursive Depth:</span>
                  <span className="font-bold text-indigo-400">{activeClosestStep?.depth ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {modality === "point_in_polygon_ray_casting" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Polygon Vertices:</span>
                  <span className="font-bold text-white">{customPolygon.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Ray Crossings (K):</span>
                  <span className="font-bold text-amber-400">{pipRayResult.totalCrossings}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Winding Number:</span>
                  <span className="font-bold text-cyan-400">{pipWindingResult.windingNumber}</span>
                </div>
                <div className="flex justify-between text-xs items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">Classification:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      pipRayResult.isInside
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                        : "bg-rose-950 text-rose-300 border border-rose-700/60"
                    }`}
                  >
                    {pipRayResult.isOnBoundary
                      ? "ON BOUNDARY"
                      : pipRayResult.isInside
                        ? "INSIDE POLYGON"
                        : "OUTSIDE POLYGON"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Current Step Explanation Box */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex-1 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-indigo-400" /> Step Explanation
            </span>
            <h4 className="text-xs font-bold text-white">
              {activeHullStep?.title ||
                activeBentleyStep?.title ||
                activeClosestStep?.title ||
                activePipStep?.phase ||
                "Ready"}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeHullStep?.description ||
                activeBentleyStep?.description ||
                activeClosestStep?.description ||
                activePipStep?.description ||
                "Select a preset or drag vertices on the canvas to examine geometric sweep steps."}
            </p>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* BOTTOM PLAYBACK CONTROLS & TIMELINE SCRUBBER */}
      {/* -------------------------------------------------------------------- */}
      <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStepIdx(0)}
            disabled={safeStepIdx === 0}
            title="Reset to Beginning"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
            disabled={safeStepIdx === 0}
            title="Step Back"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause" : "Play"}
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-xs">{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            onClick={() => setCurrentStepIdx((prev) => Math.min(totalSteps - 1, prev + 1))}
            disabled={safeStepIdx >= totalSteps - 1}
            title="Step Forward"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex items-center gap-3 min-w-[200px] max-w-xl">
          <span className="text-xs text-slate-400 font-mono">0</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={safeStepIdx}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStepIdx(Number(e.target.value));
            }}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
          <span className="text-xs text-slate-400 font-mono">{Math.max(0, totalSteps - 1)}</span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Speed:</span>
          {[
            { label: "0.5x", ms: 1200 },
            { label: "1x", ms: 600 },
            { label: "2x", ms: 300 },
          ].map((sp) => (
            <button
              key={sp.label}
              onClick={() => setPlaybackSpeedMs(sp.ms)}
              className={`px-2 py-0.5 rounded text-[11px] ${
                playbackSpeedMs === sp.ms
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
