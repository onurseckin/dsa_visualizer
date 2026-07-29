import type {
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";
import { DEFAULT_POLYGON_AREA_INPUT } from "./definition";

export interface Point2D {
  x: number;
  y: number;
  id?: string;
  label?: string;
}

export interface PolygonAreaInput {
  points: Point2D[];
}

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Polygon Area problem evaluates the exact 2D surface area enclosed by an ordered sequence of vertices (P0, P1, ..., Pn-1).",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p0", label: "P0 (100,100)", x: 100, y: 100, state: "default" },
        { id: "p1", label: "P1 (400,100)", x: 400, y: 100, state: "default" },
        { id: "p2", label: "P2 (350,300)", x: 350, y: 300, state: "default" },
        { id: "p3", label: "P3 (150,300)", x: 150, y: 300, state: "default" },
      ],
      edges: [
        { from: "p0", to: "p1", isPath: true },
        { from: "p1", to: "p2", isPath: true },
        { from: "p2", to: "p3", isPath: true },
        { from: "p3", to: "p0", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Naive polygon area algorithms triangulate the polygon into smaller triangles, requiring complex decomposition and O(N log N) time.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p0", label: "P0", x: 100, y: 100, state: "active" },
        { id: "p1", label: "P1", x: 400, y: 100, state: "active" },
        { id: "p2", label: "P2", x: 350, y: 300, state: "active" },
        { id: "p3", label: "P3", x: 150, y: 300, state: "compare" },
      ],
      edges: [
        { from: "p0", to: "p1", isPath: true },
        { from: "p1", to: "p2", isPath: true },
        { from: "p2", to: "p0", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Gauss's Shoelace Formula computes the area directly from boundary coordinates in a single linear O(N) pass.",
    primarySnapshot: {
      kind: "array",
      name: "shoelace_formula",
      mode: "box",
      elements: [
        {
          id: "f1",
          value: 1,
          label: "Area = 0.5 * |sum(x_i * y_{i+1} - x_{i+1} * y_i)|",
          state: "sorted",
        },
      ],
    },
  },
  {
    narrative:
      "For each directed boundary edge P_i -> P_{i+1}, we compute the 2D cross product term: (x_i * y_{i+1} - x_{i+1} * y_i).",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p0", label: "P0 (100,100)", x: 100, y: 100, state: "active" },
        { id: "p1", label: "P1 (400,100)", x: 400, y: 100, state: "active" },
      ],
      edges: [{ from: "p0", to: "p1", isTraversed: true }],
    },
  },
  {
    narrative:
      "Geometrically, each edge cross product calculates twice the signed area of the triangle formed by the origin (0,0) and the edge endpoints.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "origin", label: "(0,0)", x: 50, y: 50, state: "compare" },
        { id: "p0", label: "P0", x: 100, y: 100, state: "active" },
        { id: "p1", label: "P1", x: 400, y: 100, state: "active" },
      ],
      edges: [
        { from: "origin", to: "p0", isPath: true },
        { from: "p0", to: "p1", isPath: true },
        { from: "p1", to: "origin", isPath: true },
      ],
    },
  },
  {
    narrative:
      "As we sweep around the boundary loop, positive areas inside the polygon add up while external regions cancel out due to opposite edge directions.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p0", label: "P0", x: 100, y: 100, state: "sorted" },
        { id: "p1", label: "P1", x: 400, y: 100, state: "sorted" },
        { id: "p2", label: "P2", x: 350, y: 300, state: "active" },
      ],
      edges: [
        { from: "p0", to: "p1", isTraversed: true },
        { from: "p1", to: "p2", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "The sign of the final sum indicates boundary orientation: positive for counter-clockwise traversal, negative for clockwise traversal.",
    primarySnapshot: {
      kind: "array",
      name: "orientation_sign",
      mode: "box",
      elements: [
        { id: "s1", value: 1, label: "Positive sum = CCW", state: "sorted" },
        { id: "s2", value: -1, label: "Negative sum = CW", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Taking the absolute value handles clockwise orientations, and dividing by 2 yields the exact enclosed surface area.",
    primarySnapshot: {
      kind: "array",
      name: "final_division",
      mode: "box",
      elements: [{ id: "d1", value: 45000, label: "Area = |90000| / 2 = 45000", state: "sorted" }],
    },
  },
  {
    narrative: "The entire computation runs in optimal O(N) time with O(1) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(1)", state: "sorted" },
      ],
    },
  },
];

export function generatePolygonAreaSteps(input: PolygonAreaInput): AlgorithmStep[] {
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
      : DEFAULT_POLYGON_AREA_INPUT.points;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.points) &&
      input.points.length === DEFAULT_POLYGON_AREA_INPUT.points.length &&
      input.points[0].x === DEFAULT_POLYGON_AREA_INPUT.points[0].x &&
      input.points[0].y === DEFAULT_POLYGON_AREA_INPUT.points[0].y);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const n = rawPoints.length;

  const getBaseNodes = (activeIdx?: number, compareIdx?: number): GraphNodeItem[] => {
    return rawPoints.map((pt, index) => {
      const id = pt.id ?? `P${index}`;
      const label = pt.label ?? `P${index} (${pt.x}, ${pt.y})`;
      let state: ElementState = "default";
      if (index === activeIdx) {
        state = "active";
      } else if (index === compareIdx) {
        state = "compare";
      }
      return { id, label, x: pt.x, y: pt.y, state, val: index };
    });
  };

  const getBaseEdges = (activeEdgeIdx?: number): GraphEdgeItem[] => {
    if (n < 2) return [];
    const edges: GraphEdgeItem[] = [];
    for (let i = 0; i < n; i++) {
      const fromId = rawPoints[i].id ?? `P${i}`;
      const toId = rawPoints[(i + 1) % n].id ?? `P${(i + 1) % n}`;
      edges.push({
        from: fromId,
        to: toId,
        isTraversed: activeEdgeIdx === i,
        isPath: activeEdgeIdx !== undefined && i < activeEdgeIdx,
      });
    }
    return edges;
  };

  addStep(`Initialize Shoelace area calculation for simple polygon with ${n} vertices.`, {
    kind: "graph",
    nodes: getBaseNodes(),
    edges: getBaseEdges(),
  });

  if (n < 3) {
    addStep(`Vertex count n = ${n} < 3; degenerate polygon has 0 surface area.`, {
      kind: "graph",
      nodes: getBaseNodes(),
      edges: getBaseEdges(),
    });
    return steps;
  }

  let areaSum = 0;

  for (let i = 0; i < n; i++) {
    const nextIdx = (i + 1) % n;
    const p1 = rawPoints[i];
    const p2 = rawPoints[nextIdx];

    const crossProduct = p1.x * p2.y - p2.x * p1.y;
    areaSum += crossProduct;

    addStep(
      `Inspect edge P${i} (${p1.x},${p1.y}) -> P${nextIdx} (${p2.x},${p2.y}): cross product = (${p1.x} × ${p2.y}) - (${p2.x} × ${p1.y}) = ${crossProduct}. Accumulated area_sum = ${areaSum}.`,
      {
        kind: "graph",
        nodes: getBaseNodes(i, nextIdx),
        edges: getBaseEdges(i),
      },
    );
  }

  const finalArea = Math.abs(areaSum) / 2.0;

  addStep(
    `Perimeter sweep complete! Total signed sum = ${areaSum}. Absolute area = |${areaSum}| / 2 = ${finalArea}.`,
    {
      kind: "graph",
      nodes: rawPoints.map((pt, idx) => ({
        id: pt.id ?? `P${idx}`,
        label: pt.label ?? `P${idx}`,
        x: pt.x,
        y: pt.y,
        state: "sorted" as ElementState,
        val: idx,
      })),
      edges: rawPoints.map((pt, idx) => ({
        from: pt.id ?? `P${idx}`,
        to: rawPoints[(idx + 1) % n].id ?? `P${(idx + 1) % n}`,
        isPath: true,
      })),
    },
  );

  return steps;
}
