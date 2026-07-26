import type {
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../../types/dsa";

export interface Point2D {
  x: number;
  y: number;
  id?: string;
  label?: string;
}

export interface PolygonAreaInput {
  points: Point2D[];
}

export const generatePolygonAreaSteps = (input: PolygonAreaInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const points = input.points;
  const n = points.length;

  const getBaseNodes = (activeIdx?: number, compareIdx?: number): GraphNodeItem[] => {
    return points.map((pt, index) => {
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
      const fromId = points[i].id ?? `P${i}`;
      const toId = points[(i + 1) % n].id ?? `P${(i + 1) % n}`;
      edges.push({
        from: fromId,
        to: toId,
        isTraversed: activeEdgeIdx === i,
        isPath: activeEdgeIdx !== undefined && i < activeEdgeIdx,
      });
    }
    return edges;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    nodes: GraphNodeItem[],
    edges: GraphEdgeItem[],
    auxMap: Record<string, string>,
    terms: string[],
    vars: Record<string, string | number | boolean>,
  ) => {
    const primarySnapshot: GraphVisualSnapshot = { kind: "graph", nodes, edges };

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot,
      auxiliaryState: {
        visited: [...terms],
        hashMap: auxMap,
        customState: { vertexCount: n, ...vars },
      },
      variables: vars,
    });
  };

  addStep(
    6,
    "Start the shoelace formula",
    `We'll walk the ${n} vertices in order, cross-multiplying each edge's coordinates; the criss-cross pattern of those products is where the "shoelace" name comes from.`,
    getBaseNodes(),
    getBaseEdges(),
    { Formula: "Area = 0.5 * |sum(x_i * y_{i+1} - x_{i+1} * y_i)|" },
    [],
    { n },
  );

  if (n < 3) {
    addStep(
      8,
      "Stop — too few vertices",
      `A polygon needs at least 3 vertices to enclose any region, and we only have ${n}, so the area is simply 0.`,
      getBaseNodes(),
      getBaseEdges(),
      { Status: "Invalid polygon (n < 3)" },
      [],
      { n, area: 0.0 },
    );
    return steps;
  }

  let areaSum = 0;
  const terms: string[] = [];

  addStep(
    10,
    "Set the running sum to zero",
    "Each edge will add its signed cross product here; positive and negative terms partly cancel, and what survives is exactly twice the enclosed area.",
    getBaseNodes(),
    getBaseEdges(),
    { area_sum: "0.0" },
    [],
    { area_sum: 0.0 },
  );

  for (let i = 0; i < n; i++) {
    const nextIdx = (i + 1) % n;
    const p1 = points[i];
    const p2 = points[nextIdx];

    const crossProduct = p1.x * p2.y - p2.x * p1.y;
    areaSum += crossProduct;

    const termStr = `(${p1.x} * ${p2.y}) - (${p2.x} * ${p1.y}) = ${crossProduct}`;
    terms.push(`Edge ${i}->${nextIdx}: ${termStr}`);

    const nodes = getBaseNodes(i, nextIdx);
    const edges = getBaseEdges(i);

    addStep(
      14,
      `Cross-multiply edge P${i} -> P${nextIdx}`,
      `This edge sweeps out a signed trapezoid against the axis worth (${p1.x} * ${p2.y}) - (${p2.x} * ${p1.y}) = ${crossProduct}, bringing our running sum to ${areaSum}.`,
      nodes,
      edges,
      {
        "Edge Processed": `P${i} (${p1.x},${p1.y}) -> P${nextIdx} (${p2.x},${p2.y})`,
        "Cross Product": `${crossProduct}`,
        "Current area_sum": `${areaSum}`,
      },
      terms,
      {
        i,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        cross_product: crossProduct,
        area_sum: areaSum,
      },
    );
  }

  const finalArea = Math.abs(areaSum) / 2.0;

  const finalNodes = points.map((pt, idx) => ({
    id: pt.id ?? `P${idx}`,
    label: pt.label ?? `P${idx}`,
    x: pt.x,
    y: pt.y,
    state: "sorted" as ElementState,
    val: idx,
  }));

  const finalEdges = points.map((pt, idx) => ({
    from: pt.id ?? `P${idx}`,
    to: points[(idx + 1) % n].id ?? `P${(idx + 1) % n}`,
    isPath: true,
  }));

  addStep(
    17,
    `Halve the sum: area = ${finalArea}`,
    `Every edge has been folded in, so the total ${areaSum} is twice the signed area; taking the absolute value and dividing by 2 gives ${finalArea}. One trip around the boundary was all it took — O(n).`,
    finalNodes,
    finalEdges,
    {
      "Total Sum": `${areaSum}`,
      "Abs Sum": `${Math.abs(areaSum)}`,
      "Final Area": `${finalArea}`,
    },
    terms,
    { area_sum: areaSum, final_area: finalArea },
  );

  return steps;
};
