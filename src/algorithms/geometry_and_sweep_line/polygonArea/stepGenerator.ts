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

const FALLBACK_POINTS: Point2D[] = [
  { x: 100, y: 100, id: "P0", label: "P0 (100, 100)" },
  { x: 400, y: 100, id: "P1", label: "P1 (400, 100)" },
  { x: 350, y: 300, id: "P2", label: "P2 (350, 300)" },
  { x: 150, y: 300, id: "P3", label: "P3 (150, 300)" },
];

export const generatePolygonAreaSteps = (input: PolygonAreaInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const points =
    input && Array.isArray(input.points) && input.points.length > 0
      ? input.points
      : FALLBACK_POINTS;
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
    1,
    `Initialize polygon area calculation for ${n} vertices`,
    `The Shoelace (Gauss) formula calculates polygon surface area by computing signed cross-products along ordered boundary edges in a single linear pass.`,
    getBaseNodes(),
    getBaseEdges(),
    { vertexCount: `${n}` },
    [],
    { n },
  );

  addStep(
    2,
    "Prepare ordered vertex cross-multiplication pass",
    `Iterating around perimeter vertices in cyclic order allows trapezoidal areas to accumulate while canceling out regions outside the boundary.`,
    getBaseNodes(),
    getBaseEdges(),
    { Formula: "Area = 0.5 * |sum(x_i * y_{i+1} - x_{i+1} * y_i)|" },
    [],
    { n },
  );

  addStep(
    3,
    `Validate polygon boundary vertex count (n = ${n})`,
    n < 3
      ? `A valid enclosed 2D surface requires at least 3 non-collinear vertices.`
      : `With ${n} ordered vertices, the boundary encloses a valid 2D polygon ready for area calculation.`,
    getBaseNodes(),
    getBaseEdges(),
    { n: `${n}`, validPolygon: `${n >= 3}` },
    [],
    { n },
  );

  if (n < 3) {
    addStep(
      4,
      "Return zero area for degenerate polygon input",
      `Fewer than 3 points cannot define a 2D surface, resulting in an area of 0.`,
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
    6,
    "Initialize signed area sum register to 0.0",
    "Accumulating signed cross-products along boundary edges will total exactly twice the enclosed polygon area.",
    getBaseNodes(),
    getBaseEdges(),
    { area_sum: "0.0" },
    [],
    { area_sum: 0.0 },
  );

  addStep(
    7,
    `Sweep perimeter edges from index 0 to ${n - 1}`,
    "Sequential edge traversal ensures adjacent vertex pairs cross-multiply with correct cyclic wrap-around.",
    getBaseNodes(),
    getBaseEdges(),
    { iterations: `${n}`, wrap: `i+1 mod ${n}` },
    [],
    { n, area_sum: 0.0 },
  );

  for (let i = 0; i < n; i++) {
    const nextIdx = (i + 1) % n;
    const p1 = points[i];
    const p2 = points[nextIdx];

    const nodes = getBaseNodes(i, nextIdx);
    const edges = getBaseEdges(i);

    // Line 8: Unpack p1
    addStep(
      8,
      `Select boundary start vertex P${i} (${p1.x}, ${p1.y})`,
      `Establishing the anchor vertex coordinates for edge segment P${i} → P${nextIdx}.`,
      nodes,
      edges,
      { "Active Vertex": `P${i} (${p1.x}, ${p1.y})` },
      terms,
      { i, x1: p1.x, y1: p1.y, area_sum: areaSum },
    );

    // Line 9: Unpack p2
    addStep(
      9,
      `Select boundary end vertex P${nextIdx} (${p2.x}, ${p2.y})`,
      `Pairing adjacent vertex coordinates around boundary loop (wrapping modulo ${n}).`,
      nodes,
      edges,
      { "Next Vertex": `P${nextIdx} (${p2.x}, ${p2.y})` },
      terms,
      { i, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, area_sum: areaSum },
    );

    const term1 = p1.x * p2.y;
    const term2 = p2.x * p1.y;
    const crossProduct = term1 - term2;

    // Line 10: Compute cross product
    addStep(
      10,
      `Compute 2D determinant for edge P${i} → P${nextIdx}: (${p1.x} × ${p2.y}) - (${p2.x} × ${p1.y}) = ${crossProduct}`,
      `The 2D cross-product measures twice the signed area of the origin-anchored triangle for this edge segment.`,
      nodes,
      edges,
      {
        "Forward Term": `${p1.x} × ${p2.y} = ${term1}`,
        "Backward Term": `${p2.x} × ${p1.y} = ${term2}`,
        "Cross Product": `${crossProduct}`,
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

    areaSum += crossProduct;
    const termStr = `(${p1.x} * ${p2.y}) - (${p2.x} * ${p1.y}) = ${crossProduct}`;
    terms.push(`Edge ${i}->${nextIdx}: ${termStr}`);

    // Line 11: Accumulate
    addStep(
      11,
      `Fold cross-product ${crossProduct} into signed area sum (Total = ${areaSum})`,
      `Summing signed cross-products combines interior trapezoidal areas while external regions cancel out.`,
      nodes,
      edges,
      {
        "Added Value": `${crossProduct}`,
        "Running area_sum": `${areaSum}`,
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
    13,
    `Finalize polygon area calculation: |${areaSum}| / 2 = ${finalArea}`,
    `Taking absolute value resolves vertex orientation (clockwise vs counter-clockwise) and halving yields exact polygon area.`,
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
