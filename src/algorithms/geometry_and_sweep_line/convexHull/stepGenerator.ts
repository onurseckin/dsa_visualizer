import type {
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";
import { DEFAULT_CONVEX_HULL_INPUT } from "./definition";

export interface Point2D {
  x: number;
  y: number;
  id?: string;
  label?: string;
}

export interface ConvexHullInput {
  points: Point2D[];
}

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Given a set of 2D points on a Cartesian plane, the Convex Hull problem asks us to find the minimal convex polygon that encloses all points.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1", x: 100, y: 300, state: "default" },
        { id: "p2", label: "P2", x: 250, y: 100, state: "default" },
        { id: "p3", label: "P3", x: 400, y: 350, state: "default" },
        { id: "p4", label: "P4", x: 250, y: 250, state: "default" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "A useful physical mental model is imagining pins driven into the plane at every point, then stretching an elastic rubber band around all pins.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1", x: 100, y: 300, state: "sorted" },
        { id: "p2", label: "P2", x: 250, y: 100, state: "sorted" },
        { id: "p3", label: "P3", x: 400, y: 350, state: "sorted" },
        { id: "p4", label: "P4 (interior)", x: 250, y: 250, state: "default" },
      ],
      edges: [
        { from: "p1", to: "p2", isPath: true, isTraversed: true },
        { from: "p2", to: "p3", isPath: true, isTraversed: true },
        { from: "p3", to: "p1", isPath: true, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Naive verification tests every line segment connecting pairs of points to check if all remaining points lie on one side, taking O(N³) time.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1", x: 100, y: 300, state: "active" },
        { id: "p4", label: "P4", x: 250, y: 250, state: "active" },
        { id: "p2", label: "P2", x: 250, y: 100, state: "compare" },
        { id: "p3", label: "P3", x: 400, y: 350, state: "compare" },
      ],
      edges: [{ from: "p1", to: "p4", isPath: true }],
    },
  },
  {
    narrative:
      "Andrew's Monotone Chain algorithm begins by sorting points lexicographically by x-coordinate (breaking ties by y-coordinate).",
    primarySnapshot: {
      kind: "array",
      name: "lexicographical_sort",
      mode: "box",
      elements: [
        { id: "sp1", value: 100, label: "P1 (x:100)", state: "sorted" },
        { id: "sp2", value: 250, label: "P2 (x:250)", state: "sorted" },
        { id: "sp3", value: 250, label: "P4 (x:250)", state: "sorted" },
        { id: "sp4", value: 400, label: "P3 (x:400)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Orientation test: the 2D cross product cross(O, A, B) = (A.x - O.x)(B.y - O.y) - (A.y - O.y)(B.x - O.x) determines turn direction.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "o", label: "O (Origin)", x: 100, y: 300, state: "active" },
        { id: "a", label: "A", x: 250, y: 100, state: "active" },
        { id: "b", label: "B", x: 400, y: 350, state: "compare" },
      ],
      edges: [
        { from: "o", to: "a", isPath: true },
        { from: "a", to: "b", isPath: true },
      ],
    },
  },
  {
    narrative:
      "A strictly positive cross product (> 0) represents a counter-clockwise left turn, keeping the new point on the outer convex boundary.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "o", label: "O", x: 100, y: 300, state: "sorted" },
        { id: "a", label: "A", x: 250, y: 100, state: "sorted" },
        { id: "b", label: "B (Left Turn)", x: 300, y: 250, state: "sorted" },
      ],
      edges: [
        { from: "o", to: "a", isPath: true, isTraversed: true },
        { from: "a", to: "b", isPath: true, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "A cross product ≤ 0 represents a right turn or straight line, creating an interior dent. The middle point must be popped from the hull stack.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "o", label: "O", x: 100, y: 300, state: "sorted" },
        { id: "a", label: "A (Popped Dent)", x: 250, y: 250, state: "visited" },
        { id: "b", label: "B", x: 400, y: 350, state: "sorted" },
      ],
      edges: [{ from: "o", to: "b", isPath: true, isTraversed: true }],
    },
  },
  {
    narrative:
      "The algorithm splits the boundary into a Lower Chain (swept left-to-right) and an Upper Chain (swept right-to-left).",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1 (Min X)", x: 100, y: 300, state: "active" },
        { id: "p2", label: "P2", x: 250, y: 100, state: "sorted" },
        { id: "p3", label: "P3 (Max X)", x: 400, y: 350, state: "active" },
      ],
      edges: [{ from: "p1", to: "p2", isPath: true, isTraversed: true }],
    },
  },
  {
    narrative:
      "Combining lower and upper chains yields the complete convex hull in O(N log N) time due to sorting, using O(N) space.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1", x: 100, y: 300, state: "sorted" },
        { id: "p2", label: "P2", x: 250, y: 100, state: "sorted" },
        { id: "p3", label: "P3", x: 400, y: 350, state: "sorted" },
      ],
      edges: [
        { from: "p1", to: "p2", isPath: true, isTraversed: true },
        { from: "p2", to: "p3", isPath: true, isTraversed: true },
        { from: "p3", to: "p1", isPath: true, isTraversed: true },
      ],
    },
  },
];

export function generateConvexHullSteps(input: ConvexHullInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIdx++, phase, narrative, primarySnapshot }));
  };

  const rawPoints =
    Array.isArray(input?.points) && input.points.length > 0
      ? input.points
      : DEFAULT_CONVEX_HULL_INPUT.points;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.points) &&
      input.points.length === DEFAULT_CONVEX_HULL_INPUT.points.length &&
      input.points[0].x === DEFAULT_CONVEX_HULL_INPUT.points[0].x &&
      input.points[0].y === DEFAULT_CONVEX_HULL_INPUT.points[0].y);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const points: Required<Point2D>[] = rawPoints.map((p, idx) => ({
    x: p.x,
    y: p.y,
    id: p.id || `P${idx}`,
    label: p.label || `P${idx}`,
  }));

  const createGraphSnapshot = (
    activePointId?: string,
    hullPoints: Required<Point2D>[] = [],
    isFinal = false,
  ): GraphVisualSnapshot => {
    const hullSet = new Set(hullPoints.map((p) => p.id));
    const nodes: GraphNodeItem[] = points.map((p) => {
      let state: ElementState = "default";
      if (p.id === activePointId) state = "active";
      else if (hullSet.has(p.id)) state = isFinal ? "sorted" : "in-stack";
      return { id: p.id, label: p.label, x: p.x, y: p.y, state };
    });

    const edges: GraphEdgeItem[] = [];
    for (let i = 0; i < hullPoints.length - 1; i++) {
      edges.push({
        from: hullPoints[i].id,
        to: hullPoints[i + 1].id,
        isPath: true,
        isTraversed: true,
      });
    }

    if (isFinal && hullPoints.length > 2) {
      edges.push({
        from: hullPoints[hullPoints.length - 1].id,
        to: hullPoints[0].id,
        isPath: true,
        isTraversed: true,
      });
    }

    return { kind: "graph", nodes, edges };
  };

  if (points.length <= 3) {
    addStep(
      `Point set contains ${points.length} point(s) (<= 3). A set of 3 or fewer points is trivially convex.`,
      createGraphSnapshot(undefined, points, true),
    );
    return steps;
  }

  const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  const cross = (o: Point2D, a: Point2D, b: Point2D): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  addStep(
    `Sort all ${points.length} points lexicographically by x-coordinate: ${sorted.map((p) => p.id).join(", ")}.`,
    createGraphSnapshot(),
  );

  const lower: Required<Point2D>[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      const popped = lower.pop()!;
      const prevO = lower[lower.length - 1];
      const crossVal = cross(prevO, popped, p);
      addStep(
        `Turn from ${prevO.id} through ${popped.id} to ${p.id} makes a right/straight turn (cross product ${crossVal} <= 0). Pop interior point ${popped.id} from lower hull stack.`,
        createGraphSnapshot(p.id, [...lower, p]),
      );
    }
    lower.push(p);
    addStep(
      `Push point ${p.id} onto lower hull stack. Current lower hull contains ${lower.length} point(s): ${lower.map((lp) => lp.id).join(" -> ")}.`,
      createGraphSnapshot(p.id, lower),
    );
  }

  const upper: Required<Point2D>[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      const popped = upper.pop()!;
      const prevO = upper[upper.length - 1];
      const crossVal = cross(prevO, popped, p);
      addStep(
        `Sweeping right-to-left, turn from ${prevO.id} through ${popped.id} to ${p.id} makes a right/straight turn (cross product ${crossVal} <= 0). Pop interior point ${popped.id} from upper hull stack.`,
        createGraphSnapshot(p.id, [...upper, p]),
      );
    }
    upper.push(p);
    addStep(
      `Push point ${p.id} onto upper hull stack. Current upper hull contains ${upper.length} point(s): ${upper.map((up) => up.id).join(" -> ")}.`,
      createGraphSnapshot(p.id, upper),
    );
  }

  lower.pop();
  upper.pop();
  const fullHull = [...lower, ...upper];

  addStep(
    `Stitch lower and upper chains by dropping duplicated endpoints. Convex hull complete with ${fullHull.length} vertices: ${fullHull.map((hp) => hp.id).join(" -> ")}.`,
    createGraphSnapshot(undefined, fullHull, true),
  );

  return steps;
}
